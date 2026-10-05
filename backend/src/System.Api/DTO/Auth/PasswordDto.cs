using System.ComponentModel.DataAnnotations;
using System.Api.DTO.Common;

namespace System.Api.DTO.Auth;

public sealed class ForgotPasswordRequest
{
    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "E-mail inválido.")]
    public string Email { get; init; } = string.Empty;
}

public sealed class ResetPasswordRequest
{
    [Required(ErrorMessage = "O token é obrigatório.")]
    public string Token { get; init; } = string.Empty;

    [Required(ErrorMessage = "A senha é obrigatória.")]
    [StringLength(128, MinimumLength = 8, ErrorMessage = "A senha precisa ter entre 8 e 128 caracteres.")]
    [StrongPassword]
    public string NewPassword { get; init; } = string.Empty;
}

public sealed class ChangePasswordRequest
{
    [Required(ErrorMessage = "A senha atual é obrigatória.")]
    public string CurrentPassword { get; init; } = string.Empty;

    [Required(ErrorMessage = "A senha nova é obrigatória.")]
    [StringLength(128, MinimumLength = 8, ErrorMessage = "A senha precisa ter entre 8 e 128 caracteres.")]
    [StrongPassword]
    public string NewPassword { get; init; } = string.Empty;
}

public sealed record MessageResponse(string Message);
