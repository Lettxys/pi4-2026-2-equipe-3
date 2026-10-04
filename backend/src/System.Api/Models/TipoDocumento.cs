using System.Api.Models.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace System.Api.Models;

[Table("tipo_documento")]
public class TipoDocumento
{
    public short Id { get; set; }
    public string Codigo { get; set; } = null!;
    public string Nome { get; set; } = null!;
    public DonoDocumento Dono { get; set; }
    public RegraValidade RegraValidade { get; set; }
    public int? ValidadeDias { get; set; }
}
