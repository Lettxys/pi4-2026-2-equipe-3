using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Api.Interfaces;
using System.Api.Security;

namespace System.Api.Services;

public sealed class TokenValidationService(
    IUsuarioRepository usuarios,
    ITokenRevogadoRepository tokensRevogados) : ITokenValidator
{
    public async Task<bool> ValidateAsync(ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        if (principal.FindFirst(JwtClaimNames.TokenType)?.Value == JwtClaimNames.RefreshTokenType)
        {
            return false;
        }

        var userId = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        if (!long.TryParse(userId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id))
        {
            return false;
        }

        var user = await usuarios.GetByIdAsync(id, cancellationToken);

        if (user is null || user.AnonimizadoEm is not null || string.IsNullOrEmpty(user.SenhaHash))
        {
            return false;
        }

        var jti = principal.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
        return jti is null
            || !await tokensRevogados.ExistsAsync(jti, cancellationToken);
    }
}