using System.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace System.Api.Data.Configuration;

public class TokenRevogadoConfiguration : IEntityTypeConfiguration<TokenRevogado>
{
    public void Configure(EntityTypeBuilder<TokenRevogado> builder)
    {
        builder.HasKey(t => t.Jti);
        builder.Property(t => t.Jti).HasMaxLength(64);
    }
}
