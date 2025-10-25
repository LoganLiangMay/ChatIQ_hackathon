# 🔧 Fix: Decisions Tab Infinite Scanning

**Issue:** Decisions tab stuck in infinite scanning loop + no data in Firebase

---

## ✅ Fixed Issues

### 1. Infinite Scanning Loop
**Problem:** The auto-scan logic was triggering repeatedly

**Fix Applied:**
- Mark as scanned BEFORE starting the extraction
- Add `!scanning` check to prevent overlapping scans
- Add 500ms delay before triggering auto-scan to avoid race conditions
- Better logging to see what's happening

### 2. Check if Function is Actually Running

Let's verify the `extractDecisions` function is deployed and working.

---

## 🧪 Debug Steps

### Step 1: Check Function Logs (Terminal)
```bash
cd /Applications/Gauntlet/chat_iq
firebase functions:log
```

Look for:
- Any `extractDecisions` calls
- Error messages
- Response times

### Step 2: Check Firebase Console

1. Go to: https://console.firebase.google.com
2. Select project: `messageai-mvp-e0b2b`
3. Go to **Functions** → **extractDecisions**
4. Check:
   - ✅ Function is deployed?
   - ✅ Any invocations showing?
   - ✅ Any errors in logs?

### Step 3: Manual Test

Open your app and watch the Expo logs for:

```
🔍 Starting decision scan for X chats...
📊 Extracting decisions from [chatId]...
✅ Found X decisions in chat
OR
📭 No decisions found in chat
OR
❌ Error extracting decisions: [error message]
```

### Step 4: Check if Function is Being Called

The error might be:
1. **Function not deployed** - Check Firebase Console
2. **Function failing silently** - Check Firebase Function logs
3. **No actual decisions in messages** - Expected if no decision language used
4. **OpenAI API error** - Check Firebase logs for rate limits

---

## 🔍 Common Issues & Solutions

### Issue: "extractDecisions is not a function"
**Solution:** The function name in AIService.ts uses wrong name
```typescript
// In AIService.ts, line 105:
const extract = httpsCallable(this.functions, 'extractDecisions');
```
✅ This is correct!

### Issue: "No decisions found"
**Cause:** Your messages don't have decision language

**Test with these messages:**
```
"Should we order pizza or sushi?"
"I think pizza is better"
"Let's go with pizza"
```

### Issue: "Function times out"
**Cause:** Processing 100 messages is slow

**Solution:** Reduce to 50 messages:
```typescript
// In decisions.tsx, line 70:
const decisions = await trackDecisions(chat.id, 50); // Was 100
```

### Issue: Expo console shows errors
**Look for:**
```
❌ Error extracting decisions: [message]
```

Common errors:
- `unauthenticated` - User not logged in
- `permission-denied` - User not in chat
- `internal` - OpenAI API error or function crash

---

## 📊 Expected Behavior (After Fix)

### First Time Opening Decisions Tab:
1. Shows "Loading decisions..."
2. Loads 0 decisions from Firestore
3. Triggers auto-scan: "Scanning chats for decisions..."
4. Scans up to 10 chats
5. Shows "No decisions found" OR displays found decisions
6. Scanning stops ✅

### On Manual Refresh:
1. Click refresh button
2. "Scanning chats for decisions..."
3. Rescans all chats
4. Updates with new decisions
5. Scanning stops ✅

### Subsequent Opens:
1. Shows "Loading decisions..."
2. Loads existing decisions from Firestore
3. NO auto-scan (already scanned)
4. Displays decisions immediately ✅

---

## 🎯 Next Steps

### 1. Reload the App
```bash
# In terminal where Expo is running, press 'r' to reload
# OR shake iPad and tap "Reload"
```

### 2. Open Decisions Tab
Watch Expo console for logs:
- Should see "Starting decision scan"
- Should NOT loop infinitely
- Should see "Scan finished"

### 3. Check Firebase Console
Go to Firestore Database → Look for:
- `decisions` collection
- Any documents inside?

### 4. If Still No Decisions

**Test manually in Firebase Console:**

1. Go to Functions → extractDecisions
2. Click "Test function"
3. Use this test data:
```json
{
  "chatId": "YOUR_ACTUAL_CHAT_ID",
  "limit": 50
}
```
4. Check response

---

## 🐛 Quick Diagnostic

Run this in Expo console (while app is open):

```javascript
// Check if function exists
console.log('Function available:', typeof useAI !== 'undefined');

// Try calling manually
const { trackDecisions } = require('@/hooks/useAI').useAI();
trackDecisions('YOUR_CHAT_ID', 50).then(
  result => console.log('✅ Result:', result),
  error => console.error('❌ Error:', error)
);
```

---

## 📝 Current Status

- ✅ Fixed infinite scanning loop
- ✅ Added better logging
- ✅ Added error handling
- ⏳ Need to verify function is being called
- ⏳ Need to check Firebase for actual data

**Reload the app and check the console logs!**

