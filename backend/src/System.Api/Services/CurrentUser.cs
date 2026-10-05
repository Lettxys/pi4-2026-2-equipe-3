using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Api.Interfaces;
using System.Api.Models.Enums;
using System.Api.Security;

namespace System.Api.Services;

public sealed class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    public ClaimsPrincipal Principal =>
        httpContextAccessor.HttpContext?.User ?? new ClaimsPrincipal(new ClaimsIdentity());

    public long Id => ReadLong(JwtRegisteredClaimNames.Sub);

    public string? Email => ReadString(JwtRegisteredClaimNames.Email);

    public string? Name => ReadString(JwtRegisteredClaimNames.UniqueName);

    public string? Jti => ReadString(JwtRegisteredClaimNames.Jti);

    public DateTime? IssuedAt => ReadUnixTime(JwtRegisteredClaimNames.Iat);

    public DateTime? ExpiresAt => ReadUnixTime(JwtRegisteredClaimNames.Exp);

    public bool IsAdministrator =>
        Principal.FindAll(JwtClaimNames.Role).Any(c => c.Value == Papel.ADMIN.ToString());

    private string? ReadString(string claimType) => Principal.FindFirst(claimType)?.Value;

    private long ReadLong(string claimType)
    {
        var value = ReadString(claimType);
        return long.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id) ? id : 0;
    }

    private DateTime? ReadUnixTime(string claimType)
    {
        var value = ReadString(claimType);
        return long.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var unixSeconds)
            ? DateTimeOffset.FromUnixTimeSeconds(unixSeconds).UtcDateTime
            : null;
    }
}