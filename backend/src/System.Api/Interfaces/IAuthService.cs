using System.Security.Claims;
using System.Api.DTO.Auth;
using System.Api.Models;
using System.Api.Security;

namespace System.Api.Interfaces;

public interface IPasswordHasher
{
    string Hash(string password);

    bool Verify(string password, string storedHash);
}

public interface ITokenService
{
    (string Token, DateTime ExpiresAt) Generate(Usuario user);

    IssuedRefreshToken GenerateRefreshToken(long userId, string familyId);

    RefreshTokenClaims? ValidateRefreshToken(string token);
}

public interface IRefreshTokenStore
{
    Task StoreAsync(string jti, string familyId, string tokenHash, TimeSpan lifetime, CancellationToken cancellationToken);

    Task<string?> GetTokenHashAsync(string jti, CancellationToken cancellationToken);

    Task<bool> IsConsumedAsync(string jti, CancellationToken cancellationToken);

    Task ConsumeAsync(string jti, TimeSpan lifetime, CancellationToken cancellationToken);

    Task<bool> IsFamilyRevokedAsync(string familyId, CancellationToken cancellationToken);

    Task RevokeFamilyAsync(string familyId, TimeSpan lifetime, CancellationToken cancellationToken);
}

public interface ICurrentUser
{
    ClaimsPrincipal Principal { get; }

    long Id { get; }

    string? Email { get; }

    string? Name { get; }

    string? Jti { get; }

    DateTime? IssuedAt { get; }

    DateTime? ExpiresAt { get; }

    bool IsAdministrator { get; }
}

public interface ITokenValidator
{
    Task<bool> ValidateAsync(ClaimsPrincipal principal, CancellationToken cancellationToken);
}

public interface IEmailSender
{
    Task SendAsync(string recipient, string subject, string body, CancellationToken cancellationToken);
}

public interface IStorage
{
    string ResolvePath(string relativePath);

    void Delete(string relativePath);
}

public interface IAuthService
{
    Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);

    Task<AuthSession> LoginAsync(LoginRequest request, CancellationToken cancellationToken);

    Task<AuthSession> RefreshAsync(string refreshToken, CancellationToken cancellationToken);

    Task<VerifyCodeResponse> VerifyCodeAsync(VerifyCodeRequest request, CancellationToken cancellationToken);

    Task<MeResponse> MeAsync(long userId, CancellationToken cancellationToken);

    Task SendResetCodeAsync(ForgotPasswordRequest request, CancellationToken cancellationToken);

    Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken);

    Task ChangePasswordAsync(long userId, ChangePasswordRequest request, CancellationToken cancellationToken);

    Task EndSessionAsync(string jti, DateTime expiresAt, string? refreshToken, CancellationToken cancellationToken);

    Task AnonymizeAccountAsync(long targetUserId, CancellationToken cancellationToken);
}