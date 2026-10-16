using System.ComponentModel.DataAnnotations;

namespace System.Api.DTO.Auth;

public sealed class VerifyCodeRequest
{
    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "E-mail inválido.")]
    [StringLength(150, ErrorMessage = "O e-mail precisa ter no máximo 150 caracteres.")]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "O código é obrigatório.")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "O código deve ter 6 caracteres.")]
    public string Code { get; init; } = string.Empty;
}

public sealed record VerifyCodeResponse(string ResetToken);
