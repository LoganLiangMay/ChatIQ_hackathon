# 🧪 Quick Test Guide - Decision Intelligence

**Time to test:** 2 minutes ⏱️

---

## Step 1: Reload App (10 seconds)

In your Expo terminal:
```
Press 'r' to reload
```

OR on your device:
```
Shake device → Tap "Reload"
```

---

## Step 2: Open Decisions Tab (5 seconds)

Tap the **Decisions** icon in the bottom navigation (git-branch icon)

### ✅ Expected Behavior:
1. Shows "Loading decisions..." briefly
2. If first time: "Scanning chats for decisions..."
3. Shows decisions OR "No decisions found"
4. Does NOT loop infinitely ✅

---

## Step 3: Watch Console Logs (30 seconds)

In Expo terminal, you should see:
```
🔍 Starting decision scan for X chats...
📊 Extracting decisions from [chatId]...
✅ Found X decisions in chat
✅ Saved X decisions to Firestore
✅ Scan complete! X success, 0 errors, X total decisions
```

### ✅ Good Signs:
- "Scan complete!" appears
- No infinite loops
- Numbers make sense

### ❌ Bad Signs:
- "Error extracting decisions"
- Keeps rescanning forever
- Function timeout

---

## Step 4: Check Firebase Console (30 seconds)

Open: https://console.firebase.google.com/project/messageai-mvp-e0b2b/firestore

### Look for `decisions` collection:
```
decisions/
  decision_1729704754027_abc123/
    ✅ decision: "Let's do Voodoo Dough..."
    ✅ topic: "Desserts for Paul's birthday"
    ✅ confidence: 0.9
    ✅ decisionThread: Array[3]
    ✅ sentiment: Object
    ✅ participants: Array
    ✅ userId: your-user-id
    ✅ chatId: chat-id
    ✅ timestamp: 1666544915000
```

### Look for `projects` collection (if any projects mentioned):
```
projects/
  project_alpha_chatid/
    ✅ name: "Project Alpha"
    ✅ status: Object (current + timeline)
    ✅ sentiment: Object (confusion, blockers)
    ✅ mentions: Array
```

---

## Step 5: Test Manual Refresh (10 seconds)

In Decisions tab:
1. Pull down on the list
2. Should show "Scanning..." 
3. Should finish and update

---

## Step 6: Test Navigation (10 seconds)

1. Tap on any decision
2. Should navigate to the chat where it was made
3. Tap back
4. Should return to Decisions tab

---

## ✅ Success Criteria

- [x] App loads without crashing
- [x] Decisions tab opens
- [x] Auto-scan runs ONCE (not infinite)
- [x] Console shows "Scan complete!"
- [x] Decisions appear in Firestore
- [x] Pull-to-refresh works
- [x] Navigation works

---

## ❌ Common Issues

### Issue: "No decisions found"
**Cause:** Your chats don't have decision language

**Test with these messages:**
```
User 1: "Should we order pizza or sushi?"
User 2: "I think pizza is better"
User 3: "Let's go with pizza"
```

### Issue: Function timeout
**Fix:** Reduce message limit in `decisions.tsx` line 70:
```typescript
const decisions = await trackDecisions(chat.id, 50); // Was 100
```

### Issue: Keeps scanning forever
**Fix:** Already applied! Make sure you reloaded the app.

### Issue: "Missing index" error
**Fix:** Already deployed! Wait 2-5 minutes for indexes to build.

---

## 📊 What to Expect

### First Time Opening Decisions Tab:
```
[0 seconds] Loading decisions...
[1 second]  0 decisions loaded (none in Firestore yet)
[2 seconds] Starting decision scan...
[5-30 secs] Scanning chats... (depends on chat count)
[30+ secs]  Scan complete! X decisions found
[31 secs]   Decisions appear in UI ✅
```

### Subsequent Opens:
```
[0 seconds] Loading decisions...
[1 second]  X decisions loaded from Firestore ✅
[1 second]  Decisions displayed (NO auto-scan) ✅
```

### Manual Refresh:
```
[0 seconds] Pull down...
[1 second]  Scanning chats...
[5-30 secs] Processing...
[30+ secs]  Scan complete! Updated ✅
```

---

## 🎯 Quick Checklist

Run through this in 2 minutes:

1. ⬜ Reload app
2. ⬜ Open Decisions tab
3. ⬜ Check console logs (no errors?)
4. ⬜ Check Firebase Console (data there?)
5. ⬜ Pull to refresh (works?)
6. ⬜ Tap a decision (navigates to chat?)

If all ✅ → **You're good to go! 🎉**

---

## 🔧 Debug Commands

### Check Firebase Function Logs:
```bash
cd /Applications/Gauntlet/chat_iq
firebase functions:log --only extractDecisions --limit 20
```

### Check Index Status:
```bash
open "https://console.firebase.google.com/project/messageai-mvp-e0b2b/firestore/indexes"
```

### Rebuild and Redeploy Function:
```bash
cd /Applications/Gauntlet/chat_iq/functions
npm run build
cd ..
firebase deploy --only functions:extractDecisions
```

---

## 🎉 Done!

**Your Decision Intelligence System is ready!** 🚀

Now open some chats and have conversations with decisions:
- "Should we use React or Vue?"
- "I think React is better"
- "Let's go with React then"

Watch them get automatically tracked! ✨

