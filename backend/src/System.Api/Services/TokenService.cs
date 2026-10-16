using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Api.Configuration;
using System.Api.Interfaces;
using System.Api.Models;
using System.Api.Security;

namespace System.Api.Services;

public sealed class TokenService(IOptions<AppOptions> options) : ITokenService
{
    public (string Token, DateTime ExpiresAt) Generate(Usuario user)
    {
        var jwt = options.Value.Jwt;
        var now = DateTime.UtcNow;
        var expiresAt = now.AddMinutes(jwt.ExpiresInMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString(CultureInfo.InvariantCulture)),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new(
                JwtRegisteredClaimNames.Iat,
                new DateTimeOffset(now, TimeSpan.Zero).ToUnixTimeSeconds().ToString(CultureInfo.InvariantCulture),
                ClaimValueTypes.Integer64),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.UniqueName, user.NomeCompleto),
            new(JwtClaimNames.Role, user.Papel.ToString()),
            new(JwtClaimNames.TokenType, JwtClaimNames.AccessTokenType),
        };

        return (Write(claims, now, expiresAt), expiresAt);
    }

    public IssuedRefreshToken GenerateRefreshToken(long userId, string familyId)
    {
        var jwt = options.Value.Jwt;
        var now = DateTime.UtcNow;
        var expiresAt = now.AddDays(jwt.RefreshExpiresInDays);
        var jti = Guid.NewGuid().ToString("N");

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString(CultureInfo.InvariantCulture)),
            new(JwtRegisteredClaimNames.Jti, jti),
            new(
                JwtRegisteredClaimNames.Iat,
                new DateTimeOffset(now, TimeSpan.Zero).ToUnixTimeSeconds().ToString(CultureInfo.InvariantCulture),
                ClaimValueTypes.Integer64),
            new(JwtClaimNames.TokenType, JwtClaimNames.RefreshTokenType),
            new(JwtClaimNames.FamilyId, familyId),
        };

        return new IssuedRefreshToken(Write(claims, now, expiresAt), expiresAt, jti, familyId);
    }

    public RefreshTokenClaims? ValidateRefreshToken(string token)
    {
        var jwt = options.Value.Jwt;
        var parameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)),
            ClockSkew = TimeSpan.Zero,
        };

        var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };

        try
        {
            var principal = handler.ValidateToken(token, parameters, out _);

            if (principal.FindFirst(JwtClaimNames.TokenType)?.Value != JwtClaimNames.RefreshTokenType)
            {
                return null;
            }

            var subject = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            var jti = principal.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
            var familyId = principal.FindFirst(JwtClaimNames.FamilyId)?.Value;
            var expiresAt = principal.FindFirst(JwtRegisteredClaimNames.Exp)?.Value;

            if (!long.TryParse(subject, NumberStyles.Integer, CultureInfo.InvariantCulture, out var userId)
                || string.IsNullOrEmpty(jti)
                || string.IsNullOrEmpty(familyId)
                || !long.TryParse(expiresAt, NumberStyles.Integer, CultureInfo.InvariantCulture, out var expiresAtUnix))
            {
                return null;
            }

            return new RefreshTokenClaims(
                userId,
                jti,
                familyId,
                DateTimeOffset.FromUnixTimeSeconds(expiresAtUnix).UtcDateTime);
        }
        catch (SecurityTokenException)
        {
            return null;
        }
    }

    private string Write(IReadOnlyCollection<Claim> claims, DateTime now, DateTime expiresAt)
    {
        var jwt = options.Value.Jwt;
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(jwt.Issuer, jwt.Audience, claims, now, expiresAt, credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
