using System.Globalization;

namespace System.Api.Configuration;

public sealed record JwtOptions(string Secret, string Issuer, string Audience, int ExpiresInMinutes);

public sealed record StorageOptions(string RootPath);

public sealed record PasswordResetOptions(int TokenExpiresInMinutes);

public sealed record FrontendOptions(string Url);

public sealed record SmtpOptions(string Host, int Port, string User, string Password, string From)
{
    public bool Enabled => !string.IsNullOrWhiteSpace(Host);
}

public sealed record CorsOptions(IReadOnlyList<string> AllowedOrigins);

public sealed class AppOptions
{
    public const int MinimumSecretLength = 32;

    public required JwtOptions Jwt { get; init; }

    public required StorageOptions Storage { get; init; }

    public required PasswordResetOptions PasswordReset { get; init; }

    public required FrontendOptions Frontend { get; init; }

    public required SmtpOptions Smtp { get; init; }

    public required CorsOptions Cors { get; init; }

    public static AppOptions Load(IConfiguration configuration)
    {
        var secret = Require(configuration, "JWT_SECRET", "Jwt:Secret");
        if (secret.Length < MinimumSecretLength)
        {
            throw new InvalidOperationException(
                $"JWT_SECRET precisa ter ao menos {MinimumSecretLength} caracteres.");
        }

        var expiresInMinutes = ReadInt(configuration, 60, "JWT_EXPIRES_IN_MINUTES", "Jwt:ExpiresInMinutes");
        if (expiresInMinutes <= 0)
        {
            throw new InvalidOperationException("JWT_EXPIRES_IN_MINUTES precisa ser maior que zero.");
        }

        var resetExpiresInMinutes = ReadInt(configuration, 30, "PASSWORD_RESET_TOKEN_EXPIRES_MINUTES");
        if (resetExpiresInMinutes <= 0)
        {
            throw new InvalidOperationException(
                "PASSWORD_RESET_TOKEN_EXPIRES_IN_MINUTES precisa ser maior que zero.");
        }

        var allowedOrigins = Read(configuration, "CORS_ALLOWED_ORIGINS", "http://localhost:5173")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        return new AppOptions
        {
            Jwt = new JwtOptions(
                secret,
                Read(configuration, "JWT_ISSUER", "Jwt:Issuer", "pi4-equipe-3"),
                Read(configuration, "JWT_AUDIENCE", "Jwt:Audience", "pi4-equipe-3-clients"),
                expiresInMinutes),
            Storage = new StorageOptions(
                Path.GetFullPath(Read(configuration, "STORAGE_DIR", "./storage"))),
            PasswordReset = new PasswordResetOptions(resetExpiresInMinutes),
            Frontend = new FrontendOptions(
                Read(configuration, "FRONTEND_URL", "http://localhost:5173").TrimEnd('/')),
            Smtp = new SmtpOptions(
                Read(configuration, "SMTP_HOST"),
                ReadInt(configuration, 587, "SMTP_PORT"),
                Read(configuration, "SMTP_USER"),
                Read(configuration, "SMTP_PASSWORD"),
                Read(configuration, "SMTP_FROM", "no-reply@isenta.local")),
            Cors = new CorsOptions(allowedOrigins),
        };
    }

    public static string Require(IConfiguration configuration, string name, params string[] aliases)
    {
        var value = Read(configuration, name, aliases);
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException(
                $"Variável de ambiente obrigatória ausente: {name}. Configure no arquivo .env.");
        }

        return value;
    }

    public static string Read(IConfiguration configuration, string name, params string[] aliases)
    {
        foreach (var key in new[] { name }.Concat(aliases))
        {
            var value = configuration[key];
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value.Trim();
            }
        }

        return string.Empty;
    }

    public static int ReadInt(IConfiguration configuration, int defaultValue, string name, params string[] aliases)
    {
        var value = Read(configuration, name, aliases);
        if (string.IsNullOrWhiteSpace(value))
        {
            return defaultValue;
        }

        if (!int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed))
        {
            throw new InvalidOperationException($"Variável de ambiente inválida: {name}={value}.");
        }

        return parsed;
    }
}
