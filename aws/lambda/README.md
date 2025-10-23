# MessageAI AWS Lambda Functions

Heavy AI processing functions optimized for cost and performance.

## 📁 Structure

```
aws/lambda/
├── src/
│   ├── shared/              # Shared utilities
│   │   ├── openai.ts        # OpenAI client (embeddings, chat)
│   │   ├── pinecone.ts      # Pinecone vector DB client
│   │   └── firestore.ts     # Firebase Firestore client
│   └── functions/           # Lambda handlers
│       ├── searchMessages.ts       # Semantic search (Feature #5)
│       ├── knowledgeBuilder.ts     # Knowledge base builder (Advanced AI)
│       └── aiAssistant.ts          # AI assistant (Advanced AI)
├── package.json
├── tsconfig.json
└── README.md (this file)
```

## 🚀 Functions

### 1. **searchMessages** (API Gateway trigger)
**Purpose:** Semantic search across messages using vector similarity

**Trigger:** HTTP POST via API Gateway  
**Response time:** <3s  
**Cost per call:** ~$0.0002

**Request:**
```json
{
  "query": "project deadline",
  "userId": "user123",
  "chatIds": ["chat1", "chat2"],
  "limit": 10
}
```

**Response:**
```json
{
  "results": [
    {
      "messageId": "msg123",
      "chatId": "chat1",
      "content": "The project deadline is Friday",
      "score": 0.92,
      "relevance": "high"
    }
  ]
}
```

### 2. **knowledgeBuilder** (EventBridge trigger)
**Purpose:** Build knowledge base from conversations (batch processing)

**Trigger:** EventBridge (hourly schedule)  
**Duration:** 1-5 minutes  
**Cost per run:** ~$0.05-0.10

**Tasks:**
1. Fetch new messages from last hour
2. Generate embeddings (batch of 100)
3. Store vectors in Pinecone
4. Extract user knowledge
5. Save to Firestore

### 3. **aiAssistant** (API Gateway trigger)
**Purpose:** Answer questions using knowledge base

**Trigger:** HTTP POST via API Gateway  
**Response time:** <15s  
**Cost per call:** ~$0.001

**Request:**
```json
{
  "question": "When is the project deadline?",
  "userId": "user123",
  "context": "Asked by team member"
}
```

**Response:**
```json
{
  "answer": "Based on your messages, the project deadline is Friday, October 25th.",
  "confidence": "high",
  "needsMoreInfo": false,
  "duration": 3500
}
```

## 🛠️ Setup

### Prerequisites
- AWS account with CLI configured
- Node.js 18+
- OpenAI API key
- Pinecone account
- Firebase project

### 1. Install Dependencies
```bash
cd /Applications/Gauntlet/chat_iq/aws/lambda
npm install
```

### 2. Build TypeScript
```bash
npm run build
```

### 3. Set Environment Variables

Create Lambda environment variables in AWS Console:

```bash
OPENAI_API_KEY=sk-proj-...
PINECONE_API_KEY=pcsk_...
FIREBASE_PROJECT_ID=messageai-mvp-e0b2b
SAMPLE_USER_IDS=user1,user2,user3  # For knowledge builder
```

### 4. Deploy Functions

#### Create Lambda Functions
```bash
# Search Messages
aws lambda create-function \
  --function-name MessageAI-Search \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/MessageAI-Lambda-Role \
  --handler dist/functions/searchMessages.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 512

# Knowledge Builder
aws lambda create-function \
  --function-name MessageAI-KnowledgeBuilder \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/MessageAI-Lambda-Role \
  --handler dist/functions/knowledgeBuilder.handler \
  --zip-file fileb://function.zip \
  --timeout 300 \
  --memory-size 1024

# AI Assistant
aws lambda create-function \
  --function-name MessageAI-Assistant \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/MessageAI-Lambda-Role \
  --handler dist/functions/aiAssistant.handler \
  --zip-file fileb://function.zip \
  --timeout 60 \
  --memory-size 512
```

#### Update Functions (after changes)
```bash
npm run deploy:search
npm run deploy:knowledge
npm run deploy:assistant
```

### 5. Set Up API Gateway

Create REST API in AWS Console:
- Resource: `/search` → POST → MessageAI-Search
- Resource: `/assistant` → POST → MessageAI-Assistant
- Enable CORS for both

Get API Gateway URL:
```
https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod
```

Add to mobile app `.env`:
```
AWS_API_GATEWAY_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod
```

### 6. Set Up EventBridge Schedule

Create EventBridge rule:
- Name: `MessageAI-HourlyKnowledgeBuilder`
- Schedule: `rate(1 hour)`
- Target: `MessageAI-KnowledgeBuilder` Lambda

## 📊 Cost Estimates

### Per Month (100 active users, 10K messages/day)

| Function | Invocations | Duration | Cost |
|----------|-------------|----------|------|
| searchMessages | 1K | 3s avg | $0.20 |
| knowledgeBuilder | 720 (hourly) | 5min avg | $3.00 |
| aiAssistant | 500 | 10s avg | $0.50 |
| **Lambda Total** | | | **$3.70** |
| OpenAI (embeddings) | 50K | - | $0.50 |
| OpenAI (chat) | 1.5K | - | $1.50 |
| Pinecone (vectors) | 100K | - | $0 (free tier) |
| **Total** | | | **~$5.70/month** |

## 🔐 IAM Role

Create IAM role `MessageAI-Lambda-Role` with policies:
- `AWSLambdaBasicExecutionRole` (CloudWatch logs)
- Custom policy for Secrets Manager (if storing API keys)

## 🧪 Testing

### Local Testing
```bash
# Test with sample event
npm run build
node -e "
  const { handler } = require('./dist/functions/searchMessages');
  handler({
    body: JSON.stringify({ query: 'test', userId: 'user123' })
  }).then(console.log);
"
```

### AWS Testing
```bash
# Invoke via AWS CLI
aws lambda invoke \
  --function-name MessageAI-Search \
  --payload '{"body":"{\"query\":\"test\",\"userId\":\"user123\"}"}' \
  response.json

cat response.json
```

### View Logs
```bash
aws logs tail /aws/lambda/MessageAI-Search --follow
aws logs tail /aws/lambda/MessageAI-KnowledgeBuilder --follow
aws logs tail /aws/lambda/MessageAI-Assistant --follow
```

## 📝 Notes

- All functions use singleton pattern for client reuse (faster cold starts)
- Embeddings are generated in batches of 100 for efficiency
- Pinecone queries include metadata filtering for security
- Knowledge builder only processes last hour of messages
- AI assistant searches user's own messages for privacy

## 🐛 Troubleshooting

### Cold Start Too Slow
- Increase memory (more CPU = faster init)
- Use provisioned concurrency (costs more)
- Pre-warm with scheduled ping

### Out of Memory
- Reduce batch size in knowledge builder
- Increase Lambda memory allocation
- Process fewer messages per run

### Timeout
- Increase function timeout
- Optimize Firestore queries
- Reduce embedding batch size

---

**Last Updated:** October 22, 2025


