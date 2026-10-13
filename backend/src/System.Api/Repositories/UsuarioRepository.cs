using Microsoft.EntityFrameworkCore;
using System.Api.Data;
using System.Api.Interfaces;
using System.Api.Models;

namespace System.Api.Repositories;

public sealed class UsuarioRepository(AppDbContext db) : IUsuarioRepository
{
    public Task<Usuario?> GetByIdAsync(long id, CancellationToken cancellationToken) =>
        db.Usuarios.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

    public Task<Usuario?> GetByEmailAsync(string email, CancellationToken cancellationToken) =>
        db.Usuarios.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

    public Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken) =>
        db.Usuarios.AnyAsync(u => u.Email == email, cancellationToken);

    public Task<bool> CpfExistsAsync(string cpf, CancellationToken cancellationToken) =>
        db.Usuarios.AnyAsync(u => u.Cpf == cpf, cancellationToken);

    public void Add(Usuario usuario) => db.Usuarios.Add(usuario);

    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
}
