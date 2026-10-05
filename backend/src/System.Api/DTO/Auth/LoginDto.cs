using System.ComponentModel.DataAnnotations;
using System.Api.DTO.Common;
using System.Api.Models.Enums;

namespace System.Api.DTO.Auth;

public sealed class LoginRequest
{
    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "E-mail inválido.")]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "A senha é obrigatória.")]
    public string Password { get; init; } = string.Empty;
}

public sealed record LoginResponse(
    string TokenType,
    string AccessToken,
    int ExpiresIn,
    long UserId,
    string FullName,
    string Email,
    TipoPerfil? ProfileType,
    long? ActiveProcessId);

public sealed record MeResponse(
    long UserId,
    string FullName,
    string? Cpf,
    string? Email,
    TipoPerfil? ProfileType,
    long? ActiveProcessId);
