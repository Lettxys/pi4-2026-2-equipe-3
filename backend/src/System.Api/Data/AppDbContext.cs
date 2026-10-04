using System.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace System.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<TokenRedefinicaoSenha> TokensRedefinicaoSenha => Set<TokenRedefinicaoSenha>();
    public DbSet<TokenRevogado> TokensRevogados => Set<TokenRevogado>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<QuizResposta> QuizRespostas => Set<QuizResposta>();
    public DbSet<Processo> Processos => Set<Processo>();
    public DbSet<Etapa> Etapas => Set<Etapa>();
    public DbSet<EtapaAcao> EtapaAcoes => Set<EtapaAcao>();
    public DbSet<TipoDocumento> TiposDocumento => Set<TipoDocumento>();
    public DbSet<EtapaDocumento> EtapaDocumentos => Set<EtapaDocumento>();
    public DbSet<ProcessoEtapa> ProcessoEtapas => Set<ProcessoEtapa>();
    public DbSet<CondutorAutorizado> CondutoresAutorizados => Set<CondutorAutorizado>();
    public DbSet<Documento> Documentos => Set<Documento>();
    public DbSet<Dossie> Dossies => Set<Dossie>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<Enum>().HaveConversion<string>();
    }
}
