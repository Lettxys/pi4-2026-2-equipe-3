using Microsoft.EntityFrameworkCore;
using System.Api.Models;
using System.Api.Models.Enums;

namespace System.Api.Tests;

[Collection("Banco de teste")]
public sealed class UnicidadeTests(DatabaseFixture fixture) : RestricaoTest(fixture)
{
    [Fact]
    public async Task TestUsuarioDuplicado()
    {
        await CriarCenarioAsync();

        Assert.Equal("ix_usuario_email",
            (await FalhaAoInserirAsync(NewUsuario("maria@example.com", "39053344705"))).ConstraintName);
        Assert.Equal("ix_usuario_cpf",
            (await FalhaAoInserirAsync(NewUsuario("ana@example.com", "52998224725"))).ConstraintName);
        Assert.Equal("ix_usuario_email",
            (await FalhaAoAtualizarAsync<Usuario>(u => u.Email = "maria@example.com", Joao.Id)).ConstraintName);
        Assert.Equal("ix_usuario_cpf",
            (await FalhaAoAtualizarAsync<Usuario>(u => u.Cpf = "52998224725", Joao.Id)).ConstraintName);

        await using var db = Fixture.CreateContext();
        var joao = await db.Usuarios.FindAsync(Joao.Id);
        Assert.Equal(2, await db.Usuarios.CountAsync());
        Assert.Equal("joao@example.com", joao!.Email);
        Assert.Equal("11144477735", joao.Cpf);
    }

    [Fact]
    public async Task TestVariosUsuariosAnonimizados()
    {
        await CriarCenarioAsync();
        await using var db = Fixture.CreateContext();

        foreach (var usuario in await db.Usuarios.ToListAsync())
        {
            usuario.Email = null;
            usuario.Cpf = null;
            usuario.AnonimizadoEm = DateTime.UtcNow;
        }
        await db.SaveChangesAsync();

        Assert.Equal(2, await db.Usuarios.CountAsync(u => u.Email == null && u.Cpf == null));
    }

    [Fact]
    public async Task TestTokenDuplicado()
    {
        await CriarCenarioAsync();
        var outroToken = await SaveAsync(NewToken(Maria.Id, "hash-2", usadoEm: null));
        await SaveAsync(new TokenRevogado { Jti = "jti-2", ExpiraEm = DateTime.UtcNow.AddHours(1) });

        Assert.Equal("ix_token_redefinicao_senha_token_hash",
            (await FalhaAoInserirAsync(NewToken(Maria.Id, "hash-1", usadoEm: null))).ConstraintName);
        Assert.Equal("ix_token_redefinicao_senha_token_hash",
            (await FalhaAoAtualizarAsync<TokenRedefinicaoSenha>(t => t.TokenHash = "hash-1", outroToken.Id)).ConstraintName);
        Assert.Equal("pk_token_revogado",
            (await FalhaAoInserirAsync(new TokenRevogado { Jti = "jti-1", ExpiraEm = DateTime.UtcNow })).ConstraintName);
        Assert.Equal("pk_token_revogado",
            (await FalhaNoSqlAsync($"UPDATE token_revogado SET jti = 'jti-1' WHERE jti = 'jti-2'")).ConstraintName);

        await using var db = Fixture.CreateContext();
        Assert.Equal(["hash-1", "hash-2"], await db.TokensRedefinicaoSenha.Select(t => t.TokenHash).OrderBy(h => h).ToListAsync());
        Assert.Equal(["jti-1", "jti-2"], await db.TokensRevogados.Select(t => t.Jti).OrderBy(j => j).ToListAsync());
    }

    [Fact]
    public async Task TestQuizDuplicado()
    {
        await CriarCenarioAsync();
        var repetido = NewQuiz(null);
        repetido.TokenAnonimo = Quiz.TokenAnonimo;

        Assert.Equal("ix_quiz_token_anonimo", (await FalhaAoInserirAsync(repetido)).ConstraintName);
        Assert.Equal("ix_quiz_token_anonimo",
            (await FalhaAoAtualizarAsync<Quiz>(q => q.TokenAnonimo = Quiz.TokenAnonimo, QuizDoJoao.Id)).ConstraintName);

        await using var db = Fixture.CreateContext();
        Assert.Equal(2, await db.Quizzes.CountAsync());
        Assert.Equal(QuizDoJoao.TokenAnonimo, (await db.Quizzes.FindAsync(QuizDoJoao.Id))!.TokenAnonimo);
    }

    [Fact]
    public async Task TestTipoDocumentoDuplicado()
    {
        await CriarCenarioAsync();
        var cpf = await SaveAsync(NewTipoDocumento("CPF"));

        Assert.Equal("ix_tipo_documento_codigo", (await FalhaAoInserirAsync(NewTipoDocumento("ID_CARD"))).ConstraintName);
        Assert.Equal("ix_tipo_documento_codigo",
            (await FalhaAoAtualizarAsync<TipoDocumento>(t => t.Codigo = "ID_CARD", cpf.Id)).ConstraintName);

        await using var db = Fixture.CreateContext();
        Assert.Equal(["CPF", "ID_CARD"], await db.TiposDocumento.Select(t => t.Codigo).OrderBy(c => c).ToListAsync());
    }

    [Fact]
    public async Task TestEtapaDuplicada()
    {
        await CriarCenarioAsync();
        var segunda = await SaveAsync(NewEtapa(2));

        Assert.Equal("ix_etapa_tipo_perfil_ordem", (await FalhaAoInserirAsync(NewEtapa(1))).ConstraintName);
        Assert.Equal("ix_etapa_tipo_perfil_ordem",
            (await FalhaAoAtualizarAsync<Etapa>(e => e.Ordem = 1, segunda.Id)).ConstraintName);

        await using var db = Fixture.CreateContext();
        Assert.Equal([1, 2], await db.Etapas.Select(e => (int)e.Ordem).OrderBy(o => o).ToListAsync());
    }

    [Fact]
    public async Task TestProcessoComQuizRepetido()
    {
        await CriarCenarioAsync();
        var repetido = NewProcesso(Joao.Id, StatusProcesso.DRAFT);
        repetido.QuizId = Quiz.Id;

        Assert.Equal("ix_processo_quiz_id", (await FalhaAoInserirAsync(repetido)).ConstraintName);

        var processoDoJoao = await SaveAsync(NewProcesso(Joao.Id, StatusProcesso.DRAFT));
        Assert.Equal("ix_processo_quiz_id",
            (await FalhaAoAtualizarAsync<Processo>(p => p.QuizId = Quiz.Id, processoDoJoao.Id)).ConstraintName);

        await using var db = Fixture.CreateContext();
        Assert.Equal(2, await db.Processos.CountAsync());
        Assert.Null((await db.Processos.FindAsync(processoDoJoao.Id))!.QuizId);
    }

    [Fact]
    public async Task TestDoisProcessosAtivos()
    {
        await CriarCenarioAsync();
        var concluido = await SaveAsync(NewProcesso(Maria.Id, StatusProcesso.COMPLETED));

        Assert.Equal("ix_processo_usuario_id",
            (await FalhaAoInserirAsync(NewProcesso(Maria.Id, StatusProcesso.DRAFT))).ConstraintName);
        Assert.Equal("ix_processo_usuario_id",
            (await FalhaAoAtualizarAsync<Processo>(p => p.Status = StatusProcesso.IN_PROGRESS, concluido.Id)).ConstraintName);

        await using var db = Fixture.CreateContext();
        Assert.Equal(2, await db.Processos.CountAsync(p => p.UsuarioId == Maria.Id));
        Assert.Equal(StatusProcesso.COMPLETED, (await db.Processos.FindAsync(concluido.Id))!.Status);
    }

    [Fact]
    public async Task TestCondutorDuplicado()
    {
        await CriarCenarioAsync();
        var mesmoCpf = NewCondutor(Processo.Id, "39053344705");
        mesmoCpf.Posicao = 2;
        var segundo = NewCondutor(Processo.Id, "52998224725");
        segundo.Posicao = 2;
        segundo = await SaveAsync(segundo);
        var processoDoJoao = await SaveAsync(NewProcesso(Joao.Id, StatusProcesso.DRAFT));
        await SaveAsync(NewCondutor(processoDoJoao.Id, "39053344705"));

        Assert.Equal("ix_condutor_autorizado_processo_id_cpf", (await FalhaAoInserirAsync(mesmoCpf)).ConstraintName);
        Assert.Equal("ix_condutor_autorizado_processo_id_posicao",
            (await FalhaAoInserirAsync(NewCondutor(Processo.Id, "11144477735"))).ConstraintName);
        Assert.Equal("ix_condutor_autorizado_processo_id_cpf",
            (await FalhaAoAtualizarAsync<CondutorAutorizado>(c => c.Cpf = "39053344705", segundo.Id)).ConstraintName);
        Assert.Equal("ix_condutor_autorizado_processo_id_posicao",
            (await FalhaAoAtualizarAsync<CondutorAutorizado>(c => c.Posicao = 1, segundo.Id)).ConstraintName);

        await using var db = Fixture.CreateContext();
        var condutor = await db.CondutoresAutorizados.FindAsync(segundo.Id);
        Assert.Equal(3, await db.CondutoresAutorizados.CountAsync());
        Assert.Equal("52998224725", condutor!.Cpf);
        Assert.Equal(2, condutor.Posicao);
    }

    [Fact]
    public async Task TestDossieDuplicado()
    {
        await CriarCenarioAsync();
        var processoDoJoao = await SaveAsync(NewProcesso(Joao.Id, StatusProcesso.DRAFT));
        var dossieDoJoao = await SaveAsync(NewDossie(processoDoJoao.Id));

        Assert.Equal("ix_dossie_processo_id", (await FalhaAoInserirAsync(NewDossie(Processo.Id))).ConstraintName);
        Assert.Equal("ix_dossie_processo_id",
            (await FalhaAoAtualizarAsync<Dossie>(d => d.ProcessoId = Processo.Id, dossieDoJoao.Id)).ConstraintName);

        await using var db = Fixture.CreateContext();
        Assert.Equal(2, await db.Dossies.CountAsync());
        Assert.Equal(processoDoJoao.Id, (await db.Dossies.FindAsync(dossieDoJoao.Id))!.ProcessoId);
    }

    [Fact]
    public async Task TestInsereChaveCompostaRepetida()
    {
        await CriarCenarioAsync();

        Assert.Equal("pk_etapa_acao",
            (await FalhaAoInserirAsync(new EtapaAcao { EtapaId = Etapa.Id, Ordem = 1, Descricao = "Outra" })).ConstraintName);
        Assert.Equal("pk_etapa_documento",
            (await FalhaAoInserirAsync(new EtapaDocumento { EtapaId = Etapa.Id, TipoDocumentoId = Tipo.Id })).ConstraintName);
        Assert.Equal("pk_quiz_resposta",
            (await FalhaAoInserirAsync(new QuizResposta { QuizId = Quiz.Id, CodigoPergunta = "P1", Resposta = "não" })).ConstraintName);
        Assert.Equal("pk_processo_etapa",
            (await FalhaAoInserirAsync(NewProcessoEtapa(Processo.Id, Etapa.Id))).ConstraintName);

        await using var db = Fixture.CreateContext();
        Assert.Equal("Separar o RG", (await db.EtapaAcoes.SingleAsync()).Descricao);
        Assert.Equal(1, await db.EtapaDocumentos.CountAsync());
        Assert.Equal("sim", (await db.QuizRespostas.SingleAsync()).Resposta);
        Assert.Equal(1, await db.ProcessoEtapas.CountAsync());
    }

    [Fact]
    public async Task TestAtualizaChaveCompostaRepetida()
    {
        await CriarCenarioAsync();
        var cpf = await SaveAsync(NewTipoDocumento("CPF"));
        var segundaEtapa = await SaveAsync(NewEtapa(2));
        await SaveAsync(new EtapaAcao { EtapaId = Etapa.Id, Ordem = 2, Descricao = "Tirar cópia" });
        await SaveAsync(new EtapaDocumento { EtapaId = Etapa.Id, TipoDocumentoId = cpf.Id });
        await SaveAsync(new QuizResposta { QuizId = Quiz.Id, CodigoPergunta = "P2", Resposta = "não" });
        await SaveAsync(NewProcessoEtapa(Processo.Id, segundaEtapa.Id));

        Assert.Equal("pk_etapa_acao",
            (await FalhaNoSqlAsync($"UPDATE etapa_acao SET ordem = 1 WHERE ordem = 2")).ConstraintName);
        Assert.Equal("pk_etapa_documento",
            (await FalhaNoSqlAsync($"UPDATE etapa_documento SET tipo_documento_id = {Tipo.Id} WHERE tipo_documento_id = {cpf.Id}")).ConstraintName);
        Assert.Equal("pk_quiz_resposta",
            (await FalhaNoSqlAsync($"UPDATE quiz_resposta SET codigo_pergunta = 'P1' WHERE codigo_pergunta = 'P2'")).ConstraintName);
        Assert.Equal("pk_processo_etapa",
            (await FalhaNoSqlAsync($"UPDATE processo_etapa SET etapa_id = {Etapa.Id} WHERE etapa_id = {segundaEtapa.Id}")).ConstraintName);

        await using var db = Fixture.CreateContext();
        Assert.Equal([1, 2], await db.EtapaAcoes.Select(a => (int)a.Ordem).OrderBy(o => o).ToListAsync());
        Assert.Equal(2, await db.EtapaDocumentos.CountAsync(e => e.TipoDocumentoId == Tipo.Id || e.TipoDocumentoId == cpf.Id));
        Assert.Equal(["P1", "P2"], await db.QuizRespostas.Select(r => r.CodigoPergunta).OrderBy(c => c).ToListAsync());
        Assert.Equal(2, await db.ProcessoEtapas.CountAsync());
    }
}
