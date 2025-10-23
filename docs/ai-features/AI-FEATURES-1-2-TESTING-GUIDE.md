# 🧪 AI Features #1 & #2 - Testing Guide

**Date:** October 22, 2025  
**Features:** Priority Detection & Thread Summarization  
**Status:** ✅ DEPLOYED & UI INTEGRATED

---

## 🎯 Test Objectives

Following the @testing-mobile-mvp methodology, we'll validate:
1. ✅ Firebase functions are live and accessible
2. ✅ Authentication works correctly
3. ✅ Thread summarization generates accurate summaries
4. ✅ Priority detection identifies urgent messages
5. ✅ UI integration works seamlessly
6. ✅ Error handling is robust
7. ✅ Performance meets targets (<2s for priority, <3s for summaries)

---

## 📋 Pre-Test Setup

### 1. Verify Firebase Functions are Deployed

```bash
# Check deployed functions
cd /Applications/Gauntlet/chat_iq/functions
firebase functions:list

# Expected Output:
# ✔  detectPriority(us-central1)
# ✔  summarizeThread(us-central1)
# ✔  onMessageCreated(us-central1)
```

**Status:** ✅ Both functions confirmed live

- **detectPriority**: https://us-central1-messageai-mvp-e0b2b.cloudfunctions.net/detectPriority
- **summarizeThread**: https://us-central1-messageai-mvp-e0b2b.cloudfunctions.net/summarizeThread

### 2. Verify Environment Variables

```bash
# Check OpenAI API key is set
firebase functions:config:get openai

# Expected Output:
# {
#   "api_key": "sk-proj-..."
# }
```

### 3. Integration Changes Made

✅ **Chat Header** (`components/chat/ChatHeader.tsx`):
- Added ✨ sparkles button for AI summary
- Added `onSummarize` prop and handler
- Added `testID="summary-button"` for testing

✅ **Chat Screen** (`app/(tabs)/chats/[chatId].tsx`):
- Integrated `useAI()` hook
- Added `SummaryModal` component
- Added `handleSummarize` function
- Wired up summary button to modal

---

## 🧪 Test Scenarios

### Test #1: Feature #2 - Thread Summarization (Manual - Expo Go)

**Objective:** Verify AI can summarize a conversation thread

**Prerequisites:**
- 2 authenticated users in a chat
- At least 10 messages in the conversation
- Chat contains meaningful content (not just "hi", "hello")

**Steps:**
1. Open Expo Go on your iPad
2. Sign in as User A
3. Navigate to an existing chat with messages
4. **Tap the ✨ sparkles button** in the chat header (top right)
5. Observe loading state (spinner + "Generating summary...")
6. Wait for summary to appear (target: <3 seconds)

**Expected Results:**
✅ **UI Behavior:**
- Modal slides up from bottom
- Loading spinner shows immediately
- Loading message displays: "Generating summary..."
- Summary appears within 3 seconds
- Modal shows:
  - Summary text (concise overview)
  - Message count
  - Participant count
  - Time range (duration)
  - Participant names list

✅ **Summary Quality:**
- Captures main topics discussed
- Identifies key points
- Names participants correctly
- Shows accurate message count
- Time range is correct

✅ **Error Handling:**
- If no messages: Shows appropriate error
- If not authenticated: Shows auth error
- If API fails: Shows user-friendly error message

**Test Data Needed:**
```
Chat Requirements:
- Minimum 10 messages
- Multiple participants (for group chats)
- Varied content (questions, answers, decisions, action items)
- Recent timestamps (within last few days)
```

**Success Criteria (from PRD):**
- ✅ Response time: <3s for 50 messages
- ✅ Accuracy: Correctly summarizes conversation
- ✅ UI: Clean, intuitive modal display
- ✅ Error handling: Graceful failures with user feedback

**Console Logs to Monitor:**
```
Look for:
🤖 Generating AI summary for chat: [chatId]
✅ Summary generated: {summary, messageCount, ...}
❌ Summary error: [error message] (if fails)
```

---

### Test #2: Feature #1 - Priority Detection (Future Integration)

**Status:** ⏳ CODE READY - UI integration pending

**Current Implementation:**
- ✅ Firebase function deployed
- ✅ `detectPriority` endpoint live
- ✅ `PriorityBadge` component created
- ⏳ **Not yet integrated** into MessageList

**Next Steps for Full Integration:**
1. Call `detectPriority` when message received
2. Store priority result in message data
3. Display `PriorityBadge` in message bubble
4. Test with urgent/non-urgent messages

**Manual Test (via useAI hook):**

You can test priority detection by adding this to any screen:

```typescript
import { useAI } from '@/hooks/useAI';

const { detectPriority } = useAI();

// Test with urgent message
const testPriority = async () => {
  const result = await detectPriority(
    'test-001',
    'URGENT: Server is down! Need immediate help!',
    'test-chat'
  );
  console.log('Priority Result:', result);
};
```

**Expected Results:**
```json
{
  "isPriority": true,
  "score": 0.95,
  "urgencyLevel": "critical",
  "reason": "Contains urgent keywords and time sensitivity"
}
```

**Test Messages:**

| Message | Expected Priority | Expected Level |
|---------|------------------|----------------|
| "URGENT: Server is down!" | true | critical |
| "Can we meet ASAP?" | true | high |
| "Reminder: deadline tomorrow" | true | medium |
| "Hey, how are you?" | false | low |
| "Thanks for the update" | false | low |

---

## 🎬 Expo Go Testing Instructions

### Setup (One-Time)

1. **Install Expo Go** on your iPad (App Store)
2. **Start the dev server:**
   ```bash
   cd /Applications/Gauntlet/chat_iq
   npx expo start
   ```
3. **Scan QR code** with iPad camera
4. **Sign in** with test user account

### Test Flow for Thread Summarization

#### Step 1: Prepare Test Chat

**Option A: Use Existing Chat**
- Navigate to any chat with 10+ messages
- Ensure messages have substance (not just greetings)

**Option B: Create Test Chat**
1. Create new group chat with 2-3 users
2. Send 10-15 varied messages:
   - Questions and answers
   - Action items ("Can you send me X?")
   - Decisions ("Let's meet at 3pm")
   - Updates ("Finished the report")

#### Step 2: Execute Test

1. **Open Chat:**
   - Tap on chat from list
   - Wait for messages to load

2. **Trigger Summary:**
   - Look for ✨ sparkles icon (top right, next to info icon)
   - Tap the sparkles button

3. **Observe Loading:**
   - Modal should slide up immediately
   - See "Generating summary..." message
   - Spinner should animate

4. **Verify Summary:**
   - Wait for summary to appear (<3s)
   - Check metadata box:
     - Messages: Count should be accurate
     - Participants: Count should match
     - Time Range: Should show realistic duration
   - Read summary text:
     - Should capture main topics
     - Should be concise (2-4 sentences)
   - Check participants list:
     - All participants named
     - Names match actual users

5. **Test Error Handling:**
   - Try with empty chat (no messages)
   - Try with very new chat (1-2 messages)
   - Observe error messages

#### Step 3: Record Results

**Use this checklist:**

```
✅ UI Elements
[ ] Sparkles button visible in header
[ ] Button tap opens modal
[ ] Modal slides up smoothly
[ ] Loading spinner appears immediately
[ ] Loading text displays

✅ Summary Generation
[ ] Response time < 3 seconds
[ ] Summary text appears
[ ] Summary is accurate
[ ] Summary is concise

✅ Metadata Accuracy
[ ] Message count correct
[ ] Participant count correct
[ ] Time range reasonable
[ ] Participant names correct

✅ Error Handling
[ ] Empty chat shows appropriate error
[ ] Network error shows user-friendly message
[ ] Can close modal after error
[ ] App doesn't crash on error

✅ Performance
[ ] No UI lag when opening modal
[ ] No freezing during generation
[ ] Smooth scroll in summary text
[ ] Quick modal close animation
```

---

## 🔍 Debugging & Troubleshooting

### Common Issues

**Issue 1: "User must be authenticated" error**

**Cause:** Firebase Auth token not valid or expired

**Solution:**
```typescript
// Check auth state
import { useAuth } from '@/contexts/AuthContext';
const { user } = useAuth();
console.log('User:', user?.uid); // Should show UID
```

**Fix:**
1. Sign out and sign back in
2. Restart Expo Go
3. Check Firebase Console → Authentication → Users

---

**Issue 2: "Chat not found" error**

**Cause:** Chat doesn't exist in Firestore

**Solution:**
1. Send a message in the chat first
2. Check Firestore Console → chats collection
3. Verify chat has messages subcollection

---

**Issue 3: "No messages found" error**

**Cause:** Chat exists but messages subcollection is empty

**Solution:**
1. Send 1-2 messages to populate
2. Wait for Firestore sync (~1 second)
3. Try summary again

---

**Issue 4: Summary takes >5 seconds**

**Cause:** OpenAI API slow or high message count

**Solution:**
1. Check OpenAI API status: https://status.openai.com
2. Reduce messageLimit parameter (default: 50)
3. Check Firebase Functions logs:
   ```bash
   firebase functions:log --only summarizeThread
   ```

---

**Issue 5: Summary is generic/unhelpful**

**Cause:** Insufficient message content or poor quality

**Solution:**
- Use chat with substantial conversation
- Ensure messages have context (not just "ok", "yes", "no")
- Try chat with 20+ messages

---

### Monitoring Performance

**Firebase Console Monitoring:**

1. Go to: https://console.firebase.google.com
2. Select project: `messageai-mvp-e0b2b`
3. Navigate to: **Functions** → **Dashboard**
4. Check metrics:
   - Invocations count
   - Execution time (should be <3s avg)
   - Error rate (should be <5%)
   - Memory usage

**Logs Monitoring:**

```bash
# Watch live logs
firebase functions:log --only summarizeThread --follow

# Look for:
# ✅ "Summarization complete" with duration
# ✅ "tokensUsed: 1200" (should be <2000 for 50 messages)
# ❌ Any error messages
```

---

## 📊 Test Results Template

Use this template to record your test results:

```markdown
## Test Session: [Date/Time]
**Tester:** [Your Name]
**Device:** iPad / iPhone
**Expo Go Version:** [Version]

### Feature #2: Thread Summarization

**Test Chat Details:**
- Chat Type: Direct / Group
- Message Count: [X]
- Participants: [X]
- Content Quality: High / Medium / Low

**Results:**

| Metric | Target | Actual | Pass/Fail |
|--------|--------|--------|-----------|
| Response Time | <3s | __s | [ ] |
| Summary Accuracy | High | High/Med/Low | [ ] |
| Metadata Correct | Yes | Yes/No | [ ] |
| UI Smooth | Yes | Yes/No | [ ] |
| Error Handling | Graceful | Yes/No | [ ] |

**Summary Quality Assessment:**
- Captured main topics: [ ] Yes [ ] No
- Identified key points: [ ] Yes [ ] No
- Participant names correct: [ ] Yes [ ] No
- Concise and readable: [ ] Yes [ ] No

**Bugs Found:**
1. [Description of any bugs]
2. [Screenshots if applicable]

**Notes:**
[Any additional observations]
```

---

## ✅ Success Criteria Checklist

Before marking Features #1 & #2 as "COMPLETE", verify:

### Feature #2: Thread Summarization

- [ ] **Deployed:** Firebase function live and accessible
- [ ] **Authenticated:** Works with signed-in users
- [ ] **Accurate:** Summaries capture main topics and key points
- [ ] **Fast:** Response time consistently <3 seconds
- [ ] **UI/UX:** Modal is intuitive and displays all metadata
- [ ] **Error Handling:** Graceful failures with user feedback
- [ ] **Tested:** Verified with 10+ test cases on Expo Go
- [ ] **Documentation:** This testing guide complete

### Feature #1: Priority Detection (Partial)

- [ ] **Deployed:** Firebase function live and accessible
- [ ] **Component Ready:** PriorityBadge component created
- [ ] **Hook Ready:** useAI hook includes detectPriority method
- [ ] **Pending:** Integration into MessageList (next PR)

---

## 🚀 Next Steps

After completing tests on Expo Go:

1. **Record Results:**
   - Fill out Test Results Template
   - Take screenshots of successful summaries
   - Note any bugs or issues

2. **Update Progress:**
   - Mark completion status in `AI-PHASE-2-PROGRESS.md`
   - Update points earned (6/15 → 9/15 if both features work)

3. **Deploy Feature #3:**
   - If tests pass, proceed to Action Item Extraction
   - Repeat similar integration pattern

4. **Address Issues:**
   - Fix any bugs found
   - Optimize performance if needed
   - Improve error messages

---

## 📝 Testing Notes & Observations

**Reserved for tester notes:**

```
[Add your observations here during testing]

Examples:
- ✅ Summary button placement is intuitive
- ⚠️  Modal takes 4s to appear (slightly slow)
- 🐛 BUG: Modal doesn't close on backdrop tap
- 💡 SUGGESTION: Add "Copy Summary" button
```

---

**Last Updated:** October 22, 2025  
**Next Review:** After Expo Go testing complete  
**Status:** Ready for User Testing ✅

