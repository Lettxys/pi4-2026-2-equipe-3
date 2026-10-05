using System.ComponentModel.DataAnnotations;
using System.Api.DTO.Common;

namespace System.Api.DTO.Auth;

public sealed class RegisterRequest
{
    [Required(ErrorMessage = "O nome completo é obrigatório.")]
    [StringLength(150, MinimumLength = 3, ErrorMessage = "O nome completo precisa ter entre 3 e 150 caracteres.")]
    public string FullName { get; init; } = string.Empty;

    [Required(ErrorMessage = "O CPF é obrigatório.")]
    [Cpf]
    public string Cpf { get; init; } = string.Empty;

    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "E-mail inválido.")]
    [StringLength(150, ErrorMessage = "O e-mail precisa ter no máximo 150 caracteres.")]
    public string Email { get; init; } = string.Empty;

    [StringLength(20, ErrorMessage = "O telefone precisa ter no máximo 20 caracteres.")]
    public string? Phone { get; init; }

    [Required(ErrorMessage = "A senha é obrigatória.")]
    [StringLength(128, MinimumLength = 8, ErrorMessage = "A senha precisa ter entre 8 e 128 caracteres.")]
    [StrongPassword]
    public string Password { get; init; } = string.Empty;
}

public sealed record RegisterResponse(
    long UserId,
    string FullName,
    string Email,
    DateTime CreatedAt);
