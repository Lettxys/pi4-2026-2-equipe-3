using System.Api.Models.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace System.Api.Models;

[Table("condutor_autorizado")]
public class CondutorAutorizado
{
    public long Id { get; set; }
    public long ProcessoId { get; set; }
    public long? UsuarioId { get; set; }
    public short Posicao { get; set; }
    public string Nome { get; set; } = null!;
    public string Cpf { get; set; } = null!;
    public string CnhNumero { get; set; } = null!;
    public DateOnly? CnhValidade { get; set; }
    public Parentesco Parentesco { get; set; }
    public DateTime CriadoEm { get; set; }

    public Processo Processo { get; set; } = null!;
    public Usuario? Usuario { get; set; }
    public List<Documento> Documentos { get; set; } = [];
}
