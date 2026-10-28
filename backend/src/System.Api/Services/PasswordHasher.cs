using System.Security.Cryptography;
using System.Text;
using Konscious.Security.Cryptography;

namespace System.Api.Services;

public sealed class PasswordHasher : Interfaces.IPasswordHasher
{
    private const string Prefix = "argon2id";
    private const int Version = 19;
    private const int DegreeOfParallelism = 4;
    private const int MemorySize = 65536;
    private const int Iterations = 3;
    private const int SaltSize = 16;
    private const int HashSize = 32;

    public string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Derive(password, salt);

        return string.Join('$',
            Prefix,
            $"v={Version}",
            $"m={MemorySize},t={Iterations},p={DegreeOfParallelism}",
            Convert.ToBase64String(salt),
            Convert.ToBase64String(hash));
    }

    public bool Verify(string password, string storedHash)
    {
        if (string.IsNullOrEmpty(storedHash))
        {
            return false;
        }

        var parts = storedHash.Split('$');
        if (parts.Length != 5 || !string.Equals(parts[0], Prefix, StringComparison.Ordinal))
        {
            return false;
        }

        if (!parts[1].StartsWith("v=", StringComparison.Ordinal))
        {
            return false;
        }

        if (!TryParseParameters(parts[2], out var memorySize, out var iterations, out var degreeOfParallelism))
        {
            return false;
        }

        byte[] salt;
        byte[] expected;
        try
        {
            salt = Convert.FromBase64String(parts[3]);
            expected = Convert.FromBase64String(parts[4]);
        }
        catch (FormatException)
        {
            return false;
        }

        if (salt.Length == 0 || expected.Length == 0)
        {
            return false;
        }

        var actual = Derive(password, salt, memorySize, iterations, degreeOfParallelism);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }

    private static byte[] Derive(string password, byte[] salt) =>
        Derive(password, salt, MemorySize, Iterations, DegreeOfParallelism);

    private static byte[] Derive(string password, byte[] salt, int memorySize, int iterations, int degreeOfParallelism)
    {
        using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            DegreeOfParallelism = degreeOfParallelism,
            MemorySize = memorySize,
            Iterations = iterations,
        };

        return argon2.GetBytes(HashSize);
    }

    private static bool TryParseParameters(string parameters, out int memorySize, out int iterations, out int degreeOfParallelism)
    {
        memorySize = 0;
        iterations = 0;
        degreeOfParallelism = 0;

        var entries = parameters.Split(',', StringSplitOptions.RemoveEmptyEntries);
        foreach (var entry in entries)
        {
            var index = entry.IndexOf('=', StringComparison.Ordinal);
            if (index <= 0 || index == entry.Length - 1)
            {
                continue;
            }

            var key = entry[..index];
            var value = entry[(index + 1)..];

            if (key == "m" && int.TryParse(value, out var m))
            {
                memorySize = m;
            }
            else if (key == "t" && int.TryParse(value, out var t))
            {
                iterations = t;
            }
            else if (key == "p" && int.TryParse(value, out var p))
            {
                degreeOfParallelism = p;
            }
        }

        return memorySize > 0 && iterations > 0 && degreeOfParallelism > 0;
    }
}