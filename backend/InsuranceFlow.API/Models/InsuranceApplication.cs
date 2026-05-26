namespace InsuranceFlow.API.Models;

public class InsuranceApplication
{
    public string ApplicationId { get; set; } = string.Empty;
    public string ReferenceNumber { get; set; } = string.Empty;
    public string ApplicantFirstName { get; set; } = string.Empty;
    public string ApplicantLastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string IdNumber { get; set; } = string.Empty;
    public string PolicyType { get; set; } = string.Empty;
    public decimal CoverAmount { get; set; }
    public string VehicleRegistration { get; set; } = string.Empty;
    public string VehicleMake { get; set; } = string.Empty;
    public string VehicleModel { get; set; } = string.Empty;
    public int VehicleYear { get; set; }
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Submitted;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public List<string> DocumentKeys { get; set; } = new();
    public string? AssignedAdvisorId { get; set; }
    public string? Notes { get; set; }
}

public enum ApplicationStatus
{
    Submitted,
    DocumentsRequired,
    UnderReview,
    Approved,
    Declined,
    Cancelled
}

public class ApplicationDocument
{
    public string DocumentId { get; set; } = string.Empty;
    public string ApplicationId { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string S3Key { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public DocumentType DocumentType { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}

public enum DocumentType
{
    IdDocument,
    DriversLicence,
    ProofOfAddress,
    VehicleLicenseDisk,
    VehicleRegistrationPaper,
    Other
}
