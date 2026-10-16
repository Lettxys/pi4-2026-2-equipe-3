using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using System.Api.DTO.Common;
using System.Api.Middlewares;
using System.Api.Repositories;

namespace System.Api.Tests;

[Collection("Banco de teste")]
public sealed class ErrosDoBancoTests(DatabaseFixture fixture) : DatabaseTest(fixture)
{
    [Fact]
    public async Task TestEmailDuplicado()
    {
        await SaveAsync(NewUsuario("repetido@example.com", "52998224725"));
        var usuarios = new UsuarioRepository(Db);
        usuarios.Add(NewUsuario("repetido@example.com", "11144477735"));

        var (status, erro) = await SendThroughMiddlewareAsync(_ => usuarios.SaveChangesAsync(default));

        Assert.Equal(409, status);
        Assert.Equal(ErrorCodes.Conflict, erro.Code);
        Assert.Equal("Registro duplicado.", erro.Message);
    }

    [Fact]
    public async Task TestChaveEstrangeira()
    {
        var tokens = new TokenRedefinicaoSenhaRepository(Db);
        tokens.Add(NewToken(usuarioId: 999, "hash", usadoEm: null));

        var (status, erro) = await SendThroughMiddlewareAsync(_ => tokens.SaveChangesAsync(default));

        Assert.Equal(409, status);
        Assert.Equal(ErrorCodes.Conflict, erro.Code);
    }

    [Fact]
    public async Task TestCampoVazio()
    {
        var invalido = NewUsuario("joao@example.com", "11144477735");
        invalido.NomeCompleto = null!;
        var usuarios = new UsuarioRepository(Db);
        usuarios.Add(NewUsuario("maria@example.com", "52998224725"));
        usuarios.Add(invalido);

        var (status, erro) = await SendThroughMiddlewareAsync(_ => usuarios.SaveChangesAsync(default));

        Assert.Equal(400, status);
        Assert.Equal(ErrorCodes.Validation, erro.Code);
        await using var outroContexto = Fixture.CreateContext();
        Assert.Equal(0, await outroContexto.Usuarios.CountAsync());
    }

    private static async Task<(int Status, ApiErrorResponse Erro)> SendThroughMiddlewareAsync(RequestDelegate rota)
    {
        var middleware = new ExceptionHandlingMiddleware(rota, NullLogger<ExceptionHandlingMiddleware>.Instance);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.Body.Position = 0;
        var erro = await JsonSerializer.DeserializeAsync<ApiErrorResponse>(context.Response.Body, ApiJson.Options);
        return (context.Response.StatusCode, erro!);
    }
}
