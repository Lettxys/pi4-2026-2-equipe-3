using System.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace System.Api.Data.Configuration;

public class DocumentoConfiguration : IEntityTypeConfiguration<Documento>
{
    public void Configure(EntityTypeBuilder<Documento> builder)
    {
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("ck_documento_status", "status IN ('PENDING', 'VALID', 'EXPIRED', 'REJECTED')");
            t.HasCheckConstraint("ck_documento_tipo_conteudo", "tipo_conteudo IN ('application/pdf', 'image/jpeg', 'image/png')");
            t.HasCheckConstraint("ck_documento_tamanho_bytes", $"tamanho_bytes <= {Documento.TamanhoMaximoBytes}");
            t.HasCheckConstraint("ck_documento_data", "data_emissao IS NOT NULL OR data_validade IS NOT NULL");
        });

        builder.Property(d => d.Status).HasMaxLength(10);
        builder.Property(d => d.CaminhoArquivo).HasMaxLength(255);
        builder.Property(d => d.NomeOriginal).HasMaxLength(255);
        builder.Property(d => d.TipoConteudo).HasMaxLength(50);

        builder.HasOne(d => d.Processo)
            .WithMany(p => p.Documentos)
            .HasForeignKey(d => d.ProcessoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.CondutorAutorizado)
            .WithMany(c => c.Documentos)
            .HasForeignKey(d => d.CondutorAutorizadoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.TipoDocumento)
            .WithMany()
            .HasForeignKey(d => d.TipoDocumentoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
