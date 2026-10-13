using Microsoft.EntityFrameworkCore;
using System.Api.Data;
using System.Api.Interfaces;
using System.Api.Models;
using System.Api.Models.Enums;

namespace System.Api.Repositories;

public sealed class ProcessoRepository(AppDbContext db) : IProcessoRepository
{
    public Task<Processo?> GetInProgressAsync(long usuarioId, CancellationToken cancellationToken) =>
        db.Processos
            .AsNoTracking()
            .Where(p => p.UsuarioId == usuarioId && p.Status != StatusProcesso.COMPLETED)
            .OrderByDescending(p => p.CriadoEm)
            .FirstOrDefaultAsync(cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
}
