using System.Api.Models.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace System.Api.Models;

[Table("usuario")]
public class Usuario
{
    public long Id { get; set; }
    public string NomeCompleto { get; set; } = null!;
    public string? Cpf { get; set; }
    public string? Email { get; set; }
    public string? Telefone { get; set; }
    public DateOnly? DataNascimento { get; set; }
    public string? SenhaHash { get; set; }
    public Papel Papel { get; set; }
    public string? Cep { get; set; }
    public string? Logradouro { get; set; }
    public string? Numero { get; set; }
    public string? Complemento { get; set; }
    public string? Bairro { get; set; }
    public string? Cidade { get; set; }
    public string? Uf { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }
    public DateTime? AnonimizadoEm { get; set; }

    public List<Processo> Processos { get; set; } = [];
    public List<Quiz> Quizzes { get; set; } = [];
    public List<TokenRedefinicaoSenha> TokensRedefinicaoSenha { get; set; } = [];
    public List<CondutorAutorizado> Conducoes { get; set; } = [];
}
