using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Api.DTO.Auth;
using System.Api.DTO.Common;
using System.Api.Interfaces;

namespace System.Api.Controllers;

[ApiController]
[Route("api/auth")]
[Authorize]
[Produces("application/json")]
public sealed class AuthController(IAuthService authService, ICurrentUser currentUser) : ControllerBase
{
    private const string GenericRecoveryMessage = "Se o e-mail estiver cadastrado, você vai receber as instruções para redefinir a senha.";
    private const string RefreshCookieName = "refreshToken";
    private const string RefreshCookiePath = "/api/auth";

    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType<RegisterResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<RegisterResponse>> Register(
        [FromBody] RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var response = await authService.RegisterAsync(request, cancellationToken);
        return Created($"/api/auth/me", response);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var session = await authService.LoginAsync(request, cancellationToken);
        SetRefreshCookie(session.RefreshToken, session.RefreshTokenExpiresAt);

        return Ok(session.Response);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Refresh(CancellationToken cancellationToken)
    {
        if (!Request.Cookies.TryGetValue(RefreshCookieName, out var refreshToken)
            || string.IsNullOrWhiteSpace(refreshToken))
        {
            throw AppException.Validation("Refresh token ausente.");
        }

        var session = await authService.RefreshAsync(refreshToken, cancellationToken);
        SetRefreshCookie(session.RefreshToken, session.RefreshTokenExpiresAt);

        return Ok(session.Response);
    }

    [HttpPost("verify-code")]
    [AllowAnonymous]
    [ProducesResponseType<VerifyCodeResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<VerifyCodeResponse>> VerifyCode(
        [FromBody] VerifyCodeRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await authService.VerifyCodeAsync(request, cancellationToken));
    }

    [HttpGet("me")]
    [ProducesResponseType<MeResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MeResponse>> Me(CancellationToken cancellationToken)
    {
        return Ok(await authService.MeAsync(currentUser.Id, cancellationToken));
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<MessageResponse>> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        await authService.SendResetCodeAsync(request, cancellationToken);
        return Ok(new MessageResponse(GenericRecoveryMessage));
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MessageResponse>> ResetPassword(
        [FromBody] ResetPasswordRequest request,
        CancellationToken cancellationToken)
    {
        await authService.ResetPasswordAsync(request, cancellationToken);
        return Ok(new MessageResponse("Senha redefinida com sucesso. Você já pode realizar o login com a nova senha."));
    }

    [HttpPatch("change-password")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<MessageResponse>> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        await authService.ChangePasswordAsync(currentUser.Id, request, cancellationToken);
        return Ok(new MessageResponse("Senha alterada com sucesso."));
    }

    [HttpPost("logout")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<MessageResponse>> Logout(CancellationToken cancellationToken)
    {
        var jti = currentUser.Jti;
        var expiresAt = currentUser.ExpiresAt ?? DateTime.UtcNow.AddHours(1);

        if (jti is null)
        {
            throw new InvalidOperationException("Token sem identificador de sessão.");
        }

        Request.Cookies.TryGetValue(RefreshCookieName, out var refreshToken);

        await authService.EndSessionAsync(jti, expiresAt, refreshToken, cancellationToken);
        DeleteRefreshCookie();

        return Ok(new MessageResponse("Sessão encerrada com sucesso."));
    }

    private void SetRefreshCookie(string token, DateTime expiresAt)
    {
        Response.Cookies.Append(RefreshCookieName, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Expires = expiresAt,
            Path = RefreshCookiePath,
        });
    }

    private void DeleteRefreshCookie()
    {
        Response.Cookies.Delete(RefreshCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Path = RefreshCookiePath,
        });
    }
}
