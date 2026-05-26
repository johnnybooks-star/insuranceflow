using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using InsuranceFlow.API.Models;
using System.Text.Json;

namespace InsuranceFlow.API.Repositories;

public interface IApplicationRepository
{
    Task<InsuranceApplication> CreateAsync(InsuranceApplication application);
    Task<InsuranceApplication?> GetByIdAsync(string applicationId);
    Task<InsuranceApplication?> GetByReferenceNumberAsync(string referenceNumber);
    Task<IEnumerable<InsuranceApplication>> ListAllAsync(int limit = 50);
    Task<InsuranceApplication> UpdateAsync(InsuranceApplication application);
    Task AddDocumentKeyAsync(string applicationId, string s3Key);
}

public class DynamoDbApplicationRepository : IApplicationRepository
{
    private readonly IAmazonDynamoDB _dynamoDb;
    private readonly string _tableName;
    private readonly ILogger<DynamoDbApplicationRepository> _logger;

    public DynamoDbApplicationRepository(
        IAmazonDynamoDB dynamoDb,
        IConfiguration configuration,
        ILogger<DynamoDbApplicationRepository> logger)
    {
        _dynamoDb = dynamoDb;
        _tableName = configuration["AWS:DynamoDB:TableName"] ?? "InsuranceFlowApplications";
        _logger = logger;
    }

    public async Task<InsuranceApplication> CreateAsync(InsuranceApplication application)
    {
        var item = MapToAttributes(application);

        var request = new PutItemRequest
        {
            TableName = _tableName,
            Item = item,
            ConditionExpression = "attribute_not_exists(ApplicationId)"
        };

        await _dynamoDb.PutItemAsync(request);
        _logger.LogInformation("Created application {ApplicationId} with reference {ReferenceNumber}",
            application.ApplicationId, application.ReferenceNumber);

        return application;
    }

    public async Task<InsuranceApplication?> GetByIdAsync(string applicationId)
    {
        var request = new GetItemRequest
        {
            TableName = _tableName,
            Key = new Dictionary<string, AttributeValue>
            {
                ["ApplicationId"] = new AttributeValue { S = applicationId }
            }
        };

        var response = await _dynamoDb.GetItemAsync(request);

        if (!response.IsItemSet)
            return null;

        return MapFromAttributes(response.Item);
    }

    public async Task<InsuranceApplication?> GetByReferenceNumberAsync(string referenceNumber)
    {
        var request = new QueryRequest
        {
            TableName = _tableName,
            IndexName = "ReferenceNumber-Index",
            KeyConditionExpression = "ReferenceNumber = :refNum",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":refNum"] = new AttributeValue { S = referenceNumber }
            }
        };

        var response = await _dynamoDb.QueryAsync(request);
        var item = response.Items.FirstOrDefault();

        return item != null ? MapFromAttributes(item) : null;
    }

    public async Task<IEnumerable<InsuranceApplication>> ListAllAsync(int limit = 50)
    {
        var request = new ScanRequest
        {
            TableName = _tableName,
            Limit = limit
        };

        var response = await _dynamoDb.ScanAsync(request);
        return response.Items.Select(MapFromAttributes);
    }

    public async Task<InsuranceApplication> UpdateAsync(InsuranceApplication application)
    {
        application.UpdatedAt = DateTime.UtcNow;

        var request = new UpdateItemRequest
        {
            TableName = _tableName,
            Key = new Dictionary<string, AttributeValue>
            {
                ["ApplicationId"] = new AttributeValue { S = application.ApplicationId }
            },
            UpdateExpression = "SET #status = :status, UpdatedAt = :updatedAt, Notes = :notes, AssignedAdvisorId = :advisorId",
            ExpressionAttributeNames = new Dictionary<string, string>
            {
                ["#status"] = "Status"
            },
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":status"]     = new AttributeValue { S = application.Status.ToString() },
                [":updatedAt"]  = new AttributeValue { S = application.UpdatedAt.ToString("O") },
                [":notes"]      = new AttributeValue { S = application.Notes ?? "" },
                [":advisorId"]  = new AttributeValue { S = application.AssignedAdvisorId ?? "" }
            },
            ReturnValues = ReturnValue.ALL_NEW
        };

        await _dynamoDb.UpdateItemAsync(request);
        _logger.LogInformation("Updated application {ApplicationId} status to {Status}",
            application.ApplicationId, application.Status);

        return application;
    }

    public async Task AddDocumentKeyAsync(string applicationId, string s3Key)
    {
        var request = new UpdateItemRequest
        {
            TableName = _tableName,
            Key = new Dictionary<string, AttributeValue>
            {
                ["ApplicationId"] = new AttributeValue { S = applicationId }
            },
            UpdateExpression = "SET DocumentKeys = list_append(if_not_exists(DocumentKeys, :empty), :newKey), UpdatedAt = :updatedAt",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":newKey"]    = new AttributeValue { L = new List<AttributeValue> { new AttributeValue { S = s3Key } } },
                [":empty"]     = new AttributeValue { L = new List<AttributeValue>() },
                [":updatedAt"] = new AttributeValue { S = DateTime.UtcNow.ToString("O") }
            }
        };

        await _dynamoDb.UpdateItemAsync(request);
    }

    // ── Mapping helpers ─────────────────────────────────────────────────────

    private static Dictionary<string, AttributeValue> MapToAttributes(InsuranceApplication app) =>
        new()
        {
            ["ApplicationId"]        = new AttributeValue { S = app.ApplicationId },
            ["ReferenceNumber"]      = new AttributeValue { S = app.ReferenceNumber },
            ["ApplicantFirstName"]   = new AttributeValue { S = app.ApplicantFirstName },
            ["ApplicantLastName"]    = new AttributeValue { S = app.ApplicantLastName },
            ["Email"]                = new AttributeValue { S = app.Email },
            ["PhoneNumber"]          = new AttributeValue { S = app.PhoneNumber },
            ["IdNumber"]             = new AttributeValue { S = app.IdNumber },
            ["PolicyType"]           = new AttributeValue { S = app.PolicyType },
            ["CoverAmount"]          = new AttributeValue { N = app.CoverAmount.ToString() },
            ["VehicleRegistration"]  = new AttributeValue { S = app.VehicleRegistration },
            ["VehicleMake"]          = new AttributeValue { S = app.VehicleMake },
            ["VehicleModel"]         = new AttributeValue { S = app.VehicleModel },
            ["VehicleYear"]          = new AttributeValue { N = app.VehicleYear.ToString() },
            ["Status"]               = new AttributeValue { S = app.Status.ToString() },
            ["CreatedAt"]            = new AttributeValue { S = app.CreatedAt.ToString("O") },
            ["UpdatedAt"]            = new AttributeValue { S = app.UpdatedAt.ToString("O") },
            ["DocumentKeys"]         = new AttributeValue { L = app.DocumentKeys.Select(k => new AttributeValue { S = k }).ToList() },
            ["AssignedAdvisorId"]    = new AttributeValue { S = app.AssignedAdvisorId ?? "" },
            ["Notes"]                = new AttributeValue { S = app.Notes ?? "" }
        };

    private static InsuranceApplication MapFromAttributes(Dictionary<string, AttributeValue> item) =>
        new()
        {
            ApplicationId       = item.GetValueOrDefault("ApplicationId")?.S ?? "",
            ReferenceNumber     = item.GetValueOrDefault("ReferenceNumber")?.S ?? "",
            ApplicantFirstName  = item.GetValueOrDefault("ApplicantFirstName")?.S ?? "",
            ApplicantLastName   = item.GetValueOrDefault("ApplicantLastName")?.S ?? "",
            Email               = item.GetValueOrDefault("Email")?.S ?? "",
            PhoneNumber         = item.GetValueOrDefault("PhoneNumber")?.S ?? "",
            IdNumber            = item.GetValueOrDefault("IdNumber")?.S ?? "",
            PolicyType          = item.GetValueOrDefault("PolicyType")?.S ?? "",
            CoverAmount         = decimal.Parse(item.GetValueOrDefault("CoverAmount")?.N ?? "0"),
            VehicleRegistration = item.GetValueOrDefault("VehicleRegistration")?.S ?? "",
            VehicleMake         = item.GetValueOrDefault("VehicleMake")?.S ?? "",
            VehicleModel        = item.GetValueOrDefault("VehicleModel")?.S ?? "",
            VehicleYear         = int.Parse(item.GetValueOrDefault("VehicleYear")?.N ?? "0"),
            Status              = Enum.Parse<ApplicationStatus>(item.GetValueOrDefault("Status")?.S ?? "Submitted"),
            CreatedAt           = DateTime.Parse(item.GetValueOrDefault("CreatedAt")?.S ?? DateTime.UtcNow.ToString("O")),
            UpdatedAt           = DateTime.Parse(item.GetValueOrDefault("UpdatedAt")?.S ?? DateTime.UtcNow.ToString("O")),
            DocumentKeys        = item.GetValueOrDefault("DocumentKeys")?.L?.Select(v => v.S).ToList() ?? new(),
            AssignedAdvisorId   = item.GetValueOrDefault("AssignedAdvisorId")?.S,
            Notes               = item.GetValueOrDefault("Notes")?.S
        };
}
