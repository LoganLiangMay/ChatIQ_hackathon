# MessageAI MVP - Implementation Guide

## User Story Implementation Walkthrough

This document provides detailed implementation guidance for each of the 37 user stories in the MessageAI MVP.

---

## Authentication & Profile (US-1 to US-4)

### US-1: Account Creation with Email/Password

**Implementation**:
```javascript
// Use Firebase Auth
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const signUp = async (email, password, displayName) => {
  const auth = getAuth();
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Create user profile in Firestore
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    email,
    displayName,
    createdAt: serverTimestamp(),
    online: true,
    lastSeen: serverTimestamp()
  });
};
```

**Key Components**:
- Auth screen with email/password inputs (Expo Router screen)
- Firebase Auth SDK initialization
- User profile creation in Firestore `users/{userId}`
- Form validation (email format, password strength)

**Pitfalls**:
- ⚠️ Don't forget to create Firestore user document after auth
- ⚠️ Handle auth errors (weak password, email exists, etc.)
- ⚠️ Validate email format before submission
- ⚠️ Password must be 6+ characters (Firebase requirement)

**Effort**: Low (1-2 hours)

**Questions**: None

---

### US-2: Sign In and Sign Out

**Implementation**:
```javascript
// Sign In
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

const signIn = async (email, password) => {
  const auth = getAuth();
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Update online status
  await updateDoc(doc(db, 'users', userCredential.user.uid), {
    online: true,
    lastSeen: serverTimestamp()
  });
};

// Sign Out
const signOut = async () => {
  const auth = getAuth();
  const userId = auth.currentUser.uid;
  
  // Update offline status
  await updateDoc(doc(db, 'users', userId), {
    online: false,
    lastSeen: serverTimestamp()
  });
  
  await signOut(auth);
};
```

**Key Components**:
- Sign in screen with email/password
- Sign out button in settings/profile
- Update online status on sign in/out
- Firebase Auth state listener (onAuthStateChanged)

**Pitfalls**:
- ⚠️ Handle wrong password/email not found errors
- ⚠️ Must update online status on sign in/out
- ⚠️ Clean up listeners on sign out to prevent memory leaks
- ⚠️ Handle network errors gracefully

**Effort**: Low (1 hour)

**Questions**: None

---

### US-3: User Profile with Display Name and Picture

**Implementation**:
```javascript
// Firestore schema
users/{userId}: {
  uid: string,
  email: string,
  displayName: string,
  profilePicture: string?, // URL from Firebase Storage
  online: boolean,
  lastSeen: timestamp,
  fcmToken: string?
}

// Update profile
const updateProfile = async (userId, updates) => {
  await updateDoc(doc(db, 'users', userId), updates);
};
```

**Key Components**:
- Profile screen in app
- Display name input
- Profile picture selection (ImagePicker)
- Upload to Firebase Storage if image changed
- Store URL in Firestore user document

**Pitfalls**:
- ⚠️ Profile picture upload can fail - handle errors
- ⚠️ Show loading state during upload
- ⚠️ Use Firebase Storage for images (not base64 in Firestore)
- ⚠️ Generate thumbnail URLs for efficiency (or use full image for MVP)

**Effort**: Medium (2-3 hours including image upload)

**Questions**: Should profile picture be required or optional? (Recommend optional with initials fallback)

---

### US-4: Session Persistence Across App Restarts

**Implementation**:
```javascript
// Firebase Auth automatically handles session persistence
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// In App.js or root component
useEffect(() => {
  const auth = getAuth();
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, navigate to chats
      router.replace('/chats');
    } else {
      // User is signed out, show auth screen
      router.replace('/auth');
    }
  });
  
  return unsubscribe;
}, []);
```

**Key Components**:
- Auth state listener in root component
- Expo Router navigation based on auth state
- Splash screen while checking auth state
- Automatic restoration of session on app restart

**Pitfalls**:
- ⚠️ Show loading state while checking auth (avoid flash of wrong screen)
- ⚠️ Handle deep links with auth state
- ⚠️ Clean up listener on unmount
- ⚠️ Update online status when app becomes active

**Effort**: Low (1 hour, mostly built into Firebase)

**Questions**: None

---

## One-on-One Messaging (US-5 to US-12)

### US-5: Send Text Messages to Another User in Real-Time

**Implementation**:
```javascript
// Message sending with optimistic update
const sendMessage = async (chatId, content, senderId) => {
  const messageId = uuid.v4(); // Client-generated ID
  const message = {
    id: messageId,
    chatId,
    senderId,
    content,
    type: 'text',
    timestamp: Date.now(),
    syncStatus: 'pending',
    deliveryStatus: 'sending'
  };
  
  // 1. Save to SQLite (optimistic)
  await db.insertMessage(message);
  
  // 2. Sync to Firebase
  try {
    await setDoc(doc(firestore, `chats/${chatId}/messages`, messageId), {
      senderId,
      content,
      type: 'text',
      timestamp: serverTimestamp(),
      readBy: [senderId],
      deliveredTo: [senderId]
    });
    
    // Update chat's lastMessage
    await updateDoc(doc(firestore, 'chats', chatId), {
      lastMessage: { content, timestamp: serverTimestamp() },
      updatedAt: serverTimestamp()
    });
    
    // 3. Update SQLite sync status
    await db.updateMessageStatus(messageId, 'synced', 'sent');
  } catch (error) {
    await db.updateMessageStatus(messageId, 'failed', 'failed');
    // Schedule retry
  }
};
```

**Key Components**:
- Message input component with send button
- SQLite database service with message table
- Firebase Firestore write operation
- UUID library for client-generated IDs
- Message queue service for retry logic

**Pitfalls**:
- ⚠️ Use client-generated UUIDs (don't depend on server ID)
- ⚠️ Implement optimistic update before Firebase confirmation
- ⚠️ Handle Firebase write failures with retry queue
- ⚠️ Update chat's lastMessage for chat list sorting
- ⚠️ Use serverTimestamp() for server-side ordering
- ⚠️ Beware of timezone issues (use server timestamp as source of truth)

**Effort**: High (4-5 hours - core of messaging system)

**Questions**: None

---

### US-6: Receive Messages Instantly When Online

**Implementation**:
```javascript
// Real-time listener for active chat
useEffect(() => {
  if (!chatId || !userId) return;
  
  const messagesRef = collection(firestore, `chats/${chatId}/messages`);
  const q = query(
    messagesRef,
    orderBy('timestamp', 'desc'),
    limit(50) // Limit for performance
  );
  
  const unsubscribe = onSnapshot(q, async (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'added') {
        const message = { id: change.doc.id, ...change.doc.data() };
        
        // Save to SQLite if not from current user
        if (message.senderId !== userId) {
          await db.insertMessage({
            ...message,
            syncStatus: 'synced',
            deliveryStatus: 'delivered'
          });
          
          // Mark as delivered
          await updateDoc(change.doc.ref, {
            deliveredTo: arrayUnion(userId)
          });
        }
      }
    });
  });
  
  return () => unsubscribe();
}, [chatId, userId]);
```

**Key Components**:
- Firestore snapshot listener in chat screen
- Real-time updates via onSnapshot
- SQLite insert for received messages
- Delivery status update (deliveredTo array)
- Message list UI component

**Pitfalls**:
- ⚠️ Detach listeners when chat not active (memory leaks)
- ⚠️ Use arrayUnion to prevent duplicates in deliveredTo
- ⚠️ Limit query to recent messages (50) for performance
- ⚠️ Handle listener errors/disconnections
- ⚠️ Don't duplicate messages already in SQLite
- ⚠️ Order by timestamp desc (most recent first), reverse for display

**Effort**: Medium (3-4 hours including UI)

**Questions**: Should we implement pagination for message history now or post-MVP? (Recommend basic pagination for MVP)

---

### US-7: Optimistic UI Updates (Instant Message Appearance)

**Implementation**:
```javascript
// In message sending function
const sendMessage = async (content) => {
  // Create optimistic message
  const optimisticMessage = {
    id: uuid.v4(),
    chatId,
    senderId: currentUser.uid,
    content,
    timestamp: Date.now(),
    syncStatus: 'pending',
    deliveryStatus: 'sending',
    optimistic: true // Flag for UI
  };
  
  // 1. Update UI state immediately
  setMessages(prev => [...prev, optimisticMessage]);
  
  // 2. Save to SQLite
  await db.insertMessage(optimisticMessage);
  
  // 3. Sync to Firebase (background)
  syncMessage(optimisticMessage);
};
```

**Key Components**:
- Local state update before network call
- Visual indicator for "sending" state (e.g., clock icon)
- Update to "sent" icon on confirmation
- Rollback or error state on failure

**Pitfalls**:
- ⚠️ Must show visual feedback (sending vs sent vs delivered)
- ⚠️ Handle failures gracefully (show retry button or auto-retry)
- ⚠️ Don't block UI on network call
- ⚠️ Update message status when Firebase confirms
- ⚠️ Race condition: user sends message, immediately closes app

**Effort**: Medium (2-3 hours for full implementation)

**Questions**: How to handle failed messages in UI? (Recommend: show error icon with tap-to-retry)

---

### US-8: Message Delivery States (sending/sent/delivered/read)

**Implementation**:
```javascript
// Message status enum
const MessageStatus = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
};

// Update delivery status
const updateDeliveryStatus = async (messageId, userId) => {
  const messageRef = doc(firestore, `chats/${chatId}/messages`, messageId);
  await updateDoc(messageRef, {
    deliveredTo: arrayUnion(userId)
  });
  
  // Update SQLite
  await db.updateMessageStatus(messageId, 'synced', 'delivered');
};

// UI rendering
const getStatusIcon = (message, currentUserId) => {
  if (message.senderId !== currentUserId) return null;
  
  if (message.syncStatus === 'failed') return '❌';
  if (message.deliveryStatus === 'sending') return '🕐';
  if (message.deliveryStatus === 'sent') return '✓';
  if (message.deliveryStatus === 'delivered') return '✓✓';
  if (message.deliveryStatus === 'read') return '✓✓' (blue);
};
```

**Key Components**:
- deliveredTo array in Firestore message
- readBy array in Firestore message
- Status icons in message bubble
- Logic to determine status from arrays
- SQLite deliveryStatus column for offline viewing

**Pitfalls**:
- ⚠️ Only show status for sent messages (not received)
- ⚠️ In groups, show status differently (e.g., count read)
- ⚠️ Update deliveredTo when message received
- ⚠️ Update readBy when chat viewed
- ⚠️ Handle array updates efficiently (arrayUnion prevents duplicates)

**Effort**: Medium (2-3 hours)

**Questions**: For group chats, show individual read receipts or just count? (Recommend: count for MVP, like "Read by 3")

---

### US-9: Message Timestamps

**Implementation**:
```javascript
// Timestamp formatting utility
const formatTimestamp = (timestamp) => {
  const now = new Date();
  const messageDate = new Date(timestamp);
  const diffInHours = (now - messageDate) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return messageDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    }); // "2:34 PM"
  } else if (diffInHours < 168) { // 7 days
    return messageDate.toLocaleDateString('en-US', { 
      weekday: 'short' 
    }); // "Mon"
  } else {
    return messageDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }); // "Dec 15"
  }
};

// Display in message bubble
<Text style={styles.timestamp}>
  {formatTimestamp(message.timestamp)}
</Text>
```

**Key Components**:
- Timestamp formatter utility
- Display in message bubble (subtle, small text)
- Date dividers between messages (optional for MVP)
- Use client timestamp for immediate display, server for ordering

**Pitfalls**:
- ⚠️ Use server timestamp for ordering (client clocks can be wrong)
- ⚠️ Store both client timestamp (display) and server (ordering)
- ⚠️ Handle timezone differences
- ⚠️ Format consistently across all messages

**Effort**: Low (1 hour)

**Questions**: Include date dividers (e.g., "Today", "Yesterday") or just timestamps? (Recommend: timestamps only for MVP)

---

### US-10: Read Receipts

**Implementation**:
```javascript
// Mark messages as read when chat viewed
useEffect(() => {
  if (!chatId || !userId) return;
  
  const markMessagesAsRead = async () => {
    // Get unread messages from SQLite
    const unreadMessages = await db.getUnreadMessages(chatId, userId);
    
    // Update Firestore
    const batch = writeBatch(firestore);
    unreadMessages.forEach(msg => {
      const msgRef = doc(firestore, `chats/${chatId}/messages`, msg.id);
      batch.update(msgRef, {
        readBy: arrayUnion(userId)
      });
    });
    await batch.commit();
    
    // Update SQLite
    await db.markChatAsRead(chatId, userId);
  };
  
  markMessagesAsRead();
}, [chatId, userId]);
```

**Key Components**:
- readBy array in Firestore message document
- Batch update when chat opened
- Visual indicator (blue checkmarks)
- Real-time listener for readBy updates

**Pitfalls**:
- ⚠️ Only mark as read when chat is actually viewed (not in background)
- ⚠️ Use batch writes to reduce Firestore operations
- ⚠️ Don't mark own messages as unread
- ⚠️ In groups, handle array efficiently (can get large)
- ⚠️ Update UI in real-time when others read

**Effort**: Medium (2-3 hours)

**Questions**: None

---

### US-11: Typing Indicators

**Implementation**:
```javascript
// In Firestore, add typing field to user presence
users/{userId}: {
  // ... other fields
  typing: {
    chatId: string?,
    isTyping: boolean,
    updatedAt: timestamp
  }
}

// When user types
const handleTyping = debounce(async () => {
  await updateDoc(doc(firestore, 'users', currentUser.uid), {
    typing: {
      chatId,
      isTyping: true,
      updatedAt: serverTimestamp()
    }
  });
  
  // Clear after 3 seconds
  setTimeout(() => {
    updateDoc(doc(firestore, 'users', currentUser.uid), {
      'typing.isTyping': false
    });
  }, 3000);
}, 500);

// Listen to other user's typing status
const otherUserRef = doc(firestore, 'users', otherUserId);
onSnapshot(otherUserRef, (doc) => {
  const typing = doc.data()?.typing;
  if (typing?.chatId === chatId && typing?.isTyping) {
    setIsOtherUserTyping(true);
  } else {
    setIsOtherUserTyping(false);
  }
});
```

**Key Components**:
- Debounced typing event handler
- Firestore user document update
- Real-time listener for other user's typing status
- Visual indicator (e.g., "Alice is typing...")
- Auto-clear after timeout

**Pitfalls**:
- ⚠️ Debounce typing events (don't spam Firestore)
- ⚠️ Clear typing status after timeout (3 seconds)
- ⚠️ Clear when message sent
- ⚠️ Firestore writes cost money - minimize updates
- ⚠️ In groups, could show multiple users typing (complex - recommend single indicator for MVP)

**Effort**: Medium (2 hours)

**Questions**: For groups, show all typing users or just "Someone is typing..."? (Recommend: simple "Someone is typing..." for MVP)

---

### US-12: Online/Offline Status Indicators

**Implementation**:
```javascript
// Update presence on app state change
import { AppState } from 'react-native';

useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      // App foregrounded - set online
      updateDoc(doc(firestore, 'users', currentUser.uid), {
        online: true,
        lastSeen: serverTimestamp()
      });
    } else {
      // App backgrounded - set offline
      updateDoc(doc(firestore, 'users', currentUser.uid), {
        online: false,
        lastSeen: serverTimestamp()
      });
    }
  });
  
  return () => subscription.remove();
}, []);

// Display in chat header
<View style={styles.status}>
  <View style={[styles.dot, { backgroundColor: isOnline ? 'green' : 'gray' }]} />
  <Text>{isOnline ? 'Online' : `Last seen ${formatLastSeen(lastSeen)}`}</Text>
</View>
```

**Key Components**:
- AppState listener to track app foreground/background
- Update user's online field in Firestore
- Store lastSeen timestamp
- Real-time listener for other user's online status
- Visual indicator (green dot for online)

**Pitfalls**:
- ⚠️ Update on sign in/out
- ⚠️ Update on app foreground/background (AppState)
- ⚠️ Firebase has onDisconnect for web - React Native needs manual handling
- ⚠️ Clear listener when component unmounts
- ⚠️ Handle network disconnections (show offline when no connection)
- ⚠️ Format lastSeen nicely ("5 minutes ago", "Yesterday at 2:34 PM")

**Effort**: Medium (2-3 hours)

**Questions**: Use Firebase Realtime Database for presence (has onDisconnect) or Firestore with manual handling? (Recommend: Firestore for consistency, manual AppState handling)

---

## Offline Support (US-13 to US-17)

### US-13: View Message History While Offline

**Implementation**:
```javascript
// Load messages from SQLite (offline-first)
const loadMessages = async (chatId) => {
  // Always load from SQLite first (works offline)
  const localMessages = await db.getMessages(chatId);
  setMessages(localMessages);
  
  // Then sync with Firebase if online
  if (isOnline) {
    syncMessagesFromFirebase(chatId);
  }
};

// SQLite query
db.getMessages = (chatId) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp DESC LIMIT 50',
        [chatId],
        (_, { rows }) => resolve(rows._array),
        (_, error) => reject(error)
      );
    });
  });
};
```

**Key Components**:
- SQLite as primary data source for UI
- Load from SQLite on chat open (works offline)
- Sync with Firebase as background process when online
- Message list component reads from SQLite

**Pitfalls**:
- ⚠️ Always load from SQLite first (don't wait for Firebase)
- ⚠️ Implement proper ordering (timestamp DESC)
- ⚠️ Handle empty state gracefully
- ⚠️ Pagination for performance (load 50 at a time)
- ⚠️ Index timestamp column for fast queries

**Effort**: Medium (2-3 hours with proper setup)

**Questions**: None

---

### US-14: Send Messages While Offline (Queue Locally)

**Implementation**:
```javascript
// Message queue service
class MessageQueue {
  async sendMessage(message) {
    // Save to SQLite with pending status
    await db.insertMessage({
      ...message,
      syncStatus: 'pending',
      deliveryStatus: 'sending'
    });
    
    // Try to sync if online
    if (await isOnline()) {
      this.syncMessage(message.id);
    } else {
      // Queue for later
      console.log('Offline: message queued for sync');
    }
  }
  
  async syncMessage(messageId) {
    const message = await db.getMessage(messageId);
    
    try {
      await setDoc(doc(firestore, `chats/${message.chatId}/messages`, messageId), {
        senderId: message.senderId,
        content: message.content,
        type: message.type,
        imageUrl: message.imageUrl,
        timestamp: serverTimestamp(),
        readBy: [message.senderId],
        deliveredTo: [message.senderId]
      });
      
      await db.updateMessageStatus(messageId, 'synced', 'sent');
    } catch (error) {
      await db.updateMessageStatus(messageId, 'failed', 'failed');
    }
  }
  
  async retryPendingMessages() {
    const pending = await db.getPendingMessages();
    for (const msg of pending) {
      await this.syncMessage(msg.id);
    }
  }
}
```

**Key Components**:
- Message queue service
- SQLite pending messages tracking
- Network state listener (NetInfo from Expo)
- Auto-retry when connection restored
- Failed message handling

**Pitfalls**:
- ⚠️ Must queue messages in SQLite immediately
- ⚠️ Show "sending" state while offline
- ⚠️ Retry when network restored (use NetInfo listener)
- ⚠️ Handle race conditions (what if user sends, immediately closes app?)
- ⚠️ Preserve message order (use client timestamp)
- ⚠️ Limit retry attempts (exponential backoff)

**Effort**: Medium-High (3-4 hours)

**Questions**: None

---

### US-15: Queued Messages Send Automatically on Reconnect

**Implementation**:
```javascript
// Network state listener
import NetInfo from '@react-native-community/netinfo';

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      // Connection restored - retry pending messages
      messageQueue.retryPendingMessages();
      
      // Update online status
      updateDoc(doc(firestore, 'users', currentUser.uid), {
        online: true,
        lastSeen: serverTimestamp()
      });
    } else {
      // Connection lost
      updateDoc(doc(firestore, 'users', currentUser.uid), {
        online: false,
        lastSeen: serverTimestamp()
      }).catch(() => {}); // May fail if truly offline
    }
  });
  
  return () => unsubscribe();
}, []);
```

**Key Components**:
- NetInfo for network state monitoring
- Auto-retry pending messages on reconnect
- Update online status
- Background sync process

**Pitfalls**:
- ⚠️ NetInfo can give false positives (connected but no internet)
- ⚠️ Test actual Firebase connectivity, not just network state
- ⚠️ Don't spam retries (implement backoff)
- ⚠️ Handle partial connectivity (slow networks)
- ⚠️ Update UI to show sync in progress

**Effort**: Medium (2 hours)

**Questions**: None

---

### US-16: Receive Messages Sent While Offline

**Implementation**:
```javascript
// When app comes back online, Firebase listener automatically fires with new messages
// The onSnapshot listener will catch up with all messages sent while offline

// Ensure listener is active when online
useEffect(() => {
  if (!chatId || !isOnline) return;
  
  const messagesRef = collection(firestore, `chats/${chatId}/messages`);
  const q = query(
    messagesRef,
    where('timestamp', '>', lastSyncTimestamp),
    orderBy('timestamp', 'desc')
  );
  
  const unsubscribe = onSnapshot(q, async (snapshot) => {
    // Process new messages
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'added') {
        const message = { id: change.doc.id, ...change.doc.data() };
        await db.insertMessage({
          ...message,
          syncStatus: 'synced',
          deliveryStatus: 'delivered'
        });
        
        // Mark as delivered
        await updateDoc(change.doc.ref, {
          deliveredTo: arrayUnion(currentUser.uid)
        });
      }
    });
  });
  
  return () => unsubscribe();
}, [chatId, isOnline]);
```

**Key Components**:
- Firebase snapshot listener catches up automatically
- Query for messages newer than last sync
- Save to SQLite when received
- Mark as delivered
- Show notification for new messages

**Pitfalls**:
- ⚠️ Listener must be active when coming online
- ⚠️ Don't duplicate messages already in SQLite (check before insert)
- ⚠️ Handle large catch-ups efficiently (could be many messages)
- ⚠️ Update lastSyncTimestamp to avoid re-fetching same messages
- ⚠️ Show UI indicator when syncing

**Effort**: Low-Medium (1-2 hours, mostly handled by Firebase)

**Questions**: None

---

### US-17: Messages Never Lost (Even on Mid-Send Crash)

**Implementation**:
```javascript
// Critical: Write to SQLite BEFORE any network operation
const sendMessage = async (content) => {
  const message = {
    id: uuid.v4(),
    chatId,
    senderId: currentUser.uid,
    content,
    timestamp: Date.now(),
    syncStatus: 'pending', // Critical: mark as pending
    deliveryStatus: 'sending'
  };
  
  // 1. Write to SQLite FIRST (guaranteed persistence)
  await db.insertMessage(message);
  
  // 2. Update UI (optimistic)
  setMessages(prev => [...prev, message]);
  
  // 3. Attempt sync (can fail, that's okay)
  syncMessageToFirebase(message).catch(err => {
    console.log('Sync failed, will retry');
  });
};

// On app start, retry any pending messages
useEffect(() => {
  const retryPendingOnStartup = async () => {
    const pending = await db.getPendingMessages();
    for (const msg of pending) {
      syncMessageToFirebase(msg);
    }
  };
  
  retryPendingOnStartup();
}, []);
```

**Key Components**:
- SQLite write BEFORE Firebase (guaranteed persistence)
- Pending status flag in database
- Startup routine to retry pending messages
- Robust error handling

**Pitfalls**:
- ⚠️ **Critical**: Must write to SQLite before any async network operation
- ⚠️ SQLite write must be synchronous/awaited
- ⚠️ Handle app crash during SQLite write (use transactions)
- ⚠️ Retry pending messages on app restart
- ⚠️ Test force quit scenario thoroughly
- ⚠️ Don't let SQLite write fail silently

**Effort**: Medium (2 hours, critical testing)

**Questions**: None (this is critical path)

---

## Group Chat (US-18 to US-22)

### US-18: Create Group Chat with 3+ Participants

**Implementation**:
```javascript
// Create group in Firestore
const createGroup = async (name, creatorId, participantIds, groupPicture?) => {
  const groupId = uuid.v4();
  const group = {
    id: groupId,
    type: 'group',
    name,
    groupPicture: groupPicture || null,
    createdBy: creatorId,
    createdAt: serverTimestamp(),
    participants: [creatorId, ...participantIds],
    admins: [creatorId], // Creator is first admin
    lastMessage: null,
    updatedAt: serverTimestamp()
  };
  
  await setDoc(doc(firestore, 'chats', groupId), group);
  
  // Also save to SQLite
  await db.insertChat(group);
  
  return groupId;
};
```

**Key Components**:
- Group creation screen with:
  - Group name input
  - Participant selection (multi-select)
  - Optional group picture upload
- Firestore chat document with type: 'group'
- Participants array
- Admins array (creator starts as admin)

**Pitfalls**:
- ⚠️ Validate minimum 3 participants (including creator)
- ⚠️ Handle participant selection UI (search/filter users)
- ⚠️ Creator is automatically first admin
- ⚠️ Store both in Firestore and SQLite
- ⚠️ Update all participants' chat lists

**Effort**: Medium-High (3-4 hours with UI)

**Questions**: Max group size limit? (Recommend: 50 for MVP to keep arrays manageable)

---

### US-19: Send Messages to Group Chat

**Implementation**:
```javascript
// Same as one-on-one, but handle group-specific logic
const sendGroupMessage = async (chatId, content) => {
  const message = {
    id: uuid.v4(),
    chatId,
    senderId: currentUser.uid,
    content,
    type: 'text',
    timestamp: Date.now(),
    syncStatus: 'pending',
    deliveryStatus: 'sending'
  };
  
  await db.insertMessage(message);
  
  // Sync to Firebase
  await setDoc(doc(firestore, `chats/${chatId}/messages`, message.id), {
    senderId: message.senderId,
    content: message.content,
    type: message.type,
    timestamp: serverTimestamp(),
    readBy: [currentUser.uid], // Start with sender
    deliveredTo: [currentUser.uid]
  });
  
  // Update group's lastMessage
  await updateDoc(doc(firestore, 'chats', chatId), {
    lastMessage: {
      senderId: currentUser.uid,
      content: message.content,
      timestamp: serverTimestamp()
    },
    updatedAt: serverTimestamp()
  });
};
```

**Key Components**:
- Same message sending logic as one-on-one
- readBy and deliveredTo arrays for tracking
- All participants receive via real-time listener
- Update group's lastMessage

**Pitfalls**:
- ⚠️ readBy and deliveredTo arrays can get large in big groups
- ⚠️ All participants get updates via their listeners
- ⚠️ Handle permissions (what if user was removed from group?)
- ⚠️ Delivery tracking more complex (show count, not all names)

**Effort**: Low-Medium (1-2 hours, builds on US-5)

**Questions**: None

---

### US-20: Group Messages with Proper Attribution

**Implementation**:
```javascript
// Display sender name in group messages
const GroupMessage = ({ message, currentUserId }) => {
  const [senderInfo, setSenderInfo] = useState(null);
  
  useEffect(() => {
    const loadSender = async () => {
      const userDoc = await getDoc(doc(firestore, 'users', message.senderId));
      setSenderInfo(userDoc.data());
    };
    loadSender();
  }, [message.senderId]);
  
  const isSentByMe = message.senderId === currentUserId;
  
  return (
    <View style={[styles.message, isSentByMe ? styles.myMessage : styles.otherMessage]}>
      {!isSentByMe && (
        <Text style={styles.senderName}>{senderInfo?.displayName}</Text>
      )}
      <Text style={styles.content}>{message.content}</Text>
      <Text style={styles.timestamp}>{formatTimestamp(message.timestamp)}</Text>
    </View>
  );
};
```

**Key Components**:
- Show sender name for messages not sent by current user
- Different styling for own vs others' messages
- Cache sender info to avoid repeated Firestore reads
- Display name from users collection

**Pitfalls**:
- ⚠️ Cache user info (don't fetch for every message)
- ⚠️ Handle deleted users gracefully (show ID or "Unknown")
- ⚠️ Don't show sender name for own messages
- ⚠️ Batch user info fetches if possible
- ⚠️ Consider storing sender name in message for offline viewing

**Effort**: Low-Medium (2 hours)

**Questions**: Should we denormalize sender name into message document for offline viewing? (Recommend: yes, store displayName snapshot)

---

### US-21: Group Message Delivery and Read Status

**Implementation**:
```javascript
// Simplified read receipt for groups
const GroupMessageStatus = ({ message, participants }) => {
  const readCount = message.readBy?.length || 0;
  const deliveredCount = message.deliveredTo?.length || 0;
  const totalParticipants = participants.length;
  
  if (message.senderId !== currentUserId) return null;
  
  if (readCount === totalParticipants) {
    return <Text style={styles.readStatus}>Read by {readCount}</Text>;
  } else if (deliveredCount > 1) {
    return <Text style={styles.deliveredStatus}>Delivered to {deliveredCount}</Text>;
  } else {
    return <Text style={styles.sentStatus}>Sent</Text>;
  }
};
```

**Key Components**:
- Track readBy and deliveredTo arrays
- Show count instead of individual names (simpler UI)
- Update when each participant reads/receives
- Different visual for sent/delivered/read

**Pitfalls**:
- ⚠️ Arrays can get large (watch Firestore document size - 1MB limit)
- ⚠️ Showing individual names is complex UI (skip for MVP)
- ⚠️ Use counts for simplicity: "Read by 3", "Delivered to 5"
- ⚠️ Update arrays efficiently with arrayUnion
- ⚠️ Handle edge case: user removed from group but in readBy array

**Effort**: Medium (2-3 hours)

**Questions**: None

---

### US-22: Real-Time Updates in Group Chats

**Implementation**:
```javascript
// Same listener as one-on-one, works for groups automatically
// The key is proper Firestore query and handling

useEffect(() => {
  if (!chatId) return;
  
  const messagesRef = collection(firestore, `chats/${chatId}/messages`);
  const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'added') {
        const message = { id: change.doc.id, ...change.doc.data() };
        
        // Save to SQLite
        await db.insertOrUpdateMessage(message);
        
        // Mark as delivered
        if (message.senderId !== currentUserId) {
          await updateDoc(change.doc.ref, {
            deliveredTo: arrayUnion(currentUserId)
          });
        }
      }
    });
  });
  
  return () => unsubscribe();
}, [chatId]);
```

**Key Components**:
- Same real-time listener pattern
- Works for both one-on-one and group chats
- All participants get updates simultaneously
- Proper message ordering

**Pitfalls**:
- ⚠️ Ensure all group members have listener active
- ⚠️ Handle case where user is removed from group (stop listening)
- ⚠️ Message ordering must be consistent across devices
- ⚠️ Use server timestamp for ordering to handle clock skew
- ⚠️ Limit to recent messages (pagination)

**Effort**: Low (1 hour, reuses one-on-one logic)

**Questions**: None

---

## Notifications (US-23 to US-25)

### US-23: Receive Push Notifications (Foreground Minimum)

**Implementation**:
```javascript
// Expo Notifications setup
import * as Notifications from 'expo-notifications';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permissions
const requestPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Push notification permissions required!');
    return;
  }
  
  // Get FCM token
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  
  // Save to Firestore
  await updateDoc(doc(firestore, 'users', currentUser.uid), {
    fcmToken: token
  });
};

// Listen for foreground notifications
useEffect(() => {
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });
  
  return () => subscription.remove();
}, []);
```

**Key Components**:
- Expo Notifications configuration
- Permission request on app start
- FCM token registration
- Foreground notification listener
- Store token in Firestore user document

**Pitfalls**:
- ⚠️ **iOS**: Requires physical device (simulator doesn't support push)
- ⚠️ Request permissions early (on login or app start)
- ⚠️ Token can change - refresh periodically
- ⚠️ Handle permission denial gracefully
- ⚠️ Foreground notifications require explicit configuration
- ⚠️ Test on both iOS and Android (different behaviors)

**Effort**: Medium-High (3-4 hours with testing)

**Questions**: None (using Expo simplifies this significantly)

---

### US-24: Notification Shows Sender and Message Preview

**Implementation**:
```javascript
// Send notification via Firebase Cloud Function
// Cloud Function (Node.js)
exports.sendMessageNotification = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const chatId = context.params.chatId;
    
    // Get chat participants
    const chatDoc = await admin.firestore().doc(`chats/${chatId}`).get();
    const chat = chatDoc.data();
    
    // Get sender info
    const senderDoc = await admin.firestore().doc(`users/${message.senderId}`).get();
    const sender = senderDoc.data();
    
    // Get recipient FCM tokens (exclude sender)
    const recipients = chat.participants.filter(id => id !== message.senderId);
    const tokens = [];
    
    for (const recipientId of recipients) {
      const userDoc = await admin.firestore().doc(`users/${recipientId}`).get();
      const token = userDoc.data()?.fcmToken;
      if (token) tokens.push(token);
    }
    
    // Send notification
    if (tokens.length > 0) {
      await admin.messaging().sendMulticast({
        tokens,
        notification: {
          title: chat.type === 'group' ? `${sender.displayName} in ${chat.name}` : sender.displayName,
          body: message.type === 'text' ? message.content : '📷 Image'
        },
        data: {
          chatId,
          messageId: snap.id,
          type: 'new_message'
        }
      });
    }
  });
```

**Key Components**:
- Firebase Cloud Function triggered on new message
- Fetch sender display name
- Fetch recipient FCM tokens
- Send via Firebase Cloud Messaging
- Include chat context in notification data

**Pitfalls**:
- ⚠️ Don't send notification to message sender
- ⚠️ Handle missing FCM tokens gracefully
- ⚠️ Format group notifications differently (show group name)
- ⚠️ Truncate long messages in preview
- ⚠️ Cloud Function must handle errors (missing users, etc.)
- ⚠️ Cold start delay (1-2s acceptable for MVP)

**Effort**: High (4-5 hours including Cloud Function setup)

**Questions**: Should we batch notifications for rapid messages or send each individually? (Recommend: individual for MVP, batch post-MVP)

---

### US-25: Tapping Notification Opens Relevant Chat

**Implementation**:
```javascript
// Handle notification tap
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

const NotificationHandler = () => {
  const router = useRouter();
  
  useEffect(() => {
    // Foreground notification tap
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const chatId = response.notification.request.content.data.chatId;
      
      if (chatId) {
        router.push(`/chats/${chatId}`);
      }
    });
    
    return () => subscription.remove();
  }, []);
  
  return null;
};
```

**Key Components**:
- Notification response listener
- Extract chatId from notification data
- Navigate to chat using Expo Router
- Handle app states (foreground, background, killed)

**Pitfalls**:
- ⚠️ Must include chatId in notification data payload
- ⚠️ Handle case where chat doesn't exist locally yet
- ⚠️ Different behavior when app is foreground vs background vs killed
- ⚠️ For background/killed, may need to fetch chat data first
- ⚠️ Test all three app states

**Effort**: Medium (2-3 hours)

**Questions**: None

---

## Reliability (US-26 to US-30)

### US-26: Graceful Poor Network Handling

**Implementation**:
```javascript
// Network quality detection
import NetInfo from '@react-native-community/netinfo';

const useNetworkQuality = () => {
  const [networkState, setNetworkState] = useState({
    isConnected: true,
    type: 'unknown'
  });
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState({
        isConnected: state.isConnected,
        type: state.type
      });
      
      // Adjust behavior for slow networks
      if (state.type === 'cellular' && state.details?.cellularGeneration === '3g') {
        // Increase timeouts, reduce polling
        console.log('Slow network detected');
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  return networkState;
};

// Show network status in UI
{!networkState.isConnected && (
  <View style={styles.offlineBanner}>
    <Text>Offline - Messages will send when connected</Text>
  </View>
)}
```

**Key Components**:
- NetInfo for network state monitoring
- Show offline indicator in UI
- Adjust timeouts for slow networks
- Queue messages when offline
- Retry logic with exponential backoff

**Pitfalls**:
- ⚠️ NetInfo can report connected but no actual internet
- ⚠️ Test actual Firebase reachability, not just network state
- ⚠️ Show clear UI feedback when offline
- ⚠️ Don't let app hang on slow networks (use timeouts)
- ⚠️ Test on throttled connection (Chrome DevTools can simulate)

**Effort**: Low-Medium (2 hours)

**Questions**: None

---

### US-27: Handle Rapid-Fire Messages (20+)

**Implementation**:
```javascript
// Message queue with sequential processing
class MessageQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }
  
  async add(message) {
    this.queue.push(message);
    if (!this.processing) {
      this.processQueue();
    }
  }
  
  async processQueue() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const message = this.queue.shift();
      
      try {
        // Write to SQLite (synchronous)
        await db.insertMessage(message);
        
        // Sync to Firebase (can batch these)
        await this.syncToFirebase(message);
      } catch (error) {
        console.error('Message send failed:', error);
        // Keep in failed state, will retry later
      }
    }
    
    this.processing = false;
  }
}
```

**Key Components**:
- Message send queue (sequential processing)
- Batch Firestore writes where possible
- Proper ordering via client timestamps
- UI updates for all messages in queue

**Pitfalls**:
- ⚠️ **Critical**: Maintain message order (use timestamp)
- ⚠️ Don't overwhelm Firebase with simultaneous writes
- ⚠️ SQLite writes must be sequential (no concurrent transactions)
- ⚠️ Test with actual rapid sends (20+ in few seconds)
- ⚠️ Show all messages immediately in UI (optimistic)
- ⚠️ Handle Firestore rate limits (unlikely but possible)

**Effort**: Medium (2-3 hours)

**Questions**: Should we implement Firestore batch writes for efficiency? (Recommend: yes if time permits)

---

### US-28: Persist Through App Backgrounding

**Implementation**:
```javascript
// Handle app state changes
import { AppState } from 'react-native';

useEffect(() => {
  const subscription = AppState.addEventListener('change', nextAppState => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App foregrounded
      console.log('App came to foreground');
      
      // Retry pending messages
      messageQueue.retryPendingMessages();
      
      // Update online status
      updateOnlineStatus(true);
      
      // Refresh active chat
      if (currentChatId) {
        refreshMessages(currentChatId);
      }
    } else if (nextAppState.match(/inactive|background/)) {
      // App backgrounded
      console.log('App went to background');
      
      // Update offline status
      updateOnlineStatus(false);
      
      // Ensure pending messages are saved
      // (already in SQLite, but good to verify)
    }
    
    appState.current = nextAppState;
  });
  
  return () => subscription.remove();
}, []);
```

**Key Components**:
- AppState event listener
- Save state before backgrounding
- Restore state when foregrounding
- Retry pending messages
- Update online status

**Pitfalls**:
- ⚠️ iOS and Android behave differently when backgrounded
- ⚠️ Listeners may be paused in background
- ⚠️ Must save all state before app backgrounds
- ⚠️ Test with actual device backgrounding
- ⚠️ Handle rapid background/foreground cycles

**Effort**: Medium (2-3 hours with testing)

**Questions**: None

---

### US-29: Persist Through Force Quit

**Implementation**:
```javascript
// No special code needed - SQLite persists automatically
// Critical: Ensure ALL messages written to SQLite before any async operation

// On app restart, load from SQLite
const loadChatsOnStartup = async () => {
  const chats = await db.getChats(currentUserId);
  setChats(chats);
  
  // Retry any pending messages
  await messageQueue.retryPendingMessages();
};

// SQLite is file-based - survives app termination
// As long as we write to SQLite before Firebase, data is safe
```

**Key Components**:
- SQLite file persistence (automatic)
- Load from SQLite on app start
- Retry pending messages on startup
- No special cleanup needed

**Pitfalls**:
- ⚠️ **Critical**: Write to SQLite BEFORE async Firebase calls
- ⚠️ Test by force quitting during message send
- ⚠️ Verify SQLite write is complete before returning from function
- ⚠️ Handle corrupt SQLite database (extremely rare but possible)
- ⚠️ Test on physical device (iOS can behave differently than simulator)

**Effort**: Low (1 hour testing, logic already in place)

**Questions**: None

---

### US-30: Graceful Error Recovery Without Data Loss

**Implementation**:
```javascript
// Comprehensive error handling
const sendMessage = async (content) => {
  const message = createMessage(content);
  
  try {
    // 1. Write to SQLite (must succeed)
    await db.insertMessage(message);
  } catch (sqliteError) {
    // This is critical - show error to user
    console.error('Critical: SQLite write failed', sqliteError);
    Alert.alert('Error', 'Failed to save message. Please try again.');
    return;
  }
  
  // 2. Update UI optimistically
  setMessages(prev => [...prev, message]);
  
  // 3. Sync to Firebase (can fail, will retry)
  try {
    await syncToFirebase(message);
    await db.updateMessageStatus(message.id, 'synced', 'sent');
  } catch (firebaseError) {
    console.error('Firebase sync failed, will retry', firebaseError);
    await db.updateMessageStatus(message.id, 'failed', 'failed');
    
    // Schedule retry
    setTimeout(() => {
      retryMessage(message.id);
    }, 5000);
  }
};

// Error boundaries in React components
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo);
    // Log to error tracking service
  }
  
  render() {
    return this.props.children;
  }
}
```

**Key Components**:
- Try-catch blocks around all async operations
- SQLite write failures are critical (show user error)
- Firebase failures are non-critical (retry automatically)
- Error boundaries for component errors
- User feedback for critical errors

**Pitfalls**:
- ⚠️ SQLite write failure is critical - must notify user
- ⚠️ Firebase failures are okay if message in SQLite
- ⚠️ Show error state in UI (don't fail silently)
- ⚠️ Implement exponential backoff for retries
- ⚠️ Log errors for debugging (consider Sentry post-MVP)
- ⚠️ Test error scenarios (full disk, no permissions, etc.)

**Effort**: Medium (2-3 hours for comprehensive handling)

**Questions**: Should we implement error tracking service for MVP? (Recommend: console.log for MVP, Sentry post-MVP)

---

## Media Support (US-31 to US-32)

### US-31: Select and Send Images from Camera Roll

**Implementation**:
```javascript
// Image selection with Expo ImagePicker
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const pickAndSendImage = async (chatId) => {
  // Request permissions
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission required to access photos');
    return;
  }
  
  // Pick image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8, // Compress to 80%
    allowsEditing: false // No editing for MVP
  });
  
  if (result.canceled) return;
  
  // Upload to Firebase Storage
  const imageUri = result.assets[0].uri;
  const filename = `${uuid.v4()}.jpg`;
  const storageRef = ref(getStorage(), `chat-images/${chatId}/${filename}`);
  
  // Show uploading state
  const tempMessage = {
    id: uuid.v4(),
    type: 'image',
    uploading: true
  };
  setMessages(prev => [...prev, tempMessage]);
  
  // Upload
  const response = await fetch(imageUri);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob);
  
  // Get download URL
  const downloadURL = await getDownloadURL(storageRef);
  
  // Send message with image URL
  await sendMessage({
    type: 'image',
    imageUrl: downloadURL,
    content: '' // Optional caption
  });
};
```

**Key Components**:
- Expo ImagePicker for camera roll access
- Firebase Storage for image hosting
- Upload progress indicator
- Image message type ('image')
- Store download URL in message

**Pitfalls**:
- ⚠️ Request media library permissions
- ⚠️ Show upload progress (spinner or percentage)
- ⚠️ Handle upload failures (retry or show error)
- ⚠️ Compress images (quality: 0.8) to save bandwidth
- ⚠️ Generate unique filenames (UUID)
- ⚠️ Firebase Storage has 5GB free tier limit
- ⚠️ Set proper security rules for Storage

**Effort**: High (4-5 hours)

**Questions**: 
- Should we compress images client-side before upload? (Recommend: yes, use quality: 0.8)
- Include image captions? (Recommend: skip for MVP)

---

### US-32: View Images Inline in Chat

**Implementation**:
```javascript
// Image message component
import { Image } from 'react-native';

const ImageMessage = ({ message }) => {
  const [loading, setLoading] = useState(true);
  
  return (
    <View style={styles.imageContainer}>
      {loading && <ActivityIndicator />}
      <Image
        source={{ uri: message.imageUrl }}
        style={styles.image}
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
        resizeMode="cover"
      />
    </View>
  );
};

// In message list, render based on type
const renderMessage = (message) => {
  if (message.type === 'image') {
    return <ImageMessage message={message} />;
  } else {
    return <TextMessage message={message} />;
  }
};
```

**Key Components**:
- Image component with loading state
- Error handling for failed image loads
- Proper sizing (max width, aspect ratio)
- Tap to view full screen (optional for MVP)

**Pitfalls**:
- ⚠️ Show loading spinner while image loads
- ⚠️ Handle failed image loads (show placeholder)
- ⚠️ Set max dimensions to prevent huge images
- ⚠️ Cache images (React Native Image caches automatically)
- ⚠️ Consider thumbnail vs full size (use full for MVP)

**Effort**: Low-Medium (2 hours)

**Questions**: Should we implement tap-to-view-fullscreen? (Recommend: skip for MVP, nice-to-have)

---

## Advanced Group Features (US-33 to US-37)

### US-33: Edit Group Name and Picture

**Implementation**:
```javascript
// Update group metadata
const updateGroup = async (groupId, updates) => {
  // Check if user is admin (if we enforce admin-only editing)
  const group = await db.getChat(groupId);
  if (!group.admins.includes(currentUser.uid)) {
    alert('Only admins can edit group details');
    return;
  }
  
  // If uploading new picture
  if (updates.groupPicture && updates.groupPicture.startsWith('file://')) {
    const downloadURL = await uploadGroupPicture(groupId, updates.groupPicture);
    updates.groupPicture = downloadURL;
  }
  
  // Update Firestore
  await updateDoc(doc(firestore, 'chats', groupId), {
    ...updates,
    updatedAt: serverTimestamp()
  });
  
  // Update SQLite
  await db.updateChat(groupId, updates);
};
```

**Key Components**:
- Group settings screen
- Edit name input
- Edit picture (ImagePicker)
- Permission check (admin only or allow all members)
- Real-time updates for all participants

**Pitfalls**:
- ⚠️ Decide: admin-only or allow all members? (Recommend: admin-only)
- ⚠️ Upload image to Firebase Storage before updating
- ⚠️ Show loading state during update
- ⚠️ All participants see updates in real-time
- ⚠️ Update chat list UI when group name changes

**Effort**: Medium (2-3 hours)

**Questions**: Admin-only editing or allow all members? (Recommend: admin-only for cleaner permissions)

---

### US-34: Add or Remove Participants (Admin Only)

**Implementation**:
```javascript
// Add participant
const addParticipant = async (groupId, newUserId) => {
  const group = await getDoc(doc(firestore, 'chats', groupId));
  
  // Check admin permission
  if (!group.data().admins.includes(currentUser.uid)) {
    throw new Error('Only admins can add participants');
  }
  
  // Add to participants array
  await updateDoc(doc(firestore, 'chats', groupId), {
    participants: arrayUnion(newUserId),
    updatedAt: serverTimestamp()
  });
  
  // Send system message
  await sendSystemMessage(groupId, `${currentUser.displayName} added ${newUser.displayName}`);
};

// Remove participant
const removeParticipant = async (groupId, userIdToRemove) => {
  const group = await getDoc(doc(firestore, 'chats', groupId));
  
  // Check admin permission
  if (!group.data().admins.includes(currentUser.uid)) {
    throw new Error('Only admins can remove participants');
  }
  
  // Can't remove self this way (use leave group)
  if (userIdToRemove === currentUser.uid) {
    throw new Error('Use leave group to remove yourself');
  }
  
  // Remove from participants and admins
  await updateDoc(doc(firestore, 'chats', groupId), {
    participants: arrayRemove(userIdToRemove),
    admins: arrayRemove(userIdToRemove),
    updatedAt: serverTimestamp()
  });
  
  // Send system message
  await sendSystemMessage(groupId, `${currentUser.displayName} removed ${user.displayName}`);
};
```

**Key Components**:
- Admin permission checks
- User selection UI (search/list)
- Add/remove buttons in group settings
- Update participants array
- System messages for group events
- Real-time updates for all members

**Pitfalls**:
- ⚠️ Only admins can add/remove (enforce in both client and Firestore rules)
- ⚠️ Can't remove self (must use leave group)
- ⚠️ Remove from both participants and admins arrays
- ⚠️ Send system message for visibility
- ⚠️ Handle removed user gracefully (stop their listeners)
- ⚠️ Firestore security rules must enforce admin check

**Effort**: High (3-4 hours with UI)

**Questions**: Should we prevent removing the last admin? (Recommend: yes, require at least 1 admin)

---

### US-35: Promote/Demote Admins

**Implementation**:
```javascript
// Promote to admin
const promoteToAdmin = async (groupId, userId) => {
  const group = await getDoc(doc(firestore, 'chats', groupId));
  
  // Check permission
  if (!group.data().admins.includes(currentUser.uid)) {
    throw new Error('Only admins can promote others');
  }
  
  // Check if user is participant
  if (!group.data().participants.includes(userId)) {
    throw new Error('User is not a group member');
  }
  
  // Add to admins
  await updateDoc(doc(firestore, 'chats', groupId), {
    admins: arrayUnion(userId),
    updatedAt: serverTimestamp()
  });
  
  // System message
  await sendSystemMessage(groupId, `${user.displayName} is now an admin`);
};

// Demote admin
const demoteAdmin = async (groupId, userId) => {
  const group = await getDoc(doc(firestore, 'chats', groupId));
  const admins = group.data().admins;
  
  // Check permission
  if (!admins.includes(currentUser.uid)) {
    throw new Error('Only admins can demote');
  }
  
  // Prevent demoting last admin
  if (admins.length === 1) {
    throw new Error('Cannot remove the last admin');
  }
  
  // Can't demote self if last admin
  if (userId === currentUser.uid && admins.length === 1) {
    throw new Error('Cannot remove yourself as last admin');
  }
  
  await updateDoc(doc(firestore, 'chats', groupId), {
    admins: arrayRemove(userId),
    updatedAt: serverTimestamp()
  });
  
  await sendSystemMessage(groupId, `${user.displayName} is no longer an admin`);
};
```

**Key Components**:
- Promote/demote UI in member list (admin only)
- Permission checks
- Update admins array
- System messages
- UI shows admin badge

**Pitfalls**:
- ⚠️ Require at least one admin always
- ⚠️ Only admins can promote/demote
- ⚠️ Can't demote self if last admin
- ⚠️ Update UI to show admin badges
- ⚠️ Enforce in Firestore security rules too

**Effort**: Medium (2-3 hours)

**Questions**: None

---

### US-36: Leave Group

**Implementation**:
```javascript
const leaveGroup = async (groupId) => {
  const group = await getDoc(doc(firestore, 'chats', groupId));
  const participants = group.data().participants;
  
  // If last participant, delete group
  if (participants.length === 1) {
    await deleteDoc(doc(firestore, 'chats', groupId));
    await db.deleteChat(groupId);
    return;
  }
  
  // If last admin, need to handle succession
  const admins = group.data().admins;
  let updates = {
    participants: arrayRemove(currentUser.uid),
    admins: arrayRemove(currentUser.uid),
    updatedAt: serverTimestamp()
  };
  
  // If removing last admin, promote oldest participant
  if (admins.length === 1 && admins[0] === currentUser.uid) {
    const newAdmin = participants.find(id => id !== currentUser.uid);
    updates.admins = [newAdmin];
  }
  
  await updateDoc(doc(firestore, 'chats', groupId), updates);
  
  // Remove from local database
  await db.deleteChat(groupId);
  
  // Send system message
  await sendSystemMessage(groupId, `${currentUser.displayName} left the group`);
  
  // Navigate away
  router.back();
};
```

**Key Components**:
- Leave group button in settings
- Remove user from participants
- Handle admin succession
- Delete group if last member
- Local cleanup (remove from SQLite)
- System message

**Pitfalls**:
- ⚠️ Handle last participant (delete group)
- ⚠️ Handle last admin (auto-promote someone)
- ⚠️ Remove from both participants and admins
- ⚠️ Clean up local SQLite data
- ⚠️ Confirm before leaving (prevent accidents)
- ⚠️ Navigate away after leaving

**Effort**: Medium (2-3 hours)

**Questions**: What if last admin leaves? (Recommend: auto-promote oldest remaining participant)

---

### US-37: Show Admin Privileges in Group

**Implementation**:
```javascript
// Group participant list component
const ParticipantList = ({ group, currentUserId }) => {
  const [participants, setParticipants] = useState([]);
  
  useEffect(() => {
    const loadParticipants = async () => {
      const users = await Promise.all(
        group.participants.map(id => 
          getDoc(doc(firestore, 'users', id))
        )
      );
      
      setParticipants(
        users.map((doc, i) => ({
          ...doc.data(),
          id: group.participants[i],
          isAdmin: group.admins.includes(group.participants[i])
        }))
      );
    };
    
    loadParticipants();
  }, [group.participants, group.admins]);
  
  return (
    <FlatList
      data={participants}
      renderItem={({ item }) => (
        <View style={styles.participant}>
          <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
          <Text>{item.displayName}</Text>
          {item.isAdmin && (
            <View style={styles.adminBadge}>
              <Text>Admin</Text>
            </View>
          )}
          {group.admins.includes(currentUserId) && item.id !== currentUserId && (
            <TouchableOpacity onPress={() => showMemberActions(item)}>
              <Text>...</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    />
  );
};
```

**Key Components**:
- Participant list screen
- Admin badge/indicator
- Fetch participant details from Firestore
- Show admin controls (promote/demote/remove) if current user is admin
- Real-time updates when admins change

**Pitfalls**:
- ⚠️ Cache participant info (don't fetch repeatedly)
- ⚠️ Update UI when admins array changes
- ⚠️ Show controls only to admins
- ⚠️ Handle large groups (pagination if needed)
- ⚠️ Display creator distinctly (optional)

**Effort**: Medium (2-3 hours)

**Questions**: Should we show who created the group? (Recommend: yes, simple label)

---

## Effort Summary by Category

| Category | User Stories | Total Effort | Priority |
|----------|--------------|--------------|----------|
| Authentication | US-1 to US-4 | 5-7 hours | Critical (Hours 1-4) |
| One-on-One Messaging | US-5 to US-12 | 18-23 hours | Critical (Hours 5-12) |
| Offline Support | US-13 to US-17 | 8-12 hours | Critical (Hours 13-18) |
| Group Chat | US-18 to US-22 | 10-15 hours | High (Hours 19-22) |
| Notifications | US-23 to US-25 | 9-12 hours | High (Hours 13-18) |
| Reliability | US-26 to US-30 | 7-11 hours | Medium (Throughout) |
| Images | US-31 to US-32 | 6-7 hours | Medium (Hours 22-24) |
| Group Extras | US-33 to US-37 | 11-15 hours | Medium (Hours 22-24) |

**Total Estimated**: 74-101 hours

**Reality Check**: With 24 hours for MVP, we need to be ruthless about:
- Minimal UI (functionality over beauty)
- Reuse patterns (DRY code)
- Skip edge cases initially
- Parallel development where possible
- Testing integrated with development

**Recommended Execution Order**:
1. Setup & Auth (US-1 to US-4) - 4 hours
2. One-on-One Core (US-5, US-6, US-7, US-9) - 6 hours
3. Offline & Delivery (US-8, US-13, US-14, US-15) - 4 hours
4. Group Chat Basic (US-18, US-19, US-20) - 4 hours
5. Notifications (US-23, US-24, US-25) - 4 hours
6. Polish (US-10, US-11, US-12, US-21, US-22) - 2 hours
7. Images & Group Extras if time permits

---

## Critical Path for 24-Hour MVP

If time is tight, prioritize in this exact order:

**Must Have** (18 hours):
- Auth (US-1, US-2, US-3, US-4)
- One-on-One (US-5, US-6, US-7, US-9)
- Offline (US-13, US-14, US-15, US-17)
- Basic Groups (US-18, US-19, US-20)
- Delivery States (US-8)

**Should Have** (4 hours):
- Notifications (US-23, foreground only)
- Read Receipts (US-10)
- Online/Offline (US-12)

**Nice to Have** (2 hours):
- Typing Indicators (US-11)
- Group Extras (US-33, US-34, US-35, US-36, US-37)
- Images (US-31, US-32)

**Cut if Needed**:
- Background notifications
- Image support
- Advanced group management
- Polish and animations

---

## Implementation Questions Recap

1. **US-3**: Profile picture required or optional? → **Optional with initials fallback**
2. **US-6**: Implement pagination now or post-MVP? → **Basic pagination (50 messages)**
3. **US-7**: How to handle failed messages in UI? → **Error icon with tap-to-retry**
4. **US-8**: Group read receipts: individual or count? → **Count ("Read by 3")**
5. **US-9**: Include date dividers? → **No, timestamps only**
6. **US-11**: Group typing: show all users or simple? → **"Someone is typing..."**
7. **US-12**: Firestore or Realtime DB for presence? → **Firestore with manual AppState**
8. **US-24**: Batch rapid notifications? → **Individual for MVP**
9. **US-27**: Implement Firestore batch writes? → **Yes if time permits**
10. **US-30**: Error tracking service? → **console.log for MVP**
11. **US-31**: Compress images? → **Yes (quality: 0.8)**
12. **US-31**: Image captions? → **No for MVP**
13. **US-32**: Tap to view fullscreen? → **No for MVP**
14. **US-33**: Admin-only group editing? → **Yes, admin-only**
15. **US-34**: Last admin leaves? → **Auto-promote oldest participant**
16. **US-34**: Max group size? → **50 participants**
17. **US-20**: Denormalize sender name in messages? → **Yes for offline viewing**

---

## Next Steps

After review of this implementation guide:
1. Confirm answers to questions above
2. Review and approve recommended code structure
3. Proceed with starter code generation for Setup & Auth (Hours 1-4)

