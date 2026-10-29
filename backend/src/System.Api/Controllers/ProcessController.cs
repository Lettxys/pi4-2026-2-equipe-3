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

    [HttpGet("{processId:long}")]
    [ProducesResponseType<ProcessProgressResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProcessProgressResponse>> GetProcess(
        long processId,
        CancellationToken cancellationToken)
    {
        var response = await processService.GetProcessProgressAsync(currentUser.Id, processId, cancellationToken);
        return Ok(response);
    }

    [HttpGet("{processId:long}/documents/checklist")]
    [ProducesResponseType<List<DocumentChecklistItemResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<DocumentChecklistItemResponse>>> GetDocumentChecklist(
        long processId,
        CancellationToken cancellationToken)
    {
        var response = await processService.GetDocumentChecklistAsync(currentUser.Id, processId, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{processId:long}/documents")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType<UploadDocumentResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status413PayloadTooLarge)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status415UnsupportedMediaType)]
    public async Task<ActionResult<UploadDocumentResponse>> UploadDocument(
        long processId,
        [FromForm] UploadDocumentRequest request,
        CancellationToken cancellationToken)
    {
        var response = await processService.UploadDocumentAsync(currentUser.Id, processId, request, request.File, cancellationToken);
        return Created($"api/processes/{processId}/documents/{response.DocumentId}", response);
    }

    [HttpGet("{processId:long}/documents/{documentId:long}/validate")]
    [ProducesResponseType<DocumentValidationResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DocumentValidationResponse>> ValidateDocument(
        long processId,
        long documentId,
        CancellationToken cancellationToken)
    {
        var response = await processService.ValidateDocumentAsync(currentUser.Id, processId, documentId, cancellationToken);
        return Ok(response);
    }

    [HttpDelete("{processId:long}/documents/{documentId:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDocument(
        long processId,
        long documentId,
        CancellationToken cancellationToken)
    {
        await processService.RemoveDocumentAsync(currentUser.Id, processId, documentId, cancellationToken);
        return NoContent();
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

    [HttpGet("{processId:long}/guidance/steps/{stepNumber:int}")]
    [ProducesResponseType<StepGuidanceResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StepGuidanceResponse>> GetStepGuidance(
        long processId,
        int stepNumber,
        CancellationToken cancellationToken)
    {
        var response = await processService.GetStepGuidanceAsync(currentUser.Id, processId, (short)stepNumber, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{processId:long}/steps/{stepNumber:int}/validate")]
    [ProducesResponseType<StepValidationResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StepValidationResponse>> ValidateStep(
        long processId,
        int stepNumber,
        CancellationToken cancellationToken)
    {
        var response = await processService.ValidateStepAsync(currentUser.Id, processId, (short)stepNumber, cancellationToken);
        return Ok(response);
    }
}
