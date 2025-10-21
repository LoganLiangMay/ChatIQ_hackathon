# 🧪 Testing Guide: Search Functionality (PR #9)

## ✅ Pre-Test Checklist

Before testing, ensure:
- [ ] App is running (`npm start` or `expo start`)
- [ ] You're signed in
- [ ] You have at least 2-3 chats with messages
- [ ] Firebase is connected
- [ ] Internet connection active

---

## 🔍 Test Suite: Search Functionality

### **Test 1: Access Search Screen**

**Steps:**
1. Open the app
2. Go to "Chats" tab (bottom navigation)
3. Look at the top right header
4. You should see TWO icons:
   - 🔍 **Search icon** (left)
   - ✏️ **New chat icon** (right)

**✅ Pass Criteria:**
- Both icons visible
- Search icon is left of new chat icon
- Icons are blue (#007AFF)

---

### **Test 2: Open Search Screen**

**Steps:**
1. From Chats screen
2. Tap the 🔍 search icon (top right)

**✅ Expected Result:**
```
┌─────────────────────────────────────────┐
│ 🔍  Search messages, chats...     ✕    │ ← Search bar
├─────────────────────────────────────────┤
│                                         │
│         🔍                              │
│                                         │
│   Search messages, chats, and users    │ ← Empty state
│                                         │
└─────────────────────────────────────────┘
```

**✅ Pass Criteria:**
- New screen opens
- Search bar at top with focus (keyboard appears)
- Cancel button (✕) on right
- Empty state shows search icon and text
- Placeholder: "Search messages, chats, users..."

---

### **Test 3: Message Search**

**Setup:** Send a test message with unique word (e.g., "xyztest123")

**Steps:**
1. In search screen
2. Type: "xyztest123" (or any word from your messages)
3. Wait 300ms (debounce delay)

**✅ Expected Result:**
```
┌─────────────────────────────────────────┐
│ 🔍  xyztest123                    ×  ✕ │
├─────────────────────────────────────────┤
│ MESSAGES                              1 │ ← Section header
├─────────────────────────────────────────┤
│ 💬  Chat Name                           │
│     This is xyztest123 highlighted      │ ← Yellow highlight
│     John Doe · 2m ago                   │
└─────────────────────────────────────────┘
```

**✅ Pass Criteria:**
- Results appear after 300ms delay
- "MESSAGES" section header shows
- Count shows number of results
- Matching text is highlighted in yellow
- Shows chat name, sender, timestamp
- Clear button (×) appears in search bar

**Test Variations:**
- Search "hello" → Multiple results
- Search "meeting" → Related messages
- Search "!" → Special characters work

---

### **Test 4: Debouncing (Performance)**

**Steps:**
1. In search screen
2. Type VERY QUICKLY: "h-e-l-l-o" (one letter at a time)
3. Watch for when search executes

**✅ Expected Behavior:**
- Search does NOT trigger on each letter
- Wait 300ms after LAST keystroke
- Only ONE search executes with "hello"
- Loading indicator may flash briefly

**Why This Matters:**
Without debouncing: 5 letters = 5 database queries ❌
With debouncing: 5 letters = 1 database query ✅

---

### **Test 5: Chat Search**

**Setup:** Have chats with names like "Team", "Project", "Family"

**Steps:**
1. In search screen
2. Type: "team"

**✅ Expected Result:**
```
┌─────────────────────────────────────────┐
│ CHATS                                 1 │
├─────────────────────────────────────────┤
│ TC  Team Chat                           │
│     Last message preview...             │
│     5 members                           │ ← For groups
└─────────────────────────────────────────┘
```

**✅ Pass Criteria:**
- Shows chats matching "team"
- Avatar with initials
- Last message preview
- Member count for groups
- "Direct chat" for 1:1

---

### **Test 6: User Search**

**Steps:**
1. In search screen
2. Type a user's name or email (someone NOT in your chats)
3. Example: "john" or "john@example.com"

**✅ Expected Result:**
```
┌─────────────────────────────────────────┐
│ USERS                                 2 │
├─────────────────────────────────────────┤
│ JD  John Doe                         🟢 │ ← Green dot = online
│     john@example.com                    │
│     Online                              │
├─────────────────────────────────────────┤
│ JS  John Smith                          │ ← No dot = offline
│     john.smith@example.com              │
│     Offline                             │
└─────────────────────────────────────────┘
```

**✅ Pass Criteria:**
- Shows matching users
- Avatar with initials
- Email shown if available
- Online/offline status
- Green dot for online users
- Results sorted (exact matches first)

---

### **Test 7: Start Chat from User Search**

**Steps:**
1. Search for a user (from Test 6)
2. Tap on a user result
3. Read the dialog

**✅ Expected Dialog:**
```
┌─────────────────────────────┐
│      Start Chat             │
│                             │
│ Start a conversation with   │
│ John Doe?                   │
│                             │
│  [Cancel]  [Start Chat]     │
└─────────────────────────────┘
```

**Steps:**
4. Tap "Start Chat"

**✅ Expected Result:**
- Dialog closes
- Chat screen opens
- New direct chat created
- You can send messages immediately

**✅ Pass Criteria:**
- Dialog appears with user's name
- "Cancel" dismisses dialog
- "Start Chat" creates chat
- Navigation works
- Chat appears in chats list

---

### **Test 8: Navigate to Chat from Message Result**

**Steps:**
1. In search screen
2. Search for a message: "hello"
3. Tap on a message result

**✅ Expected Result:**
- Search screen closes
- Chat screen opens for that specific chat
- You can see all messages in that chat
- Back button returns to chats list (not search)

**✅ Pass Criteria:**
- Correct chat opens
- Messages are visible
- Can send new messages
- Navigation stack correct

---

### **Test 9: Navigate to Chat from Chat Result**

**Steps:**
1. In search screen
2. Search for a chat: "team"
3. Tap on a chat result

**✅ Expected Result:**
- Same as Test 8
- Opens the correct chat
- Search screen closes

---

### **Test 10: Clear Search**

**Steps:**
1. In search screen
2. Type: "test"
3. Results appear
4. Tap the × button (clear button, left of cancel)

**✅ Expected Result:**
- Search query clears
- Input becomes empty
- Results disappear
- Shows empty state again
- Keyboard stays open
- Clear button disappears

---

### **Test 11: Cancel Search**

**Steps:**
1. In search screen
2. Type: "test"
3. Tap the ✕ button (cancel button, far right)

**✅ Expected Result:**
- Returns to Chats screen
- Search screen closes
- Keyboard dismisses
- Previous chat list is shown

---

### **Test 12: No Results**

**Steps:**
1. In search screen
2. Type: "xyznonexistent999"

**✅ Expected Result:**
```
┌─────────────────────────────────────────┐
│ 🔍  xyznonexistent999           ×  ✕   │
├─────────────────────────────────────────┤
│                                         │
│         😔                              │
│                                         │
│      No results found                  │
│                                         │
│   Try a different search term          │
│                                         │
└─────────────────────────────────────────┘
```

**✅ Pass Criteria:**
- Shows sad face icon
- "No results found" message
- Helpful subtext
- No error crashes

---

### **Test 13: Empty Query**

**Steps:**
1. In search screen
2. Don't type anything (empty input)

**✅ Expected Result:**
```
┌─────────────────────────────────────────┐
│ 🔍  Search messages, chats...        ✕ │
├─────────────────────────────────────────┤
│                                         │
│         🔍                              │
│                                         │
│   Search messages, chats, and users    │
│                                         │
└─────────────────────────────────────────┘
```

**✅ Pass Criteria:**
- Shows search icon
- Helpful placeholder text
- No results displayed
- No "No results" message

---

### **Test 14: Mixed Results**

**Steps:**
1. In search screen
2. Type a common word: "the" or "a"

**✅ Expected Result:**
```
┌─────────────────────────────────────────┐
│ MESSAGES                             15 │
├─────────────────────────────────────────┤
│ [Message results...]                    │
├─────────────────────────────────────────┤
│ CHATS                                 3 │
├─────────────────────────────────────────┤
│ [Chat results...]                       │
├─────────────────────────────────────────┤
│ USERS                                 2 │
├─────────────────────────────────────────┤
│ [User results...]                       │
└─────────────────────────────────────────┘
```

**✅ Pass Criteria:**
- All three sections appear
- Each has correct count
- Results are grouped by type
- Scrollable if many results
- All categories show

---

### **Test 15: Special Characters**

**Steps:**
Test these queries:
- "hello!"
- "what?"
- "meeting@"
- "test#1"
- "50%"

**✅ Pass Criteria:**
- No crashes
- Searches work correctly
- Special characters are handled
- Results match expected

---

### **Test 16: Long Query**

**Steps:**
1. Type a very long search query (100+ characters)

**✅ Pass Criteria:**
- Input accepts long text
- No UI overflow
- Search still works
- No crashes

---

### **Test 17: Case Sensitivity**

**Steps:**
1. Send message: "Hello World"
2. Search for: "hello world" (lowercase)
3. Search for: "HELLO WORLD" (uppercase)
4. Search for: "HeLLo WoRLd" (mixed)

**✅ Expected Result:**
- All three searches find the same message
- Case is ignored
- Results are identical

---

### **Test 18: Highlighting**

**Steps:**
1. Send message: "Let's meet tomorrow for coffee and discuss the meeting"
2. Search for: "meet"

**✅ Expected Result:**
```
Let's meet tomorrow for coffee and discuss the meeting
      ^^^^                                   ^^^^
   (highlighted)                        (highlighted)
```

**✅ Pass Criteria:**
- Both instances of "meet" highlighted
- Highlight is yellow (#FFEB3B)
- Text is bold/darker
- Easy to see

---

### **Test 19: Performance (Many Results)**

**Setup:** Have 50+ messages in various chats

**Steps:**
1. Search for common word: "the"
2. Observe loading time

**✅ Pass Criteria:**
- Results appear within 1 second
- No lag or freezing
- Smooth scrolling
- Only shows first 20 messages
- UI remains responsive

---

### **Test 20: Offline Search**

**Steps:**
1. Turn OFF WiFi and mobile data
2. Open search screen
3. Search for a message you've already received

**✅ Expected Result:**
- Message search works (SQLite is local)
- Chat search works
- User search fails gracefully (requires Firestore)

**✅ Pass Criteria:**
- Messages and chats searchable offline
- No crashes
- User search shows no results or error

---

## 🐛 Known Issues & Limitations

### **User Search Limitation**
- Only searches first 100 users
- Client-side filtering (not server-side)
- For 1000+ users, needs Algolia/ElasticSearch

### **Firestore Limitations**
- No fuzzy matching (exact substring required)
- No typo tolerance
- No stemming ("run" won't match "running")

### **Future Enhancements Needed**
- Search history
- Filters (date, sender, type)
- Sort options
- Full-text search (FTS5)

---

## 📊 Test Results Template

Use this to track your testing:

```
Test #  | Test Name              | Status | Notes
--------|------------------------|--------|-------
Test 1  | Access Search Screen   | ⬜ PASS | 
        |                        | ⬜ FAIL | 
Test 2  | Open Search Screen     | ⬜ PASS | 
        |                        | ⬜ FAIL | 
Test 3  | Message Search         | ⬜ PASS | 
        |                        | ⬜ FAIL | 
Test 4  | Debouncing             | ⬜ PASS | 
        |                        | ⬜ FAIL | 
Test 5  | Chat Search            | ⬜ PASS | 
        |                        | ⬜ FAIL | 
Test 6  | User Search            | ⬜ PASS | 
        |                        | ⬜ FAIL | 
Test 7  | Start Chat from User   | ⬜ PASS | 
        |                        | ⬜ FAIL | 
Test 8  | Navigate (Message)     | ⬜ PASS | 
        |                        | ⬜ FAIL | 
Test 9  | Navigate (Chat)        | ⬜ PASS | 
        |                        | ⬜ FAIL | 
Test 10 | Clear Search           | ⬜ PASS | 
        |                        | ⬜ FAIL | 
Test 11 | Cancel Search          | ⬜ PASS | 
        |                        | ⬜ FAIL | 
Test 12 | No Results             | ⬜ PASS | 
        |                        | ⬜ FAIL | 
Test 13 | Empty Query            | ⬜ PASS | 
        |                        | ⬜ FAIL | 
Test 14 | Mixed Results          | ⬜ PASS | 
        |                        | ⬜ FAIL | 
Test 15 | Special Characters     | ⬜ PASS | 
        |                        | ⬜ FAIL | 
Test 16 | Long Query             | ⬜ PASS | 
        |                        | ⬜ FAIL | 
Test 17 | Case Sensitivity       | ⬜ PASS | 
        |                        | ⬜ FAIL | 
Test 18 | Highlighting           | ⬜ PASS | 
        |                        | ⬜ FAIL | 
Test 19 | Performance            | ⬜ PASS | 
        |                        | ⬜ FAIL | 
Test 20 | Offline Search         | ⬜ PASS | 
        |                        | ⬜ FAIL | 
```

---

## 🚀 Quick Start Testing

**Minimum Viable Test (5 minutes):**
1. ✅ Test 2: Open search
2. ✅ Test 3: Search messages
3. ✅ Test 6: Search users
4. ✅ Test 7: Start chat
5. ✅ Test 11: Cancel search

**Comprehensive Test (20 minutes):**
- Run all 20 tests
- Document any issues
- Take screenshots

---

## 📸 Screenshots to Capture

For documentation/debugging:
1. Empty search state
2. Message search results
3. Chat search results
4. User search results
5. Mixed results (all 3 categories)
6. Highlighted text
7. No results state
8. Loading indicator

---

## 🐛 Common Issues & Fixes

### Issue: "Search button not visible"
**Fix:** Check `app/(tabs)/chats.tsx` was updated correctly

### Issue: "No results found" for everything
**Fix:** 
- Check SQLite has data (`db.getMessages()`)
- Verify Firestore connection

### Issue: "User search not working"
**Fix:**
- Check internet connection
- Verify Firestore rules allow user reads
- Check console for errors

### Issue: "App crashes on search"
**Fix:**
- Check console logs
- Verify all imports are correct
- Clear cache: `expo start -c`

### Issue: "Highlighting not working"
**Fix:**
- Check `SearchResults.tsx` `highlightText` function
- Verify regex is correct

---

## 📝 Testing Notes

**Environment:**
- Device/Simulator: _____________
- OS Version: _____________
- Expo SDK: 49.0.0
- Date: _____________
- Tester: _____________

**Overall Assessment:**
- Core Functionality: ⬜ PASS / ⬜ FAIL
- Performance: ⬜ PASS / ⬜ FAIL
- UI/UX: ⬜ PASS / ⬜ FAIL
- Edge Cases: ⬜ PASS / ⬜ FAIL

**Issues Found:**
1. _____________
2. _____________
3. _____________

**Recommendations:**
1. _____________
2. _____________
3. _____________

---

**Ready to test? Start with Test 1!** 🚀

