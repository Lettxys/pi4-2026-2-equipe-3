namespace System.Api.Security;

public sealed record IssuedRefreshToken(
    string Token,
    DateTime ExpiresAt,
    string Jti,
    string FamilyId);

public sealed record RefreshTokenClaims(
    long UserId,
    string Jti,
    string FamilyId,
    DateTime ExpiresAt);
