using Microsoft.EntityFrameworkCore;
using System.Api.Data;
using System.Api.Interfaces;
using System.Api.Models;

namespace System.Api.Repositories;

public sealed class TokenRevogadoRepository(AppDbContext db) : ITokenRevogadoRepository
{
    public Task<bool> ExistsAsync(string jti, CancellationToken cancellationToken) =>
        db.TokensRevogados.AnyAsync(t => t.Jti == jti, cancellationToken);

    public void Add(TokenRevogado token) => db.TokensRevogados.Add(token);

    public async Task RemoveExpiredAsync(DateTime now, CancellationToken cancellationToken) =>
        db.TokensRevogados.RemoveRange(await db.TokensRevogados
            .Where(t => t.ExpiraEm < now)
            .ToListAsync(cancellationToken));

    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
}
