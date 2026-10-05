using Microsoft.Extensions.Options;
using System.Api.Configuration;
using System.Api.Interfaces;

namespace System.Api.Services;

public sealed class Storage(IOptions<AppOptions> options, ILogger<Storage> logger) : IStorage
{
    public string ResolvePath(string relativePath) =>
        Path.GetFullPath(Path.Combine(options.Value.Storage.RootPath, relativePath));

    public void Delete(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            return;
        }

        var root = Path.GetFullPath(options.Value.Storage.RootPath);
        var fullPath = Path.GetFullPath(Path.Combine(root, relativePath));

        if (!fullPath.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.Ordinal))
        {
            logger.LogWarning("Ignorando exclusão fora da raiz de armazenamento: {Path}", relativePath);
            return;
        }

        if (!File.Exists(fullPath))
        {
            return;
        }

        try
        {
            File.Delete(fullPath);
        }
        catch (IOException exception)
        {
            logger.LogWarning(exception, "Falha ao excluir o arquivo {Path}", fullPath);
        }
        catch (UnauthorizedAccessException exception)
        {
            logger.LogWarning(exception, "Sem permissão para excluir o arquivo {Path}", fullPath);
        }
    }
}