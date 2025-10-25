# ✅ Verification Checklist - AI Agent & RAG

## Quick Test: Is Everything Working?

### 1️⃣ Pinecone Connection ✅ PASSED
```bash
npx tsx test-pinecone.ts
```
**Expected Output:**
```
✅ Pinecone client initialized
✅ Index accessed
✅ Test upsert successful
✅ Test query successful
✅ All tests passed!
```

**Status:** ✅ PASSED (Already verified)

---

### 2️⃣ Firebase Functions Deployment ✅ PASSED
```bash
firebase deploy --only functions
```
**Expected Output:**
```
✔ functions[onMessageCreated(us-central1)] Successful update operation.
✔ functions[aiAgent(us-central1)] Successful update operation.
✔ functions[searchMessages(us-central1)] Successful update operation.
... (all 9 functions)
✔ Deploy complete!
```

**Status:** ✅ PASSED (Just deployed successfully)

---

### 3️⃣ Environment Variables ✅ CONFIGURED

**Client-side (`.env`):**
```bash
grep PINECONE .env
```
**Expected:**
```
EXPO_PUBLIC_PINECONE_API_KEY=your_pinecone_api_key_here...
EXPO_PUBLIC_PINECONE_ENVIRONMENT=us-east-1-aws
EXPO_PUBLIC_PINECONE_INDEX=chatiq-messages
```

**Firebase Functions:**
```bash
cd functions && firebase functions:config:get
```
**Expected:**
```json
{
  "pinecone": {
    "api_key": "your_pinecone_api_key_here...",
    "environment": "us-east-1-aws",
    "index": "chatiq-messages"
  }
}
```

**Status:** ✅ CONFIGURED (Already verified)

---

## 🧪 Live Testing

### Test 1: Send a Message (Auto-Embedding)
**Goal:** Verify messages are automatically embedded in Pinecone

1. **Open your app** (on iPad or simulator)
2. **Send a test message** in any chat:
   ```
   "Let's discuss the API redesign proposal"
   ```
3. **Check Firebase logs:**
   ```bash
   firebase functions:log --only onMessageCreated --limit 50
   ```
4. **Look for:**
   ```
   🔍 Embedding message for semantic search: [messageId]
   ✅ Message embedding initiated for: [messageId]
   ```

**Expected Result:**
- ✅ Message sent successfully
- ✅ Embedding log appears in Firebase
- ✅ No errors in logs
- ✅ Pinecone vector count increases (check dashboard)

**Status:** ⏳ PENDING (Test after deployment)

---

### Test 2: AI Assistant Tab Exists
**Goal:** Verify new AI Assistant tab is visible

1. **Open your app**
2. **Check bottom tab bar**
3. **Look for "AI Assistant" tab with sparkles icon ✨**

**Expected Result:**
- ✅ New tab appears in navigation
- ✅ Sparkles icon displays correctly
- ✅ Tapping tab opens AI chat screen

**Status:** ⏳ PENDING (Check app UI)

---

### Test 3: AI Assistant Query (Simple)
**Goal:** Verify agent can respond to basic queries

1. **Open AI Assistant tab**
2. **Send query:**
   ```
   "Hello! What can you help me with?"
   ```
3. **Observe response streaming**

**Expected Result:**
- ✅ Response streams token-by-token
- ✅ Agent describes capabilities (summarize, actions, decisions, search)
- ✅ No errors displayed
- ✅ Response completes successfully

**Status:** ⏳ PENDING (Test in app)

---

### Test 4: AI Assistant Query (Tool Use)
**Goal:** Verify agent can call tools

1. **Send query:**
   ```
   "List my active chats"
   ```
2. **Watch for:**
   - Tool call indicator (if UI shows it)
   - Firebase logs for tool execution

**Expected Result:**
- ✅ Agent calls `getUserChatsTool`
- ✅ Returns list of your chats
- ✅ Response includes chat names
- ✅ No errors

**Status:** ⏳ PENDING (Test in app)

---

### Test 5: Semantic Search
**Goal:** Verify search by meaning (not keywords)

**Prerequisites:** Send a few messages first with varied content:
- "Let's deploy the new API next week"
- "The database migration is scheduled for Friday"
- "We need to refactor the authentication flow"

**Test Query:**
```
"Find messages about launching new features"
```
(Note: "launching" and "new features" weren't in messages, but "deploy" is semantically similar)

**Expected Result:**
- ✅ Returns message about "deploy the new API"
- ✅ Semantic match (not keyword match)
- ✅ Shows relevance score
- ✅ Includes context (messages before/after)

**Status:** ⏳ PENDING (Test after sending messages)

---

### Test 6: Multi-Step Reasoning
**Goal:** Verify agent can perform complex workflows

**Test Query:**
```
"What decisions have we made, and what actions came from them?"
```

**Expected Result:**
- ✅ Agent calls `trackDecisionsTool` (Step 1)
- ✅ Agent calls `extractActionsTool` (Step 2)
- ✅ Combines results into coherent response
- ✅ Shows decisions and related actions

**Status:** ⏳ PENDING (Test in app)

---

## 📊 Firebase Console Checks

### Function Logs
```bash
firebase functions:log --limit 100
```

**Look for:**
- ✅ No critical errors
- ✅ Embedding operations logged
- ✅ AI agent invocations successful
- ⚠️ Any warnings are non-critical (e.g., AI detection failed)

---

### Firestore Console
1. **Open Firebase Console:** https://console.firebase.google.com
2. **Navigate to:** Firestore Database
3. **Check collections:**
   - `chats/` - Should have your test chats
   - `chats/{chatId}/messages/` - Should have your test messages
   - `users/` - Should have your user profile

---

### Pinecone Dashboard
1. **Open Pinecone Console:** https://app.pinecone.io
2. **Select Project:** ChatIQ (or your project name)
3. **Check Index:** `chatiq-messages`
4. **Verify:**
   - ✅ Vector count > 0 (if messages sent)
   - ✅ Dimension: 1536
   - ✅ Metric: cosine

---

## 🚨 Troubleshooting

### Issue: No embedding logs appear
**Possible Causes:**
- Message type is not 'text' (e.g., image)
- Function failed silently (check logs for errors)
- Pinecone credentials not configured

**Debug:**
```bash
firebase functions:log --only onMessageCreated --limit 50
```

**Fix:**
- Verify message is text (not image/file)
- Check `.env` and Firebase config for Pinecone credentials
- Verify OpenAI API key is valid

---

### Issue: AI Assistant tab doesn't appear
**Possible Cause:** App needs rebuild

**Fix:**
```bash
npx expo start --clear
```
Then reopen app on device/simulator

---

### Issue: Agent doesn't respond
**Possible Causes:**
- Firebase Function timeout
- OpenAI API error
- Authentication issue

**Debug:**
```bash
firebase functions:log --only aiAgent --limit 50
```

**Fix:**
- Check OpenAI API key in Firebase config
- Verify user is authenticated
- Check Firebase Functions logs for specific error

---

### Issue: Tool calls fail
**Possible Cause:** Tool-specific error (e.g., no data)

**Debug:**
- Check Firebase logs for tool execution
- Verify data exists (e.g., chats, messages, decisions)

**Fix:**
- Ensure test data exists
- Check tool implementation for bugs
- Verify Firestore permissions

---

## ✅ Final Verification

Run this command to get a complete status:
```bash
echo "=== Pinecone Connection ===" && \
npx tsx test-pinecone.ts && \
echo "" && \
echo "=== Firebase Functions Status ===" && \
firebase functions:list && \
echo "" && \
echo "=== Recent Function Logs ===" && \
firebase functions:log --limit 20
```

**Expected Output:**
- ✅ Pinecone: All tests passed
- ✅ Functions: 9 functions listed
- ✅ Logs: No critical errors

---

## 📝 Test Results

### Summary
- [x] Pinecone connection: ✅ PASSED
- [x] Firebase deployment: ✅ PASSED
- [x] Environment config: ✅ CONFIGURED
- [ ] Auto-embedding: ⏳ PENDING (send message)
- [ ] AI Assistant UI: ⏳ PENDING (check app)
- [ ] Simple query: ⏳ PENDING (test in app)
- [ ] Tool use: ⏳ PENDING (test in app)
- [ ] Semantic search: ⏳ PENDING (test in app)
- [ ] Multi-step reasoning: ⏳ PENDING (test in app)

**Overall Status:** 🟡 Infrastructure Ready, App Testing Pending

---

## 🎯 Next Steps

1. **Rebuild & Launch App:**
   ```bash
   npx expo start --clear
   ```

2. **Test Auto-Embedding:**
   - Send a message
   - Check Firebase logs
   - Verify Pinecone vector count

3. **Test AI Assistant:**
   - Open AI Assistant tab
   - Try simple query
   - Try tool-based query
   - Try complex multi-step query

4. **Monitor & Iterate:**
   - Watch Firebase logs for errors
   - Check Pinecone dashboard for usage
   - Gather user feedback
   - Iterate on prompts and tools

---

**Your AI Agent is deployed and ready to test!** 🚀

All infrastructure is verified and working. The remaining steps are app-level testing to ensure the UI and end-to-end flows work as expected.

**Happy Testing!** 🎉

