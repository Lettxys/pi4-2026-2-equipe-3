using System.Api.Models.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace System.Api.Models;

[Table("etapa")]
public class Etapa
{
    public short Id { get; set; }
    public TipoPerfil TipoPerfil { get; set; }
    public short Ordem { get; set; }
    public string Titulo { get; set; } = null!;
    public Orgao? Orgao { get; set; }
    public string ExplicacaoSimplificada { get; set; } = null!;

    public List<EtapaAcao> Acoes { get; set; } = [];
    public List<EtapaDocumento> DocumentosExigidos { get; set; } = [];
}
