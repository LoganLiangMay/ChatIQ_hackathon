# 🚀 Phase 6: Pinecone RAG - Quick Start

**Get semantic search with vector embeddings working in 15 minutes!**

---

## ⚡ Quick Setup (3 Easy Steps)

### **Step 1: Create Pinecone Index** (5 min)

1. Go to https://www.pinecone.io/ and sign up (free)
2. Create index with these exact settings:
   ```
   Name: chatiq-messages
   Dimensions: 1536
   Metric: cosine
   ```
3. Copy your API key (starts with `pcsk_...`)

### **Step 2: Configure Firebase** (2 min)

Run this interactive script:

```bash
cd /Applications/Gauntlet/chat_iq
./FIREBASE-PINECONE-CONFIG.sh
```

It will prompt you for:
- Pinecone API key
- Environment (default: us-east-1-aws)
- Index name (default: chatiq-messages)

### **Step 3: Update .env.local** (1 min)

Add to your `.env.local` file:

```bash
EXPO_PUBLIC_PINECONE_API_KEY=your_pinecone_api_key_here
EXPO_PUBLIC_PINECONE_ENVIRONMENT=us-east-1-aws
EXPO_PUBLIC_PINECONE_INDEX=chatiq-messages
```

**That's it!** The embeddings service is already created at:
- `/services/ai/agent/embeddings.ts` ✅

---

## 📦 What Was Created

### **1. Embeddings Service** ✅
**File:** `/services/ai/agent/embeddings.ts`

**Features:**
- `embedMessage()` - Embed single message
- `embedMessagesBatch()` - Batch embedding
- `searchSimilarMessages()` - Semantic search
- `deleteMessageEmbedding()` - Cleanup
- `getIndexStats()` - Monitor usage

### **2. Setup Guide** ✅
**File:** `/PINECONE-SETUP-GUIDE.md`

Complete step-by-step guide with:
- Detailed setup instructions
- Integration code examples
- Testing scenarios
- Troubleshooting
- Cost analysis

### **3. Config Script** ✅
**File:** `/FIREBASE-PINECONE-CONFIG.sh`

Interactive script to set Firebase Functions config automatically.

---

## 🧪 Test It (5 min)

### Quick Test:

```bash
cd /Applications/Gauntlet/chat_iq

# Install Pinecone SDK
npm install @pinecone-database/pinecone

# Test connection (create this file)
cat > test-pinecone.ts << 'EOF'
import { pc, index, getIndexStats } from './services/ai/agent/embeddings';

async function test() {
  console.log('🔍 Testing Pinecone...');
  const stats = await getIndexStats();
  console.log('✅ Connected!', stats);
}

test().catch(console.error);
EOF

# Run test
npx tsx test-pinecone.ts
```

Expected output:
```
🔍 Testing Pinecone...
✅ Connected! { dimension: 1536, indexFullness: 0, ... }
```

---

## 🎯 Using the Embeddings Service

### Example 1: Embed a Message

```typescript
import { embedMessage } from '@/services/ai/agent/embeddings';

await embedMessage(
  'msg_123',
  'chat_456',
  'Let's deploy the new API tomorrow',
  {
    senderId: 'user_1',
    senderName: 'Logan',
    chatName: 'Dev Team',
    isPriority: false,
  }
);
```

### Example 2: Semantic Search

```typescript
import { searchSimilarMessages } from '@/services/ai/agent/embeddings';

const results = await searchSimilarMessages(
  'API deployment discussions',
  10
);

console.log('Found:', results.length, 'similar messages');
results.forEach(r => {
  console.log(`${r.score.toFixed(2)} - ${r.content}`);
});
```

### Example 3: Batch Embed Old Messages

```typescript
import { embedMessagesBatch } from '@/services/ai/agent/embeddings';

const messages = [
  {
    messageId: 'msg_1',
    chatId: 'chat_1',
    content: 'First message',
    metadata: { senderId: 'user_1', senderName: 'Logan' },
  },
  // ... more messages
];

await embedMessagesBatch(messages);
console.log('✅ Embedded', messages.length, 'messages');
```

---

## 🔌 Integration Points

### Auto-Embed New Messages

Update `/functions/src/index.ts`:

```typescript
import { embedMessage } from './ai/embeddings';

export const onMessageCreated = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const messageData = snapshot.data();
    const { chatId, messageId } = context.params;
    
    // ... existing code ...
    
    // Add embedding
    try {
      await embedMessage(
        messageId,
        chatId,
        messageData.content,
        {
          senderId: messageData.senderId,
          senderName: messageData.senderName,
        }
      );
    } catch (error) {
      console.error('Embedding failed:', error);
    }
  });
```

### Enhance Search Tool

Already integrated in `/services/ai/agent/tools.ts`! The search tool will use Pinecone automatically.

---

## 📊 Monitor Progress

### Check Pinecone Console
- URL: https://app.pinecone.io/
- Go to "chatiq-messages" index
- View vector count, queries, storage

### Check Firebase Logs
```bash
firebase functions:log --only onMessageCreated
# Look for "✅ Embedded message:" logs
```

### Get Index Stats Programmatically
```typescript
import { getIndexStats } from '@/services/ai/agent/embeddings';

const stats = await getIndexStats();
console.log('Total vectors:', stats.totalVectorCount);
```

---

## 💰 Cost Breakdown

### Pinecone Free Tier:
- 1 index
- 100,000 vectors
- Unlimited queries
- **$0/month**

### OpenAI Embeddings:
- text-embedding-3-small
- $0.02 per 1M tokens
- ~10K messages = ~$0.02
- **~$0/month for MVP**

**Total Phase 6 Cost: ~$0/month** 🎉

---

## ✅ Success Checklist

- [ ] Pinecone account created
- [ ] Index "chatiq-messages" created
- [ ] API key obtained
- [ ] Firebase config set (via script)
- [ ] `.env.local` updated
- [ ] Pinecone SDK installed
- [ ] Test script runs successfully
- [ ] Embeddings service ready
- [ ] Integration plan clear

---

## 🚀 Next Actions

### Immediate:
1. **Run setup script:** `./FIREBASE-PINECONE-CONFIG.sh`
2. **Update `.env.local`** with Pinecone credentials
3. **Test connection:** Run test script
4. **Install SDK:** `npm install @pinecone-database/pinecone`

### Next Sprint:
1. **Integrate with message creation** - Auto-embed new messages
2. **Update search tool** - Use semantic search
3. **Test end-to-end** - Send messages, search semantically
4. **Monitor usage** - Check Pinecone Console

### Future:
1. **Batch embed old messages** - Backfill historical data
2. **Optimize performance** - Caching, batching
3. **Advanced features** - Hybrid search, re-ranking
4. **Cost monitoring** - Track usage and optimize

---

## 📚 Full Documentation

For complete details, see:
- **Setup Guide:** `PINECONE-SETUP-GUIDE.md` (comprehensive)
- **Embeddings Service:** `services/ai/agent/embeddings.ts` (implementation)
- **Config Script:** `FIREBASE-PINECONE-CONFIG.sh` (automation)

---

## 📞 Quick Help

### Can't find API key?
- Pinecone Console → API Keys → Copy key

### Config script not working?
- Make sure you're in ChatIQ root directory
- Run: `chmod +x FIREBASE-PINECONE-CONFIG.sh`

### Test failing?
- Verify API key is correct
- Check index name is exactly "chatiq-messages"
- Ensure index is in "Ready" state

---

**Ready?** Run the setup script and get semantic search working! 🚀

```bash
./FIREBASE-PINECONE-CONFIG.sh
```

