using System.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace System.Api.Data.Configuration;

public class EtapaConfiguration : IEntityTypeConfiguration<Etapa>
{
    public void Configure(EntityTypeBuilder<Etapa> builder)
    {
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("ck_etapa_tipo_perfil", "tipo_perfil IN ('PCD_DRIVER', 'PCD_NON_DRIVER')");
            t.HasCheckConstraint("ck_etapa_orgao", "orgao IN ('CLINIC', 'DETRAN', 'RECEITA_FEDERAL', 'SEFAZ', 'DEALERSHIP')");
        });

        builder.Property(e => e.TipoPerfil).HasMaxLength(20);
        builder.Property(e => e.Titulo).HasMaxLength(100);
        builder.Property(e => e.Orgao).HasMaxLength(20);

        builder.HasIndex(e => new { e.TipoPerfil, e.Ordem }).IsUnique();
    }
}
