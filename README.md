# InsuranceFlow API

Short-term insurance application intake and automation API built with .NET 8, AWS DynamoDB, AWS S3, and React 18.

Automates the manual multi-step workflow for insurance application submission, document collection, and status tracking - eliminating human-in-the-loop data handling for advisors.

## Stack

| Layer | Technology |
|---|---|
| Backend API | .NET 8 / C# / ASP.NET Core |
| Database | AWS DynamoDB |
| Document Storage | AWS S3 (presigned URLs) |
| Frontend | React 18 / Vite / Tailwind CSS |
| Containerisation | Docker (multi-stage, non-root) |
| Hosting | EC2 t2.micro + S3 static website |

## Project Structure

```
insuranceflow/
  backend/
    InsuranceFlow.API/
      Controllers/          # REST endpoints - applications + documents
      Services/             # Business logic, state machine, S3 document service
      Repositories/         # DynamoDB data layer with interface abstraction
      Models/               # Domain models and enums
      DTOs/                 # Request/response DTOs, ApiResponse<T> wrapper
      Middleware/           # Global exception handling + HTTP status mapping
      Program.cs            # Startup, DI registration, CORS, Swagger
      Dockerfile            # Multi-stage build, non-root user, health check
  frontend/
    src/
      components/           # ApplicationForm, List, Status, DocumentUpload
      App.jsx               # Navigation and view routing
      api.js                # Typed API client
    index.html
    package.json
    vite.config.js
  infrastructure/
    setup-aws.sh            # One-run script: creates DynamoDB table + S3 bucket
  docs/
    InsuranceFlow_Documentation.docx  # Full technical docs + AWS deployment guide
```

## Quick Start - Frontend (no backend required)

Run the UI immediately without any AWS setup:

```bash
cd frontend
npm install
npx vite
```

Open **http://localhost:5173** in Chrome.

- **New Application** - full form works without backend
- **Track Application** - search works without backend  
- **All Applications** - requires backend + AWS (shows connection error without it)
- **Document Upload** - requires backend + AWS S3

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/v1/applications | Submit a new application |
| GET | /api/v1/applications | List all applications |
| GET | /api/v1/applications/{id} | Get application by ID |
| GET | /api/v1/applications/reference/{ref} | Track by reference number |
| PATCH | /api/v1/applications/{id}/status | Update application status |
| POST | /api/v1/applications/{id}/documents | Upload a document |
| GET | /api/v1/applications/{id}/documents | List documents with presigned URLs |

## Full Backend + AWS Setup

```bash
# 1. Create AWS infrastructure (Free Tier)
cd infrastructure
chmod +x setup-aws.sh
./setup-aws.sh

# 2. Update backend/InsuranceFlow.API/appsettings.json
#    with your DynamoDB table name and S3 bucket name

# 3. Run the API
cd backend
dotnet run --project InsuranceFlow.API

# 4. API runs at http://localhost:5000
#    Swagger UI at http://localhost:5000
```

Requires: .NET 8 SDK, AWS CLI configured with credentials.
Full step-by-step guide with screenshots in **docs/InsuranceFlow_Documentation.docx**.

## Key Design Decisions

- **Repository pattern** with interface abstraction - DynamoDB implementation swappable without touching service/controller layers
- **ApiResponse<T> envelope** on all endpoints - consistent JSON shape for all success and error responses
- **Status state machine** - enforces valid transitions, prevents invalid status changes
- **Presigned S3 URLs** - documents served directly from S3, API stays stateless
- **Global exception middleware** - centralised error handling, no stack traces in production
- **Multi-stage Dockerfile** with non-root user - production-grade container security

## Author

John-Sebastian Mphuthi - Senior Software Developer  
+27 82 829 9050 | JohnnyBooks@gmail.com | Morningside, Johannesburg  
github.com/johnnybooks-star
