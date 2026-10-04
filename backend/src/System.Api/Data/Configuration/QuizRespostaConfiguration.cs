using System.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace System.Api.Data.Configuration;

public class QuizRespostaConfiguration : IEntityTypeConfiguration<QuizResposta>
{
    public void Configure(EntityTypeBuilder<QuizResposta> builder)
    {
        builder.HasKey(r => new { r.QuizId, r.CodigoPergunta });
        builder.Property(r => r.CodigoPergunta).HasMaxLength(40);
        builder.Property(r => r.Resposta).HasMaxLength(255);

        builder.HasOne(r => r.Quiz)
            .WithMany(q => q.Respostas)
            .HasForeignKey(r => r.QuizId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
