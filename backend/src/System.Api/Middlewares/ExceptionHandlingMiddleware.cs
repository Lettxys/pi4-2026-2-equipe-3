using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics;
using System.Api.DTO.Common;

namespace System.Api.Middlewares;

public sealed class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (AppException exception)
        {
            logger.LogInformation(
                "Erro de aplicação em {Method} {Route}: {Code} - {Message}",
                context.Request.Method,
                context.Request.Path,
                exception.Code,
                exception.Message);

            await WriteAsync(context, exception.Status, exception.Code, exception.Message, exception.Details);
        }
        catch (BadHttpRequestException exception)
        {
            var (code, message) = exception.StatusCode switch
            {
                StatusCodes.Status413PayloadTooLarge => (ErrorCodes.PayloadTooLarge, "Arquivo acima do limite permitido."),
                StatusCodes.Status415UnsupportedMediaType => (ErrorCodes.UnsupportedMediaType, "Formato de envio não aceito."),
                _ => (ErrorCodes.Validation, "Requisição inválida."),
            };

            logger.LogInformation(exception, "Requisição rejeitada em {Route}", context.Request.Path);
            await WriteAsync(context, exception.StatusCode, code, message, []);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Falha não tratada em {Method} {Route}", context.Request.Method, context.Request.Path);
            await WriteAsync(
                context,
                StatusCodes.Status500InternalServerError,
                ErrorCodes.InternalError,
                "Erro interno inesperado.",
                []);
        }
    }

    private static Task WriteAsync(
        HttpContext context,
        int status,
        string code,
        string message,
        IReadOnlyList<ApiErrorDetail> details) =>
        WriteEnvelopeAsync(context, status, code, message, details);

    public static async Task WriteEnvelopeAsync(
        HttpContext context,
        int status,
        string code,
        string message,
        IReadOnlyList<ApiErrorDetail> details)
    {
        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.Clear();
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/json; charset=utf-8";

        await context.Response.WriteAsync(JsonSerializer.Serialize(
            ApiErrorResponse.Create(status, code, message, details),
            ApiJson.Options));
    }

    public static Task WriteDefaultAsync(StatusCodeContext context)
    {
        var (status, code, message) = context.HttpContext.Response.StatusCode switch
        {
            StatusCodes.Status401Unauthorized =>
                (StatusCodes.Status401Unauthorized, ErrorCodes.Unauthorized, "Token ausente, inválido ou expirado."),
            StatusCodes.Status403Forbidden =>
                (StatusCodes.Status403Forbidden, ErrorCodes.Forbidden, "Você não tem permissão para acessar este recurso."),
            StatusCodes.Status404NotFound =>
                (StatusCodes.Status404NotFound, ErrorCodes.NotFound, "Recurso não encontrado."),
            _ => (context.HttpContext.Response.StatusCode, ErrorCodes.Validation, "Requisição inválida."),
        };

        return WriteEnvelopeAsync(context.HttpContext, status, code, message, []);
    }
}