using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Api.DTO.Common;
using System.Api.DTO.Process;
using System.Api.Interfaces;

namespace System.Api.Controllers;

[ApiController]
[Route("api/processes")]
[Authorize]
[Produces("application/json")]
public sealed class ProcessController(IProcessService processService, ICurrentUser currentUser) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<StartProcessResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StartProcessResponse>> StartProcess(
        [FromBody] StartProcessRequest request,
        CancellationToken cancellationToken)
    {
        var response = await processService.StartProcessAsync(currentUser.Id, request, cancellationToken);
        return Created($"api/processes/{response.ProcessId}", response);
    }

    [HttpPost("{processId:long}/drivers")]
    [ProducesResponseType<AddDriverResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AddDriverResponse>> AddDriver(
        long processId,
        [FromBody] AddDriverRequest request,
        CancellationToken cancellationToken)
    {
        var response = await processService.AddDriverAsync(currentUser.Id, processId, request, cancellationToken);
        return Created($"api/processes/{processId}/drivers/{response.DriverId}", response);
    }

    [HttpGet("{processId:long}/drivers")]
    [ProducesResponseType<ListDriversResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ListDriversResponse>> ListDrivers(
        long processId,
        CancellationToken cancellationToken)
    {
        var response = await processService.ListDriversAsync(currentUser.Id, processId, cancellationToken);
        return Ok(response);
    }

    [HttpDelete("{processId:long}/drivers/{driverId:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDriver(
        long processId,
        long driverId,
        CancellationToken cancellationToken)
    {
        await processService.DeleteDriverAsync(currentUser.Id, processId, driverId, cancellationToken);
        return NoContent();
    }
}
