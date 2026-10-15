using System.Api.DTO.Process;

namespace System.Api.Interfaces;

public interface IProcessService
{
    Task<StartProcessResponse> StartProcessAsync(long userId, StartProcessRequest request, CancellationToken cancellationToken);

    Task<AddDriverResponse> AddDriverAsync(long userId, long processId, AddDriverRequest request, CancellationToken cancellationToken);

    Task<ListDriversResponse> ListDriversAsync(long userId, long processId, CancellationToken cancellationToken);

    Task DeleteDriverAsync(long userId, long processId, long driverId, CancellationToken cancellationToken);
}
