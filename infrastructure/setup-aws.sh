#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# InsuranceFlow - AWS Free Tier Infrastructure Setup
# Run this script ONCE after configuring your AWS CLI credentials.
# All resources stay within the AWS Free Tier limits.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REGION="eu-west-1"
TABLE_NAME="InsuranceFlowApplications"
BUCKET_NAME="insuranceflow-documents-$(aws sts get-caller-identity --query Account --output text)"

echo ""
echo "=== InsuranceFlow AWS Setup ==="
echo "Region:  $REGION"
echo "Table:   $TABLE_NAME"
echo "Bucket:  $BUCKET_NAME"
echo ""

# ── 1. DynamoDB table ─────────────────────────────────────────────────────────
echo "[1/3] Creating DynamoDB table..."
aws dynamodb create-table \
  --table-name "$TABLE_NAME" \
  --attribute-definitions \
    AttributeName=ApplicationId,AttributeType=S \
    AttributeName=ReferenceNumber,AttributeType=S \
  --key-schema AttributeName=ApplicationId,KeyType=HASH \
  --global-secondary-indexes '[{
    "IndexName": "ReferenceNumber-Index",
    "KeySchema": [{"AttributeName":"ReferenceNumber","KeyType":"HASH"}],
    "Projection": {"ProjectionType":"ALL"},
    "ProvisionedThroughput": {"ReadCapacityUnits":5,"WriteCapacityUnits":5}
  }]' \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region "$REGION" \
  --output table 2>/dev/null || echo "  Table already exists - skipping."

aws dynamodb wait table-exists --table-name "$TABLE_NAME" --region "$REGION"
echo "  DynamoDB table ready."

# ── 2. S3 bucket ──────────────────────────────────────────────────────────────
echo "[2/3] Creating S3 bucket..."
aws s3api create-bucket \
  --bucket "$BUCKET_NAME" \
  --region "$REGION" \
  --create-bucket-configuration LocationConstraint="$REGION" \
  2>/dev/null || echo "  Bucket already exists - skipping."

# Block all public access on the documents bucket (private - presigned URLs only)
aws s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# CORS for presigned URL downloads from the React app
aws s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration '{
  "CORSRules": [{
    "AllowedOrigins": ["http://localhost:5173", "*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }]
}'

echo "  S3 bucket ready (private, presigned URLs only)."

# ── 3. IAM policy summary (manual step - see README) ─────────────────────────
echo "[3/3] IAM permissions required (attach to your EC2 instance role or local credentials):"
cat << 'EOF'

  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem",
          "dynamodb:Query", "dynamodb:Scan", "dynamodb:DeleteItem"
        ],
        "Resource": [
          "arn:aws:dynamodb:eu-west-1:*:table/InsuranceFlowApplications",
          "arn:aws:dynamodb:eu-west-1:*:table/InsuranceFlowApplications/index/*"
        ]
      },
      {
        "Effect": "Allow",
        "Action": ["s3:PutObject", "s3:GetObject", "s3:HeadObject"],
        "Resource": "arn:aws:s3:::insuranceflow-documents-*/*"
      }
    ]
  }

EOF

echo ""
echo "=== Setup complete ==="
echo "Update appsettings.json:"
echo "  AWS.DynamoDB.TableName = $TABLE_NAME"
echo "  AWS.S3.BucketName      = $BUCKET_NAME"
echo "  AWS.Region             = $REGION"
