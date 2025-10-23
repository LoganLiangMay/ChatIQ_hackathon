# Read Receipts Implementation Plan

**Status:** 🟡 Partially Implemented  
**Priority:** HIGH (MVP Requirement)

---

## ✅ What You Already Have

### 1. **UI Components** ✅
- `MessageStatus.tsx` - Shows checkmarks (✓, ✓✓, blue ✓✓)
- `MessageBubble.tsx` - Displays status for sent messages
- Already integrated into message list

### 2. **Data Structure** ✅
```typescript
// types/message.ts
interface Message {
  readBy?: string[];        // Array of userIds who read
  deliveredTo?: string[];   // Array of userIds delivered to
  // ...
}
```

### 3. **Storage** ✅
- Firestore: `chats/{chatId}/messages/{messageId}` with `readBy` field
- SQLite: messages table with `readBy` column (JSON)

---

## 🔴 What's Missing (Must Implement)

### 1. **Mark Messages as Read When User Opens Chat**
- Detect when user views chat
- Update Firestore `readBy` array
- Sync to SQLite

### 2. **Real-Time Read Receipt Updates**
- Listen for `readBy` changes in Firestore
- Update sender's UI when message is read

### 3. **Group Chat Read Receipts**
- Handle multiple readers
- Show "Read by X of Y"
- Detailed read receipt view

---

## 📋 Implementation Checklist

### Phase 1: One-on-One Chat Read Receipts (2-3 hours)

#### Step 1: Create Read Receipt Service
- [ ] Create `services/messages/ReadReceiptService.ts`
- [ ] Implement `markMessagesAsRead(chatId, userId)`
- [ ] Implement `markSingleMessageAsRead(messageId, userId)`
- [ ] Use Firestore transactions for atomic updates

#### Step 2: Add useReadReceipts Hook
- [ ] Create `hooks/useReadReceipts.ts`
- [ ] Auto-mark messages as read when chat is opened
- [ ] Handle app foreground/background states

#### Step 3: Update Message Listeners
- [ ] Update `useMessages.ts` to subscribe to `readBy` changes
- [ ] Sync Firestore updates to SQLite
- [ ] Trigger UI re-render when read status changes

#### Step 4: Test with 2 Devices
- [ ] iPhone sends message → iPad opens chat → iPhone sees ✓✓
- [ ] Test offline: iPad reads while offline → syncs when online
- [ ] Test real-time: Read status updates within 2 seconds

---

### Phase 2: Group Chat Read Receipts (2-3 hours)

#### Step 1: Extend Read Receipt Service for Groups
- [ ] Update `markMessagesAsRead` to handle groups
- [ ] Use batch operations for multiple messages
- [ ] Optimize with Firestore transactions

#### Step 2: Update UI for Group Read Counts
- [ ] Modify `MessageStatus.tsx` to show "Read by X"
- [ ] Add long-press to show detailed view
- [ ] Create `ReadReceiptModal.tsx` (who read, when)

#### Step 3: Test with 3+ Devices
- [ ] Send message to group with 3 users
- [ ] Each user opens chat → count updates
- [ ] Verify "Read by 3 of 3" appears

---

## 💻 Implementation Code

### File 1: `services/messages/ReadReceiptService.ts` (CREATE)

```typescript
/**
 * ReadReceiptService
 * Handles marking messages as read and updating readBy arrays
 * Uses Firestore transactions for atomic updates
 */

import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  writeBatch,
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../firebase/config';
import { db } from '../database/sqlite';

interface ReadReceiptOptions {
  updateSQLite?: boolean;
  markDelivered?: boolean;
}

class ReadReceiptService {
  
  /**
   * Mark all unread messages in a chat as read by current user
   * Called when user opens/views a chat
   */
  async markChatMessagesAsRead(
    chatId: string, 
    userId: string,
    options: ReadReceiptOptions = { updateSQLite: true, markDelivered: true }
  ): Promise<void> {
    try {
      const firestore = await getFirebaseFirestore();
      
      // 1. Get all messages in chat that user hasn't read yet
      const messagesRef = collection(firestore, `chats/${chatId}/messages`);
      const q = query(messagesRef);
      const snapshot = await getDocs(q);
      
      // Filter messages not read by this user
      const unreadMessages = snapshot.docs.filter(doc => {
        const data = doc.data();
        const readBy = data.readBy || [];
        return !readBy.includes(userId) && data.senderId !== userId;
      });
      
      if (unreadMessages.length === 0) {
        console.log('No unread messages to mark');
        return;
      }
      
      // 2. Batch update Firestore (more efficient than individual updates)
      const batch = writeBatch(firestore);
      
      unreadMessages.forEach(messageDoc => {
        const messageRef = doc(firestore, `chats/${chatId}/messages/${messageDoc.id}`);
        const updates: any = {
          readBy: arrayUnion(userId)
        };
        
        // Also mark as delivered if needed
        if (options.markDelivered) {
          updates.deliveredTo = arrayUnion(userId);
        }
        
        batch.update(messageRef, updates);
      });
      
      // Commit batch
      await batch.commit();
      console.log(`✅ Marked ${unreadMessages.length} messages as read in chat ${chatId}`);
      
      // 3. Update SQLite for offline access
      if (options.updateSQLite) {
        await this.updateSQLiteReadReceipts(
          unreadMessages.map(doc => doc.id),
          userId
        );
      }
      
    } catch (error) {
      console.error('❌ Failed to mark messages as read:', error);
      throw error;
    }
  }
  
  /**
   * Mark a single message as read
   * Used for individual message read tracking
   */
  async markMessageAsRead(
    chatId: string,
    messageId: string,
    userId: string,
    options: ReadReceiptOptions = { updateSQLite: true, markDelivered: true }
  ): Promise<void> {
    try {
      const firestore = await getFirebaseFirestore();
      const messageRef = doc(firestore, `chats/${chatId}/messages`, messageId);
      
      const updates: any = {
        readBy: arrayUnion(userId)
      };
      
      if (options.markDelivered) {
        updates.deliveredTo = arrayUnion(userId);
      }
      
      await updateDoc(messageRef, updates);
      console.log(`✅ Marked message ${messageId} as read by ${userId}`);
      
      // Update SQLite
      if (options.updateSQLite) {
        await this.updateSQLiteReadReceipts([messageId], userId);
      }
      
    } catch (error) {
      console.error('❌ Failed to mark message as read:', error);
      throw error;
    }
  }
  
  /**
   * Update SQLite with read receipts (for offline access)
   */
  private async updateSQLiteReadReceipts(
    messageIds: string[],
    userId: string
  ): Promise<void> {
    try {
      for (const messageId of messageIds) {
        // Get current message from SQLite
        const messages = await db.getMessagesByChatId(
          messageId.split('_')[0] // Extract chatId from messageId if needed
        );
        
        const message = messages.find(m => m.id === messageId);
        if (!message) continue;
        
        // Update readBy array
        const readBy = message.readBy || [];
        if (!readBy.includes(userId)) {
          readBy.push(userId);
          
          // Update in SQLite
          await db.updateMessageReadReceipt(messageId, readBy);
        }
      }
      
      console.log(`✅ Updated ${messageIds.length} messages in SQLite`);
    } catch (error) {
      console.error('❌ Failed to update SQLite read receipts:', error);
      // Don't throw - SQLite updates are non-critical
    }
  }
  
  /**
   * Get read receipt details for a message (for groups)
   * Returns list of users who read the message with timestamps
   */
  async getReadReceiptDetails(
    chatId: string,
    messageId: string
  ): Promise<{ userId: string; readAt: number }[]> {
    try {
      const firestore = await getFirebaseFirestore();
      const messageRef = doc(firestore, `chats/${chatId}/messages`, messageId);
      const messageDoc = await messageRef.get();
      
      if (!messageDoc.exists()) {
        return [];
      }
      
      const data = messageDoc.data();
      const readBy = data.readBy || [];
      
      // TODO: Store read timestamps in a sub-collection for detailed tracking
      // For now, just return userIds
      return readBy.map((userId: string) => ({
        userId,
        readAt: Date.now() // Placeholder - implement timestamp tracking
      }));
      
    } catch (error) {
      console.error('❌ Failed to get read receipt details:', error);
      return [];
    }
  }
}

export const readReceiptService = new ReadReceiptService();
```

---

### File 2: `hooks/useReadReceipts.ts` (CREATE)

```typescript
/**
 * useReadReceipts Hook
 * Automatically marks messages as read when user views chat
 * Handles app lifecycle (foreground/background)
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { readReceiptService } from '@/services/messages/ReadReceiptService';
import { getAuth } from 'firebase/auth';

interface UseReadReceiptsOptions {
  enabled?: boolean;
  delay?: number; // Delay before marking as read (ms)
}

export function useReadReceipts(
  chatId: string | null,
  options: UseReadReceiptsOptions = {}
) {
  const { enabled = true, delay = 1000 } = options;
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const appState = useRef(AppState.currentState);
  const hasMarkedAsRead = useRef(false);
  
  // Mark messages as read when chat is opened
  useEffect(() => {
    if (!chatId || !enabled) return;
    
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    // Reset flag when chatId changes
    hasMarkedAsRead.current = false;
    
    // Delay marking as read (user must view chat for X ms)
    timeoutRef.current = setTimeout(async () => {
      if (!hasMarkedAsRead.current) {
        try {
          await readReceiptService.markChatMessagesAsRead(
            chatId,
            currentUser.uid
          );
          hasMarkedAsRead.current = true;
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
        }
      }
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [chatId, enabled, delay]);
  
  // Re-mark as read when app comes to foreground
  useEffect(() => {
    if (!chatId || !enabled) return;
    
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      // App came to foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App came to foreground - marking messages as read');
        try {
          await readReceiptService.markChatMessagesAsRead(
            chatId,
            currentUser.uid
          );
        } catch (error) {
          console.error('Failed to mark messages as read on foreground:', error);
        }
      }
      
      appState.current = nextAppState;
    });
    
    return () => {
      subscription.remove();
    };
  }, [chatId, enabled]);
  
  // Manual trigger function (if needed)
  const markAsRead = async () => {
    if (!chatId) return;
    
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    try {
      await readReceiptService.markChatMessagesAsRead(
        chatId,
        currentUser.uid
      );
      hasMarkedAsRead.current = true;
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };
  
  return { markAsRead };
}
```

---

### File 3: Update `services/database/sqlite.ts` (ADD METHODS)

Add these methods to your existing `DatabaseService` class:

```typescript
// Add to DatabaseService class in services/database/sqlite.ts

/**
 * Update message read receipt
 */
async updateMessageReadReceipt(messageId: string, readBy: string[]): Promise<void> {
  if (!this.isAvailable()) return Promise.resolve();
  
  return new Promise((resolve, reject) => {
    this.db!.transaction((tx) => {
      tx.executeSql(
        `UPDATE messages SET readBy = ? WHERE id = ?`,
        [JSON.stringify(readBy), messageId],
        (_, result) => {
          console.log('Updated message read receipt:', messageId);
          resolve();
        },
        (_, error) => {
          console.error('Update read receipt error:', error);
          reject(error);
          return false;
        }
      );
    });
  });
}

/**
 * Update message delivered status
 */
async updateMessageDelivered(messageId: string, deliveredTo: string[]): Promise<void> {
  if (!this.isAvailable()) return Promise.resolve();
  
  return new Promise((resolve, reject) => {
    this.db!.transaction((tx) => {
      tx.executeSql(
        `UPDATE messages SET deliveredTo = ? WHERE id = ?`,
        [JSON.stringify(deliveredTo), messageId],
        (_, result) => {
          console.log('Updated message delivered status:', messageId);
          resolve();
        },
        (_, error) => {
          console.error('Update delivered status error:', error);
          reject(error);
          return false;
        }
      );
    });
  });
}
```

---

### File 4: Update `app/(tabs)/chats/[chatId].tsx` (INTEGRATE HOOK)

Add the `useReadReceipts` hook to your chat screen:

```typescript
// app/(tabs)/chats/[chatId].tsx
import { useReadReceipts } from '@/hooks/useReadReceipts';

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams();
  
  // ... existing code ...
  
  // ✅ ADD THIS: Automatically mark messages as read when chat is opened
  useReadReceipts(chatId as string, {
    enabled: true,
    delay: 1000 // Mark as read after 1 second of viewing
  });
  
  // ... rest of your component ...
}
```

---

### File 5: Update `hooks/useMessages.ts` (LISTEN FOR READ RECEIPTS)

Update your existing Firestore listener to include `readBy` and `deliveredTo` updates:

```typescript
// In your existing useMessages hook, ensure the listener captures readBy changes

useEffect(() => {
  if (!chatId) return;
  
  const firestore = await getFirebaseFirestore();
  const messagesRef = collection(firestore, `chats/${chatId}/messages`);
  const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      const messageData = change.doc.data();
      const message: Message = {
        id: change.doc.id,
        chatId,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        content: messageData.content || '',
        type: messageData.type,
        timestamp: messageData.timestamp?.toMillis() || Date.now(),
        syncStatus: 'synced',
        deliveryStatus: 'sent',
        readBy: messageData.readBy || [],           // ✅ Include this
        deliveredTo: messageData.deliveredTo || []  // ✅ Include this
      };
      
      if (change.type === 'added' || change.type === 'modified') {
        // Update SQLite with latest read receipts
        await db.insertOrUpdateMessage(message);
      }
    });
    
    // Refresh message list
    loadMessages();
  });
  
  return () => unsubscribe();
}, [chatId]);
```

---

## 🧪 Testing Plan

### Test 1: One-on-One Read Receipts (iPhone + iPad)

```bash
# Device Setup
iPhone: User A (sender)
iPad: User B (recipient)

# Steps
1. iPhone (User A):
   - Send message "Hello"
   - Observe status: 🕐 (sending)
   - Wait for sync
   - Observe status: ✓ (sent)

2. iPad (User B):
   - Open chat with User A
   - Wait 1 second (read delay)
   - Message is marked as read

3. iPhone (User A):
   - Observe status update: ✓✓ blue (read)
   - Should update within 2 seconds

# Expected Results
✅ Status changes from ✓ → ✓✓ blue
✅ Update happens in real-time (<2s)
✅ Status persists after app restart
```

### Test 2: Offline Read Receipts

```bash
# Steps
1. iPad (User B):
   - Turn OFF WiFi
   - Open chat and read messages
   - Messages marked as read locally

2. Turn ON WiFi:
   - Read receipts sync to Firestore
   - iPhone sees ✓✓ update

# Expected Results
✅ Works offline (local update)
✅ Syncs when online
✅ No data loss
```

### Test 3: Group Chat Read Receipts (3+ Devices)

```bash
# Device Setup
iPhone: User A (sender)
iPad: User B
Friend's Phone: User C

# Steps
1. iPhone: Send message to group
2. iPad: Open chat → mark as read
3. iPhone: See "Read by 1 of 2"
4. Friend's Phone: Open chat → mark as read
5. iPhone: See "Read by 2 of 2" or ✓✓ blue

# Expected Results
✅ Read count updates incrementally
✅ Shows "Read by X of Y" for groups
✅ Updates in real-time
```

---

## 📊 Implementation Timeline

| Phase | Task | Time | Priority |
|-------|------|------|----------|
| 1 | Create ReadReceiptService.ts | 1 hour | HIGH |
| 2 | Create useReadReceipts hook | 30 min | HIGH |
| 3 | Update SQLite methods | 30 min | HIGH |
| 4 | Integrate into chat screen | 15 min | HIGH |
| 5 | Update useMessages listener | 30 min | HIGH |
| 6 | Test with 2 devices | 1 hour | HIGH |
| **Total** | **One-on-One Complete** | **3.5 hours** | |
| 7 | Extend for group chats | 1 hour | MEDIUM |
| 8 | Update UI for group counts | 1 hour | MEDIUM |
| 9 | Create ReadReceiptModal | 1 hour | LOW |
| 10 | Test with 3+ devices | 1 hour | MEDIUM |
| **Total** | **Groups Complete** | **4 hours** | |

**Total Time: 7.5 hours for complete read receipts**

---

## ✅ Acceptance Criteria

### One-on-One Chats
- [ ] Messages marked as read within 1 second of viewing
- [ ] Status updates to ✓✓ blue in sender's UI
- [ ] Real-time updates (<2 seconds)
- [ ] Works offline and syncs when online
- [ ] Persists across app restarts

### Group Chats
- [ ] Tracks multiple readers
- [ ] Shows "Read by X of Y" in UI
- [ ] Detailed view on long-press
- [ ] Real-time updates as each user reads
- [ ] Works with 3+ participants

### Performance
- [ ] No lag when marking messages as read
- [ ] Batch updates for efficiency (groups)
- [ ] SQLite updates don't block UI
- [ ] Firestore transactions prevent race conditions

---

## 🚀 Quick Start

### Implement Now (1-on-1 Chat - 3 hours):
```bash
# 1. Create the service
touch services/messages/ReadReceiptService.ts
# Copy implementation from above

# 2. Create the hook
touch hooks/useReadReceipts.ts
# Copy implementation from above

# 3. Update SQLite
# Add methods to services/database/sqlite.ts

# 4. Integrate into chat screen
# Add useReadReceipts hook to app/(tabs)/chats/[chatId].tsx

# 5. Test with 2 devices
npx expo start
# Scan QR with both iPhone and iPad
```

### Test Checklist:
- [ ] Send message from iPhone
- [ ] Open chat on iPad
- [ ] iPhone sees ✓✓ update within 2 seconds
- [ ] Force quit both apps → reopen → status persists
- [ ] Turn off WiFi → read message → turn on WiFi → syncs

---

**Your UI is already ready! Just implement the backend logic and you're done.** 🎉

**Next Steps:**
1. Create `ReadReceiptService.ts` (1 hour)
2. Create `useReadReceipts.ts` hook (30 min)
3. Update SQLite methods (30 min)
4. Integrate into chat screen (15 min)
5. Test with iPhone + iPad (1 hour)

**Total: ~3 hours to complete MVP read receipts for 1-on-1 chats!**


