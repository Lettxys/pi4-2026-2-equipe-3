using System.Api.Models.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace System.Api.Models;

[Table("documento")]
public class Documento
{
    public const int TamanhoMaximoBytes = 10 * 1024 * 1024;

    public long Id { get; set; }
    public long ProcessoId { get; set; }
    public long? CondutorAutorizadoId { get; set; }
    public short TipoDocumentoId { get; set; }
    public StatusDocumento Status { get; set; }
    public DateOnly? DataEmissao { get; set; }
    public DateOnly? DataValidade { get; set; }
    public string CaminhoArquivo { get; set; } = null!;
    public string NomeOriginal { get; set; } = null!;
    public string TipoConteudo { get; set; } = null!;
    public int TamanhoBytes { get; set; }
    public DateTime EnviadoEm { get; set; }

    public Processo Processo { get; set; } = null!;
    public CondutorAutorizado? CondutorAutorizado { get; set; }
    public TipoDocumento TipoDocumento { get; set; } = null!;
}
