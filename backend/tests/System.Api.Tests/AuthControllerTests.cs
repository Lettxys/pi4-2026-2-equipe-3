using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Api.Controllers;
using System.Api.DTO.Auth;
using System.Api.DTO.Common;
using System.Api.Interfaces;
using System.Api.Models.Enums;
using System.Security.Claims;

namespace System.Api.Tests;

public sealed class AuthControllerTests
{
    private const long TestUserId = 1;
    private const string TestJti = "test-jti-123";

    private static (AuthController Controller, FakeAuthService Service) CreateController(
        long userId = TestUserId,
        string? jti = TestJti,
        DateTime? expiresAt = null)
    {
        var service = new FakeAuthService();
        var currentUser = new FakeCurrentUser(userId, jti, expiresAt ?? DateTime.UtcNow.AddHours(1));
        var controller = new AuthController(service, currentUser);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext(),
        };
        return (controller, service);
    }

    private static AuthSession BuildSession(long userId = TestUserId) =>
        new(
            new LoginResponse(
                "Bearer",
                "access-token",
                3600,
                userId,
                "João da Silva",
                "joao@example.com",
                TipoPerfil.PCD_DRIVER,
                1L),
            "refresh-token-value",
            DateTime.UtcNow.AddDays(7));

    [Fact]
    public async Task Register_ReturnsCreated_WithUserInfoAndCorrectLocation()
    {
        var (controller, service) = CreateController();
        var request = new RegisterRequest
        {
            FullName = "João da Silva",
            Cpf = "52998224725",
            Email = "joao@example.com",
            Phone = "88999999999",
            Password = "Senha@123",
        };
        var expected = new RegisterResponse(1, "João da Silva", "joao@example.com", DateTime.UtcNow);
        service.RegisterResponseToReturn = expected;

        var actionResult = await controller.Register(request, CancellationToken.None);

        var created = Assert.IsType<CreatedResult>(actionResult.Result);
        Assert.Equal("/api/auth/me", created.Location);
        Assert.Same(expected, created.Value);
        Assert.Same(request, service.LastRegisterRequest);
    }

    [Fact]
    public async Task Login_ReturnsOk_WithLoginResponseAndSetsRefreshCookie()
    {
        var (controller, service) = CreateController();
        var request = new LoginRequest { Email = "joao@example.com", Password = "Senha@123" };
        var session = BuildSession();
        service.SessionToReturn = session;

        var actionResult = await controller.Login(request, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(actionResult.Result);
        Assert.Same(session.Response, ok.Value);
        Assert.Same(request, service.LastLoginRequest);

        Assert.True(controller.Response.Headers.ContainsKey("Set-Cookie"));
    }

    [Fact]
    public async Task Refresh_ReturnsOk_WhenRefreshCookiePresent()
    {
        var (controller, service) = CreateController();
        controller.ControllerContext.HttpContext.Request.Headers.Cookie = "refreshToken=valid-refresh-token";
        var session = BuildSession();
        service.SessionToReturn = session;

        var actionResult = await controller.Refresh(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(actionResult.Result);
        Assert.Same(session.Response, ok.Value);
        Assert.Equal("valid-refresh-token", service.LastRefreshToken);
    }

    [Fact]
    public async Task Refresh_ThrowsValidation_WhenCookieAbsent()
    {
        var (controller, _) = CreateController();

        await Assert.ThrowsAsync<AppException>(() => controller.Refresh(CancellationToken.None));
    }

    [Fact]
    public async Task Refresh_ThrowsValidation_WhenCookieEmpty()
    {
        var (controller, _) = CreateController();
        controller.ControllerContext.HttpContext.Request.Headers.Cookie = "refreshToken=";

        await Assert.ThrowsAsync<AppException>(() => controller.Refresh(CancellationToken.None));
    }

    [Fact]
    public async Task VerifyCode_ReturnsOk_WithResetToken()
    {
        var (controller, service) = CreateController();
        var request = new VerifyCodeRequest { Email = "joao@example.com", Code = "123456" };
        var expected = new VerifyCodeResponse("reset-token-abc");
        service.VerifyCodeResponseToReturn = expected;

        var actionResult = await controller.VerifyCode(request, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(actionResult.Result);
        Assert.Same(expected, ok.Value);
    }

    [Fact]
    public async Task Me_ReturnsOk_WithCurrentUserProfile()
    {
        var (controller, service) = CreateController(userId: 42);
        var expected = new MeResponse(42, "João da Silva", "529.982.247-25", "joao@example.com", TipoPerfil.PCD_DRIVER, 1L);
        service.MeResponseToReturn = expected;

        var actionResult = await controller.Me(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(actionResult.Result);
        Assert.Same(expected, ok.Value);
        Assert.Equal(42, service.LastMeUserId);
    }

    [Fact]
    public async Task ForgotPassword_ReturnsOk_WithGenericMessage()
    {
        var (controller, service) = CreateController();
        var request = new ForgotPasswordRequest { Email = "joao@example.com" };

        var actionResult = await controller.ForgotPassword(request, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<MessageResponse>(ok.Value);
        Assert.Equal("Se o e-mail estiver cadastrado, você vai receber as instruções para redefinir a senha.", response.Message);
        Assert.True(service.SendResetCodeCalled);
    }

    [Fact]
    public async Task ResetPassword_ReturnsOk_WithSuccessMessage()
    {
        var (controller, service) = CreateController();
        var request = new ResetPasswordRequest { Token = "token-abc", NewPassword = "NovaSenha@1" };

        var actionResult = await controller.ResetPassword(request, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<MessageResponse>(ok.Value);
        Assert.Equal(
            "Senha redefinida com sucesso. Você já pode realizar o login com a nova senha.",
            response.Message);
        Assert.True(service.ResetPasswordCalled);
    }

    [Fact]
    public async Task ChangePassword_ReturnsOk_WithSuccessMessage()
    {
        var (controller, service) = CreateController(userId: 7);
        var request = new ChangePasswordRequest { CurrentPassword = "Velha@123", NewPassword = "Nova@1234" };

        var actionResult = await controller.ChangePassword(request, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<MessageResponse>(ok.Value);
        Assert.Equal("Senha alterada com sucesso.", response.Message);
        Assert.Equal(7, service.LastChangePasswordUserId);
        Assert.Same(request, service.LastChangePasswordRequest);
    }

    [Fact]
    public async Task Logout_ReturnsOk_WithSuccessMessageAndDeletesCookie()
    {
        var (controller, service) = CreateController(jti: TestJti);

        var actionResult = await controller.Logout(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<MessageResponse>(ok.Value);
        Assert.Equal("Sessão encerrada com sucesso.", response.Message);
        Assert.Equal(TestJti, service.LastEndSessionJti);
    }

    [Fact]
    public async Task Logout_ThrowsInvalidOperation_WhenJtiIsNull()
    {
        var (controller, _) = CreateController(jti: null);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            controller.Logout(CancellationToken.None));
    }

    private sealed class FakeCurrentUser(long userId, string? jti, DateTime expiresAt) : ICurrentUser
    {
        public ClaimsPrincipal Principal => new(new ClaimsIdentity());
        public long Id => userId;
        public string? Email => "joao@example.com";
        public string? Name => "João da Silva";
        public string? Jti => jti;
        public DateTime? IssuedAt => DateTime.UtcNow;
        public DateTime? ExpiresAt => expiresAt;
        public bool IsAdministrator => false;
    }

    private sealed class FakeAuthService : IAuthService
    {
        public RegisterRequest? LastRegisterRequest { get; private set; }
        public LoginRequest? LastLoginRequest { get; private set; }
        public string? LastRefreshToken { get; private set; }
        public long LastMeUserId { get; private set; }
        public bool SendResetCodeCalled { get; private set; }
        public bool ResetPasswordCalled { get; private set; }
        public long LastChangePasswordUserId { get; private set; }
        public ChangePasswordRequest? LastChangePasswordRequest { get; private set; }
        public string? LastEndSessionJti { get; private set; }

        public RegisterResponse? RegisterResponseToReturn { get; set; }
        public AuthSession? SessionToReturn { get; set; }
        public VerifyCodeResponse? VerifyCodeResponseToReturn { get; set; }
        public MeResponse? MeResponseToReturn { get; set; }

        public Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken ct)
        {
            LastRegisterRequest = request;
            return Task.FromResult(RegisterResponseToReturn!);
        }

        public Task<AuthSession> LoginAsync(LoginRequest request, CancellationToken ct)
        {
            LastLoginRequest = request;
            return Task.FromResult(SessionToReturn!);
        }

        public Task<AuthSession> RefreshAsync(string refreshToken, CancellationToken ct)
        {
            LastRefreshToken = refreshToken;
            return Task.FromResult(SessionToReturn!);
        }

        public Task<VerifyCodeResponse> VerifyCodeAsync(VerifyCodeRequest request, CancellationToken ct)
            => Task.FromResult(VerifyCodeResponseToReturn!);

        public Task<MeResponse> MeAsync(long userId, CancellationToken ct)
        {
            LastMeUserId = userId;
            return Task.FromResult(MeResponseToReturn!);
        }

        public Task SendResetCodeAsync(ForgotPasswordRequest request, CancellationToken ct)
        {
            SendResetCodeCalled = true;
            return Task.CompletedTask;
        }

        public Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct)
        {
            ResetPasswordCalled = true;
            return Task.CompletedTask;
        }

        public Task ChangePasswordAsync(long userId, ChangePasswordRequest request, CancellationToken ct)
        {
            LastChangePasswordUserId = userId;
            LastChangePasswordRequest = request;
            return Task.CompletedTask;
        }

        public Task EndSessionAsync(string jti, DateTime expiresAt, string? refreshToken, CancellationToken ct)
        {
            LastEndSessionJti = jti;
            return Task.CompletedTask;
        }

        public Task AnonymizeAccountAsync(long targetUserId, CancellationToken ct)
            => Task.CompletedTask;
    }
}

