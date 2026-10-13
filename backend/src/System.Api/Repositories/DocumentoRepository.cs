using Microsoft.EntityFrameworkCore;
using System.Api.Data;
using System.Api.Interfaces;
using System.Api.Models;

namespace System.Api.Repositories;

public sealed class DocumentoRepository(AppDbContext db) : IDocumentoRepository
{
    public Task<List<Documento>> ListByUsuarioAsync(long usuarioId, CancellationToken cancellationToken) =>
        db.Documentos
            .Where(d => d.Processo.UsuarioId == usuarioId)
            .ToListAsync(cancellationToken);

    public void RemoveRange(IEnumerable<Documento> documentos) => db.Documentos.RemoveRange(documentos);

    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
}
