using Microsoft.AspNetCore.Http;
using System.Api.DTO.Process;

namespace System.Api.Interfaces;

public interface IProcessService
{
    Task<StartProcessResponse> StartProcessAsync(long userId, StartProcessRequest request, CancellationToken cancellationToken);

    Task<AddDriverResponse> AddDriverAsync(long userId, long processId, AddDriverRequest request, CancellationToken cancellationToken);

    Task<ListDriversResponse> ListDriversAsync(long userId, long processId, CancellationToken cancellationToken);

    Task DeleteDriverAsync(long userId, long processId, long driverId, CancellationToken cancellationToken);

    Task<ProcessProgressResponse> GetProcessProgressAsync(long userId, long processId, CancellationToken cancellationToken);

    Task<List<DocumentChecklistItemResponse>> GetDocumentChecklistAsync(long userId, long processId, CancellationToken cancellationToken);

    Task<DocumentValidationResponse> ValidateDocumentAsync(long userId, long processId, long documentId, CancellationToken cancellationToken);

    Task RemoveDocumentAsync(long userId, long processId, long documentId, CancellationToken cancellationToken);

    Task<UploadDocumentResponse> UploadDocumentAsync(long userId, long processId, UploadDocumentRequest request, IFormFile file, CancellationToken cancellationToken);

    Task<StepGuidanceResponse> GetStepGuidanceAsync(long userId, long processId, short stepNumber, CancellationToken cancellationToken);

    Task<StepValidationResponse> ValidateStepAsync(long userId, long processId, short stepNumber, CancellationToken cancellationToken);
}
