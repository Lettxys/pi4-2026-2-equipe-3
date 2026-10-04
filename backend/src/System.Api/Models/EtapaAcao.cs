using System.ComponentModel.DataAnnotations.Schema;

namespace System.Api.Models;

[Table("etapa_acao")]
public class EtapaAcao
{
    public short EtapaId { get; set; }
    public short Ordem { get; set; }
    public string Descricao { get; set; } = null!;

    public Etapa Etapa { get; set; } = null!;
}
