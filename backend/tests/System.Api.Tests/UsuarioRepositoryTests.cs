using System.Api.Repositories;

namespace System.Api.Tests;

[Collection("Banco de teste")]
public sealed class UsuarioRepositoryTests(DatabaseFixture fixture) : DatabaseTest(fixture)
{
    [Fact]
    public async Task TestGravaELeUsuario()
    {
        var usuarios = new UsuarioRepository(Db);
        var usuario = NewUsuario("maria@example.com", "52998224725");
        usuarios.Add(usuario);
        await usuarios.SaveChangesAsync(default);

        await using var outroContexto = Fixture.CreateContext();
        var leitura = new UsuarioRepository(outroContexto);

        Assert.Equal("52998224725", (await leitura.GetByEmailAsync("maria@example.com", default))?.Cpf);
        Assert.Equal("maria@example.com", (await leitura.GetByIdAsync(usuario.Id, default))?.Email);
    }

    [Fact]
    public async Task TestAtualizaUsuario()
    {
        var salvo = await SaveAsync(NewUsuario("maria@example.com", "52998224725"));
        var usuarios = new UsuarioRepository(Db);

        var usuario = await usuarios.GetByIdAsync(salvo.Id, default);
        usuario!.Telefone = "88999990000";
        await usuarios.SaveChangesAsync(default);

        await using var outroContexto = Fixture.CreateContext();
        var leitura = new UsuarioRepository(outroContexto);
        Assert.Equal("88999990000", (await leitura.GetByIdAsync(salvo.Id, default))?.Telefone);
    }

    [Fact]
    public async Task TestEmailCpfExistem()
    {
        await SaveAsync(NewUsuario("joao@example.com", "11144477735"));
        var usuarios = new UsuarioRepository(Db);

        Assert.True(await usuarios.EmailExistsAsync("joao@example.com", default));
        Assert.False(await usuarios.EmailExistsAsync("outro@example.com", default));
        Assert.True(await usuarios.CpfExistsAsync("11144477735", default));
        Assert.False(await usuarios.CpfExistsAsync("52998224725", default));
    }

    [Theory]
    [InlineData("' OR '1'='1")]
    [InlineData("x'; DROP TABLE usuario; --")]
    public async Task TestInjecaoNoEmail(string email)
    {
        await SaveAsync(NewUsuario("ana@example.com", "39053344705"));
        var usuarios = new UsuarioRepository(Db);

        Assert.Null(await usuarios.GetByEmailAsync(email, default));
        Assert.True(await usuarios.EmailExistsAsync("ana@example.com", default));
    }
}
