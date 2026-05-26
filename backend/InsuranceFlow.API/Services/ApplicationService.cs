using InsuranceFlow.API.DTOs;
using InsuranceFlow.API.Models;
using InsuranceFlow.API.Repositories;

namespace InsuranceFlow.API.Services;

public interface IApplicationService
{
    Task<ApplicationResponse> CreateApplicationAsync(CreateApplicationRequest request);
    Task<ApplicationResponse> GetApplicationAsync(string applicationId);
    Task<ApplicationResponse> GetApplicationByReferenceAsync(string referenceNumber);
    Task<ApplicationListResponse> ListApplicationsAsync(int limit = 50);
    Task<ApplicationResponse> UpdateStatusAsync(string applicationId, UpdateApplicationStatusRequest request);
}

public class ApplicationService : IApplicationService
{
    private readonly IApplicationRepository _repository;
    private readonly ILogger<ApplicationService> _logger;

    public ApplicationService(
        IApplicationRepository repository,
        ILogger<ApplicationService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<ApplicationResponse> CreateApplicationAsync(CreateApplicationRequest request)
    {
        var application = new InsuranceApplication
        {
            ApplicationId       = Guid.NewGuid().ToString(),
            ReferenceNumber     = GenerateReferenceNumber(request.PolicyType),
            ApplicantFirstName  = request.FirstName.Trim(),
            ApplicantLastName   = request.LastName.Trim(),
            Email               = request.Email.ToLowerInvariant().Trim(),
            PhoneNumber         = NormalisePhoneNumber(request.PhoneNumber),
            IdNumber            = request.IdNumber.Trim(),
            PolicyType          = request.PolicyType,
            CoverAmount         = request.CoverAmount,
            VehicleRegistration = request.VehicleRegistration.ToUpperInvariant().Trim(),
            VehicleMake         = request.VehicleMake.Trim(),
            VehicleModel        = request.VehicleModel.Trim(),
            VehicleYear         = request.VehicleYear,
            Status              = ApplicationStatus.Submitted,
            CreatedAt           = DateTime.UtcNow,
            UpdatedAt           = DateTime.UtcNow,
        };

        var created = await _repository.CreateAsync(application);
        _logger.LogInformation("Application created: {ReferenceNumber}", created.ReferenceNumber);

        return ApplicationResponse.FromModel(created);
    }

    public async Task<ApplicationResponse> GetApplicationAsync(string applicationId)
    {
        var application = await _repository.GetByIdAsync(applicationId)
            ?? throw new KeyNotFoundException($"Application '{applicationId}' not found.");

        return ApplicationResponse.FromModel(application);
    }

    public async Task<ApplicationResponse> GetApplicationByReferenceAsync(string referenceNumber)
    {
        var application = await _repository.GetByReferenceNumberAsync(referenceNumber.ToUpperInvariant())
            ?? throw new KeyNotFoundException($"Application with reference '{referenceNumber}' not found.");

        return ApplicationResponse.FromModel(application);
    }

    public async Task<ApplicationListResponse> ListApplicationsAsync(int limit = 50)
    {
        var applications = (await _repository.ListAllAsync(limit))
            .OrderByDescending(a => a.CreatedAt)
            .ToList();

        var summaries = applications.Select(a => new ApplicationSummary(
            a.ApplicationId,
            a.ReferenceNumber,
            $"{a.ApplicantFirstName} {a.ApplicantLastName}",
            a.PolicyType,
            a.CoverAmount,
            a.Status.ToString(),
            a.CreatedAt,
            a.DocumentKeys.Count
        ));

        return new ApplicationListResponse(applications.Count, summaries);
    }

    public async Task<ApplicationResponse> UpdateStatusAsync(
        string applicationId,
        UpdateApplicationStatusRequest request)
    {
        var application = await _repository.GetByIdAsync(applicationId)
            ?? throw new KeyNotFoundException($"Application '{applicationId}' not found.");

        if (!Enum.TryParse<ApplicationStatus>(request.Status, ignoreCase: true, out var newStatus))
            throw new ArgumentException($"Invalid status value: '{request.Status}'.");

        ValidateStatusTransition(application.Status, newStatus);

        application.Status             = newStatus;
        application.Notes              = request.Notes ?? application.Notes;
        application.AssignedAdvisorId  = request.AssignedAdvisorId ?? application.AssignedAdvisorId;

        var updated = await _repository.UpdateAsync(application);
        _logger.LogInformation("Application {ReferenceNumber} status updated to {Status}",
            updated.ReferenceNumber, updated.Status);

        return ApplicationResponse.FromModel(updated);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private static string GenerateReferenceNumber(string policyType)
    {
        var prefix = policyType.ToUpperInvariant() switch
        {
            "COMPREHENSIVE"     => "COM",
            "THIRDPARTY"        => "TPI",
            "THIRDPARTYFIRE"    => "TPF",
            _                   => "POL"
        };
        var datePart   = DateTime.UtcNow.ToString("yyyyMMdd");
        var randomPart = Random.Shared.Next(1000, 9999).ToString();
        return $"IF-{prefix}-{datePart}-{randomPart}";
    }

    private static string NormalisePhoneNumber(string phone)
    {
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.StartsWith("0") && digits.Length == 10)
            return $"+27{digits[1..]}";
        if (digits.StartsWith("27") && digits.Length == 11)
            return $"+{digits}";
        return phone.Trim();
    }

    private static void ValidateStatusTransition(ApplicationStatus current, ApplicationStatus next)
    {
        var allowed = current switch
        {
            ApplicationStatus.Submitted          => new[] { ApplicationStatus.DocumentsRequired, ApplicationStatus.UnderReview, ApplicationStatus.Cancelled },
            ApplicationStatus.DocumentsRequired  => new[] { ApplicationStatus.UnderReview, ApplicationStatus.Cancelled },
            ApplicationStatus.UnderReview        => new[] { ApplicationStatus.Approved, ApplicationStatus.Declined, ApplicationStatus.DocumentsRequired },
            ApplicationStatus.Approved           => new[] { ApplicationStatus.Cancelled },
            ApplicationStatus.Declined           => Array.Empty<ApplicationStatus>(),
            ApplicationStatus.Cancelled          => Array.Empty<ApplicationStatus>(),
            _ => Array.Empty<ApplicationStatus>()
        };

        if (!allowed.Contains(next))
            throw new InvalidOperationException(
                $"Cannot transition from '{current}' to '{next}'. Allowed transitions: {string.Join(", ", allowed)}.");
    }
}
