using System.ComponentModel.DataAnnotations;
using System.Api.DTO.Common;
using System.Api.Models.Enums;

namespace System.Api.DTO.Process;

public sealed class StartProcessRequest
{
    [Required(ErrorMessage = "O perfil é obrigatório.")]
    [EnumDataType(typeof(TipoPerfil), ErrorMessage = "Perfil inválido.")]
    public TipoPerfil ProfileType { get; init; }

    [Required(ErrorMessage = "O tipo de deficiência é obrigatório.")]
    [EnumDataType(typeof(TipoDeficiencia), ErrorMessage = "Tipo de deficiência inválido.")]
    public TipoDeficiencia DisabilityType { get; init; }

    [Required(ErrorMessage = "É necessário confirmar que deseja apenas veículo zero quilômetro.")]
    [Range(typeof(bool), "true", "true", ErrorMessage = "É necessário confirmar que deseja apenas veículo zero quilômetro.")]
    public bool ConfirmsNewVehicleOnly { get; init; }
}

public sealed record StartProcessResponse(
    long ProcessId,
    TipoPerfil ProfileType,
    TipoDeficiencia DisabilityType,
    short CurrentStep,
    StatusProcesso Status,
    DateTime CreatedAt);

public sealed class AddDriverRequest
{
    [Required(ErrorMessage = "O nome completo é obrigatório.")]
    [StringLength(150, MinimumLength = 3, ErrorMessage = "O nome completo precisa ter entre 3 e 150 caracteres.")]
    public string FullName { get; init; } = string.Empty;

    [Required(ErrorMessage = "O CPF é obrigatório.")]
    [Cpf]
    public string Cpf { get; init; } = string.Empty;

    [Required(ErrorMessage = "O número da CNH é obrigatório.")]
    [Cnh]
    public string Cnh { get; init; } = string.Empty;

    [Required(ErrorMessage = "A data de validade da CNH é obrigatória.")]
    public DateOnly CnhExpiresAt { get; init; }

    [Required(ErrorMessage = "O parentesco é obrigatório.")]
    [EnumDataType(typeof(Parentesco), ErrorMessage = "Parentesco inválido.")]
    public Parentesco Relationship { get; init; }
}

public sealed record AddDriverResponse(
    long DriverId,
    string FullName,
    int RegisteredDriversCount,
    int MaxAllowedDrivers,
    string Status);

public sealed record DriverResponse(
    long DriverId,
    string FullName,
    string CpfMasked,
    string CnhMasked,
    DateOnly? CnhExpiresAt,
    Parentesco Relationship,
    DateTime CreatedAt);

public sealed record ListDriversResponse(
    int RegisteredDriversCount,
    int MaxAllowedDrivers,
    IReadOnlyList<DriverResponse> Drivers);

public sealed record StepGuidanceResponse(
    short StepNumber,
    string Title,
    Orgao? Agency,
    string SimplifiedExplanation,
    IReadOnlyList<string> ActionSteps,
    string? Notice);

public sealed record StepValidationError(
    string Code,
    string? Field,
    long? DocumentId,
    string Message);

public sealed record StepValidationResponse(
    short Step,
    bool IsValidated,
    short? NextStep,
    StatusProcesso ProcessStatus,
    IReadOnlyList<StepValidationError> ValidationErrors);
