# Multi-User Testing Guide

**Last Updated:** October 21, 2025

This guide explains how to create dummy accounts and test messaging between multiple users.

---

## 🎯 **Quick Setup: Create Dummy Accounts**

### **Method 1: Firebase Console (Recommended)**

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `chat_iq` or `messageai`

2. **Navigate to Authentication**
   - Click **Build** → **Authentication** in left sidebar
   - Click **Users** tab

3. **Add Test Users**
   - Click **Add User** button
   - Create 2-3 test accounts:
   
   ```
   Account 1 (Your Main):
   Email: your-email@example.com
   Password: (your password)
   Display Name: (Your Name)
   
   Account 2 (Test User):
   Email: test1@messageai.com
   Password: test1234
   Display Name: Alice Test
   
   Account 3 (Test User):
   Email: test2@messageai.com
   Password: test1234
   Display Name: Bob Test
   ```

4. **Copy User IDs**
   - After creating, click on each user
   - Copy their **User UID** (you'll need this for messaging)

---

### **Method 2: Sign Up in the App (Faster)**

1. **Sign Out of Current Account**
   - Go to **Profile** tab
   - Tap **Sign Out**

2. **Create Test Account 1**
   - Tap **Sign Up**
   - Email: `alice@test.com`
   - Name: `Alice Test`
   - Password: `test1234`
   - Tap **Sign Up**

3. **Note Down User ID**
   - After sign up, go to **Profile** tab
   - Copy the **User ID** shown (you'll need this!)

4. **Sign Out and Create Test Account 2**
   - Tap **Sign Out**
   - Repeat steps 2-3 with:
     - Email: `bob@test.com`
     - Name: `Bob Test`
     - Password: `test1234`

---

## 📱 **Testing Scenarios**

### **Scenario 1: Two-Device Real-Time Messaging**

**Setup:**
- **Device A (iPad):** Logged in as Alice
- **Device B (iPhone/Another iPad):** Logged in as Bob

**Test Steps:**
1. Device A: Tap **New Chat** → **New Direct Chat**
2. Search for Bob (use User ID if search not implemented)
3. Send message: "Hi Bob!"
4. Device B: Should see message appear in <200ms
5. Device B: Reply "Hey Alice!"
6. Device A: Should see reply instantly

**Success Criteria:**
- ✅ Messages appear in <200ms
- ✅ Both devices show conversation
- ✅ Read receipts work (if implemented)
- ✅ Typing indicators work (if implemented)

---

### **Scenario 2: Offline Message Queue**

**Setup:**
- **Device A:** Logged in as Alice
- **Device B:** Logged in as Bob (offline)

**Test Steps:**
1. Device B: Turn on **Airplane Mode**
2. Device A: Send 3 messages to Bob
3. Device B: Turn off **Airplane Mode**
4. Device B: **Should receive all 3 messages within 1 second**

**Success Criteria:**
- ✅ All messages delivered after reconnect
- ✅ Messages in correct order
- ✅ No message loss

---

### **Scenario 3: Group Chat (3+ Users)**

**Setup:**
- **Device A:** Alice
- **Device B:** Bob
- **Device C (Web Browser):** Carol

**Test Steps:**
1. Device A: Tap **New Chat** → **New Group**
2. Add Bob and Carol
3. Name group: "Test Group"
4. All three devices send messages simultaneously
5. Verify all messages appear in correct order

**Success Criteria:**
- ✅ All users see all messages
- ✅ Message attribution clear (who sent what)
- ✅ No message loss or duplication

---

## 🔍 **Quick Test Without Second Device**

### **Option: Use Firebase Firestore Console**

1. **Send Message Directly via Firestore**
   - Go to Firebase Console → **Firestore Database**
   - Navigate to: `chats/{chatId}/messages`
   - Click **Add Document**
   - Add fields:
     ```
     id: "test-msg-123"
     senderId: "test-user-id"
     senderName: "Test User"
     content: "Hello from Firebase!"
     timestamp: (use current timestamp)
     type: "text"
     syncStatus: "synced"
     deliveryStatus: "delivered"
     readBy: []
     deliveredTo: []
     ```
   - Click **Save**

2. **Check Your App**
   - Message should appear in your chat instantly
   - Verifies real-time listener works!

---

## 🧪 **Single-Device Network Testing**

Even without a second device, you can test core functionality:

### **Test 1: Network Indicators**

1. Turn on **Airplane Mode**
2. **Red banner should appear** at top: "No Internet Connection"
3. Try to send a message (should queue)
4. Turn off **Airplane Mode**
5. **Red banner should disappear**
6. Message should send automatically

---

### **Test 2: Persistence**

1. Have an active conversation (even if just with yourself)
2. **Force quit the app**
3. Reopen app
4. **Check:** Conversation history intact ✅
5. **Check:** Still logged in ✅

---

### **Test 3: Background/Foreground**

1. Open app → Go to Chats
2. Press **Home button** (app backgrounds)
3. Wait 30 seconds
4. Tap app icon to return
5. **Check:** Reconnects instantly ✅
6. **Check:** No data loss ✅

---

## 📋 **Your Test User IDs**

**Keep track of your test accounts:**

```
Account 1 (Main):
- Email: ___________________
- User ID: ___________________

Account 2 (Test):
- Email: ___________________
- User ID: ___________________

Account 3 (Test):
- Email: ___________________
- User ID: ___________________
```

---

## 🎥 **For Demo Video Recording**

### **Recommended Setup:**

**Option A: Two Physical Devices**
- iPad + iPhone side by side
- Record with third device or Mac screen recording

**Option B: Device + Simulator**
- iPad (physical)
- iPhone Simulator on Mac
- Record Mac screen (captures both)

**Option C: Two Simulators**
- Two iPhone simulators side by side
- Easy to record but less impressive

---

## 🚀 **Next Steps**

After creating dummy accounts:

1. ✅ Test two-device real-time messaging
2. ✅ Test offline message queue
3. ✅ Test group chat (3+ users)
4. ✅ Record demo video
5. ✅ Complete testing checklist

**Questions?** Check `testing-checklist.md` for detailed testing scenarios!


