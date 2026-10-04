using System.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace System.Api.Data.Configuration;

public class EtapaAcaoConfiguration : IEntityTypeConfiguration<EtapaAcao>
{
    public void Configure(EntityTypeBuilder<EtapaAcao> builder)
    {
        builder.HasKey(a => new { a.EtapaId, a.Ordem });
        builder.Property(a => a.Descricao).HasMaxLength(255);

        builder.HasOne(a => a.Etapa)
            .WithMany(e => e.Acoes)
            .HasForeignKey(a => a.EtapaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
