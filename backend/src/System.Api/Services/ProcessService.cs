using System.Globalization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Npgsql;
using System.Api.Configuration;
using System.Api.Data;
using System.Api.DTO.Common;
using System.Api.DTO.Process;
using System.Api.Interfaces;
using System.Api.Models;
using System.Api.Models.Enums;

namespace System.Api.Services;

public sealed class ProcessService(
    AppDbContext db,
    IStorage storage,
    IOptions<AppOptions> options) : IProcessService
{
    private const int MaxAllowedDrivers = 3;
    private const int ExpiringSoonDays = 30;

    public async Task<StartProcessResponse> StartProcessAsync(long userId, StartProcessRequest request, CancellationToken cancellationToken)
    {
        var user = await db.Usuarios
            .FirstOrDefaultAsync(u => u.Id == userId && u.AnonimizadoEm == null, cancellationToken)
            ?? throw AppException.NotFound("Usuário não encontrado.");

        if (!request.ConfirmsNewVehicleOnly)
        {
            throw AppException.Validation("É necessário confirmar que deseja apenas veículo zero quilômetro.");
        }

        var hasActiveProcess = await db.Processos
            .AnyAsync(p => p.UsuarioId == userId && p.Status != StatusProcesso.COMPLETED, cancellationToken);

        if (hasActiveProcess)
        {
            throw AppException.Conflict("Usuário já possui um processo em andamento.");
        }

        var now = DateTime.UtcNow;
        var process = new Processo
        {
            UsuarioId = userId,
            TipoPerfil = request.ProfileType,
            TipoDeficiencia = request.DisabilityType,
            Status = StatusProcesso.DRAFT,
            AceiteZeroKmEm = now,
            CriadoEm = now,
            AtualizadoEm = now,
        };

        db.Processos.Add(process);

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException { SqlState: "23505" })
        {
            throw AppException.Conflict("Usuário já possui um processo em andamento.");
        }

        return new StartProcessResponse(
            process.Id,
            process.TipoPerfil,
            process.TipoDeficiencia,
            0,
            process.Status,
            process.CriadoEm);
    }

    public async Task<AddDriverResponse> AddDriverAsync(long userId, long processId, AddDriverRequest request, CancellationToken cancellationToken)
    {
        var process = await db.Processos
            .FirstOrDefaultAsync(p => p.Id == processId && p.UsuarioId == userId, cancellationToken)
            ?? throw AppException.NotFound("Processo não encontrado.");

        if (process.Status == StatusProcesso.COMPLETED)
        {
            throw AppException.Conflict("Não é possível adicionar condutores a um processo concluído.");
        }

        if (process.TipoPerfil != TipoPerfil.PCD_NON_DRIVER)
        {
            throw AppException.Forbidden("Apenas perfis PCD não condutor podem cadastrar condutores autorizados.");
        }

        var cpf = CpfAttribute.Value.TryNormalize(request.Cpf, out var normalizedCpf)
            ? normalizedCpf
            : throw AppException.Validation("CPF inválido.");

        var cnh = CnhAttribute.Value.TryNormalize(request.Cnh, out var normalizedCnh)
            ? normalizedCnh
            : throw AppException.Validation("CNH inválida.");

        var existingDrivers = await db.CondutoresAutorizados
            .Where(c => c.ProcessoId == processId)
            .ToListAsync(cancellationToken);

        if (existingDrivers.Count >= MaxAllowedDrivers)
        {
            throw AppException.Conflict("Limite máximo de 3 condutores autorizados atingido.");
        }

        if (existingDrivers.Any(c => c.Cpf == normalizedCpf))
        {
            throw AppException.Conflict("Já existe um condutor cadastrado com este CPF neste processo.");
        }

        long? linkedUserId = null;
        var systemUser = await db.Usuarios
            .FirstOrDefaultAsync(u => u.Cpf == normalizedCpf && u.AnonimizadoEm == null, cancellationToken);
        if (systemUser is not null)
        {
            linkedUserId = systemUser.Id;
        }

        var nextPosition = existingDrivers.Max(c => (short?)c.Posicao) ?? 0;
        nextPosition += 1;

        var now = DateTime.UtcNow;
        var driver = new CondutorAutorizado
        {
            ProcessoId = processId,
            UsuarioId = linkedUserId,
            Posicao = nextPosition,
            Nome = request.FullName.Trim(),
            Cpf = normalizedCpf,
            CnhNumero = normalizedCnh,
            CnhValidade = request.CnhExpiresAt,
            Parentesco = request.Relationship,
            CriadoEm = now,
        };

        db.CondutoresAutorizados.Add(driver);

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException { SqlState: "23505" })
        {
            throw AppException.Conflict("Já existe um condutor cadastrado com este CPF neste processo.");
        }

        var count = existingDrivers.Count + 1;
        return new AddDriverResponse(driver.Id, driver.Nome, count, MaxAllowedDrivers, "REGISTERED");
    }

    public async Task<ListDriversResponse> ListDriversAsync(long userId, long processId, CancellationToken cancellationToken)
    {
        var process = await db.Processos
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == processId && p.UsuarioId == userId, cancellationToken)
            ?? throw AppException.NotFound("Processo não encontrado.");

        var drivers = await db.CondutoresAutorizados
            .AsNoTracking()
            .Where(c => c.ProcessoId == processId)
            .OrderBy(c => c.Posicao)
            .ToListAsync(cancellationToken);

        var driverResponses = drivers.Select(d => new DriverResponse(
            d.Id,
            d.Nome,
            MaskCpf(d.Cpf),
            MaskCnh(d.CnhNumero),
            d.CnhValidade,
            d.Parentesco,
            d.CriadoEm)).ToList();

        return new ListDriversResponse(driverResponses.Count, MaxAllowedDrivers, driverResponses);
    }

    public async Task DeleteDriverAsync(long userId, long processId, long driverId, CancellationToken cancellationToken)
    {
        var process = await db.Processos
            .FirstOrDefaultAsync(p => p.Id == processId && p.UsuarioId == userId, cancellationToken)
            ?? throw AppException.NotFound("Processo não encontrado.");

        var driver = await db.CondutoresAutorizados
            .FirstOrDefaultAsync(c => c.Id == driverId && c.ProcessoId == processId, cancellationToken)
            ?? throw AppException.NotFound("Condutor não encontrado.");

        db.CondutoresAutorizados.Remove(driver);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<ProcessProgressResponse> GetProcessProgressAsync(long userId, long processId, CancellationToken cancellationToken)
    {
        var process = await db.Processos
            .AsNoTracking()
            .Include(p => p.Usuario)
            .FirstOrDefaultAsync(p => p.Id == processId && p.UsuarioId == userId, cancellationToken)
            ?? throw AppException.NotFound("Processo não encontrado.");

        var totalEtapas = await db.Etapas
            .AsNoTracking()
            .CountAsync(e => e.TipoPerfil == process.TipoPerfil, cancellationToken);

        var completedEtapas = await db.ProcessoEtapas
            .AsNoTracking()
            .CountAsync(pe => pe.ProcessoId == processId && pe.Status == StatusEtapa.VALIDATED, cancellationToken);

        var currentStep = completedEtapas + 1;
        if (totalEtapas == 0)
        {
            currentStep = 1;
        }
        else if (currentStep > totalEtapas)
        {
            currentStep = totalEtapas;
        }

        double progressPercentage = 0;
        if (totalEtapas > 0)
        {
            progressPercentage = Math.Round((completedEtapas * 100.0) / totalEtapas, 1);
        }

        return new ProcessProgressResponse(
            process.Id,
            process.TipoPerfil,
            process.Usuario.NomeCompleto,
            currentStep,
            process.Status,
            progressPercentage,
            process.AtualizadoEm);
    }

    public async Task<List<DocumentChecklistItemResponse>> GetDocumentChecklistAsync(long userId, long processId, CancellationToken cancellationToken)
    {
        var process = await db.Processos
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == processId && p.UsuarioId == userId, cancellationToken)
            ?? throw AppException.NotFound("Processo não encontrado.");

        var requiredDocuments = await db.EtapaDocumentos
            .AsNoTracking()
            .Include(ed => ed.TipoDocumento)
            .Include(ed => ed.Etapa)
            .Where(ed => ed.Etapa.TipoPerfil == process.TipoPerfil)
            .Select(ed => ed.TipoDocumento)
            .Distinct()
            .ToListAsync(cancellationToken);

        var uploadedDocuments = await db.Documentos
            .AsNoTracking()
            .Where(d => d.ProcessoId == processId)
            .ToListAsync(cancellationToken);

        var authorizedDrivers = await db.CondutoresAutorizados
            .AsNoTracking()
            .Where(c => c.ProcessoId == processId)
            .OrderBy(c => c.Posicao)
            .ToListAsync(cancellationToken);

        var now = DateOnly.FromDateTime(DateTime.UtcNow);
        var result = new List<DocumentChecklistItemResponse>();

        foreach (var tipoDocumento in requiredDocuments.OrderBy(t => t.Id))
        {
            if (tipoDocumento.Dono == DonoDocumento.DRIVER)
            {
                foreach (var driver in authorizedDrivers)
                {
                    var uploaded = uploadedDocuments.FirstOrDefault(d => d.TipoDocumentoId == tipoDocumento.Id && d.CondutorAutorizadoId == driver.Id);

                    string? alert = null;
                    DateOnly? expirationDate = null;
                    StatusDocumento? status = null;
                    bool isUploaded = uploaded is not null;
                    long? authorizedDriverId = driver.Id;

                    if (uploaded is not null)
                    {
                        status = uploaded.Status;
                        expirationDate = uploaded.DataValidade;
                        if (expirationDate.HasValue && uploaded.Status == StatusDocumento.VALID)
                        {
                            var days = expirationDate.Value.DayNumber - now.DayNumber;
                            if (days >= 0 && days <= ExpiringSoonDays)
                            {
                                alert = "EXPIRING_SOON";
                            }
                        }
                    }

                    result.Add(new DocumentChecklistItemResponse(
                        tipoDocumento.Codigo,
                        authorizedDriverId,
                        true,
                        isUploaded,
                        status,
                        expirationDate,
                        alert));
                }

                continue;
            }

            var holderUploaded = uploadedDocuments.FirstOrDefault(d => d.TipoDocumentoId == tipoDocumento.Id && d.CondutorAutorizadoId == null);

            string? holderAlert = null;
            DateOnly? holderExpirationDate = null;
            StatusDocumento? holderStatus = null;
            bool holderIsUploaded = holderUploaded is not null;

            if (holderUploaded is not null)
            {
                holderStatus = holderUploaded.Status;
                holderExpirationDate = holderUploaded.DataValidade;
                if (holderExpirationDate.HasValue && holderUploaded.Status == StatusDocumento.VALID)
                {
                    var days = holderExpirationDate.Value.DayNumber - now.DayNumber;
                    if (days >= 0 && days <= ExpiringSoonDays)
                    {
                        holderAlert = "EXPIRING_SOON";
                    }
                }
            }

            result.Add(new DocumentChecklistItemResponse(
                tipoDocumento.Codigo,
                null,
                true,
                holderIsUploaded,
                holderStatus,
                holderExpirationDate,
                holderAlert));
        }

        return result;
    }

    public async Task<DocumentValidationResponse> ValidateDocumentAsync(long userId, long processId, long documentId, CancellationToken cancellationToken)
    {
        var process = await db.Processos
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == processId && p.UsuarioId == userId, cancellationToken)
            ?? throw AppException.NotFound("Processo não encontrado.");

        var document = await db.Documentos
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == documentId && d.ProcessoId == processId, cancellationToken)
            ?? throw AppException.NotFound("Documento não encontrado.");

        var now = DateOnly.FromDateTime(DateTime.UtcNow);
        int? daysUntilExpiration = null;
        if (document.DataValidade.HasValue)
        {
            daysUntilExpiration = document.DataValidade.Value.DayNumber - now.DayNumber;
        }

        bool canAdvance = document.Status == StatusDocumento.VALID;
        if (daysUntilExpiration.HasValue && daysUntilExpiration.Value < 0)
        {
            canAdvance = false;
        }

        string message = document.Status switch
        {
            StatusDocumento.VALID when daysUntilExpiration.HasValue && daysUntilExpiration.Value < 0 => "Documento vencido.",
            StatusDocumento.VALID when daysUntilExpiration.HasValue && daysUntilExpiration.Value >= 0 && daysUntilExpiration.Value <= ExpiringSoonDays => "Documento aprovado, mas próximo do vencimento.",
            StatusDocumento.VALID => "Documento aprovado e dentro do prazo de validade.",
            StatusDocumento.EXPIRED => "Documento vencido.",
            StatusDocumento.REJECTED => "Documento rejeitado.",
            StatusDocumento.PENDING => "Documento pendente de validação.",
            _ => "Status do documento não disponível."
        };

        return new DocumentValidationResponse(
            document.Id,
            document.Status,
            canAdvance,
            daysUntilExpiration,
            message);
    }

    public async Task RemoveDocumentAsync(long userId, long processId, long documentId, CancellationToken cancellationToken)
    {
        var process = await db.Processos
            .FirstOrDefaultAsync(p => p.Id == processId && p.UsuarioId == userId, cancellationToken)
            ?? throw AppException.NotFound("Processo não encontrado.");

        var document = await db.Documentos
            .FirstOrDefaultAsync(d => d.Id == documentId && d.ProcessoId == processId, cancellationToken)
            ?? throw AppException.NotFound("Documento não encontrado.");

        storage.Delete(document.CaminhoArquivo);
        db.Documentos.Remove(document);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<UploadDocumentResponse> UploadDocumentAsync(long userId, long processId, UploadDocumentRequest request, IFormFile file, CancellationToken cancellationToken)
    {
        var process = await db.Processos
            .FirstOrDefaultAsync(p => p.Id == processId && p.UsuarioId == userId, cancellationToken)
            ?? throw AppException.NotFound("Processo não encontrado.");

        if (file is null || file.Length == 0)
        {
            throw AppException.Validation("Arquivo é obrigatório.");
        }

        if (file.Length > Documento.TamanhoMaximoBytes)
        {
            throw AppException.PayloadTooLarge("Arquivo acima do limite de 10 MB.");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png" };
        if (!allowedExtensions.Contains(extension))
        {
            throw AppException.UnsupportedMediaType("Formato de arquivo não aceito.");
        }

        if (string.IsNullOrWhiteSpace(request.DocumentType))
        {
            throw AppException.Validation("Tipo de documento é obrigatório.");
        }

        if (!request.IssuedAt.HasValue && !request.ExpiresAt.HasValue)
        {
            throw AppException.Validation("É obrigatório enviar a data de emissão ou a data de validade.");
        }

        var tipoDocumento = await db.TiposDocumento
            .FirstOrDefaultAsync(t => t.Codigo == request.DocumentType, cancellationToken)
            ?? throw AppException.Validation("Tipo de documento inválido.");

        if (tipoDocumento.Dono == DonoDocumento.DRIVER)
        {
            if (!request.AuthorizedDriverId.HasValue)
            {
                throw AppException.Validation("Condutor autorizado é obrigatório para este documento.");
            }

            var driverExists = await db.CondutoresAutorizados
                .AnyAsync(c => c.Id == request.AuthorizedDriverId.Value && c.ProcessoId == processId, cancellationToken);
            if (!driverExists)
            {
                throw AppException.Validation("Condutor autorizado não encontrado.");
            }
        }

        DateOnly? expirationDate = request.ExpiresAt;
        if (!expirationDate.HasValue && request.IssuedAt.HasValue)
        {
            if (tipoDocumento.RegraValidade == RegraValidade.DAYS_FROM_ISSUE && tipoDocumento.ValidadeDias.HasValue)
            {
                expirationDate = request.IssuedAt.Value.AddDays(tipoDocumento.ValidadeDias.Value);
            }
            else if (tipoDocumento.RegraValidade == RegraValidade.PRINTED_EXPIRY)
            {
                throw AppException.Validation("É necessário informar a data de validade para este tipo de documento.");
            }
        }

        var rootPath = Path.GetFullPath(options.Value.Storage.RootPath);
        Directory.CreateDirectory(rootPath);
        var fileName = $"{Guid.NewGuid()}{extension}";
        var relativePath = fileName;
        var fullPath = Path.GetFullPath(Path.Combine(rootPath, relativePath));

        await using (var stream = new FileStream(fullPath, FileMode.CreateNew))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var now = DateTime.UtcNow;
        var document = new Documento
        {
            ProcessoId = processId,
            CondutorAutorizadoId = request.AuthorizedDriverId,
            TipoDocumentoId = tipoDocumento.Id,
            Status = StatusDocumento.VALID,
            DataEmissao = request.IssuedAt,
            DataValidade = expirationDate,
            CaminhoArquivo = relativePath,
            NomeOriginal = Path.GetFileName(file.FileName),
            TipoConteudo = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            TamanhoBytes = (int)Math.Min(file.Length, int.MaxValue),
            EnviadoEm = now,
        };

        db.Documentos.Add(document);
        process.AtualizadoEm = now;
        await db.SaveChangesAsync(cancellationToken);

        return new UploadDocumentResponse(
            document.Id,
            tipoDocumento.Codigo,
            document.Status,
            document.DataValidade,
            document.EnviadoEm);
    }

    public async Task<StepGuidanceResponse> GetStepGuidanceAsync(long userId, long processId, short stepNumber, CancellationToken cancellationToken)
    {
        var process = await db.Processos
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == processId && p.UsuarioId == userId, cancellationToken)
            ?? throw AppException.NotFound("Processo não encontrado.");

        var etapa = await db.Etapas
            .AsNoTracking()
            .Include(e => e.Acoes.OrderBy(a => a.Ordem))
            .FirstOrDefaultAsync(e => e.TipoPerfil == process.TipoPerfil && e.Ordem == stepNumber, cancellationToken)
            ?? throw AppException.NotFound("Etapa não encontrada.");

        var actions = etapa.Acoes
            .OrderBy(a => a.Ordem)
            .Select(a => a.Descricao)
            .ToList();

        string? notice = etapa.Ordem == 1 && process.AceiteZeroKmEm != default
            ? "Esta solicitação vale exclusivamente para veículos novos (0 km)."
            : null;

        return new StepGuidanceResponse(
            etapa.Ordem,
            etapa.Titulo,
            etapa.Orgao,
            etapa.ExplicacaoSimplificada,
            actions,
            notice);
    }

    public async Task<StepValidationResponse> ValidateStepAsync(long userId, long processId, short stepNumber, CancellationToken cancellationToken)
    {
        var process = await db.Processos
            .FirstOrDefaultAsync(p => p.Id == processId && p.UsuarioId == userId, cancellationToken)
            ?? throw AppException.NotFound("Processo não encontrado.");

        var etapa = await db.Etapas
            .AsNoTracking()
            .Include(e => e.DocumentosExigidos)
                .ThenInclude(ed => ed.TipoDocumento)
            .FirstOrDefaultAsync(e => e.TipoPerfil == process.TipoPerfil && e.Ordem == stepNumber, cancellationToken)
            ?? throw AppException.NotFound("Etapa não encontrada.");

        var validationErrors = new List<StepValidationError>();
        var now = DateOnly.FromDateTime(DateTime.UtcNow);

        var requiredDocuments = etapa.DocumentosExigidos;
        if (requiredDocuments.Count > 0)
        {
            var uploadedDocuments = await db.Documentos
                .AsNoTracking()
                .Where(d => d.ProcessoId == processId)
                .ToListAsync(cancellationToken);

            var authorizedDrivers = await db.CondutoresAutorizados
                .AsNoTracking()
                .Where(c => c.ProcessoId == processId)
                .ToListAsync(cancellationToken);

            foreach (var etapaDocumento in requiredDocuments)
            {
                var tipoDocumento = etapaDocumento.TipoDocumento;

                if (tipoDocumento.Dono == DonoDocumento.DRIVER)
                {
                    if (authorizedDrivers.Count == 0)
                    {
                        validationErrors.Add(new StepValidationError(
                            "DOCUMENT_MISSING",
                            null,
                            null,
                            "Documento obrigatório do condutor autorizado não enviado."));
                        continue;
                    }

                    foreach (var driver in authorizedDrivers)
                    {
                        var uploaded = uploadedDocuments.FirstOrDefault(d => d.TipoDocumentoId == tipoDocumento.Id && d.CondutorAutorizadoId == driver.Id);
                        if (uploaded is null)
                        {
                            validationErrors.Add(new StepValidationError(
                                "DOCUMENT_MISSING",
                                null,
                                null,
                                "Documento obrigatório do condutor autorizado não enviado."));
                            continue;
                        }

                        if (uploaded.Status == StatusDocumento.REJECTED)
                        {
                            validationErrors.Add(new StepValidationError(
                                "DOCUMENT_REJECTED",
                                null,
                                uploaded.Id,
                                "Documento rejeitado."));
                            continue;
                        }

                        if (uploaded.Status == StatusDocumento.EXPIRED || (uploaded.DataValidade.HasValue && uploaded.DataValidade.Value < now))
                        {
                            validationErrors.Add(new StepValidationError(
                                "DOCUMENT_EXPIRED",
                                null,
                                uploaded.Id,
                                "Documento vencido."));
                        }
                    }
                }
                else
                {
                    var uploaded = uploadedDocuments.FirstOrDefault(d => d.TipoDocumentoId == tipoDocumento.Id && d.CondutorAutorizadoId == null);
                    if (uploaded is null)
                    {
                        validationErrors.Add(new StepValidationError(
                            "DOCUMENT_MISSING",
                            null,
                            null,
                            "Documento obrigatório não enviado."));
                        continue;
                    }

                    if (uploaded.Status == StatusDocumento.REJECTED)
                    {
                        validationErrors.Add(new StepValidationError(
                            "DOCUMENT_REJECTED",
                            null,
                            uploaded.Id,
                            "Documento rejeitado."));
                        continue;
                    }

                    if (uploaded.Status == StatusDocumento.EXPIRED || (uploaded.DataValidade.HasValue && uploaded.DataValidade.Value < now))
                    {
                        validationErrors.Add(new StepValidationError(
                            "DOCUMENT_EXPIRED",
                            null,
                            uploaded.Id,
                            "Documento vencido."));
                    }
                }
            }
        }

        if (stepNumber == 3)
        {
            if (string.IsNullOrWhiteSpace(process.VeiculoModelo))
            {
                validationErrors.Add(new StepValidationError(
                    "REQUIRED_FIELD_MISSING",
                    "vehicle.model",
                    null,
                    "Campo obrigatório."));
            }
        }

        if (validationErrors.Count > 0)
        {
            return new StepValidationResponse(
                stepNumber,
                false,
                null,
                process.Status,
                validationErrors);
        }

        var processoEtapa = await db.ProcessoEtapas
            .FirstOrDefaultAsync(pe => pe.ProcessoId == processId && pe.EtapaId == etapa.Id, cancellationToken);

        if (processoEtapa is null)
        {
            processoEtapa = new ProcessoEtapa
            {
                ProcessoId = processId,
                EtapaId = etapa.Id,
                Status = StatusEtapa.VALIDATED,
                ValidadaEm = DateTime.UtcNow,
                AtualizadoEm = DateTime.UtcNow,
            };
            db.ProcessoEtapas.Add(processoEtapa);
        }
        else
        {
            processoEtapa.Status = StatusEtapa.VALIDATED;
            processoEtapa.ValidadaEm = DateTime.UtcNow;
            processoEtapa.AtualizadoEm = DateTime.UtcNow;
        }

        if (process.Status == StatusProcesso.DRAFT)
        {
            process.Status = StatusProcesso.IN_PROGRESS;
        }

        process.AtualizadoEm = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        var totalEtapas = await db.Etapas
            .CountAsync(e => e.TipoPerfil == process.TipoPerfil, cancellationToken);

        var validatedCount = await db.ProcessoEtapas
            .CountAsync(pe => pe.ProcessoId == processId && pe.Status == StatusEtapa.VALIDATED, cancellationToken);

        short? nextStep = null;
        if (validatedCount < totalEtapas)
        {
            nextStep = (short)(validatedCount + 1);
        }
        else
        {
            nextStep = null;
        }

        return new StepValidationResponse(
            stepNumber,
            true,
            nextStep,
            process.Status,
            Array.Empty<StepValidationError>());
    }

    private static string MaskCpf(string cpf)
    {
        if (string.IsNullOrEmpty(cpf) || cpf.Length < 11)
        {
            return cpf;
        }

        return $"***.{cpf.Substring(3, 3)}.{cpf.Substring(6, 3)}-**";
    }

    private static string MaskCnh(string cnh)
    {
        if (string.IsNullOrEmpty(cnh) || cnh.Length < 11)
        {
            return cnh;
        }

        return $"*****{cnh.Substring(5, 6)}";
    }
}
