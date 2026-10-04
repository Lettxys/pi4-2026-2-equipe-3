using System.Api.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;

DotNetEnv.Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

var connectionString = new NpgsqlConnectionStringBuilder
{
    Host = builder.Configuration["POSTGRES_HOST"] ?? "localhost",
    Port = builder.Configuration.GetValue("POSTGRES_PORT", 5432),
    Database = builder.Configuration["POSTGRES_DB"],
    Username = builder.Configuration["POSTGRES_USER"],
    Password = builder.Configuration["POSTGRES_PASSWORD"],
}.ConnectionString;

// Add services to the container.

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString).UseSnakeCaseNamingConvention());

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.DocumentTitle = "API para sistema de isenção veicular para pessoas com deficiência - v1";
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "API PI-IV (v1)");
        options.RoutePrefix = "docs";
    });
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
