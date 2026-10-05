using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using System.Api.Configuration;
using System.Api.Interfaces;

namespace System.Api.Services;

public sealed class EmailSender(IOptions<AppOptions> options, ILogger<EmailSender> logger) : IEmailSender
{
    public async Task SendAsync(string recipient, string subject, string body, CancellationToken cancellationToken)
    {
        var smtp = options.Value.Smtp;

        if (!smtp.Enabled)
        {
            logger.LogWarning(
                "SMTP_HOST não configurado. E-mail não enviado. Destino: {Recipient}. Assunto: {Subject}. Conteúdo: {Content}",
                recipient,
                subject,
                body);
            return;
        }

#pragma warning disable SYSLIB0014
        using var client = new SmtpClient(smtp.Host, smtp.Port)
        {
            EnableSsl = true,
            DeliveryMethod = SmtpDeliveryMethod.Network,
        };

        if (!string.IsNullOrWhiteSpace(smtp.User))
        {
            client.UseDefaultCredentials = false;
            client.Credentials = new NetworkCredential(smtp.User, smtp.Password);
        }

        using var message = new MailMessage(smtp.From, recipient, subject, body) { IsBodyHtml = true };
        await client.SendMailAsync(message, cancellationToken);
#pragma warning restore SYSLIB0014
    }
}