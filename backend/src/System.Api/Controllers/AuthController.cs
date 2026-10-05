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
        return Ok(await authService.LoginAsync(request, cancellationToken));
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
    public async Task<ActionResult<MessageResponse>> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        await authService.SendRecoveryInstructionsAsync(request, cancellationToken);
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

        await authService.EndSessionAsync(jti, expiresAt, cancellationToken);
        return Ok(new MessageResponse("Sessão encerrada com sucesso."));
    }
}
