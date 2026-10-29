using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Api.Configuration;
using System.Api.DTO.Common;
using System.Api.DTO.Process;
using System.Api.Interfaces;
using System.Api.Models;
using System.Api.Models.Enums;
using System.Api.Services;

namespace System.Api.Tests;

[Collection("Banco de teste")]
public sealed class ProcessRoutesTests(DatabaseFixture fixture) : DatabaseTest(fixture)
{
    private ProcessService CreateService()
    {
        var storage = new FakeStorage();
        var options = Options.Create(new AppOptions
        {
            Jwt = new JwtOptions("12345678901234567890123456789012", "test", "test", 60, 7),
            Storage = new StorageOptions(Path.Combine(Path.GetTempPath(), "pi4-tests")),
            Redis = new RedisOptions("localhost:6379"),
            PasswordReset = new PasswordResetOptions(30),
            Frontend = new FrontendOptions("http://localhost:5173"),
            Smtp = new SmtpOptions("localhost", 587, string.Empty, string.Empty, "test@test.com"),
            Cors = new CorsOptions(["http://localhost:5173"]),
        });
        Directory.CreateDirectory(options.Value.Storage.RootPath);
        return new ProcessService(Db, storage, options);
    }

    [Fact]
    public async Task StartProcess_CreatesProcess_WhenValidRequest()
    {
        var user = await SaveAsync(NewUsuario("start@example.com", "52998224725"));
        var service = CreateService();
        var request = new StartProcessRequest
        {
            ProfileType = TipoPerfil.PCD_NON_DRIVER,
            DisabilityType = TipoDeficiencia.PHYSICAL,
            ConfirmsNewVehicleOnly = true,
        };

        var result = await service.StartProcessAsync(user.Id, request, CancellationToken.None);

        Assert.True(result.ProcessId > 0);
        Assert.Equal(TipoPerfil.PCD_NON_DRIVER, result.ProfileType);
        Assert.Equal(TipoDeficiencia.PHYSICAL, result.DisabilityType);
        Assert.Equal(0, result.CurrentStep);
        Assert.Equal(StatusProcesso.DRAFT, result.Status);

        await using var db2 = Fixture.CreateContext();
        var process = await db2.Processos.FindAsync(result.ProcessId);
        Assert.NotNull(process);
        Assert.Equal(user.Id, process.UsuarioId);
        Assert.NotEqual(default, process.AceiteZeroKmEm);
    }

    [Fact]
    public async Task StartProcess_ThrowsValidation_WhenDoesNotConfirmNewVehicleOnly()
    {
        var user = await SaveAsync(NewUsuario("start-nov@example.com", "52998224725"));
        var service = CreateService();
        var request = new StartProcessRequest
        {
            ProfileType = TipoPerfil.PCD_NON_DRIVER,
            DisabilityType = TipoDeficiencia.PHYSICAL,
            ConfirmsNewVehicleOnly = false,
        };

        await Assert.ThrowsAsync<AppException>(() => service.StartProcessAsync(user.Id, request, CancellationToken.None));
    }

    [Fact]
    public async Task StartProcess_ThrowsConflict_WhenActiveProcessExists()
    {
        var user = await SaveAsync(NewUsuario("start-conflict@example.com", "52998224725"));
        await SaveAsync(NewProcesso(user.Id, StatusProcesso.IN_PROGRESS));
        var service = CreateService();
        var request = new StartProcessRequest
        {
            ProfileType = TipoPerfil.PCD_NON_DRIVER,
            DisabilityType = TipoDeficiencia.PHYSICAL,
            ConfirmsNewVehicleOnly = true,
        };

        await Assert.ThrowsAsync<AppException>(() => service.StartProcessAsync(user.Id, request, CancellationToken.None));
    }

    [Fact]
    public async Task GetProcessProgress_ReturnsProgressForOwner()
    {
        var user = await SaveAsync(NewUsuario("progress@example.com", "52998224725"));
        var process = await SaveAsync(NewProcesso(user.Id, StatusProcesso.IN_PROGRESS));

        var etapa1 = await SaveAsync(new Etapa
        {
            Id = 1,
            TipoPerfil = TipoPerfil.PCD_NON_DRIVER,
            Ordem = 1,
            Titulo = "Etapa 1",
            ExplicacaoSimplificada = "Teste",
        });
        var etapa2 = await SaveAsync(new Etapa
        {
            Id = 2,
            TipoPerfil = TipoPerfil.PCD_NON_DRIVER,
            Ordem = 2,
            Titulo = "Etapa 2",
            ExplicacaoSimplificada = "Teste",
        });
        await SaveAsync(new ProcessoEtapa
        {
            ProcessoId = process.Id,
            EtapaId = etapa1.Id,
            Status = StatusEtapa.VALIDATED,
            AtualizadoEm = DateTime.UtcNow,
        });

        var service = CreateService();
        var result = await service.GetProcessProgressAsync(user.Id, process.Id, CancellationToken.None);

        Assert.Equal(process.Id, result.ProcessId);
        Assert.Equal(user.NomeCompleto, result.FullName);
        Assert.Equal(2, result.CurrentStep);
        Assert.Equal(50.0, result.ProgressPercentage);
    }

    [Fact]
    public async Task GetProcessProgress_ThrowsNotFound_WhenNotOwner()
    {
        var owner = await SaveAsync(NewUsuario("owner@example.com", "52998224725"));
        var other = await SaveAsync(NewUsuario("other@example.com", "11144477735"));
        var process = await SaveAsync(NewProcesso(owner.Id, StatusProcesso.IN_PROGRESS));

        var service = CreateService();
        await Assert.ThrowsAsync<AppException>(() => service.GetProcessProgressAsync(other.Id, process.Id, CancellationToken.None));
    }

    [Fact]
    public async Task GetDocumentChecklist_ReturnsRequiredDocumentsWithStatus()
    {
        var user = await SaveAsync(NewUsuario("checklist@example.com", "52998224725"));
        var process = await SaveAsync(NewProcesso(user.Id, StatusProcesso.IN_PROGRESS));

        var tipoDoc = await SaveAsync(new TipoDocumento
        {
            Codigo = "MEDICAL_REPORT_IPI",
            Nome = "Laudo Médico",
            Dono = DonoDocumento.HOLDER,
            RegraValidade = RegraValidade.DAYS_FROM_ISSUE,
            ValidadeDias = 365,
        });

        var etapa = await SaveAsync(new Etapa
        {
            Id = 10,
            TipoPerfil = TipoPerfil.PCD_NON_DRIVER,
            Ordem = 1,
            Titulo = "Laudo",
            ExplicacaoSimplificada = "Teste",
        });

        await SaveAsync(new EtapaDocumento
        {
            EtapaId = etapa.Id,
            TipoDocumentoId = tipoDoc.Id,
        });

        await SaveAsync(new Documento
        {
            ProcessoId = process.Id,
            TipoDocumentoId = tipoDoc.Id,
            Status = StatusDocumento.VALID,
            DataEmissao = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-10)),
            DataValidade = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(15)),
            CaminhoArquivo = "uploads/test.pdf",
            NomeOriginal = "test.pdf",
            TipoConteudo = "application/pdf",
            TamanhoBytes = 1024,
            EnviadoEm = DateTime.UtcNow,
        });

        var service = CreateService();
        var checklist = await service.GetDocumentChecklistAsync(user.Id, process.Id, CancellationToken.None);

        var item = Assert.Single(checklist);
        Assert.Equal("MEDICAL_REPORT_IPI", item.DocumentType);
        Assert.True(item.IsRequired);
        Assert.True(item.IsUploaded);
        Assert.Equal(StatusDocumento.VALID, item.Status);
        Assert.Equal("EXPIRING_SOON", item.Alert);
    }

    [Fact]
    public async Task ValidateDocument_ReturnsValidationInfo()
    {
        var user = await SaveAsync(NewUsuario("validate@example.com", "52998224725"));
        var process = await SaveAsync(NewProcesso(user.Id, StatusProcesso.IN_PROGRESS));
        var tipoDoc = await SaveAsync(new TipoDocumento
        {
            Codigo = "CPF",
            Nome = "CPF",
            Dono = DonoDocumento.HOLDER,
            RegraValidade = RegraValidade.NONE,
        });

        var document = await SaveAsync(new Documento
        {
            ProcessoId = process.Id,
            TipoDocumentoId = tipoDoc.Id,
            Status = StatusDocumento.VALID,
            DataEmissao = DateOnly.FromDateTime(DateTime.UtcNow),
            DataValidade = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(100)),
            CaminhoArquivo = "uploads/cpf.pdf",
            NomeOriginal = "cpf.pdf",
            TipoConteudo = "application/pdf",
            TamanhoBytes = 1024,
            EnviadoEm = DateTime.UtcNow,
        });

        var service = CreateService();
        var result = await service.ValidateDocumentAsync(user.Id, process.Id, document.Id, CancellationToken.None);

        Assert.Equal(document.Id, result.DocumentId);
        Assert.Equal(StatusDocumento.VALID, result.Status);
        Assert.True(result.CanAdvance);
        Assert.True(result.DaysUntilExpiration >= 99);
    }

    [Fact]
    public async Task RemoveDocument_RemovesFileAndRecord()
    {
        var user = await SaveAsync(NewUsuario("remove@example.com", "52998224725"));
        var process = await SaveAsync(NewProcesso(user.Id, StatusProcesso.IN_PROGRESS));
        var tipoDoc = await SaveAsync(new TipoDocumento
        {
            Codigo = "ID_CARD",
            Nome = "RG",
            Dono = DonoDocumento.HOLDER,
            RegraValidade = RegraValidade.NONE,
        });

        var document = await SaveAsync(new Documento
        {
            ProcessoId = process.Id,
            TipoDocumentoId = tipoDoc.Id,
            Status = StatusDocumento.VALID,
            DataEmissao = DateOnly.FromDateTime(DateTime.UtcNow),
            CaminhoArquivo = "uploads/remove.pdf",
            NomeOriginal = "remove.pdf",
            TipoConteudo = "application/pdf",
            TamanhoBytes = 1024,
            EnviadoEm = DateTime.UtcNow,
        });

        var service = CreateService();
        await service.RemoveDocumentAsync(user.Id, process.Id, document.Id, CancellationToken.None);

        await using var db2 = Fixture.CreateContext();
        Assert.Null(await db2.Documentos.FindAsync(document.Id));
    }

    [Fact]
    public async Task UploadDocument_CreatesDocumentWithCalculatedExpiration()
    {
        var user = await SaveAsync(NewUsuario("upload@example.com", "52998224725"));
        var process = await SaveAsync(NewProcesso(user.Id, StatusProcesso.IN_PROGRESS));
        await SaveAsync(new TipoDocumento
        {
            Codigo = "MEDICAL_REPORT_IPI",
            Nome = "Laudo Médico IPI",
            Dono = DonoDocumento.HOLDER,
            RegraValidade = RegraValidade.DAYS_FROM_ISSUE,
            ValidadeDias = 365,
        });

        var service = CreateService();
        var content = "test"u8.ToArray();
        var file = new FormFile(new MemoryStream(content), 0, content.Length, "file", "laudo.pdf")
        {
            Headers = new HeaderDictionary(),
            ContentType = "application/pdf",
        };

        var request = new UploadDocumentRequest
        {
            File = file,
            DocumentType = "MEDICAL_REPORT_IPI",
            IssuedAt = new DateOnly(2026, 1, 1),
        };

        var result = await service.UploadDocumentAsync(user.Id, process.Id, request, file, CancellationToken.None);

        Assert.True(result.DocumentId > 0);
        Assert.Equal("MEDICAL_REPORT_IPI", result.DocumentType);
        Assert.Equal(StatusDocumento.VALID, result.Status);
        Assert.Equal(new DateOnly(2027, 1, 1), result.ExpirationDate);
    }

    [Fact]
    public async Task UploadDocument_ThrowsValidation_WhenMissingDates()
    {
        var user = await SaveAsync(NewUsuario("upload2@example.com", "52998224725"));
        var process = await SaveAsync(NewProcesso(user.Id, StatusProcesso.IN_PROGRESS));
        await SaveAsync(new TipoDocumento
        {
            Codigo = "MEDICAL_REPORT_IPI",
            Nome = "Laudo Médico IPI",
            Dono = DonoDocumento.HOLDER,
            RegraValidade = RegraValidade.DAYS_FROM_ISSUE,
            ValidadeDias = 365,
        });

        var service = CreateService();
        var content = "test"u8.ToArray();
        var file = new FormFile(new MemoryStream(content), 0, content.Length, "file", "laudo.pdf")
        {
            Headers = new HeaderDictionary(),
            ContentType = "application/pdf",
        };

        var request = new UploadDocumentRequest
        {
            File = file,
            DocumentType = "MEDICAL_REPORT_IPI",
        };

        await Assert.ThrowsAsync<AppException>(() => service.UploadDocumentAsync(user.Id, process.Id, request, file, CancellationToken.None));
    }

    [Fact]
    public async Task AddDriver_CreatesDriver_WhenValid()
    {
        var user = await SaveAsync(NewUsuario("driver@example.com", "52998224725"));
        var process = await SaveAsync(NewProcesso(user.Id, StatusProcesso.IN_PROGRESS));
        var service = CreateService();
        var request = new AddDriverRequest
        {
            FullName = "Carlos Silva",
            Cpf = "39053344705",
            Cnh = "02650306461",
            CnhExpiresAt = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(2)),
            Relationship = Parentesco.SPOUSE,
        };

        var result = await service.AddDriverAsync(user.Id, process.Id, request, CancellationToken.None);

        Assert.True(result.DriverId > 0);
        Assert.Equal("Carlos Silva", result.FullName);
        Assert.Equal(1, result.RegisteredDriversCount);
        Assert.Equal(3, result.MaxAllowedDrivers);
        Assert.Equal("REGISTERED", result.Status);

        await using var db2 = Fixture.CreateContext();
        var savedDriver = await db2.CondutoresAutorizados.FindAsync(result.DriverId);
        Assert.NotNull(savedDriver);
        Assert.Equal(1, savedDriver.Posicao);
        Assert.Equal("39053344705", savedDriver.Cpf);
    }

    [Fact]
    public async Task AddDriver_ThrowsForbidden_WhenProfileIsNotPcdNonDriver()
    {
        var user = await SaveAsync(NewUsuario("driver-forbid@example.com", "52998224725"));
        var process = await SaveAsync(new Processo
        {
            UsuarioId = user.Id,
            TipoPerfil = TipoPerfil.PCD_DRIVER,
            TipoDeficiencia = TipoDeficiencia.PHYSICAL,
            Status = StatusProcesso.IN_PROGRESS,
            AceiteZeroKmEm = DateTime.UtcNow,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow,
        });

        var service = CreateService();
        var request = new AddDriverRequest
        {
            FullName = "Carlos Silva",
            Cpf = "39053344705",
            Cnh = "02650306461",
            CnhExpiresAt = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(2)),
            Relationship = Parentesco.SPOUSE,
        };

        await Assert.ThrowsAsync<AppException>(() => service.AddDriverAsync(user.Id, process.Id, request, CancellationToken.None));
    }

    [Fact]
    public async Task AddDriver_ThrowsConflict_WhenMaxDriversReached()
    {
        var user = await SaveAsync(NewUsuario("driver-max@example.com", "52998224725"));
        var process = await SaveAsync(NewProcesso(user.Id, StatusProcesso.IN_PROGRESS));
        await SaveAsync(NewCondutor(process.Id, "39053344705"));
        await SaveAsync(new CondutorAutorizado
        {
            ProcessoId = process.Id,
            Posicao = 2,
            Nome = "Condutor 2",
            Cpf = "11144477735",
            CnhNumero = "02650306461",
            Parentesco = Parentesco.FATHER,
            CriadoEm = DateTime.UtcNow,
        });
        await SaveAsync(new CondutorAutorizado
        {
            ProcessoId = process.Id,
            Posicao = 3,
            Nome = "Condutor 3",
            Cpf = "52998224725",
            CnhNumero = "02650306461",
            Parentesco = Parentesco.CHILD,
            CriadoEm = DateTime.UtcNow,
        });

        var service = CreateService();
        var request = new AddDriverRequest
        {
            FullName = "Condutor 4",
            Cpf = "60718501007",
            Cnh = "02650306461",
            CnhExpiresAt = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(1)),
            Relationship = Parentesco.OTHER,
        };

        await Assert.ThrowsAsync<AppException>(() => service.AddDriverAsync(user.Id, process.Id, request, CancellationToken.None));
    }

    [Fact]
    public async Task ListDrivers_ReturnsDrivers_WithMaskedData()
    {
        var user = await SaveAsync(NewUsuario("list-drv@example.com", "52998224725"));
        var process = await SaveAsync(NewProcesso(user.Id, StatusProcesso.IN_PROGRESS));
        await SaveAsync(new CondutorAutorizado
        {
            ProcessoId = process.Id,
            Posicao = 1,
            Nome = "Condutor Um",
            Cpf = "39053344705",
            CnhNumero = "02650306461",
            CnhValidade = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(1)),
            Parentesco = Parentesco.SIBLING,
            CriadoEm = DateTime.UtcNow,
        });

        var service = CreateService();
        var result = await service.ListDriversAsync(user.Id, process.Id, CancellationToken.None);

        Assert.Equal(1, result.RegisteredDriversCount);
        Assert.Equal(3, result.MaxAllowedDrivers);
        var driver = Assert.Single(result.Drivers);
        Assert.Equal("Condutor Um", driver.FullName);
        Assert.Equal("***.533.447-**", driver.CpfMasked);
        Assert.Equal("*****306461", driver.CnhMasked);
    }

    [Fact]
    public async Task DeleteDriver_RemovesDriver_WhenExists()
    {
        var user = await SaveAsync(NewUsuario("del-drv@example.com", "52998224725"));
        var process = await SaveAsync(NewProcesso(user.Id, StatusProcesso.IN_PROGRESS));
        var driver = await SaveAsync(NewCondutor(process.Id, "39053344705"));

        var service = CreateService();
        await service.DeleteDriverAsync(user.Id, process.Id, driver.Id, CancellationToken.None);

        await using var db2 = Fixture.CreateContext();
        Assert.Null(await db2.CondutoresAutorizados.FindAsync(driver.Id));
    }

    [Fact]
    public async Task DeleteDriver_ThrowsNotFound_WhenDriverNotFound()
    {
        var user = await SaveAsync(NewUsuario("del-drv-nf@example.com", "52998224725"));
        var process = await SaveAsync(NewProcesso(user.Id, StatusProcesso.IN_PROGRESS));

        var service = CreateService();
        await Assert.ThrowsAsync<AppException>(() => service.DeleteDriverAsync(user.Id, process.Id, 9999, CancellationToken.None));
    }

    [Fact]
    public async Task GetStepGuidance_ReturnsStepGuidanceAndActions()
    {
        var user = await SaveAsync(NewUsuario("guidance@example.com", "52998224725"));
        var process = await SaveAsync(NewProcesso(user.Id, StatusProcesso.IN_PROGRESS));
        var etapa = await SaveAsync(new Etapa
        {
            Id = 20,
            TipoPerfil = TipoPerfil.PCD_NON_DRIVER,
            Ordem = 1,
            Titulo = "Laudo Médico",
            Orgao = Orgao.DETRAN,
            ExplicacaoSimplificada = "Obter laudo com médico credenciado",
        });
        await SaveAsync(new EtapaAcao
        {
            EtapaId = etapa.Id,
            Ordem = 1,
            Descricao = "Agendar consulta médica",
        });

        var service = CreateService();
        var result = await service.GetStepGuidanceAsync(user.Id, process.Id, 1, CancellationToken.None);

        Assert.Equal(1, result.StepNumber);
        Assert.Equal("Laudo Médico", result.Title);
        Assert.Equal(Orgao.DETRAN, result.Agency);
        Assert.Equal("Obter laudo com médico credenciado", result.SimplifiedExplanation);
        var action = Assert.Single(result.ActionSteps);
        Assert.Equal("Agendar consulta médica", action);
        Assert.Equal("Esta solicitação vale exclusivamente para veículos novos (0 km).", result.Notice);
    }

    [Fact]
    public async Task GetStepGuidance_ThrowsNotFound_WhenStepDoesNotExist()
    {
        var user = await SaveAsync(NewUsuario("guidance-nf@example.com", "52998224725"));
        var process = await SaveAsync(NewProcesso(user.Id, StatusProcesso.IN_PROGRESS));

        var service = CreateService();
        await Assert.ThrowsAsync<AppException>(() => service.GetStepGuidanceAsync(user.Id, process.Id, 99, CancellationToken.None));
    }

    [Fact]
    public async Task ValidateStep_AdvancesStep_WhenAllDocumentsValid()
    {
        var user = await SaveAsync(NewUsuario("step-val@example.com", "52998224725"));
        var process = await SaveAsync(NewProcesso(user.Id, StatusProcesso.DRAFT));

        var tipoDoc = await SaveAsync(new TipoDocumento
        {
            Codigo = "ID_CARD",
            Nome = "RG",
            Dono = DonoDocumento.HOLDER,
            RegraValidade = RegraValidade.NONE,
        });

        var etapa1 = await SaveAsync(new Etapa
        {
            Id = 30,
            TipoPerfil = TipoPerfil.PCD_NON_DRIVER,
            Ordem = 1,
            Titulo = "Identificação",
            ExplicacaoSimplificada = "Envie RG",
        });

        await SaveAsync(new Etapa
        {
            Id = 31,
            TipoPerfil = TipoPerfil.PCD_NON_DRIVER,
            Ordem = 2,
            Titulo = "Etapa 2",
            ExplicacaoSimplificada = "Próxima etapa",
        });

        await SaveAsync(new EtapaDocumento
        {
            EtapaId = etapa1.Id,
            TipoDocumentoId = tipoDoc.Id,
        });

        await SaveAsync(new Documento
        {
            ProcessoId = process.Id,
            TipoDocumentoId = tipoDoc.Id,
            Status = StatusDocumento.VALID,
            DataEmissao = DateOnly.FromDateTime(DateTime.UtcNow),
            CaminhoArquivo = "uploads/rg.pdf",
            NomeOriginal = "rg.pdf",
            TipoConteudo = "application/pdf",
            TamanhoBytes = 1024,
            EnviadoEm = DateTime.UtcNow,
        });

        var service = CreateService();
        var result = await service.ValidateStepAsync(user.Id, process.Id, 1, CancellationToken.None);

        Assert.Equal((short)1, result.Step);
        Assert.True(result.IsValidated);
        Assert.Equal((short)2, result.NextStep);
        Assert.Equal(StatusProcesso.IN_PROGRESS, result.ProcessStatus);
        Assert.Empty(result.ValidationErrors);

        await using var db2 = Fixture.CreateContext();
        var pe = await db2.ProcessoEtapas.FirstOrDefaultAsync(p => p.ProcessoId == process.Id && p.EtapaId == etapa1.Id);
        Assert.NotNull(pe);
        Assert.Equal(StatusEtapa.VALIDATED, pe.Status);
    }

    [Fact]
    public async Task ValidateStep_ReturnsErrors_WhenRequiredDocumentsMissing()
    {
        var user = await SaveAsync(NewUsuario("step-val-err@example.com", "52998224725"));
        var process = await SaveAsync(NewProcesso(user.Id, StatusProcesso.DRAFT));

        var tipoDoc = await SaveAsync(new TipoDocumento
        {
            Codigo = "ID_CARD",
            Nome = "RG",
            Dono = DonoDocumento.HOLDER,
            RegraValidade = RegraValidade.NONE,
        });

        var etapa1 = await SaveAsync(new Etapa
        {
            Id = 40,
            TipoPerfil = TipoPerfil.PCD_NON_DRIVER,
            Ordem = 1,
            Titulo = "Identificação",
            ExplicacaoSimplificada = "Envie RG",
        });

        await SaveAsync(new EtapaDocumento
        {
            EtapaId = etapa1.Id,
            TipoDocumentoId = tipoDoc.Id,
        });

        var service = CreateService();
        var result = await service.ValidateStepAsync(user.Id, process.Id, 1, CancellationToken.None);

        Assert.Equal((short)1, result.Step);
        Assert.False(result.IsValidated);
        Assert.Null(result.NextStep);
        var error = Assert.Single(result.ValidationErrors);
        Assert.Equal("DOCUMENT_MISSING", error.Code);
    }

    private sealed class FakeStorage : IStorage
    {
        public string ResolvePath(string relativePath) => Path.Combine(Path.GetTempPath(), relativePath);

        public void Delete(string relativePath)
        {
        }
    }
}