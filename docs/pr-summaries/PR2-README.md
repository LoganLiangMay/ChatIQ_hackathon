# PR #2: Core One-on-One Messaging - Quick Reference

## 🚀 Quick Start

### What Was Built
✅ Complete real-time messaging system with offline-first architecture
✅ Send and receive text messages instantly
✅ Optimistic UI updates for smooth UX
✅ SQLite persistence for offline access
✅ Firebase real-time synchronization
✅ Chat list with previews and timestamps

### Files Created: 12 new + 1 updated
See `PR2-IMPLEMENTATION-SUMMARY.md` for complete list

---

## ⚡ Quick Test (5 minutes)

### Setup (One-time)
```bash
# 1. Make sure Firebase is configured
# Check .env file has all Firebase credentials

# 2. Deploy Firestore rules
# See FIRESTORE-SETUP.md

# 3. Start the app
npx expo start
```

### Test Messaging (2 users required)
```typescript
// User 1: Create a test chat
import { createTestDirectChat } from '@/utils/devHelpers';
await createTestDirectChat('user2-uid', 'Test User 2');

// User 2: Chat will appear automatically
// Both users can now exchange messages!
```

### What to Test
1. ✅ Send message → appears instantly
2. ✅ Other user receives in < 2 seconds  
3. ✅ Force quit app → message persists
4. ✅ Airplane mode → message queues (shows 🕐)
5. ✅ Restore connection → message syncs (shows ✓)

---

## 📁 Key Files

### Entry Points
- **Chat List**: `app/(tabs)/chats.tsx`
- **Chat Screen**: `app/(tabs)/chats/[chatId].tsx`

### Core Logic
- **Send Messages**: `services/messages/MessageService.ts`
- **Sync to Firebase**: `services/messages/MessageSync.ts`
- **Firestore Operations**: `services/firebase/firestore.ts`

### React Hooks
- **useMessages**: `hooks/useMessages.ts` - Message state management
- **useChats**: `hooks/useChats.ts` - Chat list state management

### Components
- **MessageBubble**: `components/messages/MessageBubble.tsx`
- **MessageList**: `components/messages/MessageList.tsx`
- **MessageInput**: `components/messages/MessageInput.tsx`
- **ChatListItem**: `components/chat/ChatListItem.tsx`
- **ChatHeader**: `components/chat/ChatHeader.tsx`

---

## 🔍 How It Works

### Message Send Flow
```
1. User types message
2. Press send button
3. MessageService.sendTextMessage()
   → Write to SQLite (guaranteed persistence)
   → Update UI immediately (optimistic)
   → Sync to Firebase (background)
4. Status updates: 🕐 → ✓
```

### Message Receive Flow  
```
1. Firebase listener detects new message
2. useMessages hook processes it
   → Check: not from current user?
   → Save to SQLite
   → Update UI state
3. Message appears in chat
```

### Data Flow
```
UI Components
    ↓
React Hooks (useMessages, useChats)
    ↓
Services (MessageService, MessageSync)
    ↓
Storage (SQLite + Firebase)
```

---

## 🐛 Troubleshooting

### Messages not appearing?
1. Check Firebase console - are messages there?
2. Check SQLite - are messages saved locally?
3. Check console logs for errors
4. Verify Firestore security rules deployed

### Chat list empty?
1. Create a test chat: `createTestDirectChat()`
2. Or create via Firestore console
3. Check user is in chat.participants array

### Real-time not working?
1. Check internet connection
2. Verify Firestore indexes created
3. Check Firebase listener is active (console logs)
4. Try refreshing the chat list (pull down)

### Can't send messages?
1. Check user is authenticated (`useAuth().user`)
2. Check SQLite permissions
3. Check Firestore security rules
4. Look for errors in console

---

## 📊 Data Structure

### SQLite (Local)
```sql
messages table:
- id (UUID)
- chatId
- senderId
- senderName
- content
- type ('text' | 'image')
- timestamp
- syncStatus ('pending' | 'synced' | 'failed')
- deliveryStatus ('sending' | 'sent' | 'delivered')
```

### Firestore (Cloud)
```
chats/{chatId}/messages/{messageId}
- senderId
- senderName  
- content
- type
- timestamp (server)
- readBy []
- deliveredTo []
```

---

## 🎯 User Stories Status

| ID | Story | Status |
|----|-------|--------|
| US-5 | Send text messages | ✅ COMPLETE |
| US-6 | Receive messages instantly | ✅ COMPLETE |
| US-7 | Optimistic UI updates | ✅ COMPLETE |
| US-9 | Message timestamps | ✅ COMPLETE |

---

## 🔜 What's Next

### PR #3: Offline Support & Message Queue
- Automatic retry on network reconnect
- Exponential backoff for failed syncs
- Network state monitoring
- Guaranteed delivery guarantees

### Dependencies for PR #3
- ✅ PR #2 complete
- ✅ MessageSync service ready
- ✅ SQLite syncStatus tracking ready

---

## 💡 Tips

### Development Helpers
```typescript
import { createTestDirectChat, logCurrentUser } from '@/utils/devHelpers';

// Log who you're signed in as
logCurrentUser();

// Create a test chat
await createTestDirectChat('other-user-id', 'Other User Name');
```

### Useful Console Logs
```typescript
// In MessageService
console.log('Message sent:', message.id);

// In useMessages  
console.log('Received message:', messageId);

// In MessageSync
console.log('Synced to Firebase:', message.id);
```

### Firebase Console Views
- **Firestore Data**: See all messages in real-time
- **Firestore Rules**: Test permissions
- **Firestore Indexes**: Monitor query performance
- **Authentication**: See signed-in users

---

## ✅ Validation Checklist

Before moving to PR #3:

- [ ] Two users can exchange messages
- [ ] Messages appear instantly (< 1 second locally)
- [ ] Messages sync to Firebase (< 2 seconds)
- [ ] Messages persist after app restart
- [ ] Messages persist after force quit
- [ ] Chat list shows all chats
- [ ] Last message preview displays
- [ ] Timestamps format correctly
- [ ] Status indicators work (🕐 ✓)
- [ ] No crashes or errors in console

---

## 📞 Quick Commands

```bash
# Start app
npx expo start

# View logs
npx expo start --clear

# Reset Metro bundler cache
npx expo start -c

# Check for TypeScript errors
npx tsc --noEmit

# Run linter
npx eslint .
```

---

## 🎓 Key Learnings from PR #2

1. **SQLite First**: Always write to SQLite before Firebase
2. **Client UUIDs**: Generate IDs on client for offline support
3. **Optimistic Updates**: Update UI immediately, sync in background
4. **Listener Cleanup**: Always return cleanup function from useEffect
5. **Server Timestamps**: Use for ordering, client timestamps for display
6. **Deduplication**: Check before inserting to avoid duplicates

---

**For detailed implementation info, see: `PR2-IMPLEMENTATION-SUMMARY.md`**
**For Firestore setup, see: `FIRESTORE-SETUP.md`**
**For task breakdown, see: `memory-bank/task-list-prs.md`**

🚀 **Happy Messaging!**

