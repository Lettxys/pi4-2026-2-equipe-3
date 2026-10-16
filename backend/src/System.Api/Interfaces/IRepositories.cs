using System.Api.Models;

namespace System.Api.Interfaces;

public interface IUsuarioRepository
{
    Task<Usuario?> GetByIdAsync(long id, CancellationToken cancellationToken);

    Task<Usuario?> GetByEmailAsync(string email, CancellationToken cancellationToken);

    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken);

    Task<bool> CpfExistsAsync(string cpf, CancellationToken cancellationToken);

    void Add(Usuario usuario);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public interface ITokenRedefinicaoSenhaRepository
{
    Task<TokenRedefinicaoSenha?> GetByHashAsync(string tokenHash, CancellationToken cancellationToken);

    void Add(TokenRedefinicaoSenha token);

    Task RemovePendingAsync(long usuarioId, CancellationToken cancellationToken);

    Task RemoveAllAsync(long usuarioId, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public interface ITokenRevogadoRepository
{
    Task<bool> ExistsAsync(string jti, CancellationToken cancellationToken);

    void Add(TokenRevogado token);

    Task RemoveExpiredAsync(DateTime now, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public interface IProcessoRepository
{
    Task<Processo?> GetInProgressAsync(long usuarioId, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public interface ICondutorAutorizadoRepository
{
    Task RemoveByUsuarioAsync(long usuarioId, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public interface IDocumentoRepository
{
    Task<List<Documento>> ListByUsuarioAsync(long usuarioId, CancellationToken cancellationToken);

    void RemoveRange(IEnumerable<Documento> documentos);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public interface IDossieRepository
{
    Task<List<Dossie>> ListByUsuarioAsync(long usuarioId, CancellationToken cancellationToken);

    void RemoveRange(IEnumerable<Dossie> dossies);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
