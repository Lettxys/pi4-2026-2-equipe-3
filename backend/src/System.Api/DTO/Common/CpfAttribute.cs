using System.ComponentModel.DataAnnotations;

namespace System.Api.DTO.Common;

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter)]
public sealed class CpfAttribute : ValidationAttribute
{
    public CpfAttribute()
    {
        ErrorMessage = "CPF inválido: os dígitos verificadores não conferem.";
    }

    public override bool IsValid(object? value)
    {
        return value is null || Value.TryNormalize(value as string, out _);
    }

    public static class Value
    {
        public static bool TryNormalize(string? cpf, out string normalized)
        {
            normalized = string.Empty;

            if (string.IsNullOrWhiteSpace(cpf))
            {
                return false;
            }

            var digits = cpf.Where(char.IsAsciiDigit).ToArray();
            if (digits.Length != 11)
            {
                return false;
            }

            var onlyDigits = new string(digits);
            var withoutSpaces = string.Concat(cpf.Where(c => !char.IsWhiteSpace(c)));

            if (withoutSpaces != onlyDigits || onlyDigits.Distinct().Count() == 1)
            {
                return false;
            }

            if (!VerifiesCheckDigit(onlyDigits, 9) || !VerifiesCheckDigit(onlyDigits, 10))
            {
                return false;
            }

            normalized = onlyDigits;
            return true;
        }

        private static bool VerifiesCheckDigit(string digits, int baseLength)
        {
            var sum = 0;
            for (var i = 0; i < baseLength; i++)
            {
                sum += (digits[i] - '0') * (baseLength + 1 - i);
            }

            var remainder = sum % 11;
            var expected = remainder < 2 ? 0 : 11 - remainder;

            return (digits[baseLength] - '0') == expected;
        }
    }
}