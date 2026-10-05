using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Api.DTO.Common;
using System.Api.Interfaces;
using System.Api.Security;

namespace System.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
[Produces("application/json")]
public sealed class UsersController(IAuthService authService) : ControllerBase
{
    [HttpDelete("{userId:long}")]
    [Authorize(Policy = Policies.SelfOrAdmin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AnonymizeAccount(long userId, CancellationToken cancellationToken)
    {
        await authService.AnonymizeAccountAsync(userId, cancellationToken);
        return NoContent();
    }
}
