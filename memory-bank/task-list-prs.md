# MessageAI MVP - Task List & PR Breakdown

## Overview

This task list breaks down the 37 user stories into **10 Progressive PRs** for the MessageAI MVP. Each PR is designed to be:
- ✅ Independently testable
- ✅ Incrementally building toward full MVP
- ✅ Mergeable to main branch
- ✅ Tracked via GitHub commits

**Total User Stories**: 37 (US-1 to US-37)
**Target PRs**: 10 PRs
**Timeline**: 24 hours for MVP
**Testing**: Jest (unit) + Detox (E2E) for critical paths

---

## PR Structure Template

Each PR follows this structure:
```
PR #X: Title (User Stories Covered)
├── Description
├── User Stories: US-X, US-Y, US-Z
├── Estimated Effort: X hours
├── Dependencies: PR #N (if any)
├── Files Created/Updated
├── Subtasks (checkboxes)
├── Testing (Unit/Integration tests if applicable)
└── Validation Criteria
```

---

## 🔧 PR #1: Project Setup & Authentication

**Branch**: `feature/setup-authentication`
**User Stories**: US-1, US-2, US-3, US-4
**Effort**: 4 hours
**Dependencies**: None (foundation)
**Status**: ✅ Starter code provided

### Description
Initialize Expo project with TypeScript, set up Firebase (Auth, Firestore, Storage), implement SQLite database, create authentication screens with sign up/sign in/sign out, and establish auth state management with auto-navigation.

### Files Created
```
✅ ALL STARTER CODE PROVIDED IN starter-code/

New Files:
- app/_layout.tsx
- app/(auth)/_layout.tsx
- app/(auth)/sign-in.tsx
- app/(auth)/sign-up.tsx
- app/(tabs)/_layout.tsx
- app/(tabs)/chats.tsx
- app/(tabs)/profile.tsx
- contexts/AuthContext.tsx
- services/firebase/config.ts
- services/firebase/auth.ts
- services/database/sqlite.ts
- types/user.ts
- types/chat.ts
- types/message.ts
- utils/validation.ts
- .env (from .env.example)
- app.json (updated)
- package.json (updated)
- tsconfig.json
```

### Subtasks
- [ ] Create Expo project with TypeScript template
- [ ] Install all dependencies (expo-router, firebase, expo-sqlite, etc.)
- [ ] Set up Firebase project in console (Auth, Firestore, Storage, FCM)
- [ ] Copy starter code files to project
- [ ] Create .env file with Firebase configuration
- [ ] Update app.json with Expo Router and notification plugins
- [ ] Initialize Firebase in app root layout
- [ ] Create SQLite database schema (users, chats, messages tables)
- [ ] Implement AuthContext with Firebase onAuthStateChanged
- [ ] Create sign-in screen with email/password inputs
- [ ] Create sign-up screen with name/email/password inputs
- [ ] Implement form validation (email format, password length)
- [ ] Handle auth errors with user-friendly messages
- [ ] Auto-navigate based on auth state (signed in → chats, signed out → sign in)
- [ ] Create profile screen with user info and sign out
- [ ] Update Firestore user document on sign in/out with online status
- [ ] Test on iPhone via Expo Go

### Unit Tests (Jest)
**File**: `services/firebase/__tests__/auth.test.ts`

```typescript
describe('Authentication Service', () => {
  beforeEach(async () => {
    // Reset Firebase emulator
    await clearFirebaseAuth();
  });
  
  test('shouldCreateUserWithValidCredentials', async () => {
    const user = await signUp({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User'
    });
    
    expect(user.uid).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });
  
  test('shouldCreateFirestoreUserDocument', async () => {
    const user = await signUp({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User'
    });
    
    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
    expect(userDoc.exists()).toBe(true);
    expect(userDoc.data()?.displayName).toBe('Test User');
    expect(userDoc.data()?.online).toBe(true);
  });
  
  test('shouldRejectWeakPassword', async () => {
    await expect(signUp({
      email: 'test@example.com',
      password: '123',
      displayName: 'Test'
    })).rejects.toThrow('Password must be at least 6 characters');
  });
  
  test('shouldSignInExistingUser', async () => {
    await signUp({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test'
    });
    
    await signOut();
    
    const user = await signIn({
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(user.uid).toBeDefined();
  });
  
  test('shouldUpdateOnlineStatusOnSignIn', async () => {
    const user = await signIn({
      email: 'existing@example.com',
      password: 'password123'
    });
    
    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
    expect(userDoc.data()?.online).toBe(true);
  });
});
```

**File**: `services/database/__tests__/sqlite.test.ts`

```typescript
describe('SQLite Database Service', () => {
  beforeEach(async () => {
    await db.init();
    await db.clearAllTables(); // Helper to clear for testing
  });
  
  test('shouldInitializeDatabaseWithTables', async () => {
    const tables = await db.getTables();
    expect(tables).toContain('chats');
    expect(tables).toContain('messages');
  });
  
  test('shouldInsertMessage', async () => {
    const message = createMockMessage();
    await db.insertMessage(message);
    
    const retrieved = await db.getMessage(message.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.content).toBe(message.content);
  });
  
  test('shouldGetPendingMessages', async () => {
    const msg1 = createMockMessage({ syncStatus: 'pending' });
    const msg2 = createMockMessage({ syncStatus: 'synced' });
    
    await db.insertMessage(msg1);
    await db.insertMessage(msg2);
    
    const pending = await db.getPendingMessages();
    expect(pending.length).toBe(1);
    expect(pending[0].id).toBe(msg1.id);
  });
});
```

### Integration Test (Detox)
**File**: `e2e/auth.e2e.ts`

```typescript
describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });
  
  beforeEach(async () => {
    await device.reloadReactNative();
  });
  
  test('shouldSignUpNewUser', async () => {
    await element(by.id('sign-up-button')).tap();
    
    await element(by.id('display-name-input')).typeText('Test User');
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('confirm-password-input')).typeText('password123');
    
    await element(by.id('submit-sign-up')).tap();
    
    await waitFor(element(by.id('chats-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });
  
  test('shouldPersistSessionAfterRestart', async () => {
    // Sign in first
    await signInTestUser();
    
    // Verify on chats screen
    await expect(element(by.id('chats-screen'))).toBeVisible();
    
    // Restart app
    await device.launchApp({ newInstance: true });
    
    // Should still be on chats screen (session persisted)
    await expect(element(by.id('chats-screen'))).toBeVisible();
  });
});
```

### Validation Criteria
- [ ] Can sign up with email/password/display name
- [ ] User created in Firebase Authentication
- [ ] User document created in Firestore with correct fields
- [ ] Can sign in with correct credentials
- [ ] Sign in fails with wrong password (proper error message)
- [ ] Session persists after force quit app
- [ ] Auto-navigates to chats when signed in
- [ ] Auto-navigates to sign-in when signed out
- [ ] Can sign out from profile screen
- [ ] Online status updates correctly in Firestore

---

## 🔥 PR #2: Core One-on-One Messaging

**Branch**: `feature/one-on-one-messaging`
**User Stories**: US-5, US-6, US-7, US-9
**Effort**: 6-8 hours
**Dependencies**: PR #1 (auth required)

### Description
Implement core real-time messaging between two users: send text messages with optimistic UI updates, receive messages in real-time via Firebase listeners, persist all messages to SQLite, display messages with timestamps in chronological order.

### Files Created
```
New Files:
- app/(tabs)/chats/[chatId].tsx                  # Individual chat screen
- components/messages/MessageBubble.tsx          # Message bubble component
- components/messages/MessageList.tsx            # FlatList of messages
- components/messages/MessageInput.tsx           # Input with send button
- components/chat/ChatListItem.tsx               # Chat preview in list
- components/chat/ChatHeader.tsx                 # Chat header with name/status
- services/messages/MessageService.ts            # Core message operations
- services/messages/MessageSync.ts               # Firebase sync logic
- services/firebase/firestore.ts                 # Firestore operations
- hooks/useMessages.ts                           # Message loading/sending hook
- hooks/useChats.ts                              # Chat list hook
- utils/formatters.ts                            # Date/time formatting

Updated Files:
- app/(tabs)/chats.tsx                           # Implement chat list
- services/database/sqlite.ts                    # Add helper methods
```

### Subtasks

#### Backend Setup
- [ ] Create Firestore collections: `chats/{chatId}`, `chats/{chatId}/messages/{messageId}`
- [ ] Set up Firestore indexes for message queries (timestamp DESC)
- [ ] Deploy Firestore security rules (participants-only access)
- [ ] Test Firestore writes/reads in console

#### Message Sending (US-5, US-7)
- [ ] Create MessageService class with sendTextMessage method
- [ ] Implement client-side UUID generation for messages (uuid.v4())
- [ ] Write message to SQLite with syncStatus='pending'
- [ ] Implement optimistic UI update (add to state immediately)
- [ ] Create MessageSync service to sync to Firestore
- [ ] Update SQLite syncStatus to 'synced' on success
- [ ] Handle Firebase write failures (mark as 'failed')
- [ ] Create MessageInput component with text input and send button
- [ ] Disable send button when input empty
- [ ] Clear input after send

#### Message Receiving (US-6)
- [ ] Create useMessages hook with Firestore onSnapshot listener
- [ ] Query messages ordered by timestamp DESC, limit 50
- [ ] Save received messages to SQLite
- [ ] Update UI state when new messages arrive
- [ ] Handle listener cleanup on unmount
- [ ] Prevent duplicate messages (check SQLite before insert)
- [ ] Update chat's lastMessage in Firestore

#### Message Display (US-9)
- [ ] Create MessageBubble component with sender-based styling
- [ ] Implement timestamp formatting (time, day, date)
- [ ] Create MessageList with FlatList (inverted for chat UX)
- [ ] Show sent messages on right, received on left
- [ ] Display timestamps below each message

#### Chat List
- [ ] Create useChats hook to load user's chats
- [ ] Set up Firestore listener for user's chats
- [ ] Display chats sorted by updatedAt DESC
- [ ] Show last message preview and timestamp
- [ ] Handle empty state (no chats yet)
- [ ] Navigate to chat screen on tap
- [ ] Create new chat button (for testing, direct chat creation)

#### Chat Screen
- [ ] Create [chatId].tsx dynamic route
- [ ] Implement ChatHeader with participant name
- [ ] Load messages from SQLite on mount
- [ ] Display MessageList component
- [ ] Add MessageInput at bottom
- [ ] Handle keyboard avoiding view
- [ ] Auto-scroll to latest message

### Unit Tests (Jest) 🧪
**File**: `services/messages/__tests__/MessageService.test.ts`

```typescript
describe('MessageService', () => {
  beforeEach(async () => {
    await db.clearAllTables();
    await clearFirestore();
  });
  
  test('shouldSendTextMessageWithOptimisticUpdate', async () => {
    const chatId = 'test-chat-1';
    const content = 'Hello World';
    
    const message = await messageService.sendTextMessage(chatId, content);
    
    // Verify message structure
    expect(message.id).toBeDefined();
    expect(message.content).toBe(content);
    expect(message.type).toBe('text');
    expect(message.syncStatus).toBe('pending');
    
    // Verify SQLite insert
    const sqliteMsg = await db.getMessage(message.id);
    expect(sqliteMsg).toBeDefined();
    expect(sqliteMsg?.content).toBe(content);
  });
  
  test('shouldSyncMessageToFirestore', async () => {
    const message = createMockMessage();
    await db.insertMessage(message);
    
    await messageSync.syncToFirebase(message);
    
    const firestoreDoc = await getDoc(
      doc(firestore, `chats/${message.chatId}/messages`, message.id)
    );
    
    expect(firestoreDoc.exists()).toBe(true);
    expect(firestoreDoc.data()?.content).toBe(message.content);
  });
  
  test('shouldUpdateSyncStatusOnSuccess', async () => {
    const message = createMockMessage({ syncStatus: 'pending' });
    await db.insertMessage(message);
    
    await messageSync.syncToFirebase(message);
    
    const updated = await db.getMessage(message.id);
    expect(updated?.syncStatus).toBe('synced');
    expect(updated?.deliveryStatus).toBe('sent');
  });
  
  test('shouldMarkFailedOnFirebaseError', async () => {
    // Mock Firebase failure
    jest.spyOn(firestore, 'setDoc').mockRejectedValue(new Error('Network error'));
    
    const message = createMockMessage();
    await db.insertMessage(message);
    
    await expect(messageSync.syncToFirebase(message)).rejects.toThrow();
    
    const updated = await db.getMessage(message.id);
    expect(updated?.syncStatus).toBe('failed');
  });
});
```

**File**: `utils/__tests__/formatters.test.ts`

```typescript
describe('Timestamp Formatter', () => {
  test('shouldFormatTodayAsTime', () => {
    const now = Date.now();
    const formatted = formatTimestamp(now);
    expect(formatted).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
  });
  
  test('shouldFormatYesterdayAsDay', () => {
    const yesterday = Date.now() - (24 * 60 * 60 * 1000);
    const formatted = formatTimestamp(yesterday);
    expect(formatted).toMatch(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/);
  });
  
  test('shouldFormatOldAsDate', () => {
    const lastWeek = Date.now() - (8 * 24 * 60 * 60 * 1000);
    const formatted = formatTimestamp(lastWeek);
    expect(formatted).toMatch(/\w{3} \d{1,2}/); // "Dec 15"
  });
});
```

### Integration Test (Detox) 🧪
**File**: `e2e/messaging.e2e.ts`

```typescript
describe('One-on-One Messaging', () => {
  beforeAll(async () => {
    await device.launchApp();
  });
  
  beforeEach(async () => {
    await device.reloadReactNative();
    await signInTestUser1(); // Helper function
  });
  
  test('shouldSendAndReceiveMessageInRealTime', async () => {
    // Create/open chat
    await element(by.id('new-chat-button')).tap();
    await element(by.id('select-user-test2')).tap();
    
    // Send message
    const messageText = 'Hello from device 1!';
    await element(by.id('message-input')).typeText(messageText);
    await element(by.id('send-button')).tap();
    
    // Verify optimistic update (appears immediately)
    await waitFor(element(by.text(messageText)))
      .toBeVisible()
      .withTimeout(1000);
    
    // Verify sent status appears
    await waitFor(element(by.id('message-status-sent')))
      .toBeVisible()
      .withTimeout(3000);
  });
  
  test('shouldPersistMessagesAfterRestart', async () => {
    // Send messages
    await sendTestMessage('Test message 1');
    await sendTestMessage('Test message 2');
    
    // Restart app
    await device.launchApp({ newInstance: true });
    await signInTestUser1();
    
    // Open same chat
    await element(by.id('chat-test-chat-1')).tap();
    
    // Verify messages still visible
    await expect(element(by.text('Test message 1'))).toBeVisible();
    await expect(element(by.text('Test message 2'))).toBeVisible();
  });
  
  test('shouldDisplayTimestampsCorrectly', async () => {
    await sendTestMessage('Test with timestamp');
    
    // Timestamp should be visible
    await waitFor(element(by.id('message-timestamp')))
      .toBeVisible()
      .withTimeout(1000);
  });
});
```

### Validation Criteria
- [ ] US-5: Can send text message to another user
- [ ] US-6: Message appears on recipient device in < 2 seconds
- [ ] US-7: Message appears instantly in sender's chat (optimistic)
- [ ] US-9: All messages show timestamps
- [ ] Two users can exchange multiple messages
- [ ] Chat list shows all conversations
- [ ] Last message preview displays correctly
- [ ] Messages persist in SQLite
- [ ] Firebase sync works correctly
- [ ] Message ordering is correct (newest at bottom)

---

## 🔌 PR #3: Offline Support & Message Queue

**Branch**: `feature/offline-support`
**User Stories**: US-13, US-14, US-15, US-16, US-17
**Effort**: 5-6 hours
**Dependencies**: PR #2 (messaging foundation)

### Description
Implement offline-first architecture with message queueing, automatic sync on reconnection, network state monitoring, and guaranteed message persistence even on app crash.

### Files Created
```
New Files:
- services/messages/MessageQueue.ts              # Offline message queue
- services/network/NetworkMonitor.ts             # Network state monitoring
- hooks/useNetworkState.ts                       # Network state hook
- components/ui/OfflineBanner.tsx                # Offline indicator

Updated Files:
- services/messages/MessageService.ts            # Use MessageQueue
- services/messages/MessageSync.ts               # Add retry logic
- app/_layout.tsx                                # Initialize NetworkMonitor
- app/(tabs)/chats/[chatId].tsx                  # Show offline banner
- services/database/sqlite.ts                    # Add getFailedMessages query
```

### Subtasks

#### Network Monitoring (US-13, US-16)
- [ ] Install @react-native-community/netinfo
- [ ] Create NetworkMonitor service singleton
- [ ] Listen to NetInfo state changes
- [ ] Expose network state to components via hook
- [ ] Update user online status on network changes
- [ ] Create OfflineBanner component
- [ ] Show banner when offline in chat screen

#### Message Queue (US-14, US-17)
- [ ] Create MessageQueue class with send/retry logic
- [ ] Implement queue with sequential processing (avoid concurrent SQLite writes)
- [ ] Write to SQLite BEFORE queueing (critical for US-17)
- [ ] Add message to internal queue
- [ ] Process queue asynchronously
- [ ] Handle Firebase sync failures gracefully
- [ ] Implement exponential backoff for retries (1s, 2s, 4s, 8s, max 30s)
- [ ] Store failed messages with 'failed' status
- [ ] Create scheduleRetry method with timeout management

#### Auto-Sync on Reconnect (US-15)
- [ ] Listen for network state changes in NetworkMonitor
- [ ] When connection restored, call messageQueue.retryPendingMessages()
- [ ] Load pending messages from SQLite
- [ ] Retry each failed message
- [ ] Update UI to show sync in progress
- [ ] Clear retry timeouts on success

#### App Lifecycle Handling (US-17)
- [ ] Add AppState listener in root layout
- [ ] On app foreground, retry pending messages
- [ ] On app background, ensure all pending writes complete
- [ ] Test force quit scenario (messages in SQLite survive)
- [ ] Implement startup routine to retry pending messages
- [ ] Add loading state while retrying on startup

#### SQLite Offline Queries (US-13)
- [ ] Ensure messages always load from SQLite first
- [ ] Add getUnreadMessages query
- [ ] Add getPendingMessages query (syncStatus='pending' OR 'failed')
- [ ] Add getFailedMessages query
- [ ] Optimize queries with indexes

### Unit Tests (Jest) 🧪
**File**: `services/messages/__tests__/MessageQueue.test.ts`

```typescript
describe('MessageQueue', () => {
  let messageQueue: MessageQueue;
  
  beforeEach(async () => {
    messageQueue = new MessageQueue();
    await db.clearAllTables();
    jest.clearAllMocks();
  });
  
  test('shouldQueueMessageAndPersistToSQLite', async () => {
    const message = createMockMessage();
    
    await messageQueue.sendMessage(message);
    
    // Verify SQLite insert
    const sqliteMsg = await db.getMessage(message.id);
    expect(sqliteMsg).toBeDefined();
    expect(sqliteMsg?.syncStatus).toBe('pending');
  });
  
  test('shouldProcessQueueSequentially', async () => {
    const messages = [
      createMockMessage({ content: 'First' }),
      createMockMessage({ content: 'Second' }),
      createMockMessage({ content: 'Third' })
    ];
    
    // Send all messages
    await Promise.all(messages.map(msg => messageQueue.sendMessage(msg)));
    
    // Wait for processing
    await waitFor(() => messageQueue.isProcessing === false);
    
    // All should be synced
    const pending = await db.getPendingMessages();
    expect(pending.length).toBe(0);
  });
  
  test('shouldRetryFailedMessages', async () => {
    // Mock Firebase failure then success
    const mockSync = jest.spyOn(messageSync, 'syncToFirebase')
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(undefined);
    
    const message = createMockMessage();
    await messageQueue.sendMessage(message);
    
    // First attempt fails
    await waitFor(() => expect(mockSync).toHaveBeenCalledTimes(1));
    
    // Should schedule retry
    await waitFor(() => expect(mockSync).toHaveBeenCalledTimes(2), 6000);
  });
  
  test('shouldRetryPendingMessagesOnNetworkReconnect', async () => {
    // Create pending messages
    const msg1 = createMockMessage({ syncStatus: 'pending' });
    const msg2 = createMockMessage({ syncStatus: 'pending' });
    await db.insertMessage(msg1);
    await db.insertMessage(msg2);
    
    await messageQueue.retryPendingMessages();
    
    await waitFor(() => messageQueue.isProcessing === false);
    
    const pending = await db.getPendingMessages();
    expect(pending.length).toBe(0);
  });
  
  test('shouldImplementExponentialBackoff', async () => {
    const message = createMockMessage();
    jest.spyOn(messageSync, 'syncToFirebase').mockRejectedValue(new Error('Fail'));
    
    await messageQueue.sendMessage(message);
    
    // Check retry delays: 1s, 2s, 4s, 8s
    const delays: number[] = [];
    for (let i = 0; i < 4; i++) {
      const start = Date.now();
      await waitForNextRetry();
      delays.push(Date.now() - start);
    }
    
    expect(delays[0]).toBeGreaterThanOrEqual(1000);
    expect(delays[1]).toBeGreaterThanOrEqual(2000);
    expect(delays[2]).toBeGreaterThanOrEqual(4000);
  });
});
```

**File**: `services/network/__tests__/NetworkMonitor.test.ts`

```typescript
describe('NetworkMonitor', () => {
  test('shouldDetectOnlineState', async () => {
    const monitor = new NetworkMonitor();
    
    // Mock NetInfo
    NetInfo.fetch = jest.fn().mockResolvedValue({ isConnected: true });
    
    await monitor.init();
    
    expect(monitor.getIsOnline()).toBe(true);
  });
  
  test('shouldTriggerRetryOnReconnection', async () => {
    const monitor = new NetworkMonitor();
    const retrySpy = jest.spyOn(messageQueue, 'retryPendingMessages');
    
    await monitor.init();
    
    // Simulate reconnection
    await monitor.simulateNetworkChange(true);
    
    expect(retrySpy).toHaveBeenCalled();
  });
});
```

### Integration Test (Detox) 🧪
**File**: `e2e/offline.e2e.ts`

```typescript
describe('Offline Messaging', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    await signInTestUser1();
  });
  
  test('shouldSendMessagesWhileOffline', async () => {
    await openTestChat();
    
    // Go offline
    await device.setNetworkConnection('airplane');
    
    // Send 5 messages
    for (let i = 1; i <= 5; i++) {
      await element(by.id('message-input')).typeText(`Offline message ${i}`);
      await element(by.id('send-button')).tap();
      
      // Should appear immediately (optimistic)
      await expect(element(by.text(`Offline message ${i}`))).toBeVisible();
      
      // Should show sending status
      await expect(element(by.id(`message-status-sending-${i}`))).toBeVisible();
    }
    
    // Messages should persist
    await device.launchApp({ newInstance: true });
    await signInTestUser1();
    await openTestChat();
    
    // All messages still visible
    for (let i = 1; i <= 5; i++) {
      await expect(element(by.text(`Offline message ${i}`))).toBeVisible();
    }
  });
  
  test('shouldSyncMessagesWhenReconnected', async () => {
    await openTestChat();
    
    // Send message offline
    await device.setNetworkConnection('airplane');
    await sendTestMessage('Queued message');
    
    // Verify pending status
    await waitFor(element(by.id('message-status-sending')))
      .toBeVisible()
      .withTimeout(1000);
    
    // Reconnect
    await device.setNetworkConnection('wifi');
    
    // Should auto-sync and update status
    await waitFor(element(by.id('message-status-sent')))
      .toBeVisible()
      .withTimeout(5000);
  });
  
  test('shouldPersistMessagesAfterCrashDuringSend', async () => {
    await openTestChat();
    
    // Send message
    await element(by.id('message-input')).typeText('Crash test message');
    await element(by.id('send-button')).tap();
    
    // Immediately force quit (simulate crash)
    await device.terminateApp();
    
    // Restart
    await device.launchApp({ newInstance: true });
    await signInTestUser1();
    await openTestChat();
    
    // Message should still be there
    await expect(element(by.text('Crash test message'))).toBeVisible();
  });
});
```

### Validation Criteria
- [ ] US-13: Can view all messages while offline
- [ ] US-14: Can send messages while offline (queued)
- [ ] US-15: Queued messages auto-send on reconnect
- [ ] US-16: Receive messages sent while offline
- [ ] US-17: Force quit during send - message still delivers
- [ ] Network state banner shows when offline
- [ ] Pending messages retry automatically
- [ ] Failed messages can be retried manually
- [ ] SQLite always writes before Firebase
- [ ] No message loss under any scenario

---

## 📊 PR #4: Delivery States & Read Receipts

**Branch**: `feature/delivery-read-receipts`
**User Stories**: US-8, US-10, US-21
**Effort**: 3-4 hours
**Dependencies**: PR #2, PR #3

### Description
Implement message delivery states (sending/sent/delivered/read), read receipts with visual checkmarks, batch read updates when chat viewed, handle both one-on-one and group scenarios.

### Files Created
```
New Files:
- components/messages/MessageStatus.tsx          # Status icons (checkmarks)
- components/messages/ReadReceipt.tsx            # Read receipt component

Updated Files:
- components/messages/MessageBubble.tsx          # Add status indicator
- services/messages/MessageService.ts            # Add markAsDelivered/Read
- hooks/useMessages.ts                           # Mark messages as read on view
- services/database/sqlite.ts                    # Add read status queries
- types/message.ts                               # Ensure readBy/deliveredTo types
```

### Subtasks

#### Delivery States (US-8)
- [ ] Create MessageStatus component with icon logic
- [ ] Show icons only for sent messages (not received)
- [ ] Implement status icons:
  - 🕐 Sending (syncStatus='pending')
  - ✓ Sent (deliveryStatus='sent')
  - ✓✓ Delivered (deliveredTo includes all participants)
  - ✓✓ Read (readBy includes all participants, blue color)
- [ ] Update deliveredTo array when message received
- [ ] Use arrayUnion to prevent duplicates
- [ ] Handle failed status (❌ icon with tap to retry)

#### Read Receipts (US-10, US-21)
- [ ] Create markMessagesAsRead function
- [ ] Trigger when chat screen becomes active (useEffect on mount)
- [ ] Get unread messages from SQLite (sender != currentUser, readBy doesn't include user)
- [ ] Batch update readBy arrays in Firestore (use writeBatch)
- [ ] Update SQLite read status locally
- [ ] Listen for readBy changes in real-time
- [ ] Update message status icons when others read
- [ ] For groups: show read count ("Read by 3") instead of individual names
- [ ] Implement logic to count readBy array length
- [ ] Don't mark own messages as unread

### Unit Tests (Jest) 🧪
**File**: `services/messages/__tests__/ReadReceipts.test.ts`

```typescript
describe('Read Receipts', () => {
  test('shouldMarkMessageAsDelivered', async () => {
    const message = createMockMessage();
    await db.insertMessage(message);
    
    const recipientId = 'user-2';
    await messageService.markMessageAsDelivered(message.chatId, message.id, recipientId);
    
    const updated = await db.getMessage(message.id);
    expect(updated?.deliveredTo).toContain(recipientId);
  });
  
  test('shouldMarkMessageAsRead', async () => {
    const message = createMockMessage();
    await db.insertMessage(message);
    
    const readerId = 'user-2';
    await messageService.markMessageAsRead(message.chatId, message.id, readerId);
    
    const updated = await db.getMessage(message.id);
    expect(updated?.readBy).toContain(readerId);
  });
  
  test('shouldBatchMarkChatAsRead', async () => {
    const chatId = 'test-chat';
    const messages = [
      createMockMessage({ chatId, senderId: 'other-user' }),
      createMockMessage({ chatId, senderId: 'other-user' }),
      createMockMessage({ chatId, senderId: 'other-user' })
    ];
    
    await Promise.all(messages.map(m => db.insertMessage(m)));
    
    const currentUserId = 'current-user';
    await messageService.markChatAsRead(chatId, currentUserId);
    
    // All should be marked as read
    for (const msg of messages) {
      const updated = await db.getMessage(msg.id);
      expect(updated?.readBy).toContain(currentUserId);
    }
  });
  
  test('shouldNotMarkOwnMessagesAsUnread', async () => {
    const currentUserId = 'current-user';
    const message = createMockMessage({ 
      senderId: currentUserId,
      readBy: [currentUserId]
    });
    await db.insertMessage(message);
    
    const unread = await db.getUnreadMessages(message.chatId, currentUserId);
    expect(unread.length).toBe(0);
  });
});
```

### Validation Criteria
- [ ] US-8: Message status shows sending → sent → delivered → read
- [ ] US-10: Read receipts update in real-time
- [ ] US-21: Group messages show read count
- [ ] Status icons display correctly for sent messages
- [ ] No status icons for received messages
- [ ] Batch read updates work (Firestore writeBatch)
- [ ] Read status persists in SQLite for offline viewing
- [ ] Blue checkmarks appear when message is read

---

## 👥 PR #5: Online Status & Typing Indicators

**Branch**: `feature/presence-typing`
**User Stories**: US-11, US-12
**Effort**: 3-4 hours
**Dependencies**: PR #2

### Description
Implement user presence (online/offline status) with AppState monitoring, typing indicators with debounced updates, display status in chat headers and participant lists.

### Files Created
```
New Files:
- services/presence/PresenceService.ts           # Online/offline management
- hooks/useOnlineStatus.ts                       # Other user's status hook
- hooks/useTypingIndicator.ts                    # Typing status hook
- components/chat/OnlineIndicator.tsx            # Green dot component
- components/chat/TypingIndicator.tsx            # "User is typing..." text

Updated Files:
- components/chat/ChatHeader.tsx                 # Show online status
- app/(tabs)/chats/[chatId].tsx                  # Show typing indicator
- components/messages/MessageInput.tsx           # Trigger typing events
- app/_layout.tsx                                # Initialize PresenceService
```

### Subtasks

#### Online/Offline Status (US-12)
- [ ] Create PresenceService with AppState listener
- [ ] Update user's online field on app foreground/background
- [ ] Update lastSeen timestamp
- [ ] Create useOnlineStatus hook for watching other user's status
- [ ] Listen to other user's Firestore document changes
- [ ] Create OnlineIndicator component (green dot or "Last seen...")
- [ ] Add to ChatHeader component
- [ ] Format lastSeen ("5 min ago", "Yesterday at 2:34 PM")
- [ ] Handle network disconnection (show offline when no connection)

#### Typing Indicators (US-11)
- [ ] Add typing field to Firestore user document schema
- [ ] Create useTypingIndicator hook
- [ ] Debounce typing events (500ms delay)
- [ ] Update Firestore with typing status: { chatId, isTyping: true }
- [ ] Auto-clear typing after 3 seconds
- [ ] Clear typing status when message sent
- [ ] Listen to other user's typing status in chat screen
- [ ] Create TypingIndicator component
- [ ] For groups: show simple "Someone is typing..." (not all names)
- [ ] Display above message input area

### Unit Tests (Jest) 🧪
**File**: `services/presence/__tests__/PresenceService.test.ts`

```typescript
describe('PresenceService', () => {
  test('shouldUpdateOnlineStatusOnAppStateChange', async () => {
    const presenceService = new PresenceService();
    const userId = 'test-user';
    
    await presenceService.init(userId);
    
    // Simulate app going to background
    await presenceService.handleAppStateChange('background');
    
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    expect(userDoc.data()?.online).toBe(false);
  });
  
  test('shouldUpdateLastSeenTimestamp', async () => {
    const presenceService = new PresenceService();
    const userId = 'test-user';
    
    await presenceService.updateOnlineStatus(userId, false);
    
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    expect(userDoc.data()?.lastSeen).toBeDefined();
  });
});
```

**File**: `hooks/__tests__/useTypingIndicator.test.ts`

```typescript
describe('useTypingIndicator', () => {
  test('shouldDebounceTypingUpdates', async () => {
    const { result } = renderHook(() => useTypingIndicator('test-chat'));
    
    const updateSpy = jest.spyOn(firestore, 'updateDoc');
    
    // Trigger typing multiple times rapidly
    act(() => {
      result.current.setTyping();
      result.current.setTyping();
      result.current.setTyping();
    });
    
    // Should only update once (debounced)
    await waitFor(() => expect(updateSpy).toHaveBeenCalledTimes(1));
  });
  
  test('shouldClearTypingAfterTimeout', async () => {
    const { result } = renderHook(() => useTypingIndicator('test-chat'));
    
    act(() => {
      result.current.setTyping();
    });
    
    // Wait for auto-clear (3 seconds)
    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
    }, 4000);
  });
});
```

### Validation Criteria
- [ ] US-11: Typing indicator shows when other user types
- [ ] US-12: Online/offline status displays correctly
- [ ] Green dot shows for online users
- [ ] Last seen displays when offline ("5 min ago")
- [ ] Typing updates are debounced (not spamming Firestore)
- [ ] Typing clears after 3 seconds
- [ ] Typing clears when message sent
- [ ] Group typing shows simple indicator
- [ ] Status updates in real-time

---

## 👥 PR #6: Basic Group Chat

**Branch**: `feature/group-chat`
**User Stories**: US-18, US-19, US-20, US-22
**Effort**: 6-8 hours
**Dependencies**: PR #2, PR #4

### Description
Implement group chat creation with 3+ participants, group messaging with proper attribution, participant lists, real-time updates for all members, and group-specific delivery/read status.

### Files Created
```
New Files:
- app/groups/create.tsx                          # Create group screen
- app/groups/[groupId]/settings.tsx              # Group settings (minimal)
- components/groups/ParticipantSelector.tsx      # Select members UI
- components/groups/ParticipantList.tsx          # Display members
- components/groups/GroupAvatar.tsx              # Group picture/initials
- components/messages/GroupMessageBubble.tsx     # Message with sender name
- services/groups/GroupService.ts                # Group CRUD operations

Updated Files:
- app/(tabs)/chats.tsx                           # Add create group button
- app/(tabs)/chats/[chatId].tsx                  # Handle group vs direct chat
- components/chat/ChatHeader.tsx                 # Show group name/participants
- components/messages/MessageBubble.tsx          # Add sender name for groups
- hooks/useMessages.ts                           # Handle group message attribution
```

### Subtasks

#### Group Creation (US-18)
- [ ] Create group creation screen
- [ ] Implement user search/selection (fetch from Firestore users)
- [ ] Multi-select UI for participants (minimum 3 including creator)
- [ ] Group name input (required)
- [ ] Optional group picture upload (ImagePicker)
- [ ] Generate group ID (uuid.v4())
- [ ] Create group document in Firestore with:
  - type: 'group'
  - name
  - groupPicture (optional)
  - participants array (creator + selected users)
  - admins array (creator as first admin)
- [ ] Save group to SQLite
- [ ] Navigate to new group chat

#### Group Messaging (US-19, US-20)
- [ ] Adapt sendMessage to handle groups (same logic as direct)
- [ ] Store senderName in message for attribution
- [ ] Create GroupMessageBubble showing sender name
- [ ] Only show sender name for messages not from current user
- [ ] Update group's lastMessage with sender info
- [ ] Handle message ordering (server timestamp)

#### Group UI
- [ ] Show group name in ChatHeader
- [ ] Display participant count ("3 members")
- [ ] Implement GroupAvatar (initials or picture)
- [ ] Distinguish group chats in chat list (group icon)
- [ ] Create basic ParticipantList component

#### Real-Time for Groups (US-22)
- [ ] Same Firebase listener works for groups
- [ ] All participants receive updates via their listeners
- [ ] Ensure deliveredTo updates for each participant
- [ ] Handle readBy arrays for group read receipts

### Unit Tests (Jest) 🧪
**File**: `services/groups/__tests__/GroupService.test.ts`

```typescript
describe('GroupService', () => {
  test('shouldCreateGroupWithParticipants', async () => {
    const groupData = {
      name: 'Test Group',
      creatorId: 'user-1',
      participantIds: ['user-2', 'user-3']
    };
    
    const groupId = await groupService.createGroup(
      groupData.name,
      groupData.creatorId,
      groupData.participantIds
    );
    
    const group = await db.getChat(groupId);
    expect(group?.type).toBe('group');
    expect(group?.participants).toHaveLength(3);
    expect(group?.participants).toContain('user-1');
    expect(group?.admins).toEqual(['user-1']); // Creator is admin
  });
  
  test('shouldRequireMinimumThreeParticipants', async () => {
    await expect(groupService.createGroup(
      'Small Group',
      'user-1',
      ['user-2'] // Only 2 total (including creator)
    )).rejects.toThrow('Group must have at least 3 participants');
  });
  
  test('shouldSendMessageToGroup', async () => {
    const groupId = await createTestGroup();
    
    const message = await messageService.sendTextMessage(groupId, 'Group message');
    
    expect(message.chatId).toBe(groupId);
    
    const firestoreMsg = await getDoc(
      doc(firestore, `chats/${groupId}/messages`, message.id)
    );
    expect(firestoreMsg.exists()).toBe(true);
  });
});
```

### Integration Test (Detox) 🧪
**File**: `e2e/groupChat.e2e.ts`

```typescript
describe('Group Chat', () => {
  test('shouldCreateGroupWithMultipleUsers', async () => {
    await device.launchApp();
    await signInTestUser1();
    
    // Create group
    await element(by.id('chats-screen')).swipe('down'); // Pull to refresh if needed
    await element(by.id('create-group-button')).tap();
    
    await element(by.id('group-name-input')).typeText('Test Group');
    await element(by.id('select-user-user2')).tap();
    await element(by.id('select-user-user3')).tap();
    await element(by.id('create-group-submit')).tap();
    
    // Should navigate to group chat
    await waitFor(element(by.id('group-chat-screen')))
      .toBeVisible()
      .withTimeout(2000);
    
    await expect(element(by.text('Test Group'))).toBeVisible();
  });
  
  test('shouldShowSenderNamesInGroup', async () => {
    await openTestGroupChat();
    
    // Send message as User 1
    await sendTestMessage('Message from User 1');
    
    // Sign out and sign in as User 2
    await signOut();
    await signInTestUser2();
    await openTestGroupChat();
    
    // Should see sender name
    await expect(element(by.text('Test User 1'))).toBeVisible();
    await expect(element(by.text('Message from User 1'))).toBeVisible();
  });
  
  test('shouldReceiveGroupMessagesInRealTime', async () => {
    // This requires multi-device setup or multi-process
    // For MVP, simulate with rapid send/receive check
    
    await openTestGroupChat();
    await sendTestMessage('Group broadcast');
    
    // Verify received status updates
    await waitFor(element(by.id('message-status-delivered')))
      .toBeVisible()
      .withTimeout(3000);
  });
});
```

### Validation Criteria
- [ ] US-8: Delivery states show correctly
- [ ] US-10: Read receipts update when message viewed
- [ ] US-18: Can create group with 3+ users
- [ ] US-19: Can send messages to group
- [ ] US-20: Sender name shows in group messages
- [ ] US-21: Group read status shows count
- [ ] US-22: All participants receive real-time updates
- [ ] Checkmarks display properly (✓ → ✓✓ → ✓✓ blue)
- [ ] Batch read update reduces Firestore operations

---

## 🔔 PR #7: Push Notifications

**Branch**: `feature/push-notifications`
**User Stories**: US-23, US-24, US-25
**Effort**: 6-8 hours
**Dependencies**: PR #2, PR #6 (needs messaging and groups)

### Description
Implement push notifications using Expo Notifications and Firebase Cloud Messaging, including foreground notifications, notification content with sender/preview, tap-to-open chat functionality, and Cloud Function to send notifications on new messages.

### Files Created
```
New Files:
- services/notifications/NotificationService.ts  # Notification management
- components/notifications/NotificationHandler.tsx # Handle taps
- firebase/functions/src/index.ts                # Cloud Functions
- firebase/functions/src/notifications.ts        # Send notification logic
- firebase/functions/package.json                # Functions dependencies
- firebase/functions/tsconfig.json               # Functions TypeScript config
- hooks/useNotifications.ts                      # Notification permissions hook

Updated Files:
- app/_layout.tsx                                # Initialize notifications
- services/firebase/config.ts                    # FCM token handling
- services/firebase/auth.ts                      # Save FCM token on sign in
```

### Subtasks

#### Expo Notifications Setup (US-23)
- [ ] Request notification permissions on app start
- [ ] Get Expo push token
- [ ] Save FCM token to Firestore user document
- [ ] Configure foreground notification handler
- [ ] Set up notification received listener
- [ ] Handle permission denial gracefully
- [ ] Test on physical iPhone (required - simulator doesn't support push)

#### Notification Content (US-24)
- [ ] Set up Firebase Cloud Functions project
- [ ] Create onMessageCreate trigger function
- [ ] Fetch sender display name from Firestore
- [ ] Fetch recipient FCM tokens (exclude sender)
- [ ] For groups: format as "{Sender} in {Group Name}"
- [ ] For direct: format as "{Sender Name}"
- [ ] For images: show "📷 Image" as body
- [ ] Send via Firebase Admin SDK (sendMulticast)
- [ ] Include chatId in notification data payload
- [ ] Handle missing FCM tokens gracefully
- [ ] Deploy Cloud Function

#### Notification Tap Handling (US-25)
- [ ] Create NotificationHandler component
- [ ] Set up notification response listener
- [ ] Extract chatId from notification data
- [ ] Navigate to chat using Expo Router (router.push)
- [ ] Handle notification when app is foreground
- [ ] Handle notification when app is background
- [ ] Handle notification when app is killed (may require app restart)

#### Testing
- [ ] Test foreground notifications (required for MVP)
- [ ] Test background notifications (nice-to-have)
- [ ] Test notification tap opens correct chat
- [ ] Test group vs direct notification format
- [ ] Verify token refresh handling

### Unit Tests (Jest) 🧪
**File**: `services/notifications/__tests__/NotificationService.test.ts`

```typescript
describe('NotificationService', () => {
  test('shouldRequestPermissions', async () => {
    const mockRequestPermissions = jest.fn().mockResolvedValue({ status: 'granted' });
    jest.spyOn(Notifications, 'requestPermissionsAsync').mockImplementation(mockRequestPermissions);
    
    const result = await notificationService.requestPermissions();
    
    expect(result).toBe(true);
    expect(mockRequestPermissions).toHaveBeenCalled();
  });
  
  test('shouldGetAndSaveExpoToken', async () => {
    const mockToken = 'ExponentPushToken[xxxxxx]';
    jest.spyOn(Notifications, 'getExpoPushTokenAsync').mockResolvedValue({ data: mockToken });
    
    const userId = 'test-user';
    await notificationService.registerForPushNotifications(userId);
    
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    expect(userDoc.data()?.fcmToken).toBe(mockToken);
  });
});
```

**File**: `firebase/functions/src/__tests__/notifications.test.ts`

```typescript
describe('Cloud Function: sendMessageNotification', () => {
  test('shouldSendNotificationToRecipients', async () => {
    const chatId = 'test-chat';
    const senderId = 'user-1';
    const recipientId = 'user-2';
    
    // Set up test data
    await firestore.collection('chats').doc(chatId).set({
      type: 'direct',
      participants: [senderId, recipientId]
    });
    
    await firestore.collection('users').doc(senderId).set({
      displayName: 'Sender'
    });
    
    await firestore.collection('users').doc(recipientId).set({
      displayName: 'Recipient',
      fcmToken: 'test-token'
    });
    
    // Trigger function
    const messageSnap = createMessageSnapshot({
      senderId,
      content: 'Test message'
    });
    
    await sendMessageNotification(messageSnap, { params: { chatId } });
    
    // Verify sendMulticast called
    expect(admin.messaging().sendMulticast).toHaveBeenCalledWith(
      expect.objectContaining({
        tokens: ['test-token'],
        notification: expect.objectContaining({
          title: 'Sender',
          body: 'Test message'
        })
      })
    );
  });
  
  test('shouldFormatGroupNotificationCorrectly', async () => {
    const chatId = 'test-group';
    
    await firestore.collection('chats').doc(chatId).set({
      type: 'group',
      name: 'Team Chat',
      participants: ['user-1', 'user-2', 'user-3']
    });
    
    const messageSnap = createMessageSnapshot({
      senderId: 'user-1',
      content: 'Group message'
    });
    
    await sendMessageNotification(messageSnap, { params: { chatId } });
    
    expect(admin.messaging().sendMulticast).toHaveBeenCalledWith(
      expect.objectContaining({
        notification: expect.objectContaining({
          title: expect.stringContaining('in Team Chat')
        })
      })
    );
  });
});
```

### Validation Criteria
- [ ] US-23: Foreground notifications work
- [ ] US-24: Shows sender name and message preview
- [ ] US-25: Tapping notification opens chat
- [ ] Permissions requested on first launch
- [ ] FCM token saved to Firestore
- [ ] Cloud Function deploys successfully
- [ ] Function sends notification on new message
- [ ] Excludes sender from notification recipients
- [ ] Group notifications formatted correctly
- [ ] Image messages show "📷 Image"

---

## 📷 PR #8: Image Support

**Branch**: `feature/image-messaging`
**User Stories**: US-31, US-32
**Effort**: 5-6 hours
**Dependencies**: PR #2 (messaging foundation)

### Description
Add ability to select images from camera roll, upload to Firebase Storage, send image messages with URLs, and display images inline in chats with loading states.

### Files Created
```
New Files:
- components/messages/ImageMessage.tsx           # Image message component
- components/messages/ImagePicker.tsx            # Image selection button
- services/firebase/storage.ts                   # Firebase Storage operations
- hooks/useImagePicker.ts                        # Image selection hook

Updated Files:
- components/messages/MessageBubble.tsx          # Render based on type
- services/messages/MessageService.ts            # Add sendImageMessage
- app/(tabs)/chats/[chatId].tsx                  # Add image picker button
- types/message.ts                               # Ensure imageUrl field
```

### Subtasks

#### Image Selection (US-31)
- [ ] Request media library permissions
- [ ] Create ImagePicker button in message input area
- [ ] Implement launchImageLibraryAsync with:
  - mediaTypes: Images only
  - quality: 0.8 (compression)
  - allowsEditing: false
- [ ] Handle permission denial
- [ ] Show image preview after selection
- [ ] Add "Send" button for selected image

#### Image Upload
- [ ] Create uploadImage function in storage service
- [ ] Generate unique filename (uuid.v4())
- [ ] Upload to Firebase Storage path: `chat-images/{chatId}/{filename}`
- [ ] Convert image URI to blob
- [ ] Use uploadBytes to upload
- [ ] Get download URL after upload
- [ ] Show upload progress (spinner or percentage)
- [ ] Handle upload failures (show error, allow retry)

#### Image Messages (US-32)
- [ ] Create ImageMessage component
- [ ] Display image with Image component (resizeMode: 'cover')
- [ ] Set max dimensions (e.g., 300x300)
- [ ] Show loading spinner while image loads
- [ ] Handle image load errors (show placeholder)
- [ ] Add to MessageBubble component (render based on type)
- [ ] Update sendImageMessage to create message with imageUrl
- [ ] Store message type='image' in SQLite and Firestore

### Unit Tests (Jest) 🧪
**File**: `services/firebase/__tests__/storage.test.ts`

```typescript
describe('Firebase Storage Service', () => {
  test('shouldUploadImage', async () => {
    const imageUri = 'file:///path/to/test-image.jpg';
    const chatId = 'test-chat';
    
    // Mock fetch and uploadBytes
    global.fetch = jest.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob())
    });
    
    const mockUploadBytes = jest.fn().mockResolvedValue({});
    const mockGetDownloadURL = jest.fn().mockResolvedValue('https://storage.firebase.com/test.jpg');
    
    jest.spyOn(storage, 'uploadBytes').mockImplementation(mockUploadBytes);
    jest.spyOn(storage, 'getDownloadURL').mockImplementation(mockGetDownloadURL);
    
    const downloadUrl = await storageService.uploadChatImage(chatId, imageUri);
    
    expect(downloadUrl).toBe('https://storage.firebase.com/test.jpg');
    expect(mockUploadBytes).toHaveBeenCalled();
  });
  
  test('shouldGenerateUniqueFilenames', async () => {
    const urls = await Promise.all([
      storageService.uploadChatImage('chat-1', 'test1.jpg'),
      storageService.uploadChatImage('chat-1', 'test2.jpg')
    ]);
    
    expect(urls[0]).not.toBe(urls[1]);
  });
});
```

### Validation Criteria
- [ ] US-31: Can select image from camera roll
- [ ] US-32: Images display inline in chat
- [ ] Media library permission requested
- [ ] Image uploads to Firebase Storage
- [ ] Download URL saved in message
- [ ] Loading state shows during upload
- [ ] Upload failures handled gracefully
- [ ] Images display with proper dimensions
- [ ] Both direct and group chats support images

---

## 👑 PR #9: Advanced Group Management

**Branch**: `feature/group-management`
**User Stories**: US-33, US-34, US-35, US-36, US-37
**Effort**: 6-8 hours
**Dependencies**: PR #6 (basic groups)

### Description
Implement full group management features: edit group name/picture (admin-only), add/remove participants (admin-only), promote/demote admins, leave group with admin succession, and display admin badges in UI.

### Files Created
```
New Files:
- app/groups/[groupId]/members.tsx               # Member management screen
- components/groups/MemberListItem.tsx           # Member with admin badge
- components/groups/MemberActions.tsx            # Admin action sheet
- components/groups/AdminBadge.tsx               # Admin indicator

Updated Files:
- app/groups/[groupId]/settings.tsx              # Add edit group functionality
- services/groups/GroupService.ts                # Add admin/member operations
- components/groups/ParticipantList.tsx          # Show admin badges
```

### Subtasks

#### Group Editing (US-33)
- [ ] Add edit button to group settings (admin check)
- [ ] Create edit group name modal/screen
- [ ] Create edit group picture (ImagePicker)
- [ ] Check if user is admin before allowing edit
- [ ] Upload new group picture to Firebase Storage
- [ ] Update Firestore group document
- [ ] Update SQLite group record
- [ ] Send system message ("{User} updated group name")
- [ ] All participants see changes in real-time

#### Add/Remove Participants (US-34)
- [ ] Create "Add Members" button in settings (admin-only)
- [ ] User search/selection UI
- [ ] Implement addParticipant function with admin check
- [ ] Add to participants array (arrayUnion)
- [ ] Send system message ("{User} added {NewUser}")
- [ ] Create "Remove" action in member list (admin-only)
- [ ] Implement removeParticipant with admin check
- [ ] Remove from participants AND admins arrays (arrayRemove)
- [ ] Prevent removing self (must use leave group)
- [ ] Send system message ("{User} removed {RemovedUser}")

#### Admin Management (US-35)
- [ ] Add "Promote to Admin" action (admin-only)
- [ ] Implement promoteToAdmin function
- [ ] Add to admins array (arrayUnion)
- [ ] Send system message ("{User} is now an admin")
- [ ] Add "Demote Admin" action (admin-only)
- [ ] Implement demoteAdmin function
- [ ] Prevent demoting last admin
- [ ] Remove from admins array (arrayRemove)
- [ ] Send system message ("{User} is no longer an admin")

#### Leave Group (US-36)
- [ ] Add "Leave Group" button in settings
- [ ] Confirm alert before leaving
- [ ] If last participant, delete entire group
- [ ] If last admin, auto-promote oldest participant
- [ ] Remove user from participants and admins
- [ ] Send system message ("{User} left the group")
- [ ] Delete chat from local SQLite
- [ ] Navigate away from chat
- [ ] Stop Firebase listeners for that chat

#### Admin Indicators (US-37)
- [ ] Create AdminBadge component
- [ ] Show badge in ParticipantList
- [ ] Show admin count in group settings
- [ ] Show admin controls only to admins
- [ ] Update UI when admin status changes

### Unit Tests (Jest) 🧪
**File**: `services/groups/__tests__/AdminOperations.test.ts`

```typescript
describe('Group Admin Operations', () => {
  test('shouldOnlyAllowAdminsToAddMembers', async () => {
    const group = await createTestGroup({ admins: ['admin-1'] });
    
    await expect(groupService.addParticipant(
      group.id,
      'new-user',
      'non-admin-user' // Not an admin
    )).rejects.toThrow('Only admins can add participants');
  });
  
  test('shouldAddParticipantSuccessfully', async () => {
    const group = await createTestGroup({ admins: ['admin-1'] });
    
    await groupService.addParticipant(group.id, 'new-user', 'admin-1');
    
    const updated = await groupService.getGroup(group.id);
    expect(updated?.participants).toContain('new-user');
  });
  
  test('shouldPreventDemotingLastAdmin', async () => {
    const group = await createTestGroup({ admins: ['admin-1'] });
    
    await expect(groupService.demoteAdmin(
      group.id,
      'admin-1',
      'admin-1'
    )).rejects.toThrow('Cannot remove the last admin');
  });
  
  test('shouldAutoPromoteOnLastAdminLeave', async () => {
    const group = await createTestGroup({
      participants: ['admin-1', 'user-2', 'user-3'],
      admins: ['admin-1']
    });
    
    await groupService.leaveGroup(group.id, 'admin-1');
    
    const updated = await groupService.getGroup(group.id);
    expect(updated?.admins).toHaveLength(1);
    expect(updated?.admins[0]).toBe('user-2'); // Oldest participant
  });
  
  test('shouldDeleteGroupWhenLastMemberLeaves', async () => {
    const group = await createTestGroup({ participants: ['user-1'] });
    
    await groupService.leaveGroup(group.id, 'user-1');
    
    const deleted = await groupService.getGroup(group.id);
    expect(deleted).toBeNull();
  });
});
```

### Validation Criteria
- [ ] US-33: Admins can edit group name and picture
- [ ] US-34: Admins can add/remove participants
- [ ] US-35: Admins can promote/demote others
- [ ] US-36: Users can leave group
- [ ] US-37: Admin badges display correctly
- [ ] Last admin can't be demoted
- [ ] Last admin leaving promotes someone
- [ ] Last member leaving deletes group
- [ ] System messages show for all actions
- [ ] Firestore security rules enforce admin checks

---

## ✅ PR #10: Reliability Testing & MVP Validation

**Branch**: `feature/reliability-testing`
**User Stories**: US-26, US-27, US-28, US-29, US-30
**Effort**: 4-5 hours
**Dependencies**: All previous PRs

### Description
Comprehensive testing of reliability scenarios: poor network handling, rapid-fire messages, app backgrounding/foregrounding, force quit persistence, graceful error recovery. Validate all MVP success criteria.

### Files Created
```
New Files:
- e2e/reliability.e2e.ts                         # All reliability tests
- e2e/mvp-validation.e2e.ts                      # Full MVP scenario tests
- e2e/helpers/testHelpers.ts                     # Reusable test utilities
- components/ui/ErrorBoundary.tsx                # Error boundary component

Updated Files:
- app/_layout.tsx                                # Add ErrorBoundary
- services/messages/MessageQueue.ts              # Improve error handling
- services/network/NetworkMonitor.ts             # Enhanced network detection
- All components with try-catch blocks
```

### Subtasks

#### Network Resilience (US-26)
- [ ] Test with Expo network conditions simulation
- [ ] Test with actual airplane mode on device
- [ ] Verify offline banner displays
- [ ] Verify messages queue when offline
- [ ] Test slow network (3G simulation)
- [ ] Increase timeouts for slow networks
- [ ] Handle Firebase timeout errors

#### Rapid Messages (US-27)
- [ ] Test sending 20+ messages in < 10 seconds
- [ ] Verify all messages saved to SQLite
- [ ] Verify message ordering (timestamp)
- [ ] Verify no duplicates
- [ ] Verify all sync to Firebase eventually
- [ ] Check Firestore rate limits (shouldn't hit for 20 messages)

#### App Lifecycle (US-28, US-29)
- [ ] Test app backgrounding (home button)
- [ ] Verify listeners pause/resume correctly
- [ ] Test app foregrounding
- [ ] Verify pending messages retry on foreground
- [ ] Test force quit (swipe up from app switcher)
- [ ] Verify messages persist after force quit
- [ ] Test rapid background/foreground cycles

#### Error Recovery (US-30)
- [ ] Add ErrorBoundary to app root
- [ ] Implement comprehensive try-catch blocks
- [ ] Show user-friendly error messages
- [ ] Log errors to console (add Sentry post-MVP)
- [ ] Test SQLite write failure scenario
- [ ] Test Firebase write failure scenario
- [ ] Verify retry logic works
- [ ] Test corrupted data scenarios

### Integration Tests (Detox) 🧪
**File**: `e2e/reliability.e2e.ts`

```typescript
describe('Reliability Tests', () => {
  test('shouldHandlePoorNetworkConditions', async () => {
    await device.launchApp();
    await signInTestUser1();
    await openTestChat();
    
    // Throttle network
    await device.setNetworkConnection('3g');
    
    // Send message
    await sendTestMessage('Slow network test');
    
    // Should still send eventually
    await waitFor(element(by.id('message-status-sent')))
      .toBeVisible()
      .withTimeout(10000); // Longer timeout for slow network
    
    // Restore network
    await device.setNetworkConnection('wifi');
  });
  
  test('shouldHandleRapidFireMessages', async () => {
    await device.launchApp();
    await signInTestUser1();
    await openTestChat();
    
    // Send 20 messages rapidly
    for (let i = 1; i <= 20; i++) {
      await element(by.id('message-input')).typeText(`Message ${i}\n`);
    }
    
    // All should appear in UI
    for (let i = 1; i <= 20; i++) {
      await expect(element(by.text(`Message ${i}`))).toBeVisible();
    }
    
    // All should eventually sync
    await waitFor(element(by.id('all-messages-synced')))
      .toBeVisible()
      .withTimeout(30000);
  });
  
  test('shouldPersistThroughAppBackgrounding', async () => {
    await device.launchApp();
    await signInTestUser1();
    await openTestChat();
    
    await sendTestMessage('Background test');
    
    // Background app
    await device.sendToHome();
    await waitFor(1000);
    
    // Foreground app
    await device.launchApp();
    
    // Message should still be visible
    await expect(element(by.text('Background test'))).toBeVisible();
  });
  
  test('shouldRecoverFromForceQuit', async () => {
    await device.launchApp();
    await signInTestUser1();
    await openTestChat();
    
    await sendTestMessage('Force quit test');
    
    // Force terminate
    await device.terminateApp();
    
    // Relaunch
    await device.launchApp({ newInstance: true });
    await signInTestUser1();
    await openTestChat();
    
    // Message persisted
    await expect(element(by.text('Force quit test'))).toBeVisible();
  });
  
  test('shouldHandleOfflineThenOnline', async () => {
    await device.launchApp();
    await signInTestUser1();
    await openTestChat();
    
    // Go offline
    await device.setNetworkConnection('airplane');
    
    // Send 3 messages
    await sendTestMessage('Offline 1');
    await sendTestMessage('Offline 2');
    await sendTestMessage('Offline 3');
    
    // All show as sending
    await expect(element(by.id('message-status-sending'))).toBeVisible();
    
    // Reconnect
    await device.setNetworkConnection('wifi');
    
    // Should auto-sync
    await waitFor(element(by.id('message-status-sent')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
```

**File**: `e2e/mvp-validation.e2e.ts`

```typescript
/**
 * MVP Validation Test Suite
 * Tests all 7 critical scenarios from PRD Section 3.5
 */
describe('MVP Validation', () => {
  test('SCENARIO_1_RealTimeMessaging_TwoDevices', async () => {
    // Requires multi-device Detox setup
    // For now, test single device with rapid sync check
    
    await device.launchApp();
    await signInTestUser1();
    await openTestChat();
    
    const startTime = Date.now();
    await sendTestMessage('Real-time test');
    
    // Should show sent within 2 seconds
    await waitFor(element(by.id('message-status-sent')))
      .toBeVisible()
      .withTimeout(2000);
    
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(2000);
  });
  
  test('SCENARIO_2_OfflineToOnline', async () => {
    await device.launchApp();
    await signInTestUser1();
    await openTestChat();
    
    // Go offline
    await device.setNetworkConnection('airplane');
    await sendTestMessage('Offline message');
    
    // Go online
    await device.setNetworkConnection('wifi');
    
    // Should sync
    await waitFor(element(by.id('message-status-sent')))
      .toBeVisible()
      .withTimeout(5000);
  });
  
  test('SCENARIO_3_BackgroundedApp', async () => {
    await device.launchApp();
    await signInTestUser1();
    await openTestChat();
    
    await sendTestMessage('Background test');
    
    // Background
    await device.sendToHome();
    
    // Foreground
    await device.launchApp();
    
    // Message visible
    await expect(element(by.text('Background test'))).toBeVisible();
  });
  
  test('SCENARIO_4_ForceQuitPersistence', async () => {
    await device.launchApp();
    await signInTestUser1();
    await openTestChat();
    
    await sendTestMessage('Persistence test');
    
    // Terminate
    await device.terminateApp();
    
    // Relaunch
    await device.launchApp({ newInstance: true });
    await signInTestUser1();
    await openTestChat();
    
    await expect(element(by.text('Persistence test'))).toBeVisible();
  });
  
  test('SCENARIO_5_PoorNetwork', async () => {
    // Tested in reliability.e2e.ts
  });
  
  test('SCENARIO_6_RapidFireMessages', async () => {
    await device.launchApp();
    await signInTestUser1();
    await openTestChat();
    
    // Send 20+ messages
    for (let i = 1; i <= 25; i++) {
      await element(by.id('message-input')).typeText(`Rapid ${i}\n`);
    }
    
    // All visible
    await expect(element(by.text('Rapid 25'))).toBeVisible();
    
    // No loss, correct order
    await scrollToMessage('Rapid 1');
    await expect(element(by.text('Rapid 1'))).toBeVisible();
  });
  
  test('SCENARIO_7_GroupChatThreeUsers', async () => {
    await device.launchApp();
    await signInTestUser1();
    
    await createTestGroupWithThreeUsers();
    
    await sendTestMessage('Group test message');
    
    // Should show sender name (for others)
    await expect(element(by.text('Group test message'))).toBeVisible();
  });
});
```

### Validation Criteria
- [ ] US-26: Handles poor network gracefully
- [ ] US-27: 20+ rapid messages work correctly
- [ ] US-28: App backgrounding doesn't break anything
- [ ] US-29: Force quit preserves messages
- [ ] US-30: Errors handled gracefully
- [ ] All 7 MVP test scenarios pass
- [ ] ErrorBoundary catches component errors
- [ ] Network state updates correctly
- [ ] No memory leaks from listeners
- [ ] No message loss under any condition

---

## 📦 Complete PR List Summary

| PR # | Branch | User Stories | Effort | Tests | Priority |
|------|--------|--------------|--------|-------|----------|
| **PR #1** | `feature/setup-authentication` | US-1 to US-4 | 4h | Jest (3) + Detox (1) | 🔥 Critical |
| **PR #2** | `feature/one-on-one-messaging` | US-5, US-6, US-7, US-9 | 6-8h | Jest (2) + Detox (1) | 🔥 Critical |
| **PR #3** | `feature/offline-support` | US-13-17 | 5-6h | Jest (2) + Detox (1) | 🔥 Critical |
| **PR #4** | `feature/delivery-read-receipts` | US-8, US-10, US-21 | 3-4h | Jest (1) | 🔥 Critical |
| **PR #5** | `feature/presence-typing` | US-11, US-12 | 3-4h | Jest (2) | ⚠️ High |
| **PR #6** | `feature/group-chat` | US-18-20, US-22 | 6-8h | Jest (1) + Detox (1) | 🔥 Critical |
| **PR #7** | `feature/push-notifications` | US-23-25 | 6-8h | Jest (2) | ⚠️ High |
| **PR #8** | `feature/image-messaging` | US-31, US-32 | 5-6h | Jest (1) | ⚠️ Medium |
| **PR #9** | `feature/group-management` | US-33-37 | 6-8h | Jest (1) | ⚠️ Medium |
| **PR #10** | `feature/reliability-testing` | US-26-30 | 4-5h | Detox (2) | ⚠️ High |

**Total**: 48-64 hours estimated (with testing)
**MVP Critical Path**: PR #1-4, #6 = ~24-30 hours
**Additional Features**: PR #5, #7-9 = ~20-30 hours  
**Validation**: PR #10 = ~4-5 hours

---

## 🧪 Testing Strategy Summary

### Unit Tests (Jest)
**Total**: 13 test files

**Coverage Areas**:
1. ✅ Authentication service (sign up/in/out)
2. ✅ SQLite operations (insert, query, update)
3. ✅ Message service (send, sync)
4. ✅ Message queue (queue, retry, backoff)
5. ✅ Network monitor (state detection)
6. ✅ Read receipts (mark read, batch update)
7. ✅ Presence service (online/offline)
8. ✅ Typing indicators (debounce, auto-clear)
9. ✅ Group service (create, admin operations)
10. ✅ Cloud Functions (notification sending)
11. ✅ Storage service (image upload)
12. ✅ Formatters (timestamp display)
13. ✅ Admin operations (permissions, succession)

### Integration/E2E Tests (Detox)
**Total**: 6 test files

**Coverage Areas**:
1. ✅ `e2e/auth.e2e.ts` - Authentication flow, session persistence
2. ✅ `e2e/messaging.e2e.ts` - Real-time messaging, optimistic updates
3. ✅ `e2e/offline.e2e.ts` - Offline send, auto-sync, crash recovery
4. ✅ `e2e/groupChat.e2e.ts` - Group creation, member attribution
5. ✅ `e2e/reliability.e2e.ts` - Poor network, rapid messages, lifecycle
6. ✅ `e2e/mvp-validation.e2e.ts` - All 7 critical MVP scenarios

### Test Setup Requirements

**File**: `jest.config.js`
```javascript
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  collectCoverageFrom: [
    'services/**/*.ts',
    'hooks/**/*.ts',
    'utils/**/*.ts',
    '!**/__tests__/**',
    '!**/node_modules/**'
  ]
};
```

**File**: `jest.setup.js`
```javascript
// Mock Firebase
jest.mock('firebase/app');
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('firebase/storage');

// Mock Expo modules
jest.mock('expo-sqlite');
jest.mock('expo-notifications');
jest.mock('@react-native-community/netinfo');

// Set up Firebase emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
```

**File**: `.detoxrc.json`
```json
{
  "testRunner": "jest",
  "runnerConfig": "e2e/config.json",
  "apps": {
    "ios": {
      "type": "ios.app",
      "build": "xcodebuild -workspace ios/MessageAI.xcworkspace -scheme MessageAI -configuration Release -sdk iphonesimulator -derivedDataPath ios/build",
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/MessageAI.app"
    }
  },
  "devices": {
    "simulator": {
      "type": "ios.simulator",
      "device": {
        "type": "iPhone 14"
      }
    }
  },
  "configurations": {
    "ios": {
      "device": "simulator",
      "app": "ios"
    }
  }
}
```

---

## 📋 Complete File Inventory

### Phase 1: Setup & Auth (PR #1) - 18 files ✅
Already provided in `starter-code/`

### Phase 2-10: Additional Files - ~35 files

**Screens** (10 files):
- `app/(tabs)/chats/[chatId].tsx`
- `app/groups/create.tsx`
- `app/groups/[groupId]/settings.tsx`
- `app/groups/[groupId]/members.tsx`

**Components** (15 files):
- `components/messages/MessageBubble.tsx`
- `components/messages/MessageList.tsx`
- `components/messages/MessageInput.tsx`
- `components/messages/ImageMessage.tsx`
- `components/messages/GroupMessageBubble.tsx`
- `components/messages/MessageStatus.tsx`
- `components/chat/ChatListItem.tsx`
- `components/chat/ChatHeader.tsx`
- `components/chat/OnlineIndicator.tsx`
- `components/chat/TypingIndicator.tsx`
- `components/groups/ParticipantSelector.tsx`
- `components/groups/ParticipantList.tsx`
- `components/groups/GroupAvatar.tsx`
- `components/ui/OfflineBanner.tsx`
- `components/ui/ErrorBoundary.tsx`

**Services** (10 files):
- `services/messages/MessageService.ts`
- `services/messages/MessageQueue.ts`
- `services/messages/MessageSync.ts`
- `services/firebase/firestore.ts`
- `services/firebase/storage.ts`
- `services/network/NetworkMonitor.ts`
- `services/notifications/NotificationService.ts`
- `services/presence/PresenceService.ts`
- `services/groups/GroupService.ts`

**Hooks** (6 files):
- `hooks/useMessages.ts`
- `hooks/useChats.ts`
- `hooks/useNetworkState.ts`
- `hooks/useOnlineStatus.ts`
- `hooks/useTypingIndicator.ts`
- `hooks/useNotifications.ts`
- `hooks/useImagePicker.ts`

**Firebase Functions** (3 files):
- `firebase/functions/src/index.ts`
- `firebase/functions/src/notifications.ts`
- `firebase/functions/package.json`

**Tests** (19 files):
- `services/firebase/__tests__/auth.test.ts`
- `services/database/__tests__/sqlite.test.ts`
- `services/messages/__tests__/MessageService.test.ts`
- `services/messages/__tests__/MessageQueue.test.ts`
- `services/messages/__tests__/ReadReceipts.test.ts`
- `services/network/__tests__/NetworkMonitor.test.ts`
- `services/presence/__tests__/PresenceService.test.ts`
- `services/firebase/__tests__/storage.test.ts`
- `services/notifications/__tests__/NotificationService.test.ts`
- `services/groups/__tests__/GroupService.test.ts`
- `services/groups/__tests__/AdminOperations.test.ts`
- `firebase/functions/src/__tests__/notifications.test.ts`
- `utils/__tests__/formatters.test.ts`
- `hooks/__tests__/useTypingIndicator.test.ts`
- `e2e/auth.e2e.ts`
- `e2e/messaging.e2e.ts`
- `e2e/offline.e2e.ts`
- `e2e/groupChat.e2e.ts`
- `e2e/reliability.e2e.ts`
- `e2e/mvp-validation.e2e.ts`

**Total Files**: ~88 files (including starter code)

---

## 🎯 Recommended Development Order

For 24-hour MVP, follow this sequence:

### Hours 1-4: PR #1 ✅ DONE
Setup & Authentication

### Hours 5-12: PR #2 🔥 CRITICAL
Core One-on-One Messaging
- Focus: Get basic messaging working end-to-end
- Test constantly on two devices

### Hours 13-15: PR #3 🔥 CRITICAL
Offline Support
- Focus: Message queue and network monitoring
- Test: Force quit, airplane mode

### Hours 16-17: PR #4 🔥 CRITICAL
Delivery States & Read Receipts
- Focus: Status indicators
- Test: Read receipt updates

### Hours 18-21: PR #6 🔥 CRITICAL
Basic Group Chat
- Focus: Group creation and messaging
- Test: 3+ users chatting

### Hours 22-23: PR #7 ⚠️ HIGH
Push Notifications (Foreground)
- Focus: Cloud Function + foreground notifications
- Test: Physical device required

### Hour 24: PR #10 ✅ VALIDATION
Run all tests, validate MVP

### Post-24h (if time): PR #5, #8, #9
- Typing indicators
- Images
- Group management

---

## ✅ PR Completion Checklist

For each PR:

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/branch-name
   ```

2. **Complete All Subtasks**
   - Check off each subtask as completed
   - Test each feature as built

3. **Write Tests** (where applicable)
   - Write unit tests first (TDD if possible)
   - Run tests: `npm test`
   - Add E2E tests for critical paths
   - Run Detox: `detox test`

4. **Validate Criteria**
   - Check all validation criteria
   - Test on physical device
   - Verify in Firebase Console

5. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: [PR title] - [summary]"
   git push origin feature/branch-name
   ```

6. **Create Pull Request**
   - Title: PR #X: [Title]
   - Description: Link to user stories, validation results
   - Request review

7. **Merge to Main**
   ```bash
   git checkout main
   git merge feature/branch-name
   git push origin main
   ```

---

## 🏁 Final Notes

**Critical Success Factors**:
1. Build vertically (complete features)
2. Test on physical devices constantly
3. Prioritize critical path (PR #1-4, #6)
4. Write tests as you go (don't save for end)
5. Use Firebase Emulator for faster testing
6. Minimal UI - functionality over beauty

**Testing Philosophy**:
- Unit tests for all services and utilities
- E2E tests for critical user flows
- Test on real devices (iPhone/iPad)
- Validate each PR before merging

**Git Workflow**:
- Feature branches for each PR
- Merge to main after validation
- Track progress via GitHub commits
- Tag v1.0-mvp after PR #10

You now have a complete roadmap with 10 PRs, detailed subtasks, files to create/update, and comprehensive testing strategy. Ready to start building! 🚀

