using System.ComponentModel.DataAnnotations.Schema;

namespace System.Api.Models;

[Table("token_redefinicao_senha")]
public class TokenRedefinicaoSenha
{
    public long Id { get; set; }
    public long UsuarioId { get; set; }
    public string TokenHash { get; set; } = null!;
    public DateTime ExpiraEm { get; set; }
    public DateTime? UsadoEm { get; set; }
    public DateTime CriadoEm { get; set; }

    public Usuario Usuario { get; set; } = null!;
}
