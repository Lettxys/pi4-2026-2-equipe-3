using System.Api.Models.Enums;

namespace System.Api.DTO.Process;

public sealed record ProcessProgressResponse(
    long ProcessId,
    TipoPerfil ProfileType,
    string FullName,
    int CurrentStep,
    StatusProcesso Status,
    double ProgressPercentage,
    DateTime UpdatedAt);
