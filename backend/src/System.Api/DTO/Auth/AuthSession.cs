namespace System.Api.DTO.Auth;

public sealed record AuthSession(
    LoginResponse Response,
    string RefreshToken,
    DateTime RefreshTokenExpiresAt);
