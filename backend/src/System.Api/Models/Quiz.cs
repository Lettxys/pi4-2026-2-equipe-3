using System.Api.Models.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace System.Api.Models;

[Table("quiz")]
public class Quiz
{
    public long Id { get; set; }
    public long? UsuarioId { get; set; }
    public Guid TokenAnonimo { get; set; }
    public TipoPerfil? TipoPerfil { get; set; }
    public TipoDeficiencia? TipoDeficiencia { get; set; }
    public bool? Elegivel { get; set; }
    public DateTime ConsentimentoEm { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime? VinculadoEm { get; set; }

    public Usuario? Usuario { get; set; }
    public Processo? Processo { get; set; }
    public List<QuizResposta> Respostas { get; set; } = [];
}
