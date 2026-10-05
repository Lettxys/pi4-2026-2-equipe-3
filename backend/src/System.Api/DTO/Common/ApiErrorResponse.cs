using System.Text.Json;
using System.Text.Json.Serialization;

namespace System.Api.DTO.Common;

public static class ApiJson
{
    public static JsonSerializerOptions Options { get; } = Create();

    public static void Apply(JsonSerializerOptions target)
    {
        target.PropertyNamingPolicy = Options.PropertyNamingPolicy;
        target.PropertyNameCaseInsensitive = Options.PropertyNameCaseInsensitive;
        target.NumberHandling = Options.NumberHandling;

        foreach (var converter in Options.Converters)
        {
            target.Converters.Add(converter);
        }
    }

    private static JsonSerializerOptions Create()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        options.Converters.Add(new JsonStringEnumConverter());
        return options;
    }
}

public static class ErrorCodes
{
    public const string Validation = "VALIDATION_ERROR";
    public const string Unauthorized = "UNAUTHORIZED";
    public const string Forbidden = "FORBIDDEN";
    public const string NotFound = "NOT_FOUND";
    public const string Conflict = "CONFLICT";
    public const string PayloadTooLarge = "PAYLOAD_TOO_LARGE";
    public const string UnsupportedMediaType = "UNSUPPORTED_MEDIA_TYPE";
    public const string InternalError = "INTERNAL_ERROR";
}

public sealed record ApiErrorDetail(string? Field, string Message);

public sealed record ApiErrorResponse(
    DateTime Timestamp,
    int Status,
    string Code,
    string Message,
    IReadOnlyList<ApiErrorDetail> Details)
{
    public static ApiErrorResponse Create(
        int status,
        string code,
        string message,
        IReadOnlyList<ApiErrorDetail>? details = null) =>
        new(DateTime.UtcNow, status, code, message, details ?? []);
}

public sealed class AppException(
    int status,
    string code,
    string message,
    IReadOnlyList<ApiErrorDetail>? details = null) : Exception(message)
{
    public int Status { get; } = status;

    public string Code { get; } = code;

    public IReadOnlyList<ApiErrorDetail> Details { get; } = details ?? [];

    public static AppException Validation(string message, IReadOnlyList<ApiErrorDetail>? details = null) =>
        new(StatusCodes.Status400BadRequest, ErrorCodes.Validation, message, details);

    public static AppException Unauthorized(string message) =>
        new(StatusCodes.Status401Unauthorized, ErrorCodes.Unauthorized, message);

    public static AppException Forbidden(string message) =>
        new(StatusCodes.Status403Forbidden, ErrorCodes.Forbidden, message);

    public static AppException NotFound(string message) =>
        new(StatusCodes.Status404NotFound, ErrorCodes.NotFound, message);

    public static AppException Conflict(string message) =>
        new(StatusCodes.Status409Conflict, ErrorCodes.Conflict, message);
}
