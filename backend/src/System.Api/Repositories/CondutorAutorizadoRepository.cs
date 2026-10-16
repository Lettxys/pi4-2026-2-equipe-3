using Microsoft.EntityFrameworkCore;
using System.Api.Data;
using System.Api.Interfaces;

namespace System.Api.Repositories;

public sealed class CondutorAutorizadoRepository(AppDbContext db) : ICondutorAutorizadoRepository
{
    public async Task RemoveByUsuarioAsync(long usuarioId, CancellationToken cancellationToken) =>
        db.CondutoresAutorizados.RemoveRange(await db.CondutoresAutorizados
            .Where(c => c.Processo.UsuarioId == usuarioId)
            .ToListAsync(cancellationToken));

    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
}
