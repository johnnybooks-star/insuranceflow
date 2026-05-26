using InsuranceFlow.API.DTOs;
using InsuranceFlow.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace InsuranceFlow.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class ApplicationsController : ControllerBase
{
    private readonly IApplicationService _applicationService;
    private readonly ILogger<ApplicationsController> _logger;

    public ApplicationsController(
        IApplicationService applicationService,
        ILogger<ApplicationsController> logger)
    {
        _applicationService = applicationService;
        _logger = logger;
    }

    /// <summary>
    /// Submit a new insurance application.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ApplicationResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateApplicationRequest request)
    {
        var result = await _applicationService.CreateApplicationAsync(request);
        return CreatedAtAction(
            nameof(GetById),
            new { applicationId = result.ApplicationId },
            ApiResponse<ApplicationResponse>.Ok(result, "Application submitted successfully."));
    }

    /// <summary>
    /// Retrieve an application by its internal ID.
    /// </summary>
    [HttpGet("{applicationId}")]
    [ProducesResponseType(typeof(ApiResponse<ApplicationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(string applicationId)
    {
        var result = await _applicationService.GetApplicationAsync(applicationId);
        return Ok(ApiResponse<ApplicationResponse>.Ok(result));
    }

    /// <summary>
    /// Look up an application by reference number (e.g. IF-COM-20250101-1234).
    /// </summary>
    [HttpGet("reference/{referenceNumber}")]
    [ProducesResponseType(typeof(ApiResponse<ApplicationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByReference(string referenceNumber)
    {
        var result = await _applicationService.GetApplicationByReferenceAsync(referenceNumber);
        return Ok(ApiResponse<ApplicationResponse>.Ok(result));
    }

    /// <summary>
    /// List all applications (paginated, newest first).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<ApplicationListResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List([FromQuery] int limit = 50)
    {
        var result = await _applicationService.ListApplicationsAsync(limit);
        return Ok(ApiResponse<ApplicationListResponse>.Ok(result));
    }

    /// <summary>
    /// Update the status and assignment of an application.
    /// </summary>
    [HttpPatch("{applicationId}/status")]
    [ProducesResponseType(typeof(ApiResponse<ApplicationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(
        string applicationId,
        [FromBody] UpdateApplicationStatusRequest request)
    {
        var result = await _applicationService.UpdateStatusAsync(applicationId, request);
        return Ok(ApiResponse<ApplicationResponse>.Ok(result, "Application status updated."));
    }
}
