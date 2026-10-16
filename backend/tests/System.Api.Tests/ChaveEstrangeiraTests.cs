using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Api.Models;
using System.Api.Models.Enums;

namespace System.Api.Tests;

[Collection("Banco de teste")]
public sealed class ChaveEstrangeiraTests(DatabaseFixture fixture) : RestricaoTest(fixture)
{
    [Fact]
    public async Task TestTokenSemUsuario()
    {
        await CriarCenarioAsync();

        Assert.Equal("fk_token_redefinicao_senha_usuario_usuario_id",
            (await FalhaAoInserirAsync(NewToken(999, "hash-2", usadoEm: null))).ConstraintName);
        Assert.Equal("fk_token_redefinicao_senha_usuario_usuario_id",
            (await FalhaAoAtualizarAsync<TokenRedefinicaoSenha>(t => t.UsuarioId = 999, Token.Id)).ConstraintName);

        await using var db = Fixture.CreateContext();
        Assert.Equal(Joao.Id, (await db.TokensRedefinicaoSenha.SingleAsync()).UsuarioId);
    }

    [Fact]
    public async Task TestQuizSemUsuario()
    {
        await CriarCenarioAsync();

        Assert.Equal("fk_quiz_usuario_usuario_id", (await FalhaAoInserirAsync(NewQuiz(999))).ConstraintName);
        Assert.Equal("fk_quiz_usuario_usuario_id",
            (await FalhaAoAtualizarAsync<Quiz>(q => q.UsuarioId = 999, Quiz.Id)).ConstraintName);

        await using var db = Fixture.CreateContext();
        Assert.Equal(2, await db.Quizzes.CountAsync());
        Assert.Equal(Maria.Id, (await db.Quizzes.FindAsync(Quiz.Id))!.UsuarioId);
    }

    [Fact]
    public async Task TestProcessoInvalido()
    {
        await CriarCenarioAsync();
        var semQuiz = NewProcesso(Joao.Id, StatusProcesso.DRAFT);
        semQuiz.QuizId = 999;

        Assert.Equal("fk_processo_usuario_usuario_id",
            (await FalhaAoInserirAsync(NewProcesso(999, StatusProcesso.DRAFT))).ConstraintName);
        Assert.Equal("fk_processo_quiz_quiz_id", (await FalhaAoInserirAsync(semQuiz)).ConstraintName);
        Assert.Equal("fk_processo_usuario_usuario_id",
            (await FalhaAoAtualizarAsync<Processo>(p => p.UsuarioId = 999, Processo.Id)).ConstraintName);
        Assert.Equal("fk_processo_quiz_quiz_id",
            (await FalhaAoAtualizarAsync<Processo>(p => p.QuizId = 999, Processo.Id)).ConstraintName);

        await using var db = Fixture.CreateContext();
        var processo = await db.Processos.SingleAsync();
        Assert.Equal(Maria.Id, processo.UsuarioId);
        Assert.Equal(Quiz.Id, processo.QuizId);
    }

    [Fact]
    public async Task TestRespostaSemQuiz()
    {
        await CriarCenarioAsync();

        Assert.Equal("fk_quiz_resposta_quiz_quiz_id",
            (await FalhaAoInserirAsync(new QuizResposta { QuizId = 999, CodigoPergunta = "P1", Resposta = "sim" })).ConstraintName);
        Assert.Equal("fk_quiz_resposta_quiz_quiz_id",
            (await FalhaNoSqlAsync($"UPDATE quiz_resposta SET quiz_id = 999 WHERE quiz_id = {Quiz.Id}")).ConstraintName);

        await using var db = Fixture.CreateContext();
        Assert.Equal(Quiz.Id, (await db.QuizRespostas.SingleAsync()).QuizId);
    }

    [Fact]
    public async Task TestAcaoSemEtapa()
    {
        await CriarCenarioAsync();

        Assert.Equal("fk_etapa_acao_etapa_etapa_id",
            (await FalhaAoInserirAsync(new EtapaAcao { EtapaId = 999, Ordem = 1, Descricao = "Separar o RG" })).ConstraintName);
        Assert.Equal("fk_etapa_acao_etapa_etapa_id",
            (await FalhaNoSqlAsync($"UPDATE etapa_acao SET etapa_id = 999 WHERE etapa_id = {Etapa.Id}")).ConstraintName);

        await using var db = Fixture.CreateContext();
        Assert.Equal(Etapa.Id, (await db.EtapaAcoes.SingleAsync()).EtapaId);
    }

    [Fact]
    public async Task TestDocumentoDaEtapaInvalido()
    {
        await CriarCenarioAsync();

        Assert.Equal("fk_etapa_documento_etapa_etapa_id",
            (await FalhaAoInserirAsync(new EtapaDocumento { EtapaId = 999, TipoDocumentoId = Tipo.Id })).ConstraintName);
        Assert.Equal("fk_etapa_documento_tipo_documento_tipo_documento_id",
            (await FalhaAoInserirAsync(new EtapaDocumento { EtapaId = Etapa.Id, TipoDocumentoId = 999 })).ConstraintName);
        Assert.Equal("fk_etapa_documento_etapa_etapa_id",
            (await FalhaNoSqlAsync($"UPDATE etapa_documento SET etapa_id = 999 WHERE etapa_id = {Etapa.Id}")).ConstraintName);
        Assert.Equal("fk_etapa_documento_tipo_documento_tipo_documento_id",
            (await FalhaNoSqlAsync($"UPDATE etapa_documento SET tipo_documento_id = 999 WHERE etapa_id = {Etapa.Id}")).ConstraintName);

        await using var db = Fixture.CreateContext();
        var etapaDocumento = await db.EtapaDocumentos.SingleAsync();
        Assert.Equal(Etapa.Id, etapaDocumento.EtapaId);
        Assert.Equal(Tipo.Id, etapaDocumento.TipoDocumentoId);
    }

    [Fact]
    public async Task TestEtapaDoProcessoInvalida()
    {
        await CriarCenarioAsync();

        Assert.Equal("fk_processo_etapa_processo_processo_id",
            (await FalhaAoInserirAsync(NewProcessoEtapa(999, Etapa.Id))).ConstraintName);
        Assert.Equal("fk_processo_etapa_etapa_etapa_id",
            (await FalhaAoInserirAsync(NewProcessoEtapa(Processo.Id, 999))).ConstraintName);
        Assert.Equal("fk_processo_etapa_processo_processo_id",
            (await FalhaNoSqlAsync($"UPDATE processo_etapa SET processo_id = 999 WHERE processo_id = {Processo.Id}")).ConstraintName);
        Assert.Equal("fk_processo_etapa_etapa_etapa_id",
            (await FalhaNoSqlAsync($"UPDATE processo_etapa SET etapa_id = 999 WHERE processo_id = {Processo.Id}")).ConstraintName);

        await using var db = Fixture.CreateContext();
        var processoEtapa = await db.ProcessoEtapas.SingleAsync();
        Assert.Equal(Processo.Id, processoEtapa.ProcessoId);
        Assert.Equal(Etapa.Id, processoEtapa.EtapaId);
    }

    [Fact]
    public async Task TestCondutorInvalido()
    {
        await CriarCenarioAsync();
        var semUsuario = NewCondutor(Processo.Id, "52998224725");
        semUsuario.Posicao = 2;
        semUsuario.UsuarioId = 999;
        var semDocumento = NewCondutor(Processo.Id, "86288366757");
        semDocumento.Posicao = 3;
        semDocumento = await SaveAsync(semDocumento);

        Assert.Equal("fk_condutor_autorizado_processo_processo_id",
            (await FalhaAoInserirAsync(NewCondutor(999, "52998224725"))).ConstraintName);
        Assert.Equal("fk_condutor_autorizado_usuario_usuario_id", (await FalhaAoInserirAsync(semUsuario)).ConstraintName);
        Assert.Equal("fk_condutor_autorizado_processo_processo_id",
            (await FalhaNoSqlAsync($"UPDATE condutor_autorizado SET processo_id = 999 WHERE id = {semDocumento.Id}")).ConstraintName);
        Assert.Equal("fk_condutor_autorizado_usuario_usuario_id",
            (await FalhaAoAtualizarAsync<CondutorAutorizado>(c => c.UsuarioId = 999, Condutor.Id)).ConstraintName);

        await using var db = Fixture.CreateContext();
        var condutor = await db.CondutoresAutorizados.FindAsync(Condutor.Id);
        Assert.Equal(2, await db.CondutoresAutorizados.CountAsync(c => c.ProcessoId == Processo.Id));
        Assert.Equal(Joao.Id, condutor!.UsuarioId);
    }

    [Fact]
    public async Task TestDossieSemProcesso()
    {
        await CriarCenarioAsync();

        Assert.Equal("fk_dossie_processo_processo_id", (await FalhaAoInserirAsync(NewDossie(999))).ConstraintName);
        Assert.Equal("fk_dossie_processo_processo_id",
            (await FalhaAoAtualizarAsync<Dossie>(d => d.ProcessoId = 999, Dossie.Id)).ConstraintName);

        await using var db = Fixture.CreateContext();
        Assert.Equal(Processo.Id, (await db.Dossies.SingleAsync()).ProcessoId);
    }

    [Fact]
    public async Task TestDocumentoComIdInvalido()
    {
        await CriarCenarioAsync();
        var semCondutor = NewDocumento(Processo.Id, Tipo.Id);
        semCondutor.CondutorAutorizadoId = 999;

        Assert.Equal("fk_documento_processo_processo_id",
            (await FalhaAoInserirAsync(NewDocumento(999, Tipo.Id))).ConstraintName);
        Assert.Equal("fk_documento_condutor_autorizado", (await FalhaAoInserirAsync(semCondutor)).ConstraintName);
        Assert.Equal("fk_documento_tipo_documento_tipo_documento_id",
            (await FalhaAoInserirAsync(NewDocumento(Processo.Id, 999))).ConstraintName);
        Assert.Equal("fk_documento_processo_processo_id",
            (await FalhaAoAtualizarAsync<Documento>(d => d.ProcessoId = 999, DocumentoDaMaria.Id)).ConstraintName);
        Assert.Equal("fk_documento_condutor_autorizado",
            (await FalhaAoAtualizarAsync<Documento>(d => d.CondutorAutorizadoId = 999, DocumentoDaMaria.Id)).ConstraintName);
        Assert.Equal("fk_documento_tipo_documento_tipo_documento_id",
            (await FalhaAoAtualizarAsync<Documento>(d => d.TipoDocumentoId = 999, DocumentoDaMaria.Id)).ConstraintName);

        await using var db = Fixture.CreateContext();
        var documento = await db.Documentos.FindAsync(DocumentoDaMaria.Id);
        Assert.Equal(2, await db.Documentos.CountAsync());
        Assert.Equal(Processo.Id, documento!.ProcessoId);
        Assert.Null(documento.CondutorAutorizadoId);
        Assert.Equal(Tipo.Id, documento.TipoDocumentoId);
    }

    [Fact]
    public async Task TestDocumentoComCondutorDeOutroProcesso()
    {
        await CriarCenarioAsync();
        var processoDoJoao = await SaveAsync(NewProcesso(Joao.Id, StatusProcesso.DRAFT));
        var condutorDoJoao = await SaveAsync(NewCondutor(processoDoJoao.Id, "52998224725"));
        var documento = NewDocumento(Processo.Id, Tipo.Id);
        documento.CondutorAutorizadoId = condutorDoJoao.Id;

        Assert.Equal("fk_documento_condutor_autorizado", (await FalhaAoInserirAsync(documento)).ConstraintName);
        Assert.Equal("fk_documento_condutor_autorizado",
            (await FalhaAoAtualizarAsync<Documento>(d => d.CondutorAutorizadoId = condutorDoJoao.Id, DocumentoDaMaria.Id)).ConstraintName);

        await using var db = Fixture.CreateContext();
        Assert.Equal(2, await db.Documentos.CountAsync());
        Assert.Null((await db.Documentos.FindAsync(DocumentoDaMaria.Id))!.CondutorAutorizadoId);
    }

    [Fact]
    public async Task TestApagarUsuarioComProcesso()
    {
        await CriarCenarioAsync();
        await using var db = Fixture.CreateContext();

        var erro = await Assert.ThrowsAsync<PostgresException>(
            () => db.Usuarios.Where(u => u.Id == Maria.Id).ExecuteDeleteAsync());

        Assert.Equal("fk_processo_usuario_usuario_id", erro.ConstraintName);
        Assert.True(await db.Usuarios.AnyAsync(u => u.Id == Maria.Id));
        Assert.Equal(Maria.Id, (await db.Quizzes.FindAsync(Quiz.Id))!.UsuarioId);
    }

    [Fact]
    public async Task TestApagarUsuarioSemProcesso()
    {
        await CriarCenarioAsync();
        await using var db = Fixture.CreateContext();

        await db.Usuarios.Where(u => u.Id == Joao.Id).ExecuteDeleteAsync();

        Assert.Empty(await db.TokensRedefinicaoSenha.ToListAsync());
        Assert.Null((await db.Quizzes.FindAsync(QuizDoJoao.Id))!.UsuarioId);
        Assert.Null((await db.CondutoresAutorizados.SingleAsync()).UsuarioId);
    }

    [Fact]
    public async Task TestApagarQuiz()
    {
        await CriarCenarioAsync();
        await using var db = Fixture.CreateContext();

        await db.Quizzes.Where(q => q.Id == Quiz.Id).ExecuteDeleteAsync();

        Assert.Empty(await db.QuizRespostas.ToListAsync());
        Assert.Null((await db.Processos.SingleAsync()).QuizId);
    }

    [Fact]
    public async Task TestApagarProcesso()
    {
        await CriarCenarioAsync();
        await using var db = Fixture.CreateContext();

        await db.Processos.Where(p => p.Id == Processo.Id).ExecuteDeleteAsync();

        Assert.Empty(await db.CondutoresAutorizados.ToListAsync());
        Assert.Empty(await db.Documentos.ToListAsync());
        Assert.Empty(await db.Dossies.ToListAsync());
        Assert.Empty(await db.ProcessoEtapas.ToListAsync());
        Assert.Equal(2, await db.Usuarios.CountAsync());
    }

    [Fact]
    public async Task TestApagarCondutor()
    {
        await CriarCenarioAsync();
        await using var db = Fixture.CreateContext();

        await db.CondutoresAutorizados.Where(c => c.Id == Condutor.Id).ExecuteDeleteAsync();

        Assert.Equal(DocumentoDaMaria.Id, (await db.Documentos.SingleAsync()).Id);
    }

    [Fact]
    public async Task TestApagarEtapa()
    {
        await CriarCenarioAsync();
        var etapaSemProcesso = await SaveAsync(NewEtapa(2));
        await SaveAsync(new EtapaAcao { EtapaId = etapaSemProcesso.Id, Ordem = 1, Descricao = "Ir ao DETRAN" });
        await SaveAsync(new EtapaDocumento { EtapaId = etapaSemProcesso.Id, TipoDocumentoId = Tipo.Id });
        await using var db = Fixture.CreateContext();

        var erro = await Assert.ThrowsAsync<PostgresException>(
            () => db.Etapas.Where(e => e.Id == Etapa.Id).ExecuteDeleteAsync());
        await db.Etapas.Where(e => e.Id == etapaSemProcesso.Id).ExecuteDeleteAsync();

        Assert.Equal("fk_processo_etapa_etapa_etapa_id", erro.ConstraintName);
        Assert.Equal(Etapa.Id, (await db.Etapas.SingleAsync()).Id);
        Assert.Equal(Etapa.Id, (await db.EtapaAcoes.SingleAsync()).EtapaId);
        Assert.Equal(Etapa.Id, (await db.EtapaDocumentos.SingleAsync()).EtapaId);
    }

    [Fact]
    public async Task TestApagarTipoDocumentoEmUso()
    {
        await CriarCenarioAsync();
        var tipoSoNaEtapa = await SaveAsync(NewTipoDocumento("CPF"));
        var tipoSoNoDocumento = await SaveAsync(NewTipoDocumento("PROOF_OF_ADDRESS"));
        await SaveAsync(new EtapaDocumento { EtapaId = Etapa.Id, TipoDocumentoId = tipoSoNaEtapa.Id });
        await SaveAsync(NewDocumento(Processo.Id, tipoSoNoDocumento.Id));
        await using var db = Fixture.CreateContext();

        var usadoEmEtapa = await Assert.ThrowsAsync<PostgresException>(
            () => db.TiposDocumento.Where(t => t.Id == tipoSoNaEtapa.Id).ExecuteDeleteAsync());
        var usadoEmDocumento = await Assert.ThrowsAsync<PostgresException>(
            () => db.TiposDocumento.Where(t => t.Id == tipoSoNoDocumento.Id).ExecuteDeleteAsync());

        Assert.Equal("fk_etapa_documento_tipo_documento_tipo_documento_id", usadoEmEtapa.ConstraintName);
        Assert.Equal("fk_documento_tipo_documento_tipo_documento_id", usadoEmDocumento.ConstraintName);
        Assert.Equal(3, await db.TiposDocumento.CountAsync());
    }
}
