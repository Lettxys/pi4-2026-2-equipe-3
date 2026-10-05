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
        };

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(jwt.Issuer, jwt.Audience, claims, now, expiresAt, credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}