using System.ComponentModel.DataAnnotations;

namespace System.Api.DTO.Common;

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter)]
public sealed class CnhAttribute : ValidationAttribute
{
    public CnhAttribute()
    {
        ErrorMessage = "CNH inválida: os dígitos verificadores não conferem.";
    }

    public override bool IsValid(object? value)
    {
        return value is null || Value.TryNormalize(value as string, out _);
    }

    public static class Value
    {
        public static bool TryNormalize(string? cnh, out string normalized)
        {
            normalized = string.Empty;

            if (string.IsNullOrWhiteSpace(cnh))
            {
                return false;
            }

            var digits = cnh.Where(char.IsAsciiDigit).ToArray();
            if (digits.Length != 11)
            {
                return false;
            }

            var onlyDigits = new string(digits);
            var withoutSpaces = string.Concat(cnh.Where(c => !char.IsWhiteSpace(c)));

            if (withoutSpaces != onlyDigits || onlyDigits.Distinct().Count() == 1)
            {
                return false;
            }

            if (!VerifiesCheckDigits(onlyDigits))
            {
                return false;
            }

            normalized = onlyDigits;
            return true;
        }

        private static bool VerifiesCheckDigits(string digits)
        {
            var sum1 = 0;
            var weight = 9;
            for (var i = 0; i < 9; i++)
            {
                sum1 += (digits[i] - '0') * weight;
                weight--;
            }

            var d1 = sum1 % 11;
            var decrement = 0;
            if (d1 > 9)
            {
                d1 = 0;
                decrement = 2;
            }

            var sum2 = 0;
            weight = 1;
            for (var i = 0; i < 9; i++)
            {
                sum2 += (digits[i] - '0') * weight;
                weight++;
            }

            var d2 = (sum2 % 11) - decrement;
            if (d2 < 0)
            {
                d2 += 11;
            }
            if (d2 > 9)
            {
                d2 = 0;
            }

            return (digits[9] - '0') == d1 && (digits[10] - '0') == d2;
        }
    }
}
