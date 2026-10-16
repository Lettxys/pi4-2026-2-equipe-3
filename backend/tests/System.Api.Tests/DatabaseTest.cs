using System.Api.Data;
using System.Api.Models;
using System.Api.Models.Enums;

namespace System.Api.Tests;

public abstract class DatabaseTest(DatabaseFixture fixture) : IAsyncLifetime
{
    protected DatabaseFixture Fixture { get; } = fixture;

    protected AppDbContext Db { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        await Fixture.ResetAsync();
        Db = Fixture.CreateContext();
    }

    public async Task DisposeAsync() => await Db.DisposeAsync();

    protected async Task<T> SaveAsync<T>(T entity) where T : class
    {
        await using var db = Fixture.CreateContext();
        db.Add(entity);
        await db.SaveChangesAsync();
        return entity;
    }

    protected static Usuario NewUsuario(string email, string cpf) => new()
    {
        NomeCompleto = "Usuário de Teste",
        Email = email,
        Cpf = cpf,
        Papel = Papel.USER,
        CriadoEm = DateTime.UtcNow,
        AtualizadoEm = DateTime.UtcNow,
    };

    protected static Processo NewProcesso(long usuarioId, StatusProcesso status) => new()
    {
        UsuarioId = usuarioId,
        TipoPerfil = TipoPerfil.PCD_NON_DRIVER,
        TipoDeficiencia = TipoDeficiencia.PHYSICAL,
        Status = status,
        AceiteZeroKmEm = DateTime.UtcNow,
        CriadoEm = DateTime.UtcNow,
        AtualizadoEm = DateTime.UtcNow,
        ConcluidoEm = status == StatusProcesso.COMPLETED ? DateTime.UtcNow : null,
    };

    protected static TokenRedefinicaoSenha NewToken(long usuarioId, string hash, DateTime? usadoEm) => new()
    {
        UsuarioId = usuarioId,
        TokenHash = hash,
        ExpiraEm = DateTime.UtcNow.AddMinutes(30),
        UsadoEm = usadoEm,
        CriadoEm = DateTime.UtcNow,
    };

    protected static Documento NewDocumento(long processoId, short tipoDocumentoId) => new()
    {
        ProcessoId = processoId,
        TipoDocumentoId = tipoDocumentoId,
        Status = StatusDocumento.VALID,
        DataEmissao = DateOnly.FromDateTime(DateTime.UtcNow),
        CaminhoArquivo = $"uploads/{Guid.NewGuid()}.pdf",
        NomeOriginal = "rg.pdf",
        TipoConteudo = "application/pdf",
        TamanhoBytes = 1024,
        EnviadoEm = DateTime.UtcNow,
    };

    protected static Dossie NewDossie(long processoId) => new()
    {
        ProcessoId = processoId,
        Status = StatusDossie.GENERATED,
        CaminhoArquivo = $"dossies/{Guid.NewGuid()}.zip",
        TotalDocumentos = 1,
        GeradoEm = DateTime.UtcNow,
    };

    protected static CondutorAutorizado NewCondutor(long processoId, string cpf) => new()
    {
        ProcessoId = processoId,
        Posicao = 1,
        Nome = "Condutor de Teste",
        Cpf = cpf,
        CnhNumero = "02650306461",
        Parentesco = Parentesco.SIBLING,
        CriadoEm = DateTime.UtcNow,
    };
}
