using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Npgsql;
using System.Api.Configuration;
using System.Api.Data;
using System.Api.DTO.Auth;
using System.Api.DTO.Common;
using System.Api.Interfaces;
using System.Api.Models;

namespace System.Api.Services;

public sealed class AuthService(
    AppDbContext db,
    IPasswordHasher passwordHasher,
    ITokenService tokenService,
    IEmailSender emailSender,
    IStorage storage,
    IOptions<AppOptions> options,
    ILogger<AuthService> logger) : IAuthService
{
    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var cpf = NormalizeCpf(request.Cpf);

        if (await db.Usuarios.AnyAsync(u => u.Email == email, cancellationToken))
        {
            throw AppException.Conflict("Já existe uma conta cadastrada com este e-mail.");
        }

        if (await db.Usuarios.AnyAsync(u => u.Cpf == cpf, cancellationToken))
        {
            throw AppException.Conflict("Já existe uma conta cadastrada com este CPF.");
        }

        var now = DateTime.UtcNow;
        var user = new Usuario
        {
            NomeCompleto = request.FullName.Trim(),
            Cpf = cpf,
            Email = email,
            Telefone = NormalizePhone(request.Phone),
            SenhaHash = passwordHasher.Hash(request.Password),
            Papel = Models.Enums.Papel.USER,
            CriadoEm = now,
            AtualizadoEm = now,
        };

        db.Usuarios.Add(user);

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException { SqlState: "23505" })
        {
            throw AppException.Conflict("Já existe uma conta cadastrada com este e-mail ou CPF.");
        }

        return new RegisterResponse(user.Id, user.NomeCompleto, user.Email!, now);
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Usuarios.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

        if (user is null
            || string.IsNullOrEmpty(user.SenhaHash)
            || !passwordHasher.Verify(request.Password, user.SenhaHash))
        {
            throw AppException.Unauthorized("Credenciais inválidas.");
        }

        if (user.AnonimizadoEm is not null)
        {
            throw AppException.Unauthorized("Credenciais inválidas.");
        }

        var (token, expiresAt) = tokenService.Generate(user);
        var process = await InProgressProcessAsync(user.Id, cancellationToken);

        return new LoginResponse(
            "Bearer",
            token,
            options.Value.Jwt.ExpiresInMinutes * 60,
            user.Id,
            user.NomeCompleto,
            user.Email!,
            process?.TipoPerfil,
            process?.Id);
    }

    public async Task<MeResponse> MeAsync(long userId, CancellationToken cancellationToken)
    {
        var user = await db.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw AppException.NotFound("Usuário não encontrado.");

        var process = await InProgressProcessAsync(userId, cancellationToken);

        return new MeResponse(
            user.Id,
            user.NomeCompleto,
            user.Cpf,
            user.Email,
            process?.TipoPerfil,
            process?.Id);
    }

    public async Task SendRecoveryInstructionsAsync(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Usuarios
            .FirstOrDefaultAsync(u => u.Email == email && u.AnonimizadoEm == null, cancellationToken);

        if (user is null || string.IsNullOrEmpty(user.SenhaHash))
        {
            return;
        }

        var pendingTokens = await db.TokensRedefinicaoSenha
            .Where(t => t.UsuarioId == user.Id && t.UsadoEm == null)
            .ToListAsync(cancellationToken);

        db.TokensRedefinicaoSenha.RemoveRange(pendingTokens);

        var rawToken = GenerateResetToken();
        var now = DateTime.UtcNow;

        db.TokensRedefinicaoSenha.Add(new TokenRedefinicaoSenha
        {
            UsuarioId = user.Id,
            TokenHash = HashToken(rawToken),
            ExpiraEm = now.AddMinutes(options.Value.PasswordReset.TokenExpiresInMinutes),
            CriadoEm = now,
        });

        await db.SaveChangesAsync(cancellationToken);

        var link = $"{options.Value.Frontend.Url}/reset-password?token={Uri.EscapeDataString(rawToken)}";
        await emailSender.SendAsync(user.Email!, "Isenca+ - redefinição de senha", link, cancellationToken);

        logger.LogInformation("Token de redefinição gerado para o usuário {UserId}", user.Id);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var tokenRecord = await db.TokensRedefinicaoSenha
            .Include(t => t.Usuario)
            .FirstOrDefaultAsync(t => t.TokenHash == HashToken(request.Token), cancellationToken);

        if (tokenRecord is null || tokenRecord.UsadoEm is not null || tokenRecord.ExpiraEm <= now)
        {
            throw AppException.Validation("Token de redefinição inválido ou expirado.");
        }

        if (tokenRecord.Usuario.AnonimizadoEm is not null)
        {
            throw AppException.Validation("Token de redefinição inválido ou expirado.");
        }

        var user = tokenRecord.Usuario;
        user.SenhaHash = passwordHasher.Hash(request.NewPassword);
        user.AtualizadoEm = now;
        tokenRecord.UsadoEm = now;

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task ChangePasswordAsync(long userId, ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var user = await db.Usuarios.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw AppException.NotFound("Usuário não encontrado.");

        if (string.IsNullOrEmpty(user.SenhaHash)
            || !passwordHasher.Verify(request.CurrentPassword, user.SenhaHash))
        {
            throw AppException.Validation("Senha atual incorreta.");
        }

        var now = DateTime.UtcNow;
        user.SenhaHash = passwordHasher.Hash(request.NewPassword);
        user.AtualizadoEm = now;

        db.TokensRedefinicaoSenha.RemoveRange(
            await db.TokensRedefinicaoSenha
                .Where(t => t.UsuarioId == user.Id && t.UsadoEm == null)
                .ToListAsync(cancellationToken));

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task EndSessionAsync(string jti, DateTime expiresAt, CancellationToken cancellationToken)
    {
        await db.TokensRevogados
            .Where(t => t.ExpiraEm < DateTime.UtcNow)
            .ExecuteDeleteAsync(cancellationToken);

        if (await db.TokensRevogados.AnyAsync(t => t.Jti == jti, cancellationToken))
        {
            return;
        }

        db.TokensRevogados.Add(new TokenRevogado { Jti = jti, ExpiraEm = expiresAt });
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task AnonymizeAccountAsync(long targetUserId, CancellationToken cancellationToken)
    {
        var user = await db.Usuarios.FirstOrDefaultAsync(u => u.Id == targetUserId, cancellationToken)
            ?? throw AppException.NotFound("Usuário não encontrado.");

        var processIds = await db.Processos
            .Where(p => p.UsuarioId == user.Id)
            .Select(p => p.Id)
            .ToListAsync(cancellationToken);

        var documentPaths = processIds.Count == 0
            ? []
            : await db.Documentos
                .Where(d => processIds.Contains(d.ProcessoId))
                .Select(d => new { d.CaminhoArquivo })
                .ToListAsync(cancellationToken);

        var dossierPaths = processIds.Count == 0
            ? []
            : await db.Dossies
                .Where(d => processIds.Contains(d.ProcessoId))
                .Select(d => new { d.CaminhoArquivo })
                .ToListAsync(cancellationToken);

        foreach (var document in documentPaths)
        {
            storage.Delete(document.CaminhoArquivo);
        }

        foreach (var dossier in dossierPaths)
        {
            storage.Delete(dossier.CaminhoArquivo);
        }

        if (processIds.Count > 0)
        {
            await db.Documentos.Where(d => processIds.Contains(d.ProcessoId)).ExecuteDeleteAsync(cancellationToken);
            await db.CondutoresAutorizados.Where(c => processIds.Contains(c.ProcessoId)).ExecuteDeleteAsync(cancellationToken);
            await db.Dossies.Where(d => processIds.Contains(d.ProcessoId)).ExecuteDeleteAsync(cancellationToken);
        }

        await db.TokensRedefinicaoSenha
            .Where(t => t.UsuarioId == user.Id)
            .ExecuteDeleteAsync(cancellationToken);

        var now = DateTime.UtcNow;
        user.NomeCompleto = "USUÁRIO ANONIMIZADO";
        user.Cpf = null;
        user.Email = null;
        user.Telefone = null;
        user.SenhaHash = null;
        user.Cep = null;
        user.Logradouro = null;
        user.Numero = null;
        user.Complemento = null;
        user.Bairro = null;
        user.Cidade = null;
        user.Uf = null;
        user.AnonimizadoEm = now;
        user.AtualizadoEm = now;

        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Conta do usuário {UserId} anonimizada.", user.Id);
    }

    private Task<Processo?> InProgressProcessAsync(long userId, CancellationToken cancellationToken) =>
        db.Processos
            .AsNoTracking()
            .Where(p => p.UsuarioId == userId && p.Status != Models.Enums.StatusProcesso.COMPLETED)
            .OrderByDescending(p => p.CriadoEm)
            .FirstOrDefaultAsync(cancellationToken);

    private static string NormalizeCpf(string cpf) =>
        CpfAttribute.Value.TryNormalize(cpf, out var normalized)
            ? normalized
            : throw AppException.Validation("CPF inválido.");

    private static string? NormalizePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
        {
            return null;
        }

        var digits = phone.Where(char.IsAsciiDigit).ToArray();
        return digits.Length == 0 ? null : new string(digits);
    }

    private static string GenerateResetToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(48))
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)))
            .ToLower(CultureInfo.InvariantCulture);

    private static DateTime TruncateToSecond(DateTime instant) =>
        new(instant.Ticks - (instant.Ticks % TimeSpan.TicksPerSecond), DateTimeKind.Utc);
}