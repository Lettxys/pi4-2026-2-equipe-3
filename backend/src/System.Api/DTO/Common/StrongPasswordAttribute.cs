using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace System.Api.DTO.Common;

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter)]
public sealed partial class StrongPasswordAttribute : ValidationAttribute
{
    [GeneratedRegex("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).+$")]
    private static partial Regex Pattern();

    public StrongPasswordAttribute()
    {
        ErrorMessage = "A senha precisa ter ao menos 8 caracteres, com letra maiúscula, minúscula, número e símbolo.";
    }

    public override bool IsValid(object? value) =>
        value is not string password || Pattern().IsMatch(password);
}