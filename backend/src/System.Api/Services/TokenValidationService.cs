using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using System.Api.Data;
using System.Api.Interfaces;

namespace System.Api.Services;

public sealed class TokenValidationService(AppDbContext db) : ITokenValidator
{
    public async Task<bool> ValidateAsync(ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        var userId = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        if (!long.TryParse(userId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id))
        {
            return false;
        }

        var user = await db.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

        if (user is null || user.AnonimizadoEm is not null || string.IsNullOrEmpty(user.SenhaHash))
        {
            return false;
        }

        var jti = principal.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
        return jti is null
            || !await db.TokensRevogados.AnyAsync(t => t.Jti == jti, cancellationToken);
    }
}