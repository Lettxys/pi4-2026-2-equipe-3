using System.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace System.Api.Data.Configuration;

public class ProcessoEtapaConfiguration : IEntityTypeConfiguration<ProcessoEtapa>
{
    public void Configure(EntityTypeBuilder<ProcessoEtapa> builder)
    {
        builder.ToTable(t => t.HasCheckConstraint("ck_processo_etapa_status", "status IN ('LOCKED', 'IN_PROGRESS', 'VALIDATED')"));

        builder.HasKey(pe => new { pe.ProcessoId, pe.EtapaId });
        builder.Property(pe => pe.Status).HasMaxLength(15);

        builder.HasOne(pe => pe.Processo)
            .WithMany(p => p.Etapas)
            .HasForeignKey(pe => pe.ProcessoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pe => pe.Etapa)
            .WithMany()
            .HasForeignKey(pe => pe.EtapaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
