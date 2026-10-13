using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using System.Api.Configuration;
using System.Api.DTO.Auth;
using System.Api.DTO.Common;
using System.Api.Interfaces;
using System.Api.Models;

namespace System.Api.Services;

public sealed class AuthService(
    IUsuarioRepository usuarios,
    ITokenRedefinicaoSenhaRepository tokensRedefinicaoSenha,
    ITokenRevogadoRepository tokensRevogados,
    IProcessoRepository processos,
    IDocumentoRepository documentos,
    IDossieRepository dossies,
    ICondutorAutorizadoRepository condutores,
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

        if (await usuarios.EmailExistsAsync(email, cancellationToken))
        {
            throw AppException.Conflict("Já existe uma conta cadastrada com este e-mail.");
        }

        if (await usuarios.CpfExistsAsync(cpf, cancellationToken))
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

        usuarios.Add(user);
        await usuarios.SaveChangesAsync(cancellationToken);

        return new RegisterResponse(user.Id, user.NomeCompleto, user.Email!, now);
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await usuarios.GetByEmailAsync(email, cancellationToken);

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
        var process = await processos.GetInProgressAsync(user.Id, cancellationToken);

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
        var user = await usuarios.GetByIdAsync(userId, cancellationToken)
            ?? throw AppException.NotFound("Usuário não encontrado.");

        var process = await processos.GetInProgressAsync(userId, cancellationToken);

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
        var user = await usuarios.GetByEmailAsync(email, cancellationToken);

        if (user is null || user.AnonimizadoEm is not null || string.IsNullOrEmpty(user.SenhaHash))
        {
            return;
        }

        await tokensRedefinicaoSenha.RemovePendingAsync(user.Id, cancellationToken);

        var rawToken = GenerateResetToken();
        var now = DateTime.UtcNow;

        tokensRedefinicaoSenha.Add(new TokenRedefinicaoSenha
        {
            UsuarioId = user.Id,
            TokenHash = HashToken(rawToken),
            ExpiraEm = now.AddMinutes(options.Value.PasswordReset.TokenExpiresInMinutes),
            CriadoEm = now,
        });

        await tokensRedefinicaoSenha.SaveChangesAsync(cancellationToken);

        var link = $"{options.Value.Frontend.Url}/reset-password?token={Uri.EscapeDataString(rawToken)}";
        await emailSender.SendAsync(user.Email!, "Isenca+ - redefinição de senha", link, cancellationToken);

        logger.LogInformation("Token de redefinição gerado para o usuário {UserId}", user.Id);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var tokenRecord = await tokensRedefinicaoSenha.GetByHashAsync(HashToken(request.Token), cancellationToken);

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

        await tokensRedefinicaoSenha.SaveChangesAsync(cancellationToken);
    }

    public async Task ChangePasswordAsync(long userId, ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var user = await usuarios.GetByIdAsync(userId, cancellationToken)
            ?? throw AppException.NotFound("Usuário não encontrado.");

        if (string.IsNullOrEmpty(user.SenhaHash)
            || !passwordHasher.Verify(request.CurrentPassword, user.SenhaHash))
        {
            throw AppException.Validation("Senha atual incorreta.");
        }

        var now = DateTime.UtcNow;
        user.SenhaHash = passwordHasher.Hash(request.NewPassword);
        user.AtualizadoEm = now;

        await tokensRedefinicaoSenha.RemovePendingAsync(user.Id, cancellationToken);
        await usuarios.SaveChangesAsync(cancellationToken);
    }

    public async Task EndSessionAsync(string jti, DateTime expiresAt, CancellationToken cancellationToken)
    {
        await tokensRevogados.RemoveExpiredAsync(DateTime.UtcNow, cancellationToken);

        if (!await tokensRevogados.ExistsAsync(jti, cancellationToken))
        {
            tokensRevogados.Add(new TokenRevogado { Jti = jti, ExpiraEm = expiresAt });
        }

        await tokensRevogados.SaveChangesAsync(cancellationToken);
    }

    public async Task AnonymizeAccountAsync(long targetUserId, CancellationToken cancellationToken)
    {
        var user = await usuarios.GetByIdAsync(targetUserId, cancellationToken)
            ?? throw AppException.NotFound("Usuário não encontrado.");

        var documents = await documentos.ListByUsuarioAsync(user.Id, cancellationToken);
        var dossiers = await dossies.ListByUsuarioAsync(user.Id, cancellationToken);

        foreach (var document in documents)
        {
            storage.Delete(document.CaminhoArquivo);
        }

        foreach (var dossier in dossiers)
        {
            storage.Delete(dossier.CaminhoArquivo);
        }

        documentos.RemoveRange(documents);
        dossies.RemoveRange(dossiers);
        await condutores.RemoveByUsuarioAsync(user.Id, cancellationToken);
        await tokensRedefinicaoSenha.RemoveAllAsync(user.Id, cancellationToken);

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

        await usuarios.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Conta do usuário {UserId} anonimizada.", user.Id);
    }

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