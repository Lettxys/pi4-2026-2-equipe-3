using Microsoft.EntityFrameworkCore;
using System.Api.Models;
using System.Api.Models.Enums;
using System.Api.Repositories;

namespace System.Api.Tests;

[Collection("Banco de teste")]
public sealed class ProcessoRepositoryTests(DatabaseFixture fixture) : DatabaseTest(fixture)
{
    [Fact]
    public async Task TestProcessoEmAndamento()
    {
        var usuario = await SaveAsync(NewUsuario("maria@example.com", "52998224725"));
        await SaveAsync(NewProcesso(usuario.Id, StatusProcesso.COMPLETED));
        var processos = new ProcessoRepository(Db);

        Assert.Null(await processos.GetInProgressAsync(usuario.Id, default));

        var rascunho = await SaveAsync(NewProcesso(usuario.Id, StatusProcesso.DRAFT));

        Assert.Equal(rascunho.Id, (await processos.GetInProgressAsync(usuario.Id, default))?.Id);
    }

    [Fact]
    public async Task TestRemoveDocumentosDossieCondutores()
    {
        var tipo = await SaveAsync(new TipoDocumento
        {
            Codigo = "ID_CARD",
            Nome = "RG ou CIN",
            Dono = DonoDocumento.HOLDER,
            RegraValidade = RegraValidade.NONE,
        });
        var usuario = await SaveAsync(NewUsuario("maria@example.com", "52998224725"));
        var outro = await SaveAsync(NewUsuario("joao@example.com", "11144477735"));
        var processo = await SaveAsync(NewProcesso(usuario.Id, StatusProcesso.COMPLETED));
        var processoDoOutro = await SaveAsync(NewProcesso(outro.Id, StatusProcesso.DRAFT));
        await SaveAsync(NewDocumento(processo.Id, tipo.Id));
        await SaveAsync(NewDocumento(processoDoOutro.Id, tipo.Id));
        await SaveAsync(NewDossie(processo.Id));
        await SaveAsync(NewCondutor(processo.Id, "39053344705"));
        await SaveAsync(NewCondutor(processoDoOutro.Id, "39053344705"));
        var documentos = new DocumentoRepository(Db);
        var dossies = new DossieRepository(Db);
        var condutores = new CondutorAutorizadoRepository(Db);

        var documentosDoUsuario = await documentos.ListByUsuarioAsync(usuario.Id, default);
        var dossiesDoUsuario = await dossies.ListByUsuarioAsync(usuario.Id, default);

        Assert.Equal(processo.Id, Assert.Single(documentosDoUsuario).ProcessoId);
        Assert.Equal(processo.Id, Assert.Single(dossiesDoUsuario).ProcessoId);

        documentos.RemoveRange(documentosDoUsuario);
        dossies.RemoveRange(dossiesDoUsuario);
        await condutores.RemoveByUsuarioAsync(usuario.Id, default);
        await condutores.SaveChangesAsync(default);

        Assert.Equal(processoDoOutro.Id, Assert.Single(await Db.Documentos.ToListAsync()).ProcessoId);
        Assert.Empty(await Db.Dossies.ToListAsync());
        Assert.Equal(processoDoOutro.Id, Assert.Single(await Db.CondutoresAutorizados.ToListAsync()).ProcessoId);
    }
}
