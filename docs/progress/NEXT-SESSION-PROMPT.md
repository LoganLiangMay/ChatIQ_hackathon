# 🚀 Next Session Prompt - AI Feature Implementation

**Copy this entire prompt into your next Cursor chat session:**

---

## Context

I'm building MessageAI, a React Native messaging app with AI-powered features. I've successfully completed **Feature #2 (Thread Summarization)** with:
- ✅ Backend deployed (Firebase Cloud Functions + OpenAI)
- ✅ UI integrated (centered modal with status indicators)
- ✅ Tested and working on iPad via Expo Go

**Current Progress:**
- Feature #1 (Priority Detection): Backend deployed ✅, UI integration pending ⏳
- Feature #2 (Thread Summarization): 100% complete ✅
- Features #3-5: Not started

**Tech Stack:**
- React Native + Expo (Expo Go testing on iPad)
- Firebase (Firestore, Cloud Functions, Auth)
- OpenAI API (GPT-4-mini)
- TypeScript

**Project Location:** `/Applications/Gauntlet/chat_iq/`

---

## Your Task: Complete Feature #1 - Priority Detection UI

### What's Already Done:
1. ✅ Firebase Function deployed and live
   - URL: `https://us-central1-messageai-mvp-e0b2b.cloudfunctions.net/detectPriority`
   - Working with OpenAI API
   - Returns: `{ isPriority: boolean, score: number, urgencyLevel: 'low'|'medium'|'high'|'critical', reason: string }`

2. ✅ `PriorityBadge` component created
   - File: `components/ai/PriorityBadge.tsx`
   - Shows visual indicator for medium/high/critical messages
   - Color-coded (orange, red, bright red)

3. ✅ `useAI()` hook includes `detectPriority` method
   - File: `hooks/useAI.ts`
   - Ready to call from components

### What Needs to Be Done:
1. **Integrate priority detection into MessageList**
   - Call `detectPriority()` for incoming messages
   - Store priority result in message data
   - Display `PriorityBadge` component in message bubbles

2. **Add visual indicator in chat list**
   - Show priority badge in `ChatListItem` for high-priority chats
   - Make it easy to spot important conversations

3. **Test on Expo Go**
   - Test with urgent messages ("URGENT: Server down!")
   - Test with normal messages ("Hey, how are you?")
   - Verify badges appear correctly

### Implementation Guidance:

**Option 1: Real-time detection (when message received)**
```typescript
// In useMessages hook or MessageList component
const handleNewMessage = async (message) => {
  // Save message first
  await saveMessage(message);
  
  // Detect priority asynchronously
  if (message.senderId !== currentUserId) {
    const priority = await detectPriority(
      message.id, 
      message.content, 
      message.chatId
    );
    
    // Store in Firestore/SQLite
    await updateMessagePriority(message.id, priority);
  }
};
```

**Option 2: Batch detection (for existing messages)**
```typescript
// Run on chat open, detect priority for recent messages
useEffect(() => {
  const detectPriorities = async () => {
    const recentMessages = messages.slice(0, 10); // Last 10 messages
    for (const msg of recentMessages) {
      if (!msg.priority && msg.content) {
        const priority = await detectPriority(msg.id, msg.content, chatId);
        // Store result
      }
    }
  };
  detectPriorities();
}, [chatId]);
```

**Display in MessageBubble:**
```typescript
// Add to MessageBubble component
{message.priority && message.priority.isPriority && (
  <PriorityBadge 
    urgencyLevel={message.priority.urgencyLevel}
    score={message.priority.score}
    compact={true}
  />
)}
```

### Files to Modify:
- `hooks/useMessages.ts` - Add priority detection logic
- `components/messages/MessageBubble.tsx` - Display PriorityBadge
- `components/chat/ChatListItem.tsx` - Show priority in chat list
- `types/message.ts` - Add priority field to Message interface

### Testing Checklist:
- [ ] Send urgent message → See priority badge
- [ ] Send normal message → No badge shown
- [ ] Badge appears in correct color (orange/red)
- [ ] Badge visible in message list
- [ ] Badge visible in chat list preview
- [ ] No performance issues

### Success Criteria:
✅ Priority badge automatically appears on urgent messages  
✅ Color-coded correctly (medium=orange, high=red, critical=bright red)  
✅ Works in real-time as messages arrive  
✅ No noticeable lag or performance issues  
✅ Tested on Expo Go with 5+ test messages

---

## Alternative: If You Want to Do Feature #3 Instead

### Task: Implement Action Item Extraction

**What to do:**
1. Deploy `extractActionItems` Firebase Function (code already exists)
2. Create `ActionItemsList` component (show tasks as checklist)
3. Add button to chat screen (next to sparkles button)
4. Test with conversations containing action items

**Prompt:**
```
Complete Feature #3: Action Item Extraction for MessageAI

Backend code exists at functions/src/ai/extractActions.ts but needs deployment.
Create UI component to display action items as an interactive checklist.
Follow the same pattern as Feature #2 (Thread Summarization).

Files to check:
- functions/src/ai/extractActions.ts
- AI-PHASE-2-PROGRESS.md
- memory-bank/ai-implementation-progress.md
```

---

## Memory Bank Files to Review

Before starting, read these files:
1. `AI-PHASE-2-PROGRESS.md` - Overall progress tracker
2. `memory-bank/ai-implementation-progress.md` - Detailed implementation status
3. `components/ai/PriorityBadge.tsx` - Component to integrate
4. `hooks/useAI.ts` - Available methods

---

## Expected Time

**Feature #1 UI Integration:** 1-2 hours  
**Feature #3 Deployment:** 2-3 hours

---

## Questions to Ask the AI

1. "Show me how to integrate priority detection into the message receiving flow"
2. "Where should I call detectPriority() - in useMessages hook or MessageList component?"
3. "How do I store the priority result in both Firestore and SQLite?"
4. "Should I detect priority for all messages or just incoming ones?"

---

## Final Notes

- OpenAI API key is configured in Firebase ✅
- Functions are deployed and working ✅
- Expo Go is running on iPad ✅
- All infrastructure is ready ✅

**Just need to wire up the UI!** 🚀

---

**Copy this prompt and start your next session!**

