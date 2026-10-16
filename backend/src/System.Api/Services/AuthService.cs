using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Options;
using Npgsql;
using System.Api.Configuration;
using System.Api.Data;
using System.Api.DTO.Auth;
using System.Api.DTO.Common;
using System.Api.Interfaces;
using System.Api.Models;
using System.Api.Security;

namespace System.Api.Services;

public sealed class AuthService(
    AppDbContext db,
    IPasswordHasher passwordHasher,
    ITokenService tokenService,
    IRefreshTokenStore refreshTokenStore,
    IEmailSender emailSender,
    IStorage storage,
    IDistributedCache cache,
    IOptions<AppOptions> options,
    ILogger<AuthService> logger) : IAuthService
{
    private const int VerificationCodeLength = 6;
    private const string VerificationCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private const string VerificationCodeKeyPrefix = "verification:code:";
    private const string VerificationCodeLimitKeyPrefix = "verification:limit:";
    private const string ResetTokenKeyPrefix = "reset:token:";

    private static readonly TimeSpan VerificationCodeLifetime = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan VerificationCodeRequestInterval = TimeSpan.FromSeconds(60);

    private TimeSpan RefreshTokenLifetime => TimeSpan.FromDays(options.Value.Jwt.RefreshExpiresInDays);

    private TimeSpan ResetTokenLifetime => TimeSpan.FromMinutes(options.Value.PasswordReset.TokenExpiresInMinutes);

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

    public async Task<AuthSession> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
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

        var (token, _) = tokenService.Generate(user);
        var process = await InProgressProcessAsync(user.Id, cancellationToken);
        var refreshToken = await IssueRefreshTokenAsync(user.Id, Guid.NewGuid().ToString("N"), cancellationToken);

        var response = new LoginResponse(
            "Bearer",
            token,
            options.Value.Jwt.ExpiresInMinutes * 60,
            user.Id,
            user.NomeCompleto,
            user.Email!,
            process?.TipoPerfil,
            process?.Id);

        return new AuthSession(response, refreshToken.Token, refreshToken.ExpiresAt);
    }

    public async Task<AuthSession> RefreshAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var claims = tokenService.ValidateRefreshToken(refreshToken)
            ?? throw AppException.Unauthorized("Refresh token inválido ou expirado.");

        if (await refreshTokenStore.IsFamilyRevokedAsync(claims.FamilyId, cancellationToken))
        {
            throw AppException.Unauthorized("Sessão expirada. Faça login novamente.");
        }

        var storedHash = await refreshTokenStore.GetTokenHashAsync(claims.Jti, cancellationToken);
        if (storedHash is null || !FixedTimeEquals(storedHash, HashToken(refreshToken)))
        {
            if (await refreshTokenStore.IsConsumedAsync(claims.Jti, cancellationToken))
            {
                await refreshTokenStore.RevokeFamilyAsync(claims.FamilyId, RefreshTokenLifetime, cancellationToken);
                logger.LogWarning(
                    "Reutilização de refresh token detectada para o usuário {UserId}. Sessão revogada.",
                    claims.UserId);
            }

            throw AppException.Unauthorized("Refresh token inválido ou expirado.");
        }

        var user = await db.Usuarios
            .FirstOrDefaultAsync(u => u.Id == claims.UserId && u.AnonimizadoEm == null, cancellationToken)
            ?? throw AppException.Unauthorized("Refresh token inválido ou expirado.");

        await refreshTokenStore.ConsumeAsync(claims.Jti, RefreshTokenLifetime, cancellationToken);
        var newRefreshToken = await IssueRefreshTokenAsync(user.Id, claims.FamilyId, cancellationToken);

        var (token, _) = tokenService.Generate(user);
        var process = await InProgressProcessAsync(user.Id, cancellationToken);

        var response = new LoginResponse(
            "Bearer",
            token,
            options.Value.Jwt.ExpiresInMinutes * 60,
            user.Id,
            user.NomeCompleto,
            user.Email!,
            process?.TipoPerfil,
            process?.Id);

        return new AuthSession(response, newRefreshToken.Token, newRefreshToken.ExpiresAt);
    }

    public async Task<VerifyCodeResponse> VerifyCodeAsync(
        VerifyCodeRequest request,
        CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var code = request.Code.Trim().ToUpperInvariant();

        var storedCode = await cache.GetStringAsync(VerificationCodeKeyPrefix + email, cancellationToken);
        if (storedCode is null || !FixedTimeEquals(storedCode, code))
        {
            throw AppException.Validation("Código inválido ou expirado.");
        }

        var user = await db.Usuarios
            .FirstOrDefaultAsync(u => u.Email == email && u.AnonimizadoEm == null, cancellationToken)
            ?? throw AppException.Validation("Código inválido ou expirado.");

        await cache.RemoveAsync(VerificationCodeKeyPrefix + email, cancellationToken);

        var resetToken = GenerateResetToken();
        await cache.SetStringAsync(
            ResetTokenKeyPrefix + HashToken(resetToken),
            user.Id.ToString(CultureInfo.InvariantCulture),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = ResetTokenLifetime },
            cancellationToken);

        return new VerifyCodeResponse(resetToken);
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

    public async Task SendResetCodeAsync(ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var limitKey = VerificationCodeLimitKeyPrefix + email;

        if (await cache.GetStringAsync(limitKey, cancellationToken) is not null)
        {
            throw AppException.TooManyRequests("Aguarde um minuto antes de solicitar um novo código.");
        }

        await cache.SetStringAsync(
            limitKey,
            "1",
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = VerificationCodeRequestInterval },
            cancellationToken);

        var user = await db.Usuarios
            .FirstOrDefaultAsync(u => u.Email == email && u.AnonimizadoEm == null, cancellationToken);

        if (user is null || string.IsNullOrEmpty(user.SenhaHash))
        {
            return;
        }

        var code = GenerateVerificationCode();

        await cache.SetStringAsync(
            VerificationCodeKeyPrefix + email,
            code,
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = VerificationCodeLifetime },
            cancellationToken);

        await emailSender.SendAsync(
            email,
            "Isenca+ - código de redefinição de senha",
            $"Seu código para redefinir a senha é: {code}. Ele expira em 5 minutos.",
            cancellationToken);

        logger.LogInformation("Código de redefinição enviado para o usuário {UserId}.", user.Id);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        var tokenKey = ResetTokenKeyPrefix + HashToken(request.Token);
        var rawUserId = await cache.GetStringAsync(tokenKey, cancellationToken);

        if (rawUserId is null
            || !long.TryParse(rawUserId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var userId))
        {
            throw AppException.Validation("Token de redefinição inválido ou expirado.");
        }

        var user = await db.Usuarios
            .FirstOrDefaultAsync(u => u.Id == userId && u.AnonimizadoEm == null, cancellationToken)
            ?? throw AppException.Validation("Token de redefinição inválido ou expirado.");

        await cache.RemoveAsync(tokenKey, cancellationToken);

        user.SenhaHash = passwordHasher.Hash(request.NewPassword);
        user.AtualizadoEm = DateTime.UtcNow;

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

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task EndSessionAsync(
        string jti,
        DateTime expiresAt,
        string? refreshToken,
        CancellationToken cancellationToken)
    {
        await db.TokensRevogados
            .Where(t => t.ExpiraEm < DateTime.UtcNow)
            .ExecuteDeleteAsync(cancellationToken);

        if (!await db.TokensRevogados.AnyAsync(t => t.Jti == jti, cancellationToken))
        {
            db.TokensRevogados.Add(new TokenRevogado { Jti = jti, ExpiraEm = expiresAt });
            await db.SaveChangesAsync(cancellationToken);
        }

        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return;
        }

        var claims = tokenService.ValidateRefreshToken(refreshToken);
        if (claims is not null)
        {
            await refreshTokenStore.RevokeFamilyAsync(claims.FamilyId, RefreshTokenLifetime, cancellationToken);
        }
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

    private async Task<IssuedRefreshToken> IssueRefreshTokenAsync(
        long userId,
        string familyId,
        CancellationToken cancellationToken)
    {
        var refreshToken = tokenService.GenerateRefreshToken(userId, familyId);

        await refreshTokenStore.StoreAsync(
            refreshToken.Jti,
            refreshToken.FamilyId,
            HashToken(refreshToken.Token),
            RefreshTokenLifetime,
            cancellationToken);

        return refreshToken;
    }

    private static string GenerateVerificationCode()
    {
        var code = new char[VerificationCodeLength];
        for (var index = 0; index < code.Length; index++)
        {
            code[index] = VerificationCodeAlphabet[RandomNumberGenerator.GetInt32(VerificationCodeAlphabet.Length)];
        }

        return new string(code);
    }

    private static bool FixedTimeEquals(string left, string right) =>
        CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(left),
            Encoding.UTF8.GetBytes(right));

    private static DateTime TruncateToSecond(DateTime instant) =>
        new(instant.Ticks - (instant.Ticks % TimeSpan.TicksPerSecond), DateTimeKind.Utc);
}