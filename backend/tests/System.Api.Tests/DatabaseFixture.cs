using DotNetEnv;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Api.Data;

namespace System.Api.Tests;

[CollectionDefinition("Banco de teste")]
public sealed class DatabaseCollection : ICollectionFixture<DatabaseFixture>;

public sealed class DatabaseFixture : IAsyncLifetime
{
    private readonly DbContextOptions<AppDbContext> options;

    public DatabaseFixture()
    {
        Env.TraversePath().Load();

        var database = Environment.GetEnvironmentVariable("POSTGRES_DB");
        if (string.IsNullOrEmpty(database))
        {
            throw new InvalidOperationException("Variáveis POSTGRES_* ausentes. Crie o .env a partir do .env.example.");
        }

        var connectionString = new NpgsqlConnectionStringBuilder
        {
            Host = Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost",
            Port = int.Parse(Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "5432"),
            Database = database + "_test",
            Username = Environment.GetEnvironmentVariable("POSTGRES_USER"),
            Password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD"),
        }.ConnectionString;

        options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .UseSnakeCaseNamingConvention()
            .Options;
    }

    public AppDbContext CreateContext() => new(options);

    public async Task InitializeAsync()
    {
        await using var db = CreateContext();
        await db.Database.EnsureDeletedAsync();
        await db.Database.MigrateAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    public async Task ResetAsync()
    {
        await using var db = CreateContext();
        await db.Database.ExecuteSqlRawAsync(
            "TRUNCATE usuario, token_redefinicao_senha, token_revogado, quiz, quiz_resposta, processo, etapa, " +
            "etapa_acao, tipo_documento, etapa_documento, processo_etapa, condutor_autorizado, documento, dossie " +
            "RESTART IDENTITY CASCADE");
    }
}
