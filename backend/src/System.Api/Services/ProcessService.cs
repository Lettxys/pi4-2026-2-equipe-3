using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Api.Data;
using System.Api.DTO.Common;
using System.Api.DTO.Process;
using System.Api.Interfaces;
using System.Api.Models;
using System.Api.Models.Enums;

namespace System.Api.Services;

public sealed class ProcessService(
    AppDbContext db) : IProcessService
{
    private const int MaxAllowedDrivers = 3;

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
