using System.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace System.Api.Data.Configuration;

public class ProcessoConfiguration : IEntityTypeConfiguration<Processo>
{
    public void Configure(EntityTypeBuilder<Processo> builder)
    {
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("ck_processo_tipo_perfil", "tipo_perfil IN ('PCD_DRIVER', 'PCD_NON_DRIVER')");
            t.HasCheckConstraint("ck_processo_tipo_deficiencia", "tipo_deficiencia IN ('PHYSICAL', 'VISUAL', 'HEARING', 'INTELLECTUAL', 'AUTISM', 'DOWN_SYNDROME')");
            t.HasCheckConstraint("ck_processo_status", "status IN ('DRAFT', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED')");
            t.HasCheckConstraint("ck_processo_cnh",
                "tipo_perfil = 'PCD_DRIVER' OR (cnh_numero IS NULL AND cnh_validade IS NULL AND cnh_possui_restricao IS NULL)");
        });

        builder.Property(p => p.TipoPerfil).HasMaxLength(20);
        builder.Property(p => p.TipoDeficiencia).HasMaxLength(20);
        builder.Property(p => p.Status).HasMaxLength(15);
        builder.Property(p => p.CnhNumero).HasMaxLength(11).IsFixedLength();
        builder.Property(p => p.VeiculoModelo).HasMaxLength(100);
        builder.Property(p => p.VeiculoValor).HasPrecision(12, 2);

        builder.HasIndex(p => p.UsuarioId).IsUnique().HasFilter("status <> 'COMPLETED'");

        builder.HasOne(p => p.Usuario)
            .WithMany(u => u.Processos)
            .HasForeignKey(p => p.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Quiz)
            .WithOne(q => q.Processo)
            .HasForeignKey<Processo>(p => p.QuizId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
