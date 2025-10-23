# AI Infrastructure Setup Guide

**Project:** MessageAI MVP - AI Features Implementation  
**Last Updated:** October 22, 2025  
**Architecture:** Hybrid (Firebase Cloud Functions + AWS Lambda)

---

## Overview

This document provides complete setup instructions for the AI infrastructure supporting 5 required AI features + Advanced AI Assistant capability.

### Architecture Summary

**Firebase Cloud Functions** → Simple, synchronous AI features:
- Thread summarization
- Action item extraction  
- Decision tracking
- Priority message detection

**AWS Lambda + EventBridge** → Complex, asynchronous processing:
- Smart search with Pinecone embeddings
- Advanced AI Assistant (knowledge base builder)
- Batch message processing (hourly)

**Pinecone** → Vector database:
- Message embeddings for semantic search
- User knowledge base storage

---

## Part 1: Firebase Cloud Functions Setup

### Prerequisites
- Firebase project already created ✅
- Firebase CLI installed: `npm install -g firebase-tools`
- OpenAI API key

### Step 1: Initialize Firebase Functions

```bash
cd /Applications/Gauntlet/chat_iq

# Initialize functions (if not already done)
firebase init functions
# Choose TypeScript
# Install dependencies: Yes

cd functions
```

### Step 2: Install Dependencies

```bash
cd functions
npm install openai
npm install @types/node --save-dev
```

### Step 3: Configure Environment Variables

```bash
# Set Firebase environment config
firebase functions:config:set openai.api_key="sk-YOUR_KEY_HERE"

# For local development, create .env file
cd functions
echo "OPENAI_API_KEY=sk-YOUR_KEY_HERE" > .env
```

### Step 4: Create AI Functions Structure

```bash
mkdir -p src/ai
touch src/ai/openai.ts
touch src/ai/prompts.ts
touch src/ai/summarize.ts
touch src/ai/extractActions.ts
touch src/ai/detectPriority.ts
touch src/ai/trackDecisions.ts
touch src/ai/types.ts
```

### Step 5: Deploy Firebase Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

**Expected Functions:**
- `summarizeThread` (HTTP callable)
- `extractActionItems` (HTTP callable)
- `detectPriority` (HTTP callable)
- `trackDecisions` (HTTP callable)

---

## Part 2: AWS Infrastructure Setup

### Prerequisites
- AWS account with business tier ✅
- AWS CLI installed: `brew install awscli`
- AWS credentials configured

### Step 1: Configure AWS CLI

```bash
# Configure AWS credentials
aws configure

# Enter:
# AWS Access Key ID: [Your Key]
# AWS Secret Access Key: [Your Secret]
# Default region: us-east-1
# Default output format: json

# Verify
aws sts get-caller-identity
```

### Step 2: Create IAM Role for Lambda

```bash
# Create trust policy file
cat > lambda-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create IAM role
aws iam create-role \
  --role-name MessageAI-Lambda-Role \
  --assume-role-policy-document file://lambda-trust-policy.json

# Attach basic Lambda execution policy
aws iam attach-role-policy \
  --role-name MessageAI-Lambda-Role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Note the Role ARN - you'll need it
# Example: arn:aws:iam::123456789012:role/MessageAI-Lambda-Role
```

### Step 3: Create Lambda Functions

#### 3.1 Create Project Structure

```bash
mkdir -p aws/lambda
cd aws/lambda

# Create package.json
cat > package.json <<EOF
{
  "name": "messageai-lambda",
  "version": "1.0.0",
  "description": "MessageAI AWS Lambda Functions",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "package": "zip -r function.zip dist node_modules"
  },
  "dependencies": {
    "openai": "^4.20.0",
    "@pinecone-database/pinecone": "^1.1.0",
    "firebase-admin": "^11.11.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

# Create tsconfig.json
cat > tsconfig.json <<EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
EOF

# Install dependencies
npm install

# Create source structure
mkdir -p src/shared
touch src/knowledgeBuilder.ts
touch src/messageProcessor.ts
touch src/searchMessages.ts
touch src/shared/pinecone.ts
touch src/shared/openai.ts
touch src/shared/firestore.ts
```

#### 3.2 Deploy Knowledge Builder Lambda

```bash
# Build
npm run build

# Package
npm run package

# Deploy (replace ROLE_ARN with your actual ARN)
aws lambda create-function \
  --function-name MessageAI-KnowledgeBuilder \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/MessageAI-Lambda-Role \
  --handler dist/knowledgeBuilder.handler \
  --zip-file fileb://function.zip \
  --timeout 300 \
  --memory-size 512 \
  --environment Variables="{
    OPENAI_API_KEY=sk-YOUR_KEY,
    PINECONE_API_KEY=YOUR_PINECONE_KEY,
    PINECONE_ENVIRONMENT=us-west1-gcp,
    FIREBASE_PROJECT_ID=your-project-id
  }"
```

#### 3.3 Deploy Message Processor Lambda

```bash
aws lambda create-function \
  --function-name MessageAI-MessageProcessor \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/MessageAI-Lambda-Role \
  --handler dist/messageProcessor.handler \
  --zip-file fileb://function.zip \
  --timeout 900 \
  --memory-size 1024 \
  --environment Variables="{
    OPENAI_API_KEY=sk-YOUR_KEY,
    PINECONE_API_KEY=YOUR_PINECONE_KEY,
    PINECONE_ENVIRONMENT=us-west1-gcp,
    FIREBASE_PROJECT_ID=your-project-id
  }"
```

#### 3.4 Deploy Search Messages Lambda

```bash
aws lambda create-function \
  --function-name MessageAI-SearchMessages \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/MessageAI-Lambda-Role \
  --handler dist/searchMessages.handler \
  --zip-file fileb://function.zip \
  --timeout 60 \
  --memory-size 512 \
  --environment Variables="{
    OPENAI_API_KEY=sk-YOUR_KEY,
    PINECONE_API_KEY=YOUR_PINECONE_KEY,
    PINECONE_ENVIRONMENT=us-west1-gcp
  }"
```

### Step 4: Set Up EventBridge (Hourly Batch Processing)

#### 4.1 Create EventBridge Rule

```bash
# Create rule for hourly trigger
aws events put-rule \
  --name MessageAI-HourlyBatch \
  --description "Trigger message processing every hour" \
  --schedule-expression "rate(1 hour)"

# Get the rule ARN
aws events describe-rule --name MessageAI-HourlyBatch
```

#### 4.2 Add Lambda Permission for EventBridge

```bash
# Allow EventBridge to invoke Lambda
aws lambda add-permission \
  --function-name MessageAI-MessageProcessor \
  --statement-id EventBridgeInvoke \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:us-east-1:YOUR_ACCOUNT_ID:rule/MessageAI-HourlyBatch
```

#### 4.3 Add Lambda as Target

```bash
# Create targets.json
cat > targets.json <<EOF
[
  {
    "Id": "1",
    "Arn": "arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:MessageAI-MessageProcessor",
    "Input": "{\"trigger\": \"scheduled\", \"batchType\": \"hourly\"}"
  }
]
EOF

# Add target to rule
aws events put-targets \
  --rule MessageAI-HourlyBatch \
  --targets file://targets.json
```

#### 4.4 Verify EventBridge Setup

```bash
# Check rule status
aws events describe-rule --name MessageAI-HourlyBatch

# List targets
aws events list-targets-by-rule --rule MessageAI-HourlyBatch

# Enable rule (if not already enabled)
aws events enable-rule --name MessageAI-HourlyBatch
```

### Step 5: Set Up API Gateway (for Mobile App Access)

#### 5.1 Create REST API

```bash
# Create API
aws apigateway create-rest-api \
  --name MessageAI-API \
  --description "API for MessageAI Lambda functions" \
  --endpoint-configuration types=REGIONAL

# Note the API ID from output
# Example: abc123def4
```

#### 5.2 Create Resources and Methods

```bash
# Get root resource ID
aws apigateway get-resources \
  --rest-api-id YOUR_API_ID \
  --query 'items[?path==`/`].id' \
  --output text

# Create /search resource
aws apigateway create-resource \
  --rest-api-id YOUR_API_ID \
  --parent-id ROOT_RESOURCE_ID \
  --path-part search

# Create POST method for /search
aws apigateway put-method \
  --rest-api-id YOUR_API_ID \
  --resource-id SEARCH_RESOURCE_ID \
  --http-method POST \
  --authorization-type NONE

# Integrate with Lambda
aws apigateway put-integration \
  --rest-api-id YOUR_API_ID \
  --resource-id SEARCH_RESOURCE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:MessageAI-SearchMessages/invocations
```

#### 5.3 Deploy API

```bash
# Create deployment
aws apigateway create-deployment \
  --rest-api-id YOUR_API_ID \
  --stage-name prod

# Get invoke URL
echo "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod"
```

#### 5.4 Add Lambda Permission for API Gateway

```bash
aws lambda add-permission \
  --function-name MessageAI-SearchMessages \
  --statement-id ApiGatewayInvoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:YOUR_ACCOUNT_ID:YOUR_API_ID/*/*"
```

---

## Part 3: Pinecone Setup

### Step 1: Create Pinecone Account

1. Go to https://www.pinecone.io/
2. Sign up (already done ✅)
3. Create project
4. Get API key from dashboard

### Step 2: Create Indexes

```bash
# Install Pinecone CLI (optional)
npm install -g @pinecone-database/cli

# Or use Python SDK for setup
pip install pinecone-client

# Create Python setup script
cat > setup_pinecone.py <<EOF
from pinecone import Pinecone

pc = Pinecone(api_key='YOUR_PINECONE_API_KEY')

# Create chat-messages index
pc.create_index(
    name='chat-messages',
    dimension=1536,  # OpenAI embedding dimension
    metric='cosine',
    spec={
        'serverless': {
            'cloud': 'aws',
            'region': 'us-west-2'
        }
    }
)

# Create user-knowledge index
pc.create_index(
    name='user-knowledge',
    dimension=1536,
    metric='cosine',
    spec={
        'serverless': {
            'cloud': 'aws',
            'region': 'us-west-2'
        }
    }
)

print("Indexes created successfully!")
EOF

python setup_pinecone.py
```

### Step 3: Verify Indexes

```python
# test_pinecone.py
from pinecone import Pinecone

pc = Pinecone(api_key='YOUR_API_KEY')

# List indexes
print("Available indexes:", pc.list_indexes())

# Get index info
index = pc.Index('chat-messages')
print("Index stats:", index.describe_index_stats())
```

---

## Part 4: Environment Variables Summary

### Firebase Functions (.env)

```bash
OPENAI_API_KEY=sk-proj-...
```

### AWS Lambda (via AWS Console or CLI)

```bash
OPENAI_API_KEY=sk-proj-...
PINECONE_API_KEY=pcsk_...
PINECONE_ENVIRONMENT=us-west1-gcp
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_KEY=<base64 encoded JSON>
```

### Mobile App (.env)

```bash
# Add to existing .env
AWS_API_GATEWAY_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod
```

---

## Part 5: Testing the Setup

### Test 1: Firebase Functions

```bash
# Test locally
cd functions
npm run serve

# In another terminal, test callable function
curl -X POST http://localhost:5001/YOUR_PROJECT_ID/us-central1/detectPriority \
  -H "Content-Type: application/json" \
  -d '{"data": {"message": "URGENT: Need this done ASAP"}}'
```

### Test 2: AWS Lambda

```bash
# Test MessageProcessor Lambda
aws lambda invoke \
  --function-name MessageAI-MessageProcessor \
  --payload '{"trigger": "test", "userId": "test-user"}' \
  response.json

cat response.json
```

### Test 3: EventBridge Rule

```bash
# Check rule is enabled
aws events describe-rule --name MessageAI-HourlyBatch

# Manually trigger the rule (for testing)
aws lambda invoke \
  --function-name MessageAI-MessageProcessor \
  --payload '{"trigger": "manual_test"}' \
  test-response.json
```

### Test 4: API Gateway

```bash
# Test search endpoint
curl -X POST https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test search", "userId": "test-user"}'
```

### Test 5: Pinecone Connection

```python
# test_embeddings.py
from pinecone import Pinecone
from openai import OpenAI

# Initialize clients
pc = Pinecone(api_key='YOUR_PINECONE_KEY')
openai_client = OpenAI(api_key='YOUR_OPENAI_KEY')

# Get index
index = pc.Index('chat-messages')

# Create test embedding
response = openai_client.embeddings.create(
    model="text-embedding-ada-002",
    input="This is a test message"
)
embedding = response.data[0].embedding

# Upsert to Pinecone
index.upsert(vectors=[
    {
        "id": "test-1",
        "values": embedding,
        "metadata": {
            "text": "This is a test message",
            "userId": "test-user",
            "chatId": "test-chat",
            "timestamp": 1234567890
        }
    }
])

# Query
results = index.query(
    vector=embedding,
    top_k=5,
    include_metadata=True
)

print("Query results:", results)
```

---

## Part 6: Monitoring & Costs

### Firebase Functions Monitoring

```bash
# View logs
firebase functions:log

# Or in Firebase Console:
# Console → Functions → Logs
```

### AWS Lambda Monitoring

```bash
# View recent logs
aws logs tail /aws/lambda/MessageAI-MessageProcessor --follow

# CloudWatch dashboard:
# AWS Console → CloudWatch → Logs → /aws/lambda/
```

### EventBridge Monitoring

```bash
# Check rule execution history
aws cloudwatch get-metric-statistics \
  --namespace AWS/Events \
  --metric-name Invocations \
  --dimensions Name=RuleName,Value=MessageAI-HourlyBatch \
  --start-time 2025-10-21T00:00:00Z \
  --end-time 2025-10-22T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

### Cost Estimates (MVP/Demo)

**Firebase Functions:**
- Free tier: 2M invocations/month
- Estimated usage: < 10K/month
- Cost: $0 (within free tier)

**AWS Lambda:**
- Free tier: 1M requests + 400,000 GB-seconds/month
- Hourly batch: 24 invocations/day × 30 days = 720/month
- Cost: $0 (within free tier)

**OpenAI API:**
- GPT-4-mini: $0.150 / 1M input tokens, $0.600 / 1M output tokens
- Estimated: 50 API calls/day for testing
- Average: 1K input + 500 output tokens per call
- Cost: ~$5-10 for MVP development/testing

**Pinecone:**
- Free tier: 1 index, 100K vectors
- Estimated: < 10K vectors for MVP
- Cost: $0 (within free tier)

**Total Estimated MVP Cost: $5-15**

---

## Part 7: Troubleshooting

### Common Issues

**Issue: Firebase Function timeout**
- Solution: Increase timeout in `firebase.json`:
```json
{
  "functions": {
    "timeout": 60,
    "memory": 512
  }
}
```

**Issue: Lambda "Module not found"**
- Solution: Ensure node_modules is included in zip:
```bash
zip -r function.zip dist node_modules
```

**Issue: EventBridge not triggering**
- Check: Rule is enabled
- Check: Lambda has permission
- Check: Target is correctly configured
```bash
aws events describe-rule --name MessageAI-HourlyBatch
aws events list-targets-by-rule --rule MessageAI-HourlyBatch
```

**Issue: Pinecone "Index not found"**
- Solution: Verify index name and wait 60s after creation
```python
pc.list_indexes()  # Check spelling
```

**Issue: API Gateway 403 Forbidden**
- Solution: Add Lambda invoke permission
```bash
aws lambda add-permission \
  --function-name YOUR_FUNCTION \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com
```

---

## Part 8: Next Steps

After completing this setup:

1. ✅ Firebase Functions deployed
2. ✅ AWS Lambda functions created
3. ✅ EventBridge hourly batch configured
4. ✅ API Gateway endpoints ready
5. ✅ Pinecone indexes created
6. ✅ All environment variables set

**Ready to implement:**
- Phase 1: Core AI infrastructure code
- Phase 2: 5 required AI features
- Phase 3: Advanced AI Assistant

**Proceed to:** `ai-implementation-guide.md` for code implementation

---

## Quick Reference Commands

```bash
# Deploy Firebase Functions
cd functions && npm run build && firebase deploy --only functions

# Update Lambda function
cd aws/lambda && npm run build && npm run package
aws lambda update-function-code \
  --function-name MessageAI-MessageProcessor \
  --zip-file fileb://function.zip

# Check EventBridge schedule
aws events describe-rule --name MessageAI-HourlyBatch

# View Lambda logs
aws logs tail /aws/lambda/MessageAI-MessageProcessor --follow

# Test API endpoint
curl -X POST https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

---

**Document Status:** Complete  
**Ready for:** Phase 1 Implementation  
**Last Verified:** October 22, 2025


