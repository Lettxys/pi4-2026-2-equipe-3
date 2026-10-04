using System.ComponentModel.DataAnnotations.Schema;

namespace System.Api.Models;

[Table("etapa_documento")]
public class EtapaDocumento
{
    public short EtapaId { get; set; }
    public short TipoDocumentoId { get; set; }

    public Etapa Etapa { get; set; } = null!;
    public TipoDocumento TipoDocumento { get; set; } = null!;
}
