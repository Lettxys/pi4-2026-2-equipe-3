using System.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace System.Api.Data.Configuration;

public class TipoDocumentoConfiguration : IEntityTypeConfiguration<TipoDocumento>
{
    public void Configure(EntityTypeBuilder<TipoDocumento> builder)
    {
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("ck_tipo_documento_dono", "dono IN ('HOLDER', 'DRIVER')");
            t.HasCheckConstraint("ck_tipo_documento_regra_validade", "regra_validade IN ('DAYS_FROM_ISSUE', 'PRINTED_EXPIRY', 'NONE')");
        });

        builder.Property(t => t.Codigo).HasMaxLength(40);
        builder.Property(t => t.Nome).HasMaxLength(100);
        builder.Property(t => t.Dono).HasMaxLength(10);
        builder.Property(t => t.RegraValidade).HasMaxLength(20);

        builder.HasIndex(t => t.Codigo).IsUnique();
    }
}
