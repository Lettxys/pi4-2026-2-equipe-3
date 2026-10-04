using System.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace System.Api.Data.Configuration;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable(t => t.HasCheckConstraint("ck_usuario_papel", "papel IN ('USER', 'ADMIN')"));

        builder.Property(u => u.NomeCompleto).HasMaxLength(150);
        builder.Property(u => u.Cpf).HasMaxLength(11).IsFixedLength();
        builder.Property(u => u.Email).HasMaxLength(150);
        builder.Property(u => u.Telefone).HasMaxLength(20);
        builder.Property(u => u.SenhaHash).HasMaxLength(255);
        builder.Property(u => u.Papel).HasMaxLength(10);
        builder.Property(u => u.Cep).HasMaxLength(8).IsFixedLength();
        builder.Property(u => u.Logradouro).HasMaxLength(150);
        builder.Property(u => u.Numero).HasMaxLength(10);
        builder.Property(u => u.Complemento).HasMaxLength(60);
        builder.Property(u => u.Bairro).HasMaxLength(80);
        builder.Property(u => u.Cidade).HasMaxLength(80);
        builder.Property(u => u.Uf).HasMaxLength(2).IsFixedLength();

        builder.HasIndex(u => u.Cpf).IsUnique();
        builder.HasIndex(u => u.Email).IsUnique();
    }
}
