using System.Api.Models.Enums;

namespace System.Api.DTO.Process;

public sealed record UploadDocumentResponse(
    long DocumentId,
    string DocumentType,
    StatusDocumento Status,
    DateOnly? ExpirationDate,
    DateTime UploadedAt);
