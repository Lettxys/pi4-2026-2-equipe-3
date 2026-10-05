using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Microsoft.Extensions.Options;
using Npgsql;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Api.Configuration;
using System.Api.Data;
using System.Api.DTO.Common;
using System.Api.Interfaces;
using System.Api.Middlewares;
using System.Api.Security;
using System.Api.Services;

DotNetEnv.Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

var appOptions = AppOptions.Load(builder.Configuration);

var connectionString = new NpgsqlConnectionStringBuilder
{
    Host = builder.Configuration["POSTGRES_HOST"] ?? "localhost",
    Port = builder.Configuration.GetValue("POSTGRES_PORT", 5432),
    Database = builder.Configuration["POSTGRES_DB"],
    Username = builder.Configuration["POSTGRES_USER"],
    Password = builder.Configuration["POSTGRES_PASSWORD"],
}.ConnectionString;

builder.Services.AddSingleton(Options.Create(appOptions));

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString).UseSnakeCaseNamingConvention());

builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();
builder.Services.AddScoped<ITokenValidator, TokenValidationService>();
builder.Services.AddScoped<IEmailSender, EmailSender>();
builder.Services.AddScoped<IStorage, Storage>();
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddScoped<IAuthorizationHandler, SelfOrAdminHandler>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = appOptions.Jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = appOptions.Jwt.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(appOptions.Jwt.Secret)),
            ClockSkew = TimeSpan.Zero,
            NameClaimType = JwtRegisteredClaimNames.UniqueName,
            RoleClaimType = JwtClaimNames.Role,
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var validator = context.HttpContext.RequestServices.GetRequiredService<ITokenValidator>();

                if (!await validator.ValidateAsync(context.Principal!, context.HttpContext.RequestAborted))
                {
                    context.Fail("Token revogado, expirado ou de conta inexistente.");
                }
            },
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(Policies.SelfOrAdmin, policy =>
        policy.RequireAuthenticatedUser().AddRequirements(new SelfOrAdminRequirement()));
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(appOptions.Cors.AllowedOrigins.ToArray())
            .AllowAnyHeader()
            .AllowAnyMethod()));

builder.Services.AddControllers()
    .AddJsonOptions(options => ApiJson.Apply(options.JsonSerializerOptions));

builder.Services.Configure<ApiBehaviorOptions>(options =>
    options.InvalidModelStateResponseFactory = context =>
    {
        var details = context.ModelState
            .Where(entry => entry.Value?.Errors.Count > 0)
            .SelectMany(entry => entry.Value!.Errors.Select(error => new ApiErrorDetail(
                FieldName(entry.Key),
                string.IsNullOrWhiteSpace(error.ErrorMessage) ? "Valor inválido." : error.ErrorMessage)))
            .ToArray();

        var response = ApiErrorResponse.Create(
            StatusCodes.Status400BadRequest,
            ErrorCodes.Validation,
            "Dados inválidos.",
            details);

        return new BadRequestObjectResult(response)
        {
            ContentTypes = { "application/json" },
        };
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "API para sistema de isenção veicular para pessoas com deficiência - v1",
        Version = "v1",
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Informe apenas o token JWT.",
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document, null!)] = [],
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseStatusCodePages(ExceptionHandlingMiddleware.WriteDefaultAsync);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.DocumentTitle = "API para sistema de isenção veicular para pessoas com deficiência - v1";
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "API PI-IV (v1)");
        options.RoutePrefix = "docs";
    });
}

app.UseCors();

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();

static string? FieldName(string key) =>
    key.StartsWith('$') ? key : JsonNamingPolicy.CamelCase.ConvertName(key);
