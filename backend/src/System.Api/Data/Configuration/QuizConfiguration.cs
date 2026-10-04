using System.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace System.Api.Data.Configuration;

public class QuizConfiguration : IEntityTypeConfiguration<Quiz>
{
    public void Configure(EntityTypeBuilder<Quiz> builder)
    {
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("ck_quiz_tipo_perfil", "tipo_perfil IN ('PCD_DRIVER', 'PCD_NON_DRIVER')");
            t.HasCheckConstraint("ck_quiz_tipo_deficiencia", "tipo_deficiencia IN ('PHYSICAL', 'VISUAL', 'HEARING', 'INTELLECTUAL', 'AUTISM', 'DOWN_SYNDROME')");
        });

        builder.Property(q => q.TipoPerfil).HasMaxLength(20);
        builder.Property(q => q.TipoDeficiencia).HasMaxLength(20);
        builder.HasIndex(q => q.TokenAnonimo).IsUnique();

        builder.HasOne(q => q.Usuario)
            .WithMany(u => u.Quizzes)
            .HasForeignKey(q => q.UsuarioId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
