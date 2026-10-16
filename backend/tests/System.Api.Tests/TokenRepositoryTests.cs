using Microsoft.EntityFrameworkCore;
using System.Api.Models;
using System.Api.Repositories;

namespace System.Api.Tests;

[Collection("Banco de teste")]
public sealed class TokenRepositoryTests(DatabaseFixture fixture) : DatabaseTest(fixture)
{
    [Fact]
    public async Task TestBuscaTokenPorHash()
    {
        var usuario = await SaveAsync(NewUsuario("maria@example.com", "52998224725"));
        await SaveAsync(NewToken(usuario.Id, "hash-1", usadoEm: null));
        var tokens = new TokenRedefinicaoSenhaRepository(Db);

        var token = await tokens.GetByHashAsync("hash-1", default);

        Assert.Equal("maria@example.com", token?.Usuario.Email);
        Assert.Null(await tokens.GetByHashAsync("hash-2", default));
    }

    [Fact]
    public async Task TestRemoveTokensPendentes()
    {
        var usuario = await SaveAsync(NewUsuario("maria@example.com", "52998224725"));
        var outro = await SaveAsync(NewUsuario("joao@example.com", "11144477735"));
        await SaveAsync(NewToken(usuario.Id, "pendente", usadoEm: null));
        await SaveAsync(NewToken(usuario.Id, "usado", usadoEm: DateTime.UtcNow));
        await SaveAsync(NewToken(outro.Id, "de-outro", usadoEm: null));
        var tokens = new TokenRedefinicaoSenhaRepository(Db);

        await tokens.RemovePendingAsync(usuario.Id, default);
        await tokens.SaveChangesAsync(default);

        Assert.Equal(["de-outro", "usado"], await Db.TokensRedefinicaoSenha.Select(t => t.TokenHash).OrderBy(h => h).ToListAsync());
    }

    [Fact]
    public async Task TestRemoveTodosTokens()
    {
        var usuario = await SaveAsync(NewUsuario("maria@example.com", "52998224725"));
        var outro = await SaveAsync(NewUsuario("joao@example.com", "11144477735"));
        await SaveAsync(NewToken(usuario.Id, "pendente", usadoEm: null));
        await SaveAsync(NewToken(usuario.Id, "usado", usadoEm: DateTime.UtcNow));
        await SaveAsync(NewToken(outro.Id, "de-outro", usadoEm: null));
        var tokens = new TokenRedefinicaoSenhaRepository(Db);

        await tokens.RemoveAllAsync(usuario.Id, default);
        await tokens.SaveChangesAsync(default);

        Assert.Equal(["de-outro"], await Db.TokensRedefinicaoSenha.Select(t => t.TokenHash).ToListAsync());
    }

    [Fact]
    public async Task TestTokenRevogado()
    {
        var revogados = new TokenRevogadoRepository(Db);
        revogados.Add(new TokenRevogado { Jti = "jti-1", ExpiraEm = DateTime.UtcNow.AddHours(1) });
        await revogados.SaveChangesAsync(default);

        Assert.True(await revogados.ExistsAsync("jti-1", default));
        Assert.False(await revogados.ExistsAsync("jti-2", default));
    }

    [Fact]
    public async Task TestRevogadosVencidos()
    {
        await SaveAsync(new TokenRevogado { Jti = "vencido", ExpiraEm = DateTime.UtcNow.AddMinutes(-1) });
        await SaveAsync(new TokenRevogado { Jti = "valido", ExpiraEm = DateTime.UtcNow.AddMinutes(30) });
        var revogados = new TokenRevogadoRepository(Db);

        await revogados.RemoveExpiredAsync(DateTime.UtcNow, default);
        await revogados.SaveChangesAsync(default);

        Assert.Equal(["valido"], await Db.TokensRevogados.Select(t => t.Jti).ToListAsync());
    }
}
