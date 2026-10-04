using System.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace System.Api.Data.Configuration;

public class TokenRedefinicaoSenhaConfiguration : IEntityTypeConfiguration<TokenRedefinicaoSenha>
{
    public void Configure(EntityTypeBuilder<TokenRedefinicaoSenha> builder)
    {
        builder.Property(t => t.TokenHash).HasMaxLength(255);
        builder.HasIndex(t => t.TokenHash).IsUnique();

        builder.HasOne(t => t.Usuario)
            .WithMany(u => u.TokensRedefinicaoSenha)
            .HasForeignKey(t => t.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
