using Microsoft.EntityFrameworkCore;
using System.Api.Data;
using System.Api.Interfaces;
using System.Api.Models;

namespace System.Api.Repositories;

public sealed class TokenRedefinicaoSenhaRepository(AppDbContext db) : ITokenRedefinicaoSenhaRepository
{
    public Task<TokenRedefinicaoSenha?> GetByHashAsync(string tokenHash, CancellationToken cancellationToken) =>
        db.TokensRedefinicaoSenha
            .Include(t => t.Usuario)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

    public void Add(TokenRedefinicaoSenha token) => db.TokensRedefinicaoSenha.Add(token);

    public async Task RemovePendingAsync(long usuarioId, CancellationToken cancellationToken) =>
        db.TokensRedefinicaoSenha.RemoveRange(await db.TokensRedefinicaoSenha
            .Where(t => t.UsuarioId == usuarioId && t.UsadoEm == null)
            .ToListAsync(cancellationToken));

    public async Task RemoveAllAsync(long usuarioId, CancellationToken cancellationToken) =>
        db.TokensRedefinicaoSenha.RemoveRange(await db.TokensRedefinicaoSenha
            .Where(t => t.UsuarioId == usuarioId)
            .ToListAsync(cancellationToken));

    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
}
