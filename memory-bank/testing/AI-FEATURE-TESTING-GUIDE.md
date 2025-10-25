# AI Feature Testing Guide

## Overview
This guide provides step-by-step instructions for testing all AI features in ChatIQ/MessageAI.

**Last Updated:** October 24, 2025
**Testing Status:** All features deployed and ready for testing

---

## Prerequisites

### 1. Environment Setup
Ensure your `.env` file has all required API keys:
```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...

# Pinecone (for semantic search)
EXPO_PUBLIC_PINECONE_API_KEY=...
EXPO_PUBLIC_PINECONE_INDEX_NAME=...

# LangSmith (for conversational AI tracing)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=...
LANGCHAIN_PROJECT=...
```

### 2. Deployment Check
Verify all functions are deployed:
```bash
firebase functions:list
```

Expected functions:
- ✅ `detectPriority`
- ✅ `summarizeThread`
- ✅ `extractActionItems`
- ✅ `extractDecisions`
- ✅ `detectBlockers`
- ✅ `searchMessages`
- ✅ `knowledgeAgent`
- ✅ `onMessageCreated`

### 3. Start the App
```bash
npx expo start --clear
```

---

## Feature #1: Priority Detection (Automatic)

### What It Does
Automatically detects urgent messages and marks them with a priority badge.

### How to Test

1. **Send a Priority Message**
   - Open any chat
   - Send message: `URGENT: Server is down! Need help immediately!`
   - Wait 2-6 seconds for AI processing

2. **Expected Results**
   - Message should display a `🔴 PRIORITY` badge
   - Red accent color on the message
   - Priority score: 0.7-1.0 (high urgency)

3. **Verify in Logs**
   Look for:
   ```
   ✅ Priority detected and saved
   urgencyLevel: high
   score: 0.8
   ```

4. **Test Non-Priority**
   - Send: `Hey, how are you?`
   - Should NOT show priority badge

### Debugging
- Check Firebase Functions logs: `firebase functions:log`
- Look for errors in `onMessageCreated` function
- Verify OpenAI API key is valid

---

## Feature #2: Thread Summarization (Manual)

### What It Does
Generates a concise summary of recent conversation with key points, decisions, and action items.

### How to Test

1. **Prepare Test Chat**
   - Navigate to chat with Wataru (or any chat)
   - Should have 20+ messages discussing:
     - Decisions (e.g., "Let's order cookies from Voodoo Dough")
     - Action items (e.g., "I'll send the report by Friday")
     - Topics (e.g., desserts, projects, deadlines)

2. **Trigger Summary**
   - Tap the chat header (at the top)
   - Tap "Summarize" button
   - Wait 2-3 seconds

3. **Expected Results**
   - Summary modal appears with:
     - **Summary**: Paragraph summarizing conversation
     - **Key Decisions**: Bullet points of decisions made
     - **Action Items**: Tasks mentioned with owners
     - **Timeframe**: Date range of messages
     - **Message Count**: Number of messages analyzed

4. **Verify Content**
   - Summary should mention: cookies, tiramisu, Voodoo Dough, Paul's birthday
   - Decisions should include: "Order two boxes from Voodoo Dough"
   - Action items should include: "Report due Friday", "Design by tomorrow"

### Debugging
- Check logs: `🤖 Generating AI summary for chat: ...`
- If fails: Verify `summarizeThread` function is deployed
- Check OpenAI API quota

---

## Feature #3: Action Items Extraction (Manual + Auto)

### What It Does
Extracts tasks and to-dos from conversations and tracks them.

### How to Test

1. **Navigate to Actions Tab**
   - Tap "Actions" in bottom navigation
   - App auto-scans all chats on first load

2. **Expected Results**
   - List of action items from your chats:
     ```
     ☐ Send report by Friday
       Owner: Wataru
       Chat: Wataru
       Due: Friday

     ☐ Finish design by tomorrow
       Owner: Wataru
       Chat: Wataru
       Due: Tomorrow
     ```

3. **Test Manual Extraction**
   - Go to a chat
   - Send: `I'll review the code changes and send feedback by EOD`
   - Return to Actions tab
   - Tap refresh icon (top right)
   - Should see new action item

4. **Mark as Complete**
   - Tap checkbox next to an item
   - Item should move to "Completed" section with strikethrough

### Debugging
- Check logs: `📊 Scanning {chatId} for NEW action items`
- If "Missing permissions" error:
  - Firestore rules were just updated (deployed above)
  - Try restarting the app
- Check `extractActionItems` function deployment

---

## Feature #4: Decision Tracking (Manual + Auto)

### What It Does
Tracks important decisions made in conversations.

### How to Test

1. **Navigate to Decisions Tab**
   - Tap "Decisions" in bottom navigation
   - App auto-scans all chats

2. **Expected Results**
   - List of decisions:
     ```
     ✓ Order two boxes of mixed desserts from Voodoo Dough
       Context: For Paul's birthday
       Date: [timestamp]
       Chat: Wataru
     ```

3. **Test Manual Extraction**
   - Go to a chat
   - Send: `We decided to use React Native for the mobile app`
   - Return to Decisions tab
   - Tap refresh
   - Should see new decision

4. **Verify Filters**
   - Filter by chat (dropdown at top)
   - Filter by date range

### Debugging
- Check logs: `📊 Scanning {chatId} for NEW decisions`
- "Missing permissions" → Firestore rules updated, restart app
- Check `extractDecisions` function deployment

---

## Feature #5: Semantic Search (Real-time)

### What It Does
AI-powered search that understands meaning, not just keywords.

### How to Test

1. **Navigate to Search Tab**
   - Tap "Search" in bottom navigation

2. **Test Semantic Queries**

   **Query 1: Search by Person**
   - Type: `wataru`
   - Should show messages from Wataru

   **Query 2: Search by Topic**
   - Type: `desserts`
   - Should show messages about cookies, tiramisu, Voodoo Dough

   **Query 3: Search by Meaning**
   - Type: `urgent issues`
   - Should show priority messages about server outage

3. **Expected Results**
   - Results appear as you type (debounced 500ms)
   - Each result shows:
     - Message content
     - Sender name
     - Timestamp
     - Chat name (if group)

4. **Test Filters** (if implemented)
   - Filter by priority
   - Filter by date range
   - Filter by sender

### Debugging
- Check logs: `🧠 Using AI semantic search for: {query}`
- If no results:
  - Messages might not be embedded yet (happens on message creation)
  - Check Pinecone API key
  - Verify `searchMessages` function deployment

---

## Feature #6: Project Overview (Group Chats)

### What It Does
Provides AI-powered project insights for group chats.

### How to Test

1. **Open Group Chat**
   - Navigate to the group chat "Desserts"
   - Tap header → "Group Info"

2. **Trigger Project Overview**
   - Tap "Project Overview" button
   - Modal appears with 3 tabs

3. **Expected Results**

   **Tab 1: Progress**
   - Progress percentage (0-100%)
   - Pie chart visualization
   - Active contributors list

   **Tab 2: Blockers**
   - List of blockers detected:
     ```
     🚫 Waiting for budget approval
        Context: Can't proceed until finance approves
        Severity: high
     ```

   **Tab 3: Decision Tree**
   - Mermaid flowchart showing:
     - Project start
     - Key decisions
     - Blockers

4. **Verify Data**
   - Progress should be calculated from completed vs total tasks
   - Blockers should include actual blockers from chat
   - Decision tree should show recent decisions

### Debugging
- Check logs:
  ```
  🔍 [detectBlockers] Starting blocker detection
  🔍 [getFunctionsInstance] Auth token refreshed
  ```
- If "unauthenticated" error:
  - Auth fix was applied above (token refresh)
  - Try restarting app to clear cache
- Check `detectBlockers` function deployment (redeployed above)

---

## Feature #7: Conversational AI Assistant

### What It Does
Answer questions about your conversations using AI with RAG (Retrieval-Augmented Generation).

### How to Test

1. **Navigate to AI Assistant Tab**
   - Tap "AI Assistant" in bottom navigation

2. **Test Simple Queries (Client-Side)**
   - Type: `What is ChatIQ?`
   - Should respond quickly (~500ms) using client-side Vercel AI SDK

3. **Test Complex Queries (Server-Side RAG)**
   - Type: `What did we decide about desserts for Paul's birthday?`
   - Should search messages using Pinecone
   - Respond with context from actual messages

4. **Expected Results**
   - Response streams in real-time (word by word)
   - Cites specific messages when answering
   - Can answer questions like:
     - "What are my pending action items?"
     - "What decisions were made last week?"
     - "Who is working on the deployment?"

### Debugging
- Check logs:
  ```
  🤖 Using client-side agent for simple query
  🌐 Using server-side agent for complex query
  ```
- If no response:
  - Check LangSmith dashboard for traces
  - Verify `knowledgeAgent` function deployment
  - Check Pinecone index has embeddings

---

## Common Issues & Solutions

### Issue #1: "Missing or insufficient permissions"
**Cause:** Firestore security rules not deployed
**Solution:**
```bash
firebase deploy --only firestore:rules
```

### Issue #2: "unauthenticated" when calling functions
**Cause:** Auth token not attached to request
**Solution:**
- Fixed in AIService.ts (token refresh added)
- Restart app to clear cache
- Verify user is signed in

### Issue #3: "Function not found"
**Cause:** Function not deployed
**Solution:**
```bash
cd functions
npm run build
firebase deploy --only functions
```

### Issue #4: No search results
**Cause:** Messages not embedded
**Solution:**
- Wait for messages to be embedded (happens on creation)
- Check Pinecone dashboard for vector count
- Verify OpenAI embeddings API key

### Issue #5: Slow AI responses
**Cause:** Cold start or OpenAI API latency
**Expected:**
- Priority Detection: 2-6 seconds
- Summarization: 2-3 seconds
- Search: 1-2 seconds
- Conversational AI: 1-3 seconds (streaming)

---

## Testing Checklist

Before marking features as complete, verify:

- [ ] Feature #1: Priority Detection works automatically
- [ ] Feature #2: Summarization generates accurate summaries
- [ ] Feature #3: Action Items extracted and displayed
- [ ] Feature #4: Decisions tracked across chats
- [ ] Feature #5: Semantic search returns relevant results
- [ ] Feature #6: Project Overview shows blockers and progress
- [ ] Feature #7: AI Assistant answers questions correctly
- [ ] All Firebase Functions deployed successfully
- [ ] Firestore security rules deployed
- [ ] No console errors during testing
- [ ] UI updates in real-time (Firestore listeners working)

---

## Next Steps After Testing

1. **Monitor Costs**
   - OpenAI Dashboard: Check usage and billing
   - Firebase Console: Check function invocations
   - Pinecone Dashboard: Check vector operations

2. **Optimize Performance**
   - Add caching for repeated queries
   - Implement rate limiting
   - Add loading states for better UX

3. **Production Readiness**
   - Add error boundaries
   - Implement retry logic
   - Add analytics tracking
   - Set up monitoring/alerting

---

## Support

If you encounter issues:
1. Check logs in Metro bundler
2. Check Firebase Functions logs: `firebase functions:log`
3. Check Firestore data in Firebase Console
4. Check LangSmith traces for AI agent
5. Review this guide's debugging sections

**Happy Testing! 🚀**
