using System.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace System.Api.Data.Configuration;

public class DossieConfiguration : IEntityTypeConfiguration<Dossie>
{
    public void Configure(EntityTypeBuilder<Dossie> builder)
    {
        builder.ToTable(t => t.HasCheckConstraint("ck_dossie_status", "status IN ('GENERATED')"));

        builder.Property(d => d.Status).HasMaxLength(15);
        builder.Property(d => d.CaminhoArquivo).HasMaxLength(255);

        builder.HasOne(d => d.Processo)
            .WithOne(p => p.Dossie)
            .HasForeignKey<Dossie>(d => d.ProcessoId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
