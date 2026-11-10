using System.Api.Models.Enums;

namespace System.Api.DTO.Process;

public sealed record DocumentValidationResponse(
    long DocumentId,
    StatusDocumento Status,
    bool CanAdvance,
    int? DaysUntilExpiration,
    string Message);
