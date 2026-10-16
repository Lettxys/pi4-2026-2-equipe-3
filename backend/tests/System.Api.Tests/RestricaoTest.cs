using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Api.Models;
using System.Api.Models.Enums;

namespace System.Api.Tests;

public abstract class RestricaoTest(DatabaseFixture fixture) : DatabaseTest(fixture)
{
    protected Usuario Maria = null!;
    protected Usuario Joao = null!;
    protected Quiz Quiz = null!;
    protected Quiz QuizDoJoao = null!;
    protected Processo Processo = null!;
    protected Etapa Etapa = null!;
    protected TipoDocumento Tipo = null!;
    protected CondutorAutorizado Condutor = null!;
    protected Documento DocumentoDaMaria = null!;
    protected Documento DocumentoDoCondutor = null!;
    protected Dossie Dossie = null!;
    protected TokenRedefinicaoSenha Token = null!;

    protected async Task CriarCenarioAsync()
    {
        Maria = await SaveAsync(NewUsuario("maria@example.com", "52998224725"));
        Joao = await SaveAsync(NewUsuario("joao@example.com", "11144477735"));
        Quiz = await SaveAsync(NewQuiz(Maria.Id));
        QuizDoJoao = await SaveAsync(NewQuiz(Joao.Id));
        await SaveAsync(new QuizResposta { QuizId = Quiz.Id, CodigoPergunta = "P1", Resposta = "sim" });

        var processo = NewProcesso(Maria.Id, StatusProcesso.DRAFT);
        processo.QuizId = Quiz.Id;
        Processo = await SaveAsync(processo);

        Etapa = await SaveAsync(NewEtapa(1));
        Tipo = await SaveAsync(NewTipoDocumento("ID_CARD"));
        await SaveAsync(new EtapaAcao { EtapaId = Etapa.Id, Ordem = 1, Descricao = "Separar o RG" });
        await SaveAsync(new EtapaDocumento { EtapaId = Etapa.Id, TipoDocumentoId = Tipo.Id });
        await SaveAsync(NewProcessoEtapa(Processo.Id, Etapa.Id));

        var condutor = NewCondutor(Processo.Id, "39053344705");
        condutor.UsuarioId = Joao.Id;
        Condutor = await SaveAsync(condutor);

        DocumentoDaMaria = await SaveAsync(NewDocumento(Processo.Id, Tipo.Id));
        var documento = NewDocumento(Processo.Id, Tipo.Id);
        documento.CondutorAutorizadoId = Condutor.Id;
        DocumentoDoCondutor = await SaveAsync(documento);

        Dossie = await SaveAsync(NewDossie(Processo.Id));
        Token = await SaveAsync(NewToken(Joao.Id, "hash-1", usadoEm: null));
        await SaveAsync(new TokenRevogado { Jti = "jti-1", ExpiraEm = DateTime.UtcNow.AddHours(1) });
    }

    protected async Task<PostgresException> FalhaAoInserirAsync(object entidade)
    {
        await using var db = Fixture.CreateContext();
        db.Add(entidade);
        var erro = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
        return Assert.IsType<PostgresException>(erro.InnerException);
    }

    protected async Task<PostgresException> FalhaAoAtualizarAsync<T>(Action<T> alterar, params object[] chave) where T : class
    {
        await using var db = Fixture.CreateContext();
        var entidade = await db.FindAsync<T>(chave);
        alterar(entidade!);
        var erro = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
        return Assert.IsType<PostgresException>(erro.InnerException);
    }

    protected async Task<PostgresException> FalhaNoSqlAsync(FormattableString sql)
    {
        await using var db = Fixture.CreateContext();
        return await Assert.ThrowsAsync<PostgresException>(() => db.Database.ExecuteSqlAsync(sql));
    }

    protected static Quiz NewQuiz(long? usuarioId) => new()
    {
        UsuarioId = usuarioId,
        TokenAnonimo = Guid.NewGuid(),
        ConsentimentoEm = DateTime.UtcNow,
        CriadoEm = DateTime.UtcNow,
    };

    protected static Etapa NewEtapa(short ordem) => new()
    {
        TipoPerfil = TipoPerfil.PCD_NON_DRIVER,
        Ordem = ordem,
        Titulo = "Etapa de teste",
        ExplicacaoSimplificada = "Explicação",
    };

    protected static TipoDocumento NewTipoDocumento(string codigo) => new()
    {
        Codigo = codigo,
        Nome = "Documento de teste",
        Dono = DonoDocumento.HOLDER,
        RegraValidade = RegraValidade.NONE,
    };

    protected static ProcessoEtapa NewProcessoEtapa(long processoId, short etapaId) => new()
    {
        ProcessoId = processoId,
        EtapaId = etapaId,
        Status = StatusEtapa.IN_PROGRESS,
        AtualizadoEm = DateTime.UtcNow,
    };
}
