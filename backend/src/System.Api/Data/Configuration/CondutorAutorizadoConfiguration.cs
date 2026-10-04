using System.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace System.Api.Data.Configuration;

public class CondutorAutorizadoConfiguration : IEntityTypeConfiguration<CondutorAutorizado>
{
    public void Configure(EntityTypeBuilder<CondutorAutorizado> builder)
    {
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("ck_condutor_autorizado_parentesco", "parentesco IN ('FATHER', 'MOTHER', 'SPOUSE', 'SIBLING', 'CHILD', 'OTHER')");
            t.HasCheckConstraint("ck_condutor_autorizado_posicao", "posicao BETWEEN 1 AND 3");
        });

        builder.Property(c => c.Nome).HasMaxLength(150);
        builder.Property(c => c.Cpf).HasMaxLength(11).IsFixedLength();
        builder.Property(c => c.CnhNumero).HasMaxLength(11).IsFixedLength();
        builder.Property(c => c.Parentesco).HasMaxLength(15);

        builder.HasIndex(c => new { c.ProcessoId, c.Posicao }).IsUnique();
        builder.HasIndex(c => new { c.ProcessoId, c.Cpf }).IsUnique();

        builder.HasOne(c => c.Processo)
            .WithMany(p => p.Condutores)
            .HasForeignKey(c => c.ProcessoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.Usuario)
            .WithMany(u => u.Conducoes)
            .HasForeignKey(c => c.UsuarioId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
