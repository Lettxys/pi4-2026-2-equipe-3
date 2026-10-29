using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Api.Controllers;
using System.Api.DTO.Process;
using System.Api.Interfaces;
using System.Api.Models.Enums;
using System.Security.Claims;

namespace System.Api.Tests;

public sealed class ProcessControllerTests
{
    private const long TestUserId = 42;

    private static (ProcessController Controller, FakeProcessService Service) CreateController()
    {
        var service = new FakeProcessService();
        var currentUser = new FakeCurrentUser(TestUserId);
        var controller = new ProcessController(service, currentUser);
        return (controller, service);
    }

    [Fact]
    public async Task StartProcess_ReturnsCreated_WithCorrectRouteAndBody()
    {
        var (controller, service) = CreateController();
        var request = new StartProcessRequest
        {
            ProfileType = TipoPerfil.PCD_NON_DRIVER,
            DisabilityType = TipoDeficiencia.PHYSICAL,
            ConfirmsNewVehicleOnly = true,
        };
        var expectedResponse = new StartProcessResponse(10, TipoPerfil.PCD_NON_DRIVER, TipoDeficiencia.PHYSICAL, 0, StatusProcesso.DRAFT, DateTime.UtcNow);
        service.StartProcessResponseToReturn = expectedResponse;

        var actionResult = await controller.StartProcess(request, CancellationToken.None);

        var createdResult = Assert.IsType<CreatedResult>(actionResult.Result);
        Assert.Equal("api/processes/10", createdResult.Location);
        Assert.Same(expectedResponse, createdResult.Value);
        Assert.Equal(TestUserId, service.LastUserId);
    }

    [Fact]
    public async Task GetProcess_ReturnsOk_WithProcessProgress()
    {
        var (controller, service) = CreateController();
        var expectedResponse = new ProcessProgressResponse(10, TipoPerfil.PCD_NON_DRIVER, "Nome", 1, StatusProcesso.IN_PROGRESS, 25.0, DateTime.UtcNow);
        service.ProcessProgressResponseToReturn = expectedResponse;

        var actionResult = await controller.GetProcess(10, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        Assert.Same(expectedResponse, okResult.Value);
        Assert.Equal(10, service.LastProcessId);
    }

    [Fact]
    public async Task GetDocumentChecklist_ReturnsOk_WithChecklist()
    {
        var (controller, service) = CreateController();
        var expectedResponse = new List<DocumentChecklistItemResponse>
        {
            new("CPF", null, true, true, StatusDocumento.VALID, null, null)
        };
        service.ChecklistResponseToReturn = expectedResponse;

        var actionResult = await controller.GetDocumentChecklist(10, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        Assert.Same(expectedResponse, okResult.Value);
    }

    [Fact]
    public async Task UploadDocument_ReturnsCreated_WithDocumentRoute()
    {
        var (controller, service) = CreateController();
        var file = new FormFile(new MemoryStream("data"u8.ToArray()), 0, 4, "file", "doc.pdf");
        var request = new UploadDocumentRequest { File = file, DocumentType = "CPF" };
        var expectedResponse = new UploadDocumentResponse(99, "CPF", StatusDocumento.VALID, null, DateTime.UtcNow);
        service.UploadDocumentResponseToReturn = expectedResponse;

        var actionResult = await controller.UploadDocument(10, request, CancellationToken.None);

        var createdResult = Assert.IsType<CreatedResult>(actionResult.Result);
        Assert.Equal("api/processes/10/documents/99", createdResult.Location);
        Assert.Same(expectedResponse, createdResult.Value);
    }

    [Fact]
    public async Task ValidateDocument_ReturnsOk_WithValidationInfo()
    {
        var (controller, service) = CreateController();
        var expectedResponse = new DocumentValidationResponse(99, StatusDocumento.VALID, true, 30, "Aprovado");
        service.DocumentValidationResponseToReturn = expectedResponse;

        var actionResult = await controller.ValidateDocument(10, 99, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        Assert.Same(expectedResponse, okResult.Value);
    }

    [Fact]
    public async Task DeleteDocument_ReturnsNoContent()
    {
        var (controller, service) = CreateController();

        var result = await controller.DeleteDocument(10, 99, CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
        Assert.Equal(99, service.LastDocumentId);
    }

    [Fact]
    public async Task AddDriver_ReturnsCreated_WithDriverRoute()
    {
        var (controller, service) = CreateController();
        var request = new AddDriverRequest
        {
            FullName = "Condutor",
            Cpf = "39053344705",
            Cnh = "02650306461",
            CnhExpiresAt = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(1)),
            Relationship = Parentesco.SPOUSE,
        };
        var expectedResponse = new AddDriverResponse(7, "Condutor", 1, 3, "REGISTERED");
        service.AddDriverResponseToReturn = expectedResponse;

        var actionResult = await controller.AddDriver(10, request, CancellationToken.None);

        var createdResult = Assert.IsType<CreatedResult>(actionResult.Result);
        Assert.Equal("api/processes/10/drivers/7", createdResult.Location);
        Assert.Same(expectedResponse, createdResult.Value);
    }

    [Fact]
    public async Task ListDrivers_ReturnsOk_WithDriversList()
    {
        var (controller, service) = CreateController();
        var expectedResponse = new ListDriversResponse(1, 3, new List<DriverResponse>
        {
            new(7, "Condutor", "***.533.447-**", "*****06461", DateOnly.FromDateTime(DateTime.UtcNow.AddYears(1)), Parentesco.SPOUSE, DateTime.UtcNow)
        });
        service.ListDriversResponseToReturn = expectedResponse;

        var actionResult = await controller.ListDrivers(10, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        Assert.Same(expectedResponse, okResult.Value);
    }

    [Fact]
    public async Task DeleteDriver_ReturnsNoContent()
    {
        var (controller, service) = CreateController();

        var result = await controller.DeleteDriver(10, 7, CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
        Assert.Equal(7, service.LastDriverId);
    }

    [Fact]
    public async Task GetStepGuidance_ReturnsOk_WithStepGuidance()
    {
        var (controller, service) = CreateController();
        var expectedResponse = new StepGuidanceResponse(1, "Titulo", Orgao.DETRAN, "Explicacao", new List<string> { "Acao 1" }, null);
        service.StepGuidanceResponseToReturn = expectedResponse;

        var actionResult = await controller.GetStepGuidance(10, 1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        Assert.Same(expectedResponse, okResult.Value);
    }

    [Fact]
    public async Task ValidateStep_ReturnsOk_WithStepValidation()
    {
        var (controller, service) = CreateController();
        var expectedResponse = new StepValidationResponse(1, true, 2, StatusProcesso.IN_PROGRESS, Array.Empty<StepValidationError>());
        service.StepValidationResponseToReturn = expectedResponse;

        var actionResult = await controller.ValidateStep(10, 1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        Assert.Same(expectedResponse, okResult.Value);
    }

    private sealed class FakeCurrentUser(long userId) : ICurrentUser
    {
        public ClaimsPrincipal Principal => new(new ClaimsIdentity());
        public long Id => userId;
        public string? Email => "test@example.com";
        public string? Name => "Test User";
        public string? Jti => Guid.NewGuid().ToString();
        public DateTime? IssuedAt => DateTime.UtcNow;
        public DateTime? ExpiresAt => DateTime.UtcNow.AddHours(1);
        public bool IsAdministrator => false;
    }

    private sealed class FakeProcessService : IProcessService
    {
        public long LastUserId { get; private set; }
        public long LastProcessId { get; private set; }
        public long LastDocumentId { get; private set; }
        public long LastDriverId { get; private set; }

        public StartProcessResponse? StartProcessResponseToReturn { get; set; }
        public ProcessProgressResponse? ProcessProgressResponseToReturn { get; set; }
        public List<DocumentChecklistItemResponse>? ChecklistResponseToReturn { get; set; }
        public UploadDocumentResponse? UploadDocumentResponseToReturn { get; set; }
        public DocumentValidationResponse? DocumentValidationResponseToReturn { get; set; }
        public AddDriverResponse? AddDriverResponseToReturn { get; set; }
        public ListDriversResponse? ListDriversResponseToReturn { get; set; }
        public StepGuidanceResponse? StepGuidanceResponseToReturn { get; set; }
        public StepValidationResponse? StepValidationResponseToReturn { get; set; }

        public Task<StartProcessResponse> StartProcessAsync(long userId, StartProcessRequest request, CancellationToken cancellationToken)
        {
            LastUserId = userId;
            return Task.FromResult(StartProcessResponseToReturn!);
        }

        public Task<ProcessProgressResponse> GetProcessProgressAsync(long userId, long processId, CancellationToken cancellationToken)
        {
            LastUserId = userId;
            LastProcessId = processId;
            return Task.FromResult(ProcessProgressResponseToReturn!);
        }

        public Task<List<DocumentChecklistItemResponse>> GetDocumentChecklistAsync(long userId, long processId, CancellationToken cancellationToken)
        {
            LastUserId = userId;
            LastProcessId = processId;
            return Task.FromResult(ChecklistResponseToReturn!);
        }

        public Task<UploadDocumentResponse> UploadDocumentAsync(long userId, long processId, UploadDocumentRequest request, IFormFile file, CancellationToken cancellationToken)
        {
            LastUserId = userId;
            LastProcessId = processId;
            return Task.FromResult(UploadDocumentResponseToReturn!);
        }

        public Task<DocumentValidationResponse> ValidateDocumentAsync(long userId, long processId, long documentId, CancellationToken cancellationToken)
        {
            LastUserId = userId;
            LastProcessId = processId;
            LastDocumentId = documentId;
            return Task.FromResult(DocumentValidationResponseToReturn!);
        }

        public Task RemoveDocumentAsync(long userId, long processId, long documentId, CancellationToken cancellationToken)
        {
            LastUserId = userId;
            LastProcessId = processId;
            LastDocumentId = documentId;
            return Task.CompletedTask;
        }

        public Task<AddDriverResponse> AddDriverAsync(long userId, long processId, AddDriverRequest request, CancellationToken cancellationToken)
        {
            LastUserId = userId;
            LastProcessId = processId;
            return Task.FromResult(AddDriverResponseToReturn!);
        }

        public Task<ListDriversResponse> ListDriversAsync(long userId, long processId, CancellationToken cancellationToken)
        {
            LastUserId = userId;
            LastProcessId = processId;
            return Task.FromResult(ListDriversResponseToReturn!);
        }

        public Task DeleteDriverAsync(long userId, long processId, long driverId, CancellationToken cancellationToken)
        {
            LastUserId = userId;
            LastProcessId = processId;
            LastDriverId = driverId;
            return Task.CompletedTask;
        }

        public Task<StepGuidanceResponse> GetStepGuidanceAsync(long userId, long processId, short stepNumber, CancellationToken cancellationToken)
        {
            LastUserId = userId;
            LastProcessId = processId;
            return Task.FromResult(StepGuidanceResponseToReturn!);
        }

        public Task<StepValidationResponse> ValidateStepAsync(long userId, long processId, short stepNumber, CancellationToken cancellationToken)
        {
            LastUserId = userId;
            LastProcessId = processId;
            return Task.FromResult(StepValidationResponseToReturn!);
        }
    }
}
