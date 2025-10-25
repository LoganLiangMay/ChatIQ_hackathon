# 🧪 Feature #3: Action Items - Quick Test Guide

## 📋 What to Test

**Action Item Extraction** analyzes conversations to find tasks, commitments, and to-dos automatically!

---

## 🎯 Test Steps

### 1. **Create Test Conversation**

**From Wataru's device, send these messages:**

```
Can you send me the report by Friday?
```

```
I'll finish the design by tomorrow
```

```
Please review the code changes
```

```
John will handle the deployment next week
```

---

### 2. **Extract Action Items**

**On Logan's iPad:**

1. Open the chat with Wataru
2. Look at the header
3. Tap the **📋 checkbox icon** (next to the ✨ sparkles)
4. Wait 2-3 seconds

---

### 3. **Verify Display**

You should see a modal with **4 action items**:

```
📋 Action Items                    ✕
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4 ACTION ITEMS FOUND

⭕ Send me the report by Friday
   ⏰ Friday  💬 2 min ago

⭕ Finish the design by tomorrow
   👤 Wataru  ⏰ tomorrow  💬 2 min ago

⭕ Review the code changes
   💬 2 min ago

⭕ Handle the deployment next week
   👤 John  ⏰ next week  💬 2 min ago
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tap items to mark as complete
```

---

### 4. **Test Interaction**

**Tap the first checkbox** (⭕)

✅ Should change to completed (✅)  
✅ Text should have strikethrough  
✅ Checkbox should turn green

**Tap it again**

✅ Should change back to pending (⭕)  
✅ Strikethrough should disappear  
✅ Checkbox should turn blue

---

### 5. **Test Close & Reopen**

1. Tap the ✕ to close modal
2. Tap the 📋 button again
3. Wait 2-3 seconds
4. Should show same items (fresh extraction)

---

## 🎨 What to Look For

### ✅ Success Indicators
- Modal opens smoothly
- Loading spinner shows briefly
- Action items display with task descriptions
- Owners shown when identified
- Deadlines shown when mentioned
- Source timestamps displayed
- Checkboxes toggle completion
- Strikethrough on completed items

### ❌ Potential Issues
- Modal doesn't open (check console logs)
- Loading never finishes (backend error)
- No action items found (normal if conversation has none)
- Extraction takes >5 seconds (check network)
- Checkboxes don't toggle (state issue)

---

## 🧪 Additional Test Cases

### Test Case 1: **Empty Conversation**

Create a new chat, send only:
```
Hey, how are you?
Good, thanks!
```

Extract action items:
- ✅ Should show "No action items found"
- ✅ Should show helpful empty state message

---

### Test Case 2: **Complex Tasks**

Send:
```
Can you and Sarah finish the presentation by Monday?
I need someone to call the client tomorrow morning
We should schedule a meeting for next Friday at 2pm
```

Extract action items:
- ✅ Should find 3 action items
- ✅ Should identify multiple owners
- ✅ Should capture specific times/dates

---

### Test Case 3: **Group Chat**

In a group chat, send:
```
@John can you handle the backend?
@Sarah will you do the design?
I'll write the documentation by Wednesday
```

Extract action items:
- ✅ Should identify specific owners
- ✅ Should find all 3 tasks
- ✅ Should capture deadline

---

## 📊 Expected Results

### Performance
- ⏱️ Response time: 2-3 seconds
- 💰 Cost: ~$0.001 per extraction
- 📝 Message limit: Last 50 messages

### Accuracy
- ✅ Should find obvious action items
- ✅ Should identify owners when mentioned
- ✅ Should extract deadlines when present
- ⚠️ May miss subtle implications
- ⚠️ May not handle complex grammar

---

## 🐛 If Something Goes Wrong

### Modal Won't Open
```bash
# Check Firebase Function logs
cd /Applications/Gauntlet/chat_iq
firebase functions:log --only extractActionItems | tail -20
```

### No Action Items Found
- Check if conversation actually contains tasks
- Try more explicit language ("Can you...", "I will...")
- Check console for errors

### Slow Performance
- Check network connection
- View Firebase logs for errors
- Try with fewer messages

---

## 📱 UI Components Reference

### Button Location
```
Chat Header:
[Back] [Avatar] Chat Name    [📋] [✨] [ℹ️]
                               ↑
                          Action Items
```

### Modal Structure
```
┌──────────────────────────────────┐
│ 📋 Action Items            ✕     │ ← Header
├──────────────────────────────────┤
│                                  │
│ 3 ACTION ITEMS FOUND             │ ← Count
│                                  │
│ ⭕ Task 1                        │ ← Item
│    👤 Owner  ⏰ Deadline         │ ← Metadata
│                                  │
│ ✅ Task 2 (strikethrough)        │ ← Completed
│    💬 2 hours ago                │
│                                  │
├──────────────────────────────────┤
│ Tap items to mark as complete    │ ← Footer
└──────────────────────────────────┘
```

---

## 🎯 Success Criteria

Feature is working if:
- [x] Button visible in chat header
- [x] Modal opens on tap
- [x] Loading state displays
- [x] Action items extracted correctly
- [x] Owners identified when mentioned
- [x] Deadlines shown when present
- [x] Checkboxes toggle state
- [x] Completion shows strikethrough
- [x] Empty state displays for no items

---

## 🔗 Next Steps

After testing Feature #3:
- ✅ If works: Mark Feature #3 complete
- 🎯 Move to Feature #4: Decision Tracking
- 📊 Current progress: 60% (3/5 features)

---

## 📝 Report Issues

If you find bugs, note:
1. What you tapped
2. What happened (or didn't happen)
3. Console error messages
4. Screenshots if possible

---

**Ready to test? Open a chat and tap the 📋 button!** 🚀

