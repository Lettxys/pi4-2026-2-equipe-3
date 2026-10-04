using System.Api.Models.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace System.Api.Models;

[Table("processo")]
public class Processo
{
    public long Id { get; set; }
    public long UsuarioId { get; set; }
    public long? QuizId { get; set; }
    public TipoPerfil TipoPerfil { get; set; }
    public TipoDeficiencia TipoDeficiencia { get; set; }
    public StatusProcesso Status { get; set; }
    public string? CnhNumero { get; set; }
    public DateOnly? CnhValidade { get; set; }
    public bool? CnhPossuiRestricao { get; set; }
    public string? VeiculoModelo { get; set; }
    public decimal? VeiculoValor { get; set; }
    public DateOnly? DataPrevistaCompra { get; set; }
    public DateOnly? DataUltimaCompraIsenta { get; set; }
    public DateTime AceiteZeroKmEm { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }
    public DateTime? ConcluidoEm { get; set; }

    public Usuario Usuario { get; set; } = null!;
    public Quiz? Quiz { get; set; }
    public Dossie? Dossie { get; set; }
    public List<ProcessoEtapa> Etapas { get; set; } = [];
    public List<CondutorAutorizado> Condutores { get; set; } = [];
    public List<Documento> Documentos { get; set; } = [];
}
