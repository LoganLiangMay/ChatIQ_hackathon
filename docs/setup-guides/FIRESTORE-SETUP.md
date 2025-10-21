# Firestore Setup Guide for PR #2

## 🔥 Firebase Console Setup

### Step 1: Deploy Security Rules

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules` and paste into the rules editor
5. Click **Publish**

**Or via Firebase CLI:**
```bash
firebase deploy --only firestore:rules
```

---

### Step 2: Create Firestore Indexes

Firebase will automatically prompt you to create indexes when queries fail. However, you can pre-create them:

#### Required Indexes for PR #2:

**1. Messages Query (for chat screen)**
- **Collection**: `chats/{chatId}/messages`
- **Fields**:
  - `timestamp` (Descending)
- **Query scope**: Collection

**How to create:**
1. Go to Firestore → Indexes
2. Click **Create Index**
3. Select collection: `messages` (as subcollection of chats)
4. Add field: `timestamp` → Descending
5. Query scope: Collection
6. Create

**2. Chats Query (for chat list)**
- **Collection**: `chats`
- **Fields**:
  - `participants` (Array contains)
  - `updatedAt` (Descending)
- **Query scope**: Collection

**How to create:**
1. Go to Firestore → Indexes
2. Click **Create Index**  
3. Collection: `chats`
4. Add fields:
   - `participants` → Array-contains
   - `updatedAt` → Descending
5. Query scope: Collection
6. Create

**Note**: Firebase will usually auto-prompt you with a link when the index is needed. Just click the link and it will create it for you.

---

### Step 3: Verify Firestore Database Structure

After running the app, your Firestore should have this structure:

```
📁 users
  └─ {userId}
      ├─ uid: string
      ├─ email: string  
      ├─ displayName: string
      ├─ online: boolean
      ├─ lastSeen: timestamp
      ├─ fcmToken?: string (PR #7)
      └─ createdAt: timestamp

📁 chats
  └─ {chatId}
      ├─ type: 'direct' | 'group'
      ├─ participants: string[]
      ├─ admins?: string[] (for groups)
      ├─ name?: string (for groups)
      ├─ groupPicture?: string (for groups)
      ├─ lastMessage?: {
      │   ├─ content: string
      │   ├─ timestamp: timestamp
      │   ├─ senderId: string
      │   └─ senderName: string
      │ }
      ├─ createdAt: timestamp
      └─ updatedAt: timestamp
      
      📁 messages (subcollection)
        └─ {messageId}
            ├─ senderId: string
            ├─ senderName: string
            ├─ content: string
            ├─ type: 'text' | 'image' | 'system'
            ├─ imageUrl?: string
            ├─ timestamp: timestamp
            ├─ readBy: string[]
            └─ deliveredTo: string[]
```

---

## 🧪 Testing Firestore Setup

### Test 1: Create a Test Chat via Console

1. Go to Firestore Database
2. Click **Start collection**
3. Collection ID: `chats`
4. Document ID: (auto-generate or use: `test-chat-1`)
5. Add fields:
   ```
   type: "direct"
   participants: ["user1-uid", "user2-uid"]
   createdAt: (click "timestamp" button)
   updatedAt: (click "timestamp" button)
   ```
6. Save

7. In your app, this chat should now appear in the chat list!

### Test 2: Create a Test Message via Console

1. In Firestore, open the chat document you created
2. Click **Add subcollection**
3. Collection ID: `messages`
4. Document ID: (auto-generate)
5. Add fields:
   ```
   senderId: "user1-uid"
   senderName: "Test User"
   content: "Hello from Firestore console!"
   type: "text"
   timestamp: (click "timestamp" button)
   readBy: ["user1-uid"]
   deliveredTo: ["user1-uid"]
   ```
6. Save

7. In your app, open the chat, and the message should appear!

---

## 🔒 Security Rules Explanation

### Users Collection
- **Read**: Any authenticated user can read profiles (for displaying names/avatars)
- **Write**: Only the user can update their own document

### Chats Collection
- **Read**: Only participants can read the chat
- **Create**: User must be in the participants array
- **Update**: Only participants can update (for lastMessage, etc.)
- **Delete**: Participants can delete (for leaving groups)

### Messages Subcollection
- **Read**: Only chat participants can read messages
- **Create**: Must be participant AND be the sender
- **Update**: Participants can update (for read receipts)
- **Delete**: No one can delete (for now)

---

## 🚨 Common Issues

### Issue 1: "Missing or insufficient permissions"
- **Cause**: Security rules not deployed
- **Fix**: Deploy `firestore.rules` file

### Issue 2: "The query requires an index"
- **Cause**: Missing Firestore composite index
- **Fix**: Click the link in the error message, or create manually in console

### Issue 3: Messages not appearing in real-time
- **Cause**: Listener not set up correctly or rules blocking read
- **Fix**: 
  1. Check console for errors
  2. Verify user is in chat.participants array
  3. Check Firestore Rules simulator in console

### Issue 4: Can't create chat
- **Cause**: User not in participants array of request
- **Fix**: Ensure request.resource.data.participants includes current user

---

## 📊 Firestore Usage Estimates

### PR #2 Usage:
- **Reads**: 50 per chat open (initial load) + real-time updates
- **Writes**: 2 per message (message doc + chat lastMessage)
- **Storage**: ~1 KB per message

### Daily Usage (for 100 messages/day):
- **Reads**: ~5,000-10,000 (with real-time updates)
- **Writes**: ~200 (100 messages × 2 writes each)
- **Storage**: ~100 KB

### Firebase Free Tier Limits:
- **Reads**: 50,000/day ✅ Plenty
- **Writes**: 20,000/day ✅ Plenty
- **Storage**: 1 GB ✅ Plenty

**You're well within limits for MVP testing!**

---

## ✅ Setup Checklist

- [ ] Firebase project created
- [ ] Firestore database initialized (in test mode for now)
- [ ] Security rules deployed from `firestore.rules`
- [ ] Composite indexes created (or will auto-create on first query)
- [ ] Test chat created via console (optional)
- [ ] App can read/write to Firestore successfully

---

## 🔄 Next Steps

After Firestore is set up:

1. Test creating a chat (via devHelpers or console)
2. Test sending messages between two users
3. Verify real-time updates work
4. Check Firestore console to see data structure
5. Monitor Firestore usage in console

---

## 📞 Support

If you encounter issues:

1. Check Firebase Console → Firestore → **Rules** tab for rule errors
2. Check Firebase Console → Firestore → **Indexes** tab for missing indexes
3. Check app console logs for Firebase errors
4. Use Firestore Rules simulator in console to test permissions

**Common Debug Commands:**
```typescript
// In your app code
import { getAuth } from 'firebase/auth';

// Log current user
console.log('Current user:', getAuth().currentUser);

// Test Firestore write
import { doc, setDoc } from 'firebase/firestore';
import { firestore } from '@/services/firebase/firestore';

await setDoc(doc(firestore, 'test', 'test-doc'), { test: true });
console.log('Firestore write successful!');
```

---

**Ready to start testing PR #2 messaging! 🚀**

