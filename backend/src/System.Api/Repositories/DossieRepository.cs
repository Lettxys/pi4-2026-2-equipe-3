using Microsoft.EntityFrameworkCore;
using System.Api.Data;
using System.Api.Interfaces;
using System.Api.Models;

namespace System.Api.Repositories;

public sealed class DossieRepository(AppDbContext db) : IDossieRepository
{
    public Task<List<Dossie>> ListByUsuarioAsync(long usuarioId, CancellationToken cancellationToken) =>
        db.Dossies
            .Where(d => d.Processo.UsuarioId == usuarioId)
            .ToListAsync(cancellationToken);

    public void RemoveRange(IEnumerable<Dossie> dossies) => db.Dossies.RemoveRange(dossies);

    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
}
