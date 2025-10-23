# 🧪 Test Urgent Features - Quick Guide

## 🎯 What to Test

You should now see **3 new visual indicators** for urgent messages:

1. ✅ **Red Border** around avatar (in chat list)
2. ✅ **"Urgent Messages" Section** (at top of chat list)
3. ✅ **Priority Badge** (🚨 icon next to timestamp)

---

## 📱 Testing Steps

### Step 1: **Force Close Both Apps**

On **both Wataru's device AND Logan's iPad**:
1. Double-click home button (or swipe up from bottom)
2. Swipe up on **Expo Go** to close it completely
3. Reopen **Expo Go**
4. Open the **MessageAI** app

> 💡 **Why?** Ensures latest code is loaded with all UI fixes

---

### Step 2: **Send Urgent Message** (From Wataru)

Send this exact message:
```
URGENT: Testing server-side priority detection!
```

Wait **5 seconds** for server to process.

---

### Step 3: **Check Logan's iPad**

On Logan's device:

#### 3a. Go to Chat List
- Swipe back to the main chat list
- **Pull down to refresh** (drag finger down from top)

#### 3b. Look For These 3 Things:

1. **🔴 Red Border Around Avatar**
   - Wataru's blue avatar circle should have a thick red border (3px)
   
2. **📍 "Urgent Messages" Section**
   - Should appear **ABOVE** "ALL CHATS"
   - Red background with alert icon
   - Shows: "URGENT MESSAGES (1)"
   - Wataru's chat listed in this section

3. **🚨 Priority Badge**
   - Small red badge with ⚠️ icon
   - Next to the timestamp (9:43 PM)
   - In both sections (Urgent + All Chats)

---

### Step 4: **Open the Chat**

Tap on Wataru's chat to open it.

**Inside the chat, look for:**
- Priority badge **above the message bubble**
- Shows: "🚨 CRITICAL" or "⚠️ HIGH"
- Full badge (not compact)

---

## 🐛 If You Don't See the Features

### Try These in Order:

#### 1. **Pull to Refresh**
- In the chat list, drag down to force a refresh

#### 2. **Force Close & Reopen**
- Completely close Expo Go
- Reopen and go back to chat list

#### 3. **Send Another Urgent Message**
- From Wataru: "CRITICAL: Need immediate response!"
- Wait 10 seconds
- Check Logan's chat list

#### 4. **Check Firestore Directly**
If still not working, let me verify the data is in Firestore:

```bash
firebase firestore:export
```

---

## ✅ Success Checklist

- [ ] Red border appears around Wataru's avatar
- [ ] "Urgent Messages" section shows at top
- [ ] Priority badge (🚨) shows next to timestamp
- [ ] Opening chat shows full priority badge above message
- [ ] Works instantly without opening the chat first

---

## 📸 What It Should Look Like

### Chat List (Before):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━
  Chats                🔍 ✏️
━━━━━━━━━━━━━━━━━━━━━━━━━━
  ALL CHATS
━━━━━━━━━━━━━━━━━━━━━━━━━━
  [WA]  Wataru          9:43PM
        Urgent respond now...
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Chat List (After):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━
  Chats                🔍 ✏️
━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚨 URGENT MESSAGES (1)
━━━━━━━━━━━━━━━━━━━━━━━━━━
  [[WA]]  Wataru    🚨  9:43PM  ← Red border
          Urgent respond now...
━━━━━━━━━━━━━━━━━━━━━━━━━━
  ALL CHATS
━━━━━━━━━━━━━━━━━━━━━━━━━━
  [[WA]]  Wataru    🚨  9:43PM  ← Red border
          Urgent respond now...
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> **Note:** `[[WA]]` = Blue avatar with RED border  
> **Note:** `🚨` = Priority badge (red icon)

---

## 🚀 Additional Test Cases

After verifying the UI works, try these:

### Test Case 1: **Non-Urgent Message**
Send: "Hey, how are you?"
- ❌ Should NOT show red border
- ❌ Should NOT appear in "Urgent Messages"
- ✅ Should appear in "All Chats" only

### Test Case 2: **Multiple Urgent Messages**
Send 3 urgent messages:
1. "URGENT: Server down!"
2. "CRITICAL: Need help now!"
3. "ASAP: Review this immediately!"

Check:
- ✅ "Urgent Messages (1)" section (only 1 chat)
- ✅ All 3 messages have priority badges inside chat
- ✅ Red border stays on avatar

### Test Case 3: **Medium Priority**
Send: "Meeting in 30 minutes, please confirm"
- ✅ Should show ORANGE badge (not red)
- ❌ Should NOT appear in "Urgent Messages" (score < 0.6)
- ✅ Should show in "All Chats"

---

## 🔍 Debugging Commands

If something doesn't work, run these on your Mac:

### Check Firebase Logs
```bash
cd /Applications/Gauntlet/chat_iq
firebase functions:log | grep -E "Priority detected|Checking priority" | tail -20
```

### Check Firestore Data
```bash
# Check if priority was saved
firebase firestore:get chats/[CHAT_ID]/messages/[MESSAGE_ID]
```

---

## 📞 Report Results

After testing, tell me:

1. ✅ or ❌ Red border on avatar?
2. ✅ or ❌ "Urgent Messages" section?
3. ✅ or ❌ Priority badge in chat list?
4. ✅ or ❌ Priority badge in message bubble?
5. Any errors or unexpected behavior?

---

**Ready to test? Go for it!** 🚀

