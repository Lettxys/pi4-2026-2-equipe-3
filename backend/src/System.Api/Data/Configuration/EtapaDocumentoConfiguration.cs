using System.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace System.Api.Data.Configuration;

public class EtapaDocumentoConfiguration : IEntityTypeConfiguration<EtapaDocumento>
{
    public void Configure(EntityTypeBuilder<EtapaDocumento> builder)
    {
        builder.HasKey(ed => new { ed.EtapaId, ed.TipoDocumentoId });

        builder.HasOne(ed => ed.Etapa)
            .WithMany(e => e.DocumentosExigidos)
            .HasForeignKey(ed => ed.EtapaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ed => ed.TipoDocumento)
            .WithMany()
            .HasForeignKey(ed => ed.TipoDocumentoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
