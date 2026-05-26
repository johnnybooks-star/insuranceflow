using Amazon.S3;
using Amazon.S3.Model;
using InsuranceFlow.API.DTOs;
using InsuranceFlow.API.Models;
using InsuranceFlow.API.Repositories;

namespace InsuranceFlow.API.Services;

public interface IDocumentService
{
    Task<DocumentUploadResponse> UploadDocumentAsync(
        string applicationId,
        IFormFile file,
        DocumentType documentType);

    Task<string> GeneratePresignedDownloadUrlAsync(string s3Key, int expiryMinutes = 60);
    Task<IEnumerable<DocumentUploadResponse>> GetDocumentsForApplicationAsync(string applicationId);
}

public class S3DocumentService : IDocumentService
{
    private readonly IAmazonS3 _s3;
    private readonly IApplicationRepository _repository;
    private readonly ILogger<S3DocumentService> _logger;
    private readonly string _bucketName;
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10MB

    private static readonly HashSet<string> AllowedContentTypes = new()
    {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/tiff"
    };

    public S3DocumentService(
        IAmazonS3 s3,
        IApplicationRepository repository,
        IConfiguration configuration,
        ILogger<S3DocumentService> logger)
    {
        _s3 = s3;
        _repository = repository;
        _logger = logger;
        _bucketName = configuration["AWS:S3:BucketName"] ?? "insuranceflow-documents";
    }

    public async Task<DocumentUploadResponse> UploadDocumentAsync(
        string applicationId,
        IFormFile file,
        DocumentType documentType)
    {
        ValidateFile(file);

        var application = await _repository.GetByIdAsync(applicationId)
            ?? throw new KeyNotFoundException($"Application {applicationId} not found.");

        var documentId = Guid.NewGuid().ToString();
        var extension  = Path.GetExtension(file.FileName);
        var s3Key      = $"applications/{applicationId}/{documentType}/{documentId}{extension}";

        using var stream = file.OpenReadStream();

        var uploadRequest = new PutObjectRequest
        {
            BucketName  = _bucketName,
            Key         = s3Key,
            InputStream = stream,
            ContentType = file.ContentType,
            Metadata    =
            {
                ["application-id"]  = applicationId,
                ["document-type"]   = documentType.ToString(),
                ["original-name"]   = file.FileName,
                ["uploaded-by"]     = "InsuranceFlow.API"
            }
        };

        await _s3.PutObjectAsync(uploadRequest);
        await _repository.AddDocumentKeyAsync(applicationId, s3Key);

        _logger.LogInformation(
            "Uploaded document {DocumentId} ({DocumentType}) for application {ApplicationId}, S3 key: {S3Key}",
            documentId, documentType, applicationId, s3Key);

        var downloadUrl = await GeneratePresignedDownloadUrlAsync(s3Key);

        return new DocumentUploadResponse(
            documentId,
            file.FileName,
            documentType.ToString(),
            file.Length,
            DateTime.UtcNow,
            downloadUrl
        );
    }

    public async Task<string> GeneratePresignedDownloadUrlAsync(string s3Key, int expiryMinutes = 60)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key        = s3Key,
            Expires    = DateTime.UtcNow.AddMinutes(expiryMinutes),
            Verb       = HttpVerb.GET
        };

        return await Task.FromResult(_s3.GetPreSignedURL(request));
    }

    public async Task<IEnumerable<DocumentUploadResponse>> GetDocumentsForApplicationAsync(string applicationId)
    {
        var application = await _repository.GetByIdAsync(applicationId)
            ?? throw new KeyNotFoundException($"Application {applicationId} not found.");

        var responses = new List<DocumentUploadResponse>();

        foreach (var key in application.DocumentKeys)
        {
            try
            {
                var metadata = await _s3.GetObjectMetadataAsync(_bucketName, key);
                var downloadUrl = await GeneratePresignedDownloadUrlAsync(key);

                responses.Add(new DocumentUploadResponse(
                    Guid.NewGuid().ToString(),
                    metadata.Metadata["x-amz-meta-original-name"] ?? Path.GetFileName(key),
                    metadata.Metadata["x-amz-meta-document-type"] ?? "Other",
                    metadata.ContentLength,
                    metadata.LastModified,
                    downloadUrl
                ));
            }
            catch (AmazonS3Exception ex)
            {
                _logger.LogWarning("Could not retrieve metadata for S3 key {Key}: {Message}", key, ex.Message);
            }
        }

        return responses;
    }

    private static void ValidateFile(IFormFile file)
    {
        if (file.Length == 0)
            throw new ArgumentException("File is empty.");

        if (file.Length > MaxFileSizeBytes)
            throw new ArgumentException($"File size exceeds the 10MB limit. Actual size: {file.Length / 1024 / 1024}MB.");

        if (!AllowedContentTypes.Contains(file.ContentType))
            throw new ArgumentException($"File type '{file.ContentType}' is not allowed. Accepted types: PDF, JPEG, PNG, TIFF.");
    }
}
