using System.Api.Models.Enums;

namespace System.Api.DTO.Process;

public sealed record DocumentChecklistItemResponse(
    string DocumentType,
    long? AuthorizedDriverId,
    bool IsRequired,
    bool IsUploaded,
    StatusDocumento? Status,
    DateOnly? ExpirationDate,
    string? Alert);
