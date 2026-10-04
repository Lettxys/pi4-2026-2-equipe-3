using System.Api.Models.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace System.Api.Models;

[Table("processo_etapa")]
public class ProcessoEtapa
{
    public long ProcessoId { get; set; }
    public short EtapaId { get; set; }
    public StatusEtapa Status { get; set; }
    public DateTime? ValidadaEm { get; set; }
    public DateTime AtualizadoEm { get; set; }

    public Processo Processo { get; set; } = null!;
    public Etapa Etapa { get; set; } = null!;
}
