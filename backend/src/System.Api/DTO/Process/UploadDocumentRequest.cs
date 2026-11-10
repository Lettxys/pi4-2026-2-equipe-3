using Microsoft.AspNetCore.Http;
using System.Api.Models.Enums;

namespace System.Api.DTO.Process;

public sealed class UploadDocumentRequest
{
    public IFormFile File { get; set; } = null!;

    public string DocumentType { get; set; } = null!;

    public DateOnly? IssuedAt { get; set; }

    public DateOnly? ExpiresAt { get; set; }

    public long? AuthorizedDriverId { get; set; }
}
