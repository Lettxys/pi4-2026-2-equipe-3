using System.Api.Models.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace System.Api.Models;

[Table("dossie")]
public class Dossie
{
    public long Id { get; set; }
    public long ProcessoId { get; set; }
    public StatusDossie Status { get; set; }
    public string CaminhoArquivo { get; set; } = null!;
    public int TotalDocumentos { get; set; }
    public DateTime GeradoEm { get; set; }

    public Processo Processo { get; set; } = null!;
}
