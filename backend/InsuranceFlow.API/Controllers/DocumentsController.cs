using InsuranceFlow.API.DTOs;
using InsuranceFlow.API.Models;
using InsuranceFlow.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace InsuranceFlow.API.Controllers;

[ApiController]
[Route("api/v1/applications/{applicationId}/documents")]
[Produces("application/json")]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;
    private readonly ILogger<DocumentsController> _logger;

    public DocumentsController(
        IDocumentService documentService,
        ILogger<DocumentsController> logger)
    {
        _documentService = documentService;
        _logger = logger;
    }

    /// <summary>
    /// Upload a supporting document for an application.
    /// Accepted: PDF, JPEG, PNG, TIFF. Max 10MB.
    /// </summary>
    [HttpPost]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<DocumentUploadResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Upload(
        string applicationId,
        [FromForm] IFormFile file,
        [FromForm] DocumentType documentType = DocumentType.Other)
    {
        var result = await _documentService.UploadDocumentAsync(applicationId, file, documentType);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<DocumentUploadResponse>.Ok(result, "Document uploaded successfully."));
    }

    /// <summary>
    /// List all documents attached to an application, with presigned download URLs.
    /// URLs expire after 60 minutes.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<DocumentUploadResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> List(string applicationId)
    {
        var documents = await _documentService.GetDocumentsForApplicationAsync(applicationId);
        return Ok(ApiResponse<IEnumerable<DocumentUploadResponse>>.Ok(documents));
    }
}
