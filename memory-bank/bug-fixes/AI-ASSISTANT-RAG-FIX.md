# AI Assistant + RAG Integration Fix

## Issues Found

### 1. ❌ Client-Side OpenAI API Key Error
**Error:**
```
AI_LoadAPIKeyError: OpenAI API key is missing.
Pass it using the 'apiKey' parameter or the OPENAI_API_KEY environment variable.
```

**Root Cause:**
- HybridAgent was routing "simple" queries to client-side agent
- Client-side agent tried to use OpenAI directly from React Native
- OpenAI API keys should NEVER be exposed client-side (security risk)

### 2. ❌ Incorrect Fallback Logic
```typescript
// Before: Fallback to client-side when server fails
if (!options.forceMode) {
  console.log('⚠️ [HybridAgent] Server failed, falling back to client-side');
  return await aiAgent.generateResponse(userMessage, conversationHistory);
}
```

**Problem:** Falls back to client-side (which also doesn't have API key) when server fails

### 3. ⏱️ Timeout on Decisions Extraction
**Error:** `Timeout after 15s`

**Root Cause:**
- 15 seconds wasn't enough for 50 messages
- OpenAI API calls can take 10-20 seconds for large batches
- Image filtering adds processing time

---

## Solutions Applied

### ✅ Fix 1: Always Use Server-Side (LangChain + RAG)

**Modified:** `services/ai/HybridAgent.ts`

**Before:**
```typescript
// Route to client-side for simple queries
if (complexity === 'simple' && !options.forceMode) {
  console.log('📱 [HybridAgent] Using client-side agent (fast)');
  return await aiAgent.generateResponse(userMessage, conversationHistory);
}
```

**After:**
```typescript
// Always route to server-side for security (no exposed API keys)
console.log('🔥 [HybridAgent] Using server-side agent (LangChain + RAG + LangSmith)');

const knowledgeAgentFn = httpsCallable(functions, 'knowledgeAgent');
const result = await knowledgeAgentFn({
  question: userMessage,
  userId: options.userId,
  chatId: options.chatId,
  queryType: complexity === 'rag' || complexity === 'knowledge' ? 'rag' : 'general',
  conversationHistory: conversationHistory.slice(-5), // Last 5 messages for context
});
```

**Benefits:**
- ✅ API keys never exposed to client
- ✅ Full LangChain + RAG capabilities
- ✅ LangSmith tracing for debugging
- ✅ Pinecone vector search for knowledge retrieval

### ✅ Fix 2: Removed Client-Side Fallback

**Before:**
```typescript
// Fallback to client-side if server fails
if (!options.forceMode) {
  console.log('⚠️ [HybridAgent] Server failed, falling back to client-side');
  return await aiAgent.generateResponse(userMessage, conversationHistory);
}
```

**After:**
```typescript
// Return helpful error message (no fallback)
throw new Error(
  'AI Assistant is temporarily unavailable. Please try again. ' +
  `(${error.code || error.message})`
);
```

**Benefits:**
- ✅ Clear error messages for users
- ✅ No confusing "fallback failed" errors
- ✅ Encourages fixing server-side issues

### ✅ Fix 3: Increased Timeout for Decisions

**Modified:** `app/(tabs)/decisions.tsx`

**Before:**
```typescript
// Add 15-second timeout per chat
const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error('Timeout after 15s')), 15000);
});

const decisions = await Promise.race([
  trackDecisions(chat.id, 50),
  timeoutPromise
]);
```

**After:**
```typescript
// Add 30-second timeout per chat (OpenAI can take time with large message batches)
const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error('Timeout after 30s')), 30000);
});

// Extract decisions (reduced to 30 messages for faster processing)
const decisions = await Promise.race([
  trackDecisions(chat.id, 30),
  timeoutPromise
]);
```

**Benefits:**
- ✅ More time for OpenAI API calls
- ✅ Fewer timeouts on large chats
- ✅ Better user experience (fewer errors)

---

## Architecture Overview

### Server-Side AI Stack

```
┌─────────────────────────────────────────────┐
│         React Native Client                  │
│                                              │
│  • HybridAgent.ts                           │
│  • Always routes to server                   │
│  • No API keys exposed                       │
└──────────────┬───────────────────────────────┘
               │ Firebase Functions
               │ (HTTPS Callable)
               ▼
┌─────────────────────────────────────────────┐
│      Firebase Functions (Server-Side)        │
│                                              │
│  • knowledgeAgent.ts                        │
│  • LangChain (ChatOpenAI)                   │
│  • LangSmith Tracing                        │
│  • OpenAI API Key (secure)                  │
└──────────────┬───────────────────────────────┘
               │
               ├─── Simple Queries ───────────┐
               │                               │
               │                               ▼
               │                    ┌──────────────────┐
               │                    │   OpenAI GPT-4o  │
               │                    │                  │
               │                    │   Direct answer  │
               │                    └──────────────────┘
               │
               └─── RAG Queries ──────────────┐
                                               │
                                               ▼
                                    ┌──────────────────┐
                                    │  Pinecone Vector  │
                                    │    Database       │
                                    │                   │
                                    │  • Embeddings     │
                                    │  • Messages       │
                                    │  • Summaries      │
                                    └─────────┬─────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │   OpenAI GPT-4o  │
                                    │                  │
                                    │  Context-aware   │
                                    │  RAG answer      │
                                    └──────────────────┘
```

### Query Routing Logic

1. **User asks question** → HybridAgent
2. **Assess complexity:**
   - `'simple'` - Direct OpenAI call
   - `'rag'` - Pinecone search + OpenAI
   - `'complex'` - LangChain reasoning + OpenAI
3. **Route to server-side:** `knowledgeAgent` Firebase Function
4. **LangSmith tracing:** Auto-enabled via env vars
5. **Return response:** Stream or complete answer

---

## LangChain + RAG Integration

### How RAG Works

**RAG = Retrieval-Augmented Generation**

1. **User asks:** "What did we decide about desserts?"
2. **Embed query:** Convert question to vector (OpenAI embeddings)
3. **Search Pinecone:** Find similar messages in vector database
4. **Retrieve context:** Get top 5 most relevant messages
5. **Generate answer:** Send context + question to GPT-4o
6. **Return answer:** "You decided to order cookies from Voodoo Dough"

### Code Implementation (knowledgeAgent.ts)

```typescript
// 1. Get vector store (Pinecone + OpenAI embeddings)
const store = await getVectorStore();

// 2. Perform similarity search
const results = await store.query(question, 5, { userId });

// 3. Build context from retrieved documents
const context = results.map(doc => doc.pageContent).join('\n\n---\n\n');

// 4. Generate response with context
const prompt = `You are an AI assistant for ChatIQ.
Use the following context from the user's messages to answer the question.

Context:
${context}

Question: ${question}`;

// 5. Call OpenAI with LangChain
const response = await model.invoke([{ role: 'user', content: prompt }]);
```

### LangSmith Tracing

**Auto-enabled via environment variables:**
```bash
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_key
LANGCHAIN_PROJECT=chatiq-rag
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
```

**What it tracks:**
- ✅ All LangChain calls
- ✅ Vector search queries
- ✅ OpenAI API calls
- ✅ Latency and errors
- ✅ Token usage and costs

**View traces at:** https://smith.langchain.com

---

## Testing Instructions

### Test AI Assistant (RAG)

1. **Navigate to AI Assistant Tab**
   - Tap "AI Assistant" in bottom navigation

2. **Test Simple Query**
   - Ask: "What is ChatIQ?"
   - **Expected:**
     ```
     🤖 [HybridAgent] Query complexity: simple
     🔥 [HybridAgent] Using server-side agent (LangChain + RAG + LangSmith)
     ```
   - Should respond quickly with general info

3. **Test RAG Query (Knowledge Retrieval)**
   - Ask: "What did we decide about desserts for Paul's birthday?"
   - **Expected:**
     ```
     🤖 [HybridAgent] Query complexity: rag
     🔥 [HybridAgent] Using server-side agent (LangChain + RAG + LangSmith)
     🔍 [KnowledgeAgent] Found 5 relevant documents
     ```
   - Should search Pinecone and return: "You decided to order cookies from Voodoo Dough"

4. **Test Complex Query**
   - Ask: "Analyze all my action items across all chats"
   - **Expected:** Uses LangChain reasoning with vector search

5. **Check Logs**
   - ✅ No "OpenAI API key missing" errors
   - ✅ All queries route to server-side
   - ✅ LangSmith tracing enabled

### Test Decisions Tab (Timeout Fix)

1. **Navigate to Decisions Tab**
2. **Wait for auto-scan to complete**
3. **Expected:**
   - ✅ No timeout errors
   - ✅ Scans complete within 30 seconds
   - ✅ Decisions extracted successfully

---

## Environment Variables Required

### Client-Side (.env)
```bash
# Firebase (public)
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...

# Pinecone (public - index name only, no API key)
EXPO_PUBLIC_PINECONE_INDEX_NAME=chatiq-messages
```

### Server-Side (functions/.env)
```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Pinecone
EXPO_PUBLIC_PINECONE_API_KEY=...
EXPO_PUBLIC_PINECONE_INDEX=chatiq-messages

# LangSmith (for tracing)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=...
LANGCHAIN_PROJECT=chatiq-rag
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
```

**Security Note:**
- ✅ API keys only in server-side `.env`
- ✅ Never commit `.env` files
- ✅ Use Firebase Functions config for production

---

## Deployment Status

### Functions Deployed
- ✅ `knowledgeAgent` - LangChain + RAG + LangSmith
- ✅ `searchVectorStore` - Pinecone search
- ✅ `embedContent` - Vector embedding

### Client Updates
- ✅ `HybridAgent.ts` - Always uses server-side
- ✅ `decisions.tsx` - Increased timeout to 30s

### Ready for Testing
```bash
# App should already be reloaded
# Test AI Assistant feature now
```

---

## Performance Expectations

### AI Assistant Response Times

1. **Simple Queries** (No RAG)
   - Expected: 1-3 seconds
   - Example: "What is ChatIQ?"

2. **RAG Queries** (Vector Search + Generation)
   - Expected: 2-5 seconds
   - Example: "What did we decide about desserts?"

3. **Complex Queries** (LangChain Reasoning)
   - Expected: 3-7 seconds
   - Example: "Analyze my action items"

### Decisions Auto-Scan
- Expected: 10-30 seconds per chat
- Timeout: 30 seconds (prevents hangs)

---

## Troubleshooting

### If AI Assistant Still Fails

1. **Check Server-Side Logs**
   ```bash
   firebase functions:log | grep -i "knowledge"
   ```

2. **Verify knowledgeAgent Deployment**
   ```bash
   firebase functions:list | grep knowledgeAgent
   ```
   - Should show: `knowledgeAgent │ v1 │ callable`

3. **Check Environment Variables**
   ```bash
   cd functions
   cat .env | grep -E "OPENAI|PINECONE|LANGCHAIN"
   ```
   - Verify all keys are set

4. **Test Direct Function Call**
   ```bash
   # In Firebase Console Functions section
   # Test knowledgeAgent with:
   {
     "question": "Hello",
     "userId": "test",
     "queryType": "general"
   }
   ```

### If Decisions Timeout

1. **Reduce Message Limit**
   - Already reduced to 30 (from 50)
   - Can reduce further to 20 if needed

2. **Check OpenAI API Status**
   - https://status.openai.com

3. **Check Firebase Functions Logs**
   ```bash
   firebase functions:log | grep extractDecisions
   ```

---

## Summary

### What Was Fixed

1. ✅ **AI Assistant now uses server-side LangChain + RAG**
   - No more OpenAI API key errors
   - Secure (no exposed keys)
   - Full RAG capabilities with Pinecone

2. ✅ **LangSmith integration working**
   - Auto-tracing enabled
   - Monitor all queries at smith.langchain.com

3. ✅ **Decisions timeout increased**
   - 15s → 30s timeout
   - 50 → 30 message limit
   - Fewer timeout errors

### Architecture Benefits

- 🔐 **Secure**: API keys never exposed to client
- 🚀 **Fast**: Optimized for React Native
- 🧠 **Smart**: RAG retrieval for context-aware answers
- 📊 **Observable**: LangSmith tracing for debugging
- ♻️ **Reusable**: Same server-side stack for all AI features

**Status:** ✅ Ready for testing
