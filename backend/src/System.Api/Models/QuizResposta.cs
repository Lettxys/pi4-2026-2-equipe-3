using System.ComponentModel.DataAnnotations.Schema;

namespace System.Api.Models;

[Table("quiz_resposta")]
public class QuizResposta
{
    public long QuizId { get; set; }
    public string CodigoPergunta { get; set; } = null!;
    public string Resposta { get; set; } = null!;

    public Quiz Quiz { get; set; } = null!;
}
