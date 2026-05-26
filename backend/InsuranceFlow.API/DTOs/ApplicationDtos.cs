using InsuranceFlow.API.Models;

namespace InsuranceFlow.API.DTOs;

// ── Request DTOs ─────────────────────────────────────────────────────────────

public record CreateApplicationRequest(
    string FirstName,
    string LastName,
    string Email,
    string PhoneNumber,
    string IdNumber,
    string PolicyType,
    decimal CoverAmount,
    string VehicleRegistration,
    string VehicleMake,
    string VehicleModel,
    int VehicleYear
);

public record UpdateApplicationStatusRequest(
    string Status,
    string? Notes,
    string? AssignedAdvisorId
);

// ── Response DTOs ────────────────────────────────────────────────────────────

public record ApplicationResponse(
    string ApplicationId,
    string ReferenceNumber,
    string ApplicantName,
    string Email,
    string PhoneNumber,
    string PolicyType,
    decimal CoverAmount,
    string VehicleDescription,
    string Status,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int DocumentCount,
    string? Notes
)
{
    public static ApplicationResponse FromModel(InsuranceApplication app) => new(
        app.ApplicationId,
        app.ReferenceNumber,
        $"{app.ApplicantFirstName} {app.ApplicantLastName}",
        app.Email,
        app.PhoneNumber,
        app.PolicyType,
        app.CoverAmount,
        $"{app.VehicleYear} {app.VehicleMake} {app.VehicleModel} ({app.VehicleRegistration})",
        app.Status.ToString(),
        app.CreatedAt,
        app.UpdatedAt,
        app.DocumentKeys.Count,
        app.Notes
    );
}

public record DocumentUploadResponse(
    string DocumentId,
    string FileName,
    string DocumentType,
    long FileSizeBytes,
    DateTime UploadedAt,
    string PresignedDownloadUrl
);

public record ApplicationListResponse(
    int TotalCount,
    IEnumerable<ApplicationSummary> Applications
);

public record ApplicationSummary(
    string ApplicationId,
    string ReferenceNumber,
    string ApplicantName,
    string PolicyType,
    decimal CoverAmount,
    string Status,
    DateTime CreatedAt,
    int DocumentCount
);

public record ApiResponse<T>(
    bool Success,
    string Message,
    T? Data,
    IEnumerable<string>? Errors = null
)
{
    public static ApiResponse<T> Ok(T data, string message = "Success") =>
        new(true, message, data);

    public static ApiResponse<T> Fail(string message, IEnumerable<string>? errors = null) =>
        new(false, message, default, errors);
}
