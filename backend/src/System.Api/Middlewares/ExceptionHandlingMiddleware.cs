using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Npgsql;
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
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException postgres)
        {
            await WriteDatabaseErrorAsync(context, postgres);
        }
        catch (PostgresException exception)
        {
            await WriteDatabaseErrorAsync(context, exception);
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

    private Task WriteDatabaseErrorAsync(HttpContext context, PostgresException exception)
    {
        var (status, code, message) = exception.SqlState switch
        {
            PostgresErrorCodes.UniqueViolation =>
                (StatusCodes.Status409Conflict, ErrorCodes.Conflict, "Registro duplicado."),
            PostgresErrorCodes.ForeignKeyViolation =>
                (StatusCodes.Status409Conflict, ErrorCodes.Conflict, "Registro relacionado não encontrado ou em uso."),
            PostgresErrorCodes.CheckViolation or PostgresErrorCodes.NotNullViolation or PostgresErrorCodes.StringDataRightTruncation =>
                (StatusCodes.Status400BadRequest, ErrorCodes.Validation, "Dado inválido."),
            _ => (StatusCodes.Status500InternalServerError, ErrorCodes.InternalError, "Erro interno inesperado."),
        };

        if (status == StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Falha no banco em {Method} {Route}", context.Request.Method, context.Request.Path);
        }
        else
        {
            logger.LogWarning(
                "O banco recusou a operação em {Method} {Route}: {SqlState} na restrição {Constraint}",
                context.Request.Method,
                context.Request.Path,
                exception.SqlState,
                exception.ConstraintName);
        }

        return WriteAsync(context, status, code, message, []);
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