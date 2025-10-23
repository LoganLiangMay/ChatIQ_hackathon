# MessageAI MVP Checklist (24-Hour Gate)

**Last Updated:** October 21, 2025  
**Status:** 🟡 In Progress

---

## ✅ MVP Requirements (Must Have to Pass)

### 1. One-on-One Chat Functionality
- [ ] **Send text messages** between 2 users
- [ ] **Receive messages** in real-time
- [ ] **Message list UI** shows conversation history
- [ ] **Message input** with send button

**Status:** ___  
**Notes:** ___

---

### 2. Real-Time Message Delivery (2+ Users)
- [ ] **Firestore listeners** set up for real-time updates
- [ ] **Message appears instantly** on recipient's device
- [ ] **Tested with 2 physical devices** (iPhone + iPad)
- [ ] **Latency <500ms** (target: <200ms)

**Status:** ___  
**Test Results:**
- Device A → Device B latency: ___ ms
- Messages delivered in order: YES / NO

---

### 3. Message Persistence (Survives App Restart)
- [ ] **SQLite database** implemented
- [ ] **Messages saved locally** before sending
- [ ] **Force quit app** → Reopen → Messages still there
- [ ] **Chat history loads** from SQLite on app launch

**Status:** ___  
**Test:**
- [ ] Send 5 messages
- [ ] Force quit app
- [ ] Reopen app
- [ ] All 5 messages visible: YES / NO

---

### 4. Optimistic UI Updates
- [ ] **Message appears instantly** in sender's UI
- [ ] **Shows "sending" status** before server confirmation
- [ ] **Updates to "sent"** after Firestore sync
- [ ] **Handles failures** gracefully (retry or show error)

**Status:** ___  
**Components:**
- [ ] MessageBubble shows status indicators
- [ ] MessageList updates in real-time
- [ ] MessageInput disabled during send

---

### 5. Online/Offline Status Indicators
- [ ] **User status tracked** in Firestore `users/{userId}`
- [ ] **Updates on sign in/out**
- [ ] **Updates on app background/foreground**
- [ ] **Visible in UI** (chat header or user list)
- [ ] **Real-time updates** when user status changes

**Status:** ___  
**Components:**
- [ ] usePresence hook implemented
- [ ] ChatHeader shows online/offline
- [ ] ChatListItem shows status dot

---

### 6. Message Timestamps
- [ ] **Timestamp stored** with each message
- [ ] **Formatted display** ("Just now", "2:30 PM", "Yesterday")
- [ ] **Consistent across devices** (use server timestamps)
- [ ] **Date separators** in message list (optional but nice)

**Status:** ___  
**Components:**
- [ ] formatters.ts has timestamp utils
- [ ] MessageBubble displays timestamp
- [ ] Uses Firestore serverTimestamp()

---

### 7. User Authentication
- [ ] **Firebase Auth** configured
- [ ] **Sign up screen** with email/password
- [ ] **Sign in screen** with email/password
- [ ] **Sign out functionality**
- [ ] **User profiles** in Firestore `users/{userId}`
- [ ] **Auth state persistence** (stay logged in)
- [ ] **Protected routes** (redirect to login if not authenticated)

**Status:** ___  
**Screens:**
- [ ] app/(auth)/sign-up.tsx
- [ ] app/(auth)/sign-in.tsx
- [ ] AuthContext.tsx manages state

---

### 8. Basic Group Chat (3+ Users)
- [ ] **Group creation** UI and logic
- [ ] **3+ users** can join a group
- [ ] **All users receive messages** in real-time
- [ ] **Message attribution** (shows who sent each message)
- [ ] **Group member list** visible
- [ ] **Group name** displayed in UI

**Status:** ___  
**Test:**
- [ ] Create group with 3 users
- [ ] All 3 users send messages
- [ ] All messages visible to all users: YES / NO
- [ ] Clear attribution: YES / NO

---

### 9. Message Read Receipts ✅ **COMPLETE**

#### 9A. One-on-One Chat Read Receipts
- [x] **Track when recipient reads message**
- [x] **Update `readBy` array** in Firestore
- [x] **Update SQLite** for offline access
- [x] **Visual indicator** in sender's UI (checkmarks)
  - ✓ Single checkmark: Delivered
  - ✓✓ Double checkmark: Read
  - ✓✓ Blue checkmarks: Read (styled)
- [x] **Real-time updates** when message is read

**Implementation Complete:**
1. [x] Auto-marks messages as read when user opens chat (useFocusEffect)
2. [x] Updates Firestore message `readBy` array (arrayUnion)
3. [x] Syncs update to SQLite for offline access
4. [x] MessageStatus.tsx displays checkmarks
5. [x] useMessages.ts listens for 'modified' events
6. [x] MessageService.ts has all read receipt methods
7. [x] Real-time updates (<2 seconds)

**Components Updated:**
- [x] MessageBubble.tsx - Shows MessageStatus component
- [x] MessageStatus.tsx - Displays ✓, ✓✓ gray, ✓✓ blue
- [x] useMessages.ts - Added 'modified' event handler
- [x] MessageService.ts - markAsRead, markAllAsRead methods
- [x] Firestore listeners - Subscribe to readBy updates
- [x] app/(tabs)/chats/[chatId].tsx - Auto-marks on focus

**Status:** ✅ Complete  
**Test Results:** See `READ-RECEIPTS-COMPLETE.md`

---

#### 9B. Group Chat Read Receipts
- [ ] **Track who has read** each message
- [ ] **Update `readBy` array** with userId when read
- [ ] **Show read count** ("Read by 3 of 5")
- [ ] **Detailed view** on long-press (list of who read)
- [ ] **Real-time updates** as users read messages

**Implementation Steps:**
1. [ ] Add visibility listener for group messages
2. [ ] Update Firestore with current user's ID in `readBy`
3. [ ] Calculate read count in UI
4. [ ] Show "Read by X" in message bubble
5. [ ] Add modal/sheet with read receipt details
6. [ ] Test with 3+ devices

**Components to Update:**
- [ ] MessageBubble.tsx - Group read count
- [ ] ReadReceiptModal.tsx - Detailed view (create)
- [ ] GroupService.ts - Group read receipt logic
- [ ] Firestore - Use transactions for atomic updates

**Status:** ⬜ Not Started  
**Assigned Priority:** MEDIUM

---

### 10. Push Notifications (Foreground Minimum)
- [ ] **Expo Notifications** configured
- [ ] **FCM tokens** stored in Firestore
- [ ] **Foreground notifications** work
- [ ] **Notification shows** message preview
- [ ] **Tapping notification** opens conversation
- [ ] **Background notifications** (optional for MVP)

**Status:** ___  
**Components:**
- [ ] NotificationService.ts
- [ ] NotificationHandler.tsx
- [ ] Firebase Cloud Functions (optional for MVP)

---

### 11. Deployment
- [ ] **Running on local emulator/simulator** with deployed backend
- [ ] **Firebase project** deployed and accessible
- [ ] **Environment variables** configured (.env)
- [ ] **Expo Go** testing works (recommended)
- [ ] **TestFlight/APK** (optional, nice to have)

**Status:** ___  
**Deployment Type:** ___

---

## 📊 MVP Completion Score

**Count completed items:** ___ / 45 core requirements

**MVP Gate Status:**
- [ ] ✅ **PASS** - All core requirements met (40+/45)
- [ ] ⚠️ **CONDITIONAL** - Most requirements met (30-39/45)
- [ ] 🔴 **FAIL** - Critical gaps (< 30/45)

---

## 🎯 Priority Order for Completion

### ⚡ CRITICAL (Must Have Today)
1. [ ] One-on-one chat working end-to-end
2. [ ] Real-time delivery tested with 2 devices
3. [ ] Message persistence verified (force quit test)
4. [ ] Authentication fully functional

### 🔥 HIGH (Must Have This Week)
5. [ ] **Read receipts for 1-on-1 chat** ⭐ **CURRENT**
6. [ ] Optimistic UI polished
7. [ ] Group chat basic functionality
8. [ ] Online/offline indicators working

### ⚠️ MEDIUM (Important for Complete MVP)
9. [ ] Group read receipts
10. [ ] Push notifications (foreground)
11. [ ] Deployment to Expo Go/TestFlight

---

## 🔄 Current Sprint: Read Receipts

### Goal
Implement read receipts for both 1-on-1 and group chats using Firebase transactions and SQLite sync.

### Architecture Approach (per firebase-mobile-sync.mdc)
```
1. User opens chat → Mark all unread messages as read
2. Update Firestore using transaction (atomic update of readBy array)
3. Sync update to SQLite for offline access
4. Real-time listener notifies sender of read status
5. UI displays checkmarks based on readBy array
```

### Database Schema (Already Exists)
```typescript
// Firestore: chats/{chatId}/messages/{messageId}
{
  senderId: string,
  content: string,
  timestamp: Timestamp,
  readBy: string[],        // Array of userIds who read
  deliveredTo: string[],   // Array of userIds who received
  // ... other fields
}

// SQLite: messages table
readBy TEXT,               // JSON string of userId array
deliveredTo TEXT,          // JSON string of userId array
```

### Implementation Files
- [ ] `services/messages/ReadReceiptService.ts` (CREATE)
- [ ] `components/messages/MessageStatus.tsx` (CREATE)
- [ ] `hooks/useReadReceipts.ts` (CREATE)
- [ ] `services/messages/MessageService.ts` (UPDATE)
- [ ] `components/messages/MessageBubble.tsx` (UPDATE)

### Testing Plan
1. [ ] 1-on-1 chat: Send message from iPhone → Open chat on iPad → Verify checkmarks update on iPhone
2. [ ] Group chat: Send message → All 3 users open chat → Verify "Read by 3" appears
3. [ ] Offline: Read message while offline → Come online → Read receipt syncs
4. [ ] Real-time: Message read immediately shows on sender's device (<2s)

---

## 📝 Notes & Blockers

**Current Blockers:**
- ___ (list any blockers)

**Questions:**
- ___ (list any questions)

**Next Steps:**
1. Create ReadReceiptService.ts
2. Add markAsRead functionality
3. Update UI components with status indicators
4. Test with 2 devices
5. Extend to group chats

---

## ✅ Quick Verification Tests

### Test 1: Basic Messaging (5 min)
```
[ ] iPhone sends "Hello" → iPad receives instantly
[ ] iPad replies "Hi" → iPhone receives instantly
[ ] Both devices show all messages
```

### Test 2: Persistence (2 min)
```
[ ] Send 3 messages
[ ] Force quit app on iPhone
[ ] Reopen app
[ ] All 3 messages still visible
```

### Test 3: Offline Queue (3 min)
```
[ ] Turn off WiFi on iPhone
[ ] Send 2 messages
[ ] Messages show "sending" status
[ ] Turn on WiFi
[ ] Messages deliver and status updates
```

### Test 4: Read Receipts (5 min) ⭐ **FOCUS**
```
[ ] iPhone sends message
[ ] Shows single checkmark (delivered)
[ ] iPad opens chat
[ ] iPhone checkmark updates to double (read)
[ ] Update happens within 2 seconds
```

---

**This checklist tracks your MVP gate requirements. Focus on read receipts first, then complete remaining items systematically.**

