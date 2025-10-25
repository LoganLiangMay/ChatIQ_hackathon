# 📌 Pinecone Setup Guide for ChatIQ

**Phase 6: RAG Enhancement with Vector Embeddings**

---

## 🎯 Overview

This guide walks you through setting up Pinecone for semantic search with vector embeddings in ChatIQ.

---

## 📋 Prerequisites

1. ✅ AI SDK implementation complete (Phases 1-5)
2. ✅ Firebase Functions deployed
3. ⏳ Pinecone account (free tier is fine)

---

## 🚀 Step-by-Step Setup

### **Step 1: Create Pinecone Account & Index** (5 min)

#### 1.1 Sign Up
- Go to: https://www.pinecone.io/
- Sign up for free account
- Verify email

#### 1.2 Create Index
In Pinecone Console:

**Index Settings:**
```yaml
Name: chatiq-messages
Dimensions: 1536
Metric: cosine
Cloud: AWS
Region: us-east-1 (or closest to you)
```

**Click "Create Index"**

#### 1.3 Get API Key
1. Go to "API Keys" in Pinecone Console
2. Copy your API key (starts with `pcsk_...`)
3. Note your environment (e.g., `us-east-1-aws`)

---

### **Step 2: Install Pinecone SDK** (2 min)

```bash
cd /Applications/Gauntlet/chat_iq

# Install in main app
npm install @pinecone-database/pinecone

# Install in Firebase Functions
cd functions
npm install @pinecone-database/pinecone
cd ..
```

---

### **Step 3: Configure Environment Variables** (3 min)

#### 3.1 Create/Update `.env.local`

Add these lines to your `.env.local` file:

```bash
# Pinecone Configuration
EXPO_PUBLIC_PINECONE_API_KEY=your_pinecone_api_key_here
EXPO_PUBLIC_PINECONE_ENVIRONMENT=us-east-1-aws
EXPO_PUBLIC_PINECONE_INDEX=chatiq-messages
```

**Replace `your_pinecone_api_key_here` with your actual Pinecone API key!**

#### 3.2 Configure Firebase Functions

Run this command (replace with your actual values):

```bash
cd /Applications/Gauntlet/chat_iq/functions

firebase functions:config:set \
  pinecone.api_key="your_pinecone_api_key_here" \
  pinecone.environment="us-east-1-aws" \
  pinecone.index="chatiq-messages"
```

**Verify configuration:**
```bash
firebase functions:config:get
```

---

### **Step 4: Test Pinecone Connection** (5 min)

#### 4.1 Create Test Script

Create `/test-pinecone.ts`:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

async function testPinecone() {
  console.log('🔍 Testing Pinecone connection...');
  
  const pc = new Pinecone({
    apiKey: process.env.EXPO_PUBLIC_PINECONE_API_KEY!,
  });
  
  const index = pc.index('chatiq-messages');
  
  // Get index stats
  const stats = await index.describeIndexStats();
  console.log('✅ Pinecone connected!');
  console.log('📊 Index stats:', stats);
  
  // Test upsert
  await index.upsert([
    {
      id: 'test-1',
      values: new Array(1536).fill(0.1), // Dummy embedding
      metadata: { content: 'Test message', chatId: 'test' },
    },
  ]);
  console.log('✅ Test vector upserted');
  
  // Test query
  const results = await index.query({
    vector: new Array(1536).fill(0.1),
    topK: 1,
    includeMetadata: true,
  });
  console.log('✅ Test query successful:', results);
  
  // Cleanup
  await index.deleteOne('test-1');
  console.log('✅ Test cleanup complete');
}

testPinecone().catch(console.error);
```

#### 4.2 Run Test

```bash
npx tsx test-pinecone.ts
```

Expected output:
```
🔍 Testing Pinecone connection...
✅ Pinecone connected!
📊 Index stats: { ... }
✅ Test vector upserted
✅ Test query successful: { ... }
✅ Test cleanup complete
```

---

### **Step 5: Integrate with Message Creation** (30 min)

#### 5.1 Update Message Creation

Modify `/functions/src/index.ts` to embed messages:

```typescript
import { embedMessage } from './ai/embeddings';

export const onMessageCreated = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    // ... existing code ...
    
    // Add embedding for semantic search
    try {
      await embedMessage(
        messageId,
        chatId,
        messageData.content,
        {
          senderId: messageData.senderId,
          senderName: messageData.senderName,
          chatName: chatData?.name,
          isPriority: messageData.priority?.isPriority,
        }
      );
      console.log('✅ Message embedded for semantic search');
    } catch (error) {
      console.error('⚠️ Failed to embed message (non-critical):', error);
    }
    
    // ... rest of existing code ...
  });
```

#### 5.2 Create Firebase Embeddings Service

Create `/functions/src/ai/embeddings.ts`:

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
import * as functions from 'firebase-functions';
import { generateEmbedding } from './openai';

const pc = new Pinecone({
  apiKey: functions.config().pinecone?.api_key || process.env.PINECONE_API_KEY,
});

const indexName = functions.config().pinecone?.index || 'chatiq-messages';
const index = pc.index(indexName);

export async function embedMessage(
  messageId: string,
  chatId: string,
  content: string,
  metadata: any
): Promise<void> {
  const embedding = await generateEmbedding(content);
  
  await index.upsert([
    {
      id: messageId,
      values: embedding,
      metadata: {
        chatId,
        content,
        timestamp: Date.now(),
        ...metadata,
      },
    },
  ]);
}

export { index };
```

---

### **Step 6: Update Search Tool** (30 min)

#### 6.1 Enhance Search Tool

Update `/services/ai/agent/tools.ts`:

```typescript
import { searchSimilarMessages } from './embeddings';

export const searchMessagesTool = tool({
  description: `Advanced semantic search using RAG with vector embeddings.
  Searches by meaning, not just keywords. Returns most relevant messages.`,
  parameters: z.object({
    query: z.string().describe('Search query (natural language)'),
    topK: z.number().optional().default(10),
    chatId: z.string().optional(),
  }),
  execute: async ({ query, topK, chatId }) => {
    try {
      // Use Pinecone for semantic search
      const results = await searchSimilarMessages(
        query,
        topK,
        chatId ? { chatId } : undefined
      );
      
      return {
        results: results.map(r => ({
          messageId: r.messageId,
          content: r.content,
          chatId: r.chatId,
          relevance: r.score,
          metadata: r.metadata,
        })),
        count: results.length,
        method: 'semantic_vector_search',
      };
    } catch (error: any) {
      // Fallback to basic search if Pinecone fails
      return {
        error: error.message,
        fallback: 'Using basic keyword search',
      };
    }
  },
});
```

---

### **Step 7: Deploy & Test** (10 min)

#### 7.1 Deploy Functions

```bash
cd /Applications/Gauntlet/chat_iq/functions
npm run build
firebase deploy --only functions
```

#### 7.2 Test End-to-End

1. **Send Test Messages**
   - Open app on iPad
   - Send several messages with different topics
   - Wait for embeddings to be created

2. **Test Semantic Search**
   - Go to AI Assistant tab
   - Try: "Find messages about API design"
   - Try: "What did we discuss about deployment?"
   - Verify results are semantically relevant

3. **Check Pinecone Console**
   - Go to Pinecone Console
   - Check "chatiq-messages" index
   - Verify vector count is increasing

---

## 📊 Verification Checklist

- [ ] Pinecone account created
- [ ] Index "chatiq-messages" created (1536 dimensions, cosine)
- [ ] API key obtained
- [ ] `.env.local` updated with Pinecone credentials
- [ ] Firebase Functions config set
- [ ] Pinecone SDK installed (app + functions)
- [ ] `embeddings.ts` service created
- [ ] Test script runs successfully
- [ ] Functions deployed with embedding code
- [ ] Messages are being embedded (check logs)
- [ ] Semantic search returns relevant results
- [ ] Pinecone vector count increasing

---

## 🎯 Testing Scenarios

### Test 1: Basic Semantic Search
```
Query: "API design discussions"
Expected: Messages about API, even if they don't contain exact words
```

### Test 2: Contextual Search
```
Query: "deployment problems"
Expected: Messages about deployment issues, errors, blockers
```

### Test 3: Chat-Specific Search
```
Query: "decisions made in Project X chat"
Filter: { chatId: 'project-x-chat-id' }
Expected: Only decisions from that specific chat
```

### Test 4: Similarity Threshold
```
Query: "urgent bugs"
Expected: High-scoring matches for urgent issues, bugs, critical problems
```

---

## 💰 Cost Analysis

### Pinecone Free Tier:
- **1 index** (chatiq-messages)
- **100,000 vectors** (~100K messages)
- **Unlimited queries**
- **$0/month**

### OpenAI Embeddings:
- **Model:** text-embedding-3-small
- **Cost:** $0.02 per 1M tokens
- **~1K messages:** ~100K tokens = $0.002
- **10K messages/month:** ~$0.02/month

### Total Phase 6 Cost:
- **Development:** $0/month (free tiers)
- **Production (10K msgs/month):** ~$0.02/month

**Extremely cost-effective!** 🎉

---

## 🔧 Troubleshooting

### Issue 1: "API key not found"
```bash
# Verify environment variable
echo $EXPO_PUBLIC_PINECONE_API_KEY

# Check Firebase config
firebase functions:config:get
```

### Issue 2: "Index not found"
- Verify index name is exactly "chatiq-messages"
- Check Pinecone Console that index was created
- Ensure index is in "Ready" state

### Issue 3: "Dimension mismatch"
- Index must be 1536 dimensions
- Using text-embedding-3-small model
- Delete and recreate index if wrong dimensions

### Issue 4: Embeddings not being created
```bash
# Check Firebase logs
firebase functions:log --only onMessageCreated

# Look for embedding errors
# Verify OpenAI API key is working
```

### Issue 5: Search returns no results
```bash
# Check Pinecone stats
# Verify vectors are being upserted
# Try test query directly in Pinecone Console
```

---

## 📚 Resources

### Documentation:
- **Pinecone Docs:** https://docs.pinecone.io/
- **Pinecone Node SDK:** https://github.com/pinecone-io/pinecone-ts-client
- **OpenAI Embeddings:** https://platform.openai.com/docs/guides/embeddings

### Monitoring:
- **Pinecone Console:** https://app.pinecone.io/
- **Firebase Console:** https://console.firebase.google.com/
- **LangSmith Traces:** https://smith.langchain.com/projects/pr-notable-girlfriend-31

---

## 🚀 Next Steps After Phase 6

### Phase 7: Advanced Features
1. **Hybrid Search** - Combine keyword + semantic
2. **Re-ranking** - Use AI to re-rank results
3. **Query Expansion** - Expand user query for better results
4. **Caching** - Cache frequent queries

### Phase 8: Optimization
1. **Batch Processing** - Embed messages in batches
2. **Background Jobs** - Async embedding for old messages
3. **Index Optimization** - Tune Pinecone settings
4. **Cost Monitoring** - Track usage and costs

---

## ✅ Success Criteria

Phase 6 is complete when:
- ✅ Pinecone index created and connected
- ✅ Messages automatically embedded on creation
- ✅ Semantic search returns relevant results
- ✅ Search is faster and more accurate than keyword search
- ✅ Vector count in Pinecone matches message count
- ✅ No errors in Firebase logs

---

## 📞 Need Help?

If you get stuck:
1. Check this guide's troubleshooting section
2. Review Pinecone Console for errors
3. Check Firebase Functions logs
4. Verify environment variables
5. Test with the test script

---

**Ready to implement?** Follow the steps above in order! 🚀

