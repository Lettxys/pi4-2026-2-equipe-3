using Microsoft.Extensions.Caching.Distributed;
using System.Api.Interfaces;

namespace System.Api.Services;

public sealed class RefreshTokenStore(IDistributedCache cache) : IRefreshTokenStore
{
    private const string TokenPrefix = "refresh:token:";
    private const string ConsumedPrefix = "refresh:consumed:";
    private const string FamilyPrefix = "refresh:family:";
    private const string FamilyActive = "active";
    private const string FamilyRevoked = "revoked";

    public async Task StoreAsync(
        string jti,
        string familyId,
        string tokenHash,
        TimeSpan lifetime,
        CancellationToken cancellationToken)
    {
        await cache.SetStringAsync(TokenKey(jti), tokenHash, Options(lifetime), cancellationToken);
        await cache.SetStringAsync(FamilyKey(familyId), FamilyActive, Options(lifetime), cancellationToken);
    }

    public Task<string?> GetTokenHashAsync(string jti, CancellationToken cancellationToken) =>
        cache.GetStringAsync(TokenKey(jti), cancellationToken);

    public async Task<bool> IsConsumedAsync(string jti, CancellationToken cancellationToken) =>
        await cache.GetStringAsync(ConsumedKey(jti), cancellationToken) is not null;

    public async Task ConsumeAsync(string jti, TimeSpan lifetime, CancellationToken cancellationToken)
    {
        await cache.SetStringAsync(ConsumedKey(jti), "1", Options(lifetime), cancellationToken);
        await cache.RemoveAsync(TokenKey(jti), cancellationToken);
    }

    public async Task<bool> IsFamilyRevokedAsync(string familyId, CancellationToken cancellationToken) =>
        await cache.GetStringAsync(FamilyKey(familyId), cancellationToken) == FamilyRevoked;

    public Task RevokeFamilyAsync(string familyId, TimeSpan lifetime, CancellationToken cancellationToken) =>
        cache.SetStringAsync(FamilyKey(familyId), FamilyRevoked, Options(lifetime), cancellationToken);

    private static string TokenKey(string jti) => TokenPrefix + jti;

    private static string ConsumedKey(string jti) => ConsumedPrefix + jti;

    private static string FamilyKey(string familyId) => FamilyPrefix + familyId;

    private static DistributedCacheEntryOptions Options(TimeSpan lifetime) =>
        new() { AbsoluteExpirationRelativeToNow = lifetime };
}
