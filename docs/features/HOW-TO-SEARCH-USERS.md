# How to Search for Other Users

**Last Updated:** October 21, 2025

## 🔍 **Quick Guide: Finding Other Users**

### **Step 1: Open Search**
1. On the **Chats** screen
2. Tap the **Search icon** (🔍) in the top right corner

### **Step 2: Search for Users**
The search will show results in 3 categories:
- **Users** - Other people in the app (search by name or email)
- **Chats** - Existing conversations (search by chat name)
- **Messages** - Message history (search by content)

### **Step 3: Start a Chat**
1. Type the user's name or email (e.g., "Alice" or "alice@test.com")
2. Tap on the user in the search results
3. Start messaging!

---

## 👥 **Find Your Test Accounts**

### **Your Current Accounts:**

**Account 1 (Main):**
- User ID: `jx3NDNe5IKalntwLbmjRMMzDZ7X2` (from terminal logs)
- Name: (Your display name)
- Email: (Your email)

**Account 2 (Test - Alice):**
- User ID: `QXXfmwerA4QBQdwpToBeBfkFaaf1` (from terminal logs)
- Name: (The name you entered during sign up)
- Email: (The email you used)

### **To Find These User IDs:**
1. Go to **Profile** tab
2. Look under "USER ID" section
3. Copy the ID

---

## 🧪 **Test Scenario: Search Another User**

### **What I Just Fixed:**
✅ **Firestore search** - Now properly connects to Firebase to find users
✅ **SQLite search** - No longer crashes when SQLite isn't available (Expo Go limitation)
✅ **Error handling** - Gracefully handles search failures

### **How to Test:**

**On your iPad (currently signed in as User 1):**
1. Tap the **Search icon** (🔍) in top right
2. Type part of the second user's name or email
3. The user should appear in the search results under "Users"
4. Tap the user to start a chat
5. Send a message like "Hi from User 1!"

**To test two-way messaging:**
1. Sign out on iPad
2. Sign in as User 2 (Alice)
3. You should see the chat with the message
4. Reply "Hi from User 2!"
5. Sign out and sign back in as User 1
6. See the reply

---

## 📱 **Search Features**

### **What You Can Search:**

1. **Users** (Firestore)
   - Display name (e.g., "Alice Test")
   - Email (e.g., "alice@test.com")
   - Case-insensitive, partial matching
   - Excludes yourself from results

2. **Chats** (SQLite - not available in Expo Go)
   - Chat names
   - Group names
   - Only searches your chats

3. **Messages** (SQLite - not available in Expo Go)
   - Message content
   - Sender names
   - Full-text search

### **Search Tips:**
- Type at least 2 characters to start searching
- Search is case-insensitive ("alice" = "Alice" = "ALICE")
- Results appear automatically as you type
- User results show online status (green dot if online)

---

## 🐛 **Bugs Fixed Just Now:**

### **Breaking Change #24: SearchService Firestore Import**
- **Error:** `FirebaseError: Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore`
- **Cause:** SearchService was importing `firestore` directly (removed in Breaking Change #17)
- **Fix:** Updated to use `getFirebaseFirestore()` lazy getter
- **Files:** `services/search/SearchService.ts`
- **Status:** ✅ Fixed

### **Breaking Change #25: SQLite Search Methods Null Safety**
- **Error:** `TypeError: Cannot read property 'transaction' of null`
- **Cause:** `searchMessages()` and `searchChats()` didn't check if SQLite was available
- **Fix:** Added `isAvailable()` checks to all search and chat CRUD methods
- **Files:** `services/database/sqlite.ts` (7 methods updated)
- **Status:** ✅ Fixed

---

## 🚀 **Try It Now!**

The app should have automatically reloaded with the fixes. 

**Test Steps:**
1. Open the app on your iPad
2. Tap the **Search icon** (🔍) 
3. Type any part of your test user's name or email
4. You should see the user appear in search results!

**If you see "No results found":**
- Make sure the test account was created in Firebase
- Check that the user has a `displayName` set
- Try searching by email instead

---

## 💡 **Next Steps:**

After successfully searching for a user:
1. ✅ Tap the user to start a chat
2. ✅ Send your first message
3. ✅ Test on second device to see real-time messaging
4. ✅ Complete the multi-user testing from `MULTI-USER-TESTING.md`

**Questions?** Check the terminal logs for any errors or search "No results" in the search bar to verify it's working!


