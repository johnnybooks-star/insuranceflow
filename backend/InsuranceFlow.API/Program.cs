using Amazon.DynamoDBv2;
using Amazon.S3;
using InsuranceFlow.API.Middleware;
using InsuranceFlow.API.Repositories;
using InsuranceFlow.API.Services;
using Serilog;
using Serilog.Events;

// ── Bootstrap logger ──────────────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

try
{
    Log.Information("Starting InsuranceFlow API");

    var builder = WebApplication.CreateBuilder(args);

    // ── Serilog ───────────────────────────────────────────────────────────────
    builder.Host.UseSerilog();

    // ── AWS ───────────────────────────────────────────────────────────────────
    builder.Services.AddDefaultAWSOptions(builder.Configuration.GetAWSOptions());
    builder.Services.AddAWSService<IAmazonDynamoDB>();
    builder.Services.AddAWSService<IAmazonS3>();

    // ── Application services ──────────────────────────────────────────────────
    builder.Services.AddScoped<IApplicationRepository, DynamoDbApplicationRepository>();
    builder.Services.AddScoped<IApplicationService, ApplicationService>();
    builder.Services.AddScoped<IDocumentService, S3DocumentService>();

    // ── API ───────────────────────────────────────────────────────────────────
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new()
        {
            Title       = "InsuranceFlow API",
            Version     = "v1",
            Description = "REST API for short-term insurance application intake and document management. " +
                          "Automates the manual multi-step application workflow for insurance advisors."
        });
        c.EnableAnnotations();
    });

    // ── CORS (for React frontend) ─────────────────────────────────────────────
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("ReactApp", policy =>
        {
            var origins = builder.Configuration
                .GetSection("AllowedOrigins")
                .Get<string[]>() ?? new[] { "http://localhost:5173" };

            policy.WithOrigins(origins)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
    });

    // ── Health check ──────────────────────────────────────────────────────────
    builder.Services.AddHealthChecks();

    var app = builder.Build();

    // ── Middleware pipeline ───────────────────────────────────────────────────
    app.UseMiddleware<GlobalExceptionMiddleware>();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "InsuranceFlow API v1");
            c.RoutePrefix = string.Empty; // Swagger at root
        });
    }

    app.UseCors("ReactApp");
    app.MapControllers();
    app.MapHealthChecks("/health");

    Log.Information("InsuranceFlow API listening on {Urls}", string.Join(", ", app.Urls));
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application startup failed");
    return 1;
}
finally
{
    Log.CloseAndFlush();
}

return 0;
