# 🚀 Daily Summaries - Quick Start Guide

## ✅ What's New

Your ChatIQ app now automatically saves and displays daily chat summaries!

---

## 🎯 Key Features

### 1. **Automatic Daily Summaries** 🌙
- Runs every night at **1 AM UTC** (5 PM PST / 8 PM EST)
- Summarizes yesterday's messages for all active chats
- Saves to Firestore automatically
- No user action required

### 2. **Manual Summary Persistence** 💾
- When you tap "Summarize" button (sparkles ✨), it now:
  - Generates AI summary (as before)
  - **Saves to Firestore** for history
  - **Updates existing summary** if one exists for today
  - **Embeds for AI Assistant** semantic search

### 3. **Summary History Timeline** 📅
- **New calendar icon** in chat header
- Tap to view past summaries
- Timeline view (most recent first)
- Expandable cards with full summary
- Shows auto vs manual generation

---

## 🧪 Quick Test

### Test 1: View Summary History
```
1. Open any chat with existing messages
2. Tap "Summarize" button (sparkles icon) in header
3. Wait for summary to generate (5-10 seconds)
4. Close summary modal
5. Tap "Calendar" icon (📅) in header
6. See your summary in the history timeline!
```

### Test 2: Verify Firestore Storage
```
1. Go to Firebase Console > Firestore
2. Navigate to: chats/{chat-id}/summaries
3. Should see document with today's date (YYYY-MM-DD)
4. Document contains: summary, messageCount, participants, etc.
```

### Test 3: AI Assistant Context
```
1. Generate a summary for a chat (step Test 1)
2. Open "AI Assistant" tab
3. Ask: "What did we discuss today in [chat-name]?"
4. AI should reference the saved summary!
```

---

## 📊 What Happens Automatically

### Every Night at 1 AM UTC:
1. System scans all your chats
2. For each chat with messages from yesterday:
   - Generates AI summary
   - Saves to Firestore
   - Embeds in Pinecone for AI search
3. Skips chats with no messages
4. Skips dates with existing summaries

### When You Tap "Summarize":
1. Generates AI summary (existing feature)
2. **NEW:** Saves to Firestore
3. **NEW:** Updates if summary exists for today
4. **NEW:** Embeds for AI Assistant RAG
5. All happens automatically in background

---

## 🎨 UI Guide

### Calendar Icon (📅)
- **Location:** Chat header, right side (before info icon)
- **Function:** Opens summary history timeline
- **Shows:** Last 30 days of summaries

### Summary History Modal
- **Timeline View:** Most recent first
- **Date Headers:** Today, Yesterday, or "Mon, Jan 15"
- **Message Count:** "47 messages"
- **Auto/Manual Badge:** Shows how it was generated
- **Expand/Collapse:** Tap to read full summary
- **Participants:** Listed at bottom of each card

### Status Badges
- 🟢 **Auto** (Green) - Generated automatically at 1 AM
- 🔵 **Manual** (Blue) - User-triggered summary

---

## 📁 Where Summaries Are Stored

### Firestore Path
```
/chats/{chatId}/summaries/{date}

Example:
/chats/abc123/summaries/2025-10-24
```

### Document Structure
```typescript
{
  date: "2025-10-24",               // YYYY-MM-DD
  summary: "Sarah discussed...",     // AI-generated text
  messageCount: 47,                  // Messages included
  participants: ["Sarah", "Bob"],    // Who participated
  timeRange: { start: ..., end: ... },
  createdAt: 1729728000000,          // Timestamp
  updatedAt: 1729728000000,          // Last update
  generatedBy: "auto",               // "auto" or "manual"
  userId: "user123"                  // If manual, who
}
```

### Pinecone Storage
```
Vector ID: summary_{chatId}_{date}
Content: "Daily Summary (2025-10-24): [summary]"
Metadata: { type, date, messageCount, participants }
```

---

## 💡 Tips

### For Users
- **View History Anytime:** Tap calendar icon to see past summaries
- **Update Summary:** Tap "Summarize" again to refresh today's summary
- **AI Context:** AI Assistant can now reference all your summaries
- **Search Summaries:** Ask AI about past conversations by meaning

### For Developers
- **Check Logs:** `firebase functions:log --only generateDailySummaries`
- **Verify Schedule:** Daily job runs at 1 AM UTC
- **Monitor Costs:** ~$10/month additional for 30 active chats
- **Firestore Rules:** Already configured for authenticated access

---

## 🐛 Troubleshooting

### "No Summaries Yet"
- **Cause:** No summaries generated or saved
- **Solution:** 
  1. Tap "Summarize" button to generate first summary
  2. Wait until 1 AM UTC for first auto-run
  3. Check Firestore Console to verify

### Calendar Icon Not Showing
- **Cause:** App needs rebuild
- **Solution:** 
  ```bash
  npx expo start --clear
  ```

### Summary Not Saving
- **Cause:** User not authenticated or function error
- **Solution:** 
  1. Check Firebase logs: `firebase functions:log --only summarizeThread`
  2. Verify user is logged in
  3. Check Firestore permissions

---

## 📅 Schedule Details

### Daily Auto-Summary
- **Time:** 1 AM UTC (5 PM PST, 8 PM EST)
- **Timezone:** UTC (configurable in code)
- **Target:** Previous day's messages
- **Limit:** 100 messages per chat
- **Delay:** 1 second between chats (rate limit protection)

### Customize Schedule (Developers)
```typescript
// File: /functions/src/ai/dailySummaries.ts

export const generateDailySummaries = functions.pubsub
  .schedule('0 1 * * *') // Change this cron
  .timeZone('UTC')       // Change timezone
  .onRun(async (context) => { /* ... */ });
```

**Cron Examples:**
- `0 1 * * *` - 1 AM daily (current)
- `0 */6 * * *` - Every 6 hours
- `0 9 * * 1-5` - 9 AM Monday-Friday
- `30 22 * * *` - 10:30 PM daily

---

## 🚀 What's Next

### Immediate (Available Now)
- ✅ View summary history
- ✅ Generate manual summaries
- ✅ AI Assistant can reference summaries
- ✅ Auto-generation runs nightly

### Coming Soon (Future Enhancements)
- 📝 Edit summaries
- 🔄 Regenerate specific dates
- 📤 Share/export summaries
- 🔔 Daily summary notifications
- 📊 Weekly/monthly aggregates

---

## 📊 Cost Breakdown

| Component | Cost |
|-----------|------|
| Daily auto-summaries (30 chats) | ~$5-10/month |
| Firestore storage | <$1/month |
| Pinecone embeddings | <$1/month |
| **Total Additional** | **~$7-12/month** |

**Note:** Only active chats are summarized, so actual costs may be lower.

---

## 🎉 Summary

**Daily Summaries are now live!**

- 🌙 **Automatic:** Runs every night at 1 AM UTC
- 💾 **Persistent:** Saved forever in Firestore
- 📅 **Accessible:** View history anytime via calendar icon
- 🤖 **Smart:** AI Assistant can search summaries
- 💰 **Affordable:** ~$10/month additional

**Try it now:** Generate a summary, then tap the calendar icon! 🚀

---

**For complete details, see:** `DAILY-SUMMARIES-COMPLETE.md`

