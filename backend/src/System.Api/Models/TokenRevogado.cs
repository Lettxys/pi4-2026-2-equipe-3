using System.ComponentModel.DataAnnotations.Schema;

namespace System.Api.Models;

[Table("token_revogado")]
public class TokenRevogado
{
    public string Jti { get; set; } = null!;
    public DateTime ExpiraEm { get; set; }
}
