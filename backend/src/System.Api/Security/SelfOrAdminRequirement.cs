using Microsoft.AspNetCore.Authorization;
using System.Api.Interfaces;

namespace System.Api.Security;

public static class Policies
{
    public const string SelfOrAdmin = "SelfOrAdmin";
}

public sealed class SelfOrAdminRequirement : IAuthorizationRequirement;

public sealed class SelfOrAdminHandler(ICurrentUser currentUser)
    : AuthorizationHandler<SelfOrAdminRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        SelfOrAdminRequirement requirement)
    {
        if (currentUser.IsAdministrator)
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        if (context.Resource is HttpContext httpContext
            && httpContext.Request.RouteValues.TryGetValue("userId", out var value)
            && long.TryParse(value?.ToString(), out var userId)
            && userId == currentUser.Id)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
