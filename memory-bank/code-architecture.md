# MessageAI MVP - Code Architecture & Structure

## Recommended Folder Structure

```
chat_iq/
├── app/                          # Expo Router app directory
│   ├── (auth)/                   # Auth group (layout)
│   │   ├── _layout.tsx          # Auth layout wrapper
│   │   ├── sign-in.tsx          # Sign in screen
│   │   └── sign-up.tsx          # Sign up screen
│   ├── (tabs)/                   # Main app tabs
│   │   ├── _layout.tsx          # Tab layout
│   │   ├── chats/               # Chats tab
│   │   │   ├── index.tsx        # Chat list screen
│   │   │   └── [chatId].tsx     # Individual chat screen
│   │   └── profile.tsx          # Profile/settings tab
│   ├── groups/                   # Group management screens
│   │   ├── create.tsx           # Create group
│   │   ├── [groupId]/          
│   │   │   ├── settings.tsx     # Group settings
│   │   │   └── members.tsx      # Manage members
│   └── _layout.tsx              # Root layout
├── components/                   # Reusable components
│   ├── messages/
│   │   ├── MessageBubble.tsx    # Individual message
│   │   ├── MessageList.tsx      # FlatList of messages
│   │   ├── MessageInput.tsx     # Input with send button
│   │   ├── ImageMessage.tsx     # Image message type
│   │   └── SystemMessage.tsx    # Group system messages
│   ├── chat/
│   │   ├── ChatListItem.tsx     # Chat preview in list
│   │   └── ChatHeader.tsx       # Chat screen header
│   ├── ui/
│   │   ├── Avatar.tsx           # User avatar
│   │   └── LoadingSpinner.tsx   # Loading states
│   └── notifications/
│       └── NotificationHandler.tsx # Handle notification taps
├── services/                     # Business logic services
│   ├── database/
│   │   ├── sqlite.ts            # SQLite database service
│   │   ├── schema.ts            # Database schema
│   │   └── queries.ts           # Common queries
│   ├── firebase/
│   │   ├── config.ts            # Firebase initialization
│   │   ├── auth.ts              # Auth service
│   │   ├── firestore.ts         # Firestore operations
│   │   ├── storage.ts           # Firebase Storage for images
│   │   └── messaging.ts         # FCM service
│   ├── messages/
│   │   ├── MessageQueue.ts      # Offline message queue
│   │   ├── MessageSync.ts       # Sync service
│   │   └── MessageService.ts    # Main message operations
│   └── network/
│       └── NetworkMonitor.ts    # Network state monitoring
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts               # Authentication state
│   ├── useMessages.ts           # Message loading and sending
│   ├── useChat.ts               # Chat operations
│   ├── useOnlineStatus.ts       # User online/offline
│   ├── useTypingIndicator.ts    # Typing status
│   └── useNetworkState.ts       # Network connectivity
├── contexts/                     # React Context
│   ├── AuthContext.tsx          # Global auth state
│   └── ChatContext.tsx          # Active chat state
├── utils/                        # Utility functions
│   ├── formatters.ts            # Date/time formatting
│   ├── validation.ts            # Form validation
│   └── uuid.ts                  # UUID generation
├── types/                        # TypeScript types
│   ├── message.ts               # Message types
│   ├── chat.ts                  # Chat types
│   └── user.ts                  # User types
├── constants/                    # App constants
│   └── config.ts                # App configuration
├── firebase/                     # Firebase Cloud Functions
│   └── functions/
│       ├── src/
│       │   └── index.ts         # Cloud Functions
│       ├── package.json
│       └── tsconfig.json
├── app.json                      # Expo configuration
├── package.json
├── tsconfig.json
├── .env                          # Environment variables (gitignored)
└── README.md
```

---

## Key Files and Their Responsibilities

### 1. Root Layout: `app/_layout.tsx`

```typescript
// Root layout - handles auth state and navigation
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { initializeFirebase } from '@/services/firebase/config';
import { initializeDatabase } from '@/services/database/sqlite';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    const initialize = async () => {
      await initializeFirebase();
      await initializeDatabase();
      setIsReady(true);
    };
    
    initialize();
  }, []);
  
  if (!isReady) {
    return <LoadingSpinner />;
  }
  
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  );
}
```

**Responsibilities**:
- Initialize Firebase
- Initialize SQLite database
- Provide auth context
- Setup navigation structure
- Show loading while initializing

---

### 2. Auth Context: `contexts/AuthContext.tsx`

```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { useRouter, useSegments } from 'expo-router';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  useEffect(() => {
    if (loading) return;
    
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/chats');
    }
  }, [user, loading, segments]);
  
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Responsibilities**:
- Monitor Firebase auth state
- Auto-navigate based on auth state
- Provide user to app via context
- Handle session persistence

---

### 3. SQLite Service: `services/database/sqlite.ts`

```typescript
import * as SQLite from 'expo-sqlite';

class DatabaseService {
  private db: SQLite.WebSQLDatabase;
  
  async init() {
    this.db = SQLite.openDatabase('messageai.db');
    await this.createTables();
  }
  
  private async createTables() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // Chats table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS chats (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            name TEXT,
            groupPicture TEXT,
            participants TEXT NOT NULL,
            admins TEXT,
            lastMessage TEXT,
            updatedAt INTEGER,
            createdAt INTEGER
          )
        `);
        
        // Messages table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            chatId TEXT NOT NULL,
            senderId TEXT NOT NULL,
            senderName TEXT,
            content TEXT,
            type TEXT NOT NULL,
            imageUrl TEXT,
            timestamp INTEGER NOT NULL,
            syncStatus TEXT DEFAULT 'pending',
            deliveryStatus TEXT DEFAULT 'sending',
            readBy TEXT,
            deliveredTo TEXT,
            createdAt INTEGER DEFAULT (strftime('%s', 'now'))
          )
        `);
        
        // Indexes for performance
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_messages_chatId ON messages(chatId)');
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)');
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_messages_syncStatus ON messages(syncStatus)');
      }, reject, resolve);
    });
  }
  
  // Message operations
  async insertMessage(message: Message) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO messages (id, chatId, senderId, senderName, content, type, imageUrl, timestamp, syncStatus, deliveryStatus)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            message.id,
            message.chatId,
            message.senderId,
            message.senderName || '',
            message.content || '',
            message.type,
            message.imageUrl || '',
            message.timestamp,
            message.syncStatus || 'pending',
            message.deliveryStatus || 'sending'
          ],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  }
  
  async getMessages(chatId: string, limit: number = 50) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp DESC LIMIT ?',
          [chatId, limit],
          (_, { rows }) => resolve(rows._array),
          (_, error) => reject(error)
        );
      });
    });
  }
  
  async getPendingMessages() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          "SELECT * FROM messages WHERE syncStatus = 'pending' OR syncStatus = 'failed' ORDER BY timestamp ASC",
          [],
          (_, { rows }) => resolve(rows._array),
          (_, error) => reject(error)
        );
      });
    });
  }
  
  async updateMessageStatus(id: string, syncStatus: string, deliveryStatus: string) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'UPDATE messages SET syncStatus = ?, deliveryStatus = ? WHERE id = ?',
          [syncStatus, deliveryStatus, id],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  }
  
  // Chat operations
  async insertChat(chat: Chat) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO chats (id, type, name, groupPicture, participants, admins, lastMessage, updatedAt, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            chat.id,
            chat.type,
            chat.name || '',
            chat.groupPicture || '',
            JSON.stringify(chat.participants),
            JSON.stringify(chat.admins || []),
            JSON.stringify(chat.lastMessage || null),
            chat.updatedAt || Date.now(),
            chat.createdAt || Date.now()
          ],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  }
  
  async getChats(userId: string) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM chats WHERE participants LIKE ? ORDER BY updatedAt DESC`,
          [`%${userId}%`],
          (_, { rows }) => {
            const chats = rows._array.map(chat => ({
              ...chat,
              participants: JSON.parse(chat.participants),
              admins: JSON.parse(chat.admins || '[]'),
              lastMessage: chat.lastMessage ? JSON.parse(chat.lastMessage) : null
            }));
            resolve(chats);
          },
          (_, error) => reject(error)
        );
      });
    });
  }
}

export const db = new DatabaseService();
```

**Responsibilities**:
- SQLite database initialization
- Schema creation and migrations
- All database CRUD operations
- Query methods for messages and chats
- Proper indexing for performance

---

### 4. Message Queue: `services/messages/MessageQueue.ts`

```typescript
import { db } from '../database/sqlite';
import { syncMessageToFirebase } from './MessageSync';

class MessageQueue {
  private queue: any[] = [];
  private processing: boolean = false;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  
  async sendMessage(message: any) {
    // 1. Save to SQLite immediately (critical for persistence)
    try {
      await db.insertMessage(message);
    } catch (error) {
      console.error('CRITICAL: SQLite write failed', error);
      throw error; // This must succeed
    }
    
    // 2. Add to queue for Firebase sync
    this.queue.push(message);
    
    // 3. Process queue
    if (!this.processing) {
      this.processQueue();
    }
  }
  
  private async processQueue() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const message = this.queue.shift();
      
      try {
        await syncMessageToFirebase(message);
        await db.updateMessageStatus(message.id, 'synced', 'sent');
      } catch (error) {
        console.error('Firebase sync failed:', error);
        await db.updateMessageStatus(message.id, 'failed', 'failed');
        
        // Schedule retry
        this.scheduleRetry(message.id);
      }
    }
    
    this.processing = false;
  }
  
  private scheduleRetry(messageId: string, attempt: number = 0) {
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // Exponential backoff, max 30s
    
    const timeout = setTimeout(async () => {
      const message = await db.getMessage(messageId);
      
      if (message && (message.syncStatus === 'pending' || message.syncStatus === 'failed')) {
        try {
          await syncMessageToFirebase(message);
          await db.updateMessageStatus(messageId, 'synced', 'sent');
          this.retryTimeouts.delete(messageId);
        } catch (error) {
          if (attempt < 5) {
            this.scheduleRetry(messageId, attempt + 1);
          }
        }
      }
    }, delay);
    
    this.retryTimeouts.set(messageId, timeout);
  }
  
  async retryPendingMessages() {
    const pending = await db.getPendingMessages();
    
    for (const message of pending) {
      this.queue.push(message);
    }
    
    if (!this.processing && this.queue.length > 0) {
      this.processQueue();
    }
  }
  
  clearRetry(messageId: string) {
    const timeout = this.retryTimeouts.get(messageId);
    if (timeout) {
      clearTimeout(timeout);
      this.retryTimeouts.delete(messageId);
    }
  }
}

export const messageQueue = new MessageQueue();
```

**Responsibilities**:
- Queue messages for sending
- Sequential processing (avoid concurrent SQLite writes)
- Retry failed messages with exponential backoff
- Persist messages to SQLite before Firebase
- Handle network failures gracefully

---

### 5. Firebase Config: `services/firebase/config.ts`

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

let app;
let auth;
let firestore;
let storage;

export const initializeFirebase = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    firestore = getFirestore(app);
    storage = getStorage(app);
    
    // Disable Firestore offline persistence (we use SQLite)
    // This is critical to avoid conflicts
    // Note: No built-in way to disable in v9+, so we just don't enable it
  }
  
  return { app, auth, firestore, storage };
};

export const getFirebaseAuth = () => auth;
export const getFirebaseFirestore = () => firestore;
export const getFirebaseStorage = () => storage;
```

**Responsibilities**:
- Initialize Firebase with environment variables
- Export Firebase services (auth, firestore, storage)
- Single initialization point
- Disable Firestore offline cache (critical - conflicts with SQLite)

---

### 6. Message Service: `services/messages/MessageService.ts`

```typescript
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/sqlite';
import { messageQueue } from './MessageQueue';
import { getFirebaseAuth } from '../firebase/config';

export class MessageService {
  async sendTextMessage(chatId: string, content: string) {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    const message = {
      id: uuidv4(),
      chatId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'Unknown',
      content,
      type: 'text',
      timestamp: Date.now(),
      syncStatus: 'pending',
      deliveryStatus: 'sending'
    };
    
    // Queue for sending (handles SQLite + Firebase)
    await messageQueue.sendMessage(message);
    
    return message;
  }
  
  async sendImageMessage(chatId: string, imageUrl: string) {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    const message = {
      id: uuidv4(),
      chatId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'Unknown',
      content: '',
      type: 'image',
      imageUrl,
      timestamp: Date.now(),
      syncStatus: 'pending',
      deliveryStatus: 'sending'
    };
    
    await messageQueue.sendMessage(message);
    
    return message;
  }
  
  async markMessageAsRead(chatId: string, messageId: string, userId: string) {
    // Update Firestore
    const messageRef = doc(getFirebaseFirestore(), `chats/${chatId}/messages`, messageId);
    await updateDoc(messageRef, {
      readBy: arrayUnion(userId)
    });
    
    // Update SQLite
    const message = await db.getMessage(messageId);
    const readBy = message.readBy ? JSON.parse(message.readBy) : [];
    if (!readBy.includes(userId)) {
      readBy.push(userId);
      await db.updateMessageReadBy(messageId, JSON.stringify(readBy));
    }
  }
  
  async markChatAsRead(chatId: string, userId: string) {
    const messages = await db.getUnreadMessages(chatId, userId);
    
    for (const message of messages) {
      await this.markMessageAsRead(chatId, message.id, userId);
    }
  }
}

export const messageService = new MessageService();
```

**Responsibilities**:
- High-level message operations
- Send text and image messages
- Mark messages as read
- Coordinate between SQLite and Firebase
- Handle user authentication state

---

### 7. Network Monitor: `services/network/NetworkMonitor.ts`

```typescript
import NetInfo from '@react-native-community/netinfo';
import { messageQueue } from '../messages/MessageQueue';
import { updateOnlineStatus } from '../firebase/firestore';

class NetworkMonitor {
  private isOnline: boolean = true;
  private listeners: ((isOnline: boolean) => void)[] = [];
  
  init() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected || false;
      
      // Notify listeners
      this.listeners.forEach(listener => listener(this.isOnline));
      
      // If reconnected, retry pending messages
      if (!wasOnline && this.isOnline) {
        console.log('Network reconnected - retrying pending messages');
        messageQueue.retryPendingMessages();
        updateOnlineStatus(true);
      } else if (wasOnline && !this.isOnline) {
        console.log('Network disconnected');
        updateOnlineStatus(false).catch(() => {}); // May fail if offline
      }
    });
  }
  
  subscribe(listener: (isOnline: boolean) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  getIsOnline() {
    return this.isOnline;
  }
}

export const networkMonitor = new NetworkMonitor();
```

**Responsibilities**:
- Monitor network connectivity
- Notify app when network state changes
- Trigger message retry on reconnection
- Update user online status
- Provide network state to components

---

### 8. Custom Hooks: `hooks/useMessages.ts`

```typescript
import { useState, useEffect } from 'react';
import { db } from '@/services/database/sqlite';
import { messageService } from '@/services/messages/MessageService';
import { onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/services/firebase/config';

export const useMessages = (chatId: string, currentUserId: string) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load from SQLite on mount
  useEffect(() => {
    const loadMessages = async () => {
      const localMessages = await db.getMessages(chatId);
      setMessages(localMessages);
      setLoading(false);
    };
    
    loadMessages();
  }, [chatId]);
  
  // Set up Firebase listener for real-time updates
  useEffect(() => {
    if (!chatId) return;
    
    const firestore = getFirebaseFirestore();
    const messagesRef = collection(firestore, `chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const message = { id: change.doc.id, ...change.doc.data() };
          
          // Only process if not from current user (avoid duplicates)
          if (message.senderId !== currentUserId) {
            await db.insertOrUpdateMessage({
              ...message,
              syncStatus: 'synced',
              deliveryStatus: 'delivered'
            });
            
            // Refresh local state
            const updatedMessages = await db.getMessages(chatId);
            setMessages(updatedMessages);
            
            // Mark as delivered
            await messageService.markMessageAsDelivered(chatId, message.id, currentUserId);
          }
        }
      });
    });
    
    return () => unsubscribe();
  }, [chatId, currentUserId]);
  
  const sendMessage = async (content: string) => {
    const message = await messageService.sendTextMessage(chatId, content);
    
    // Optimistically add to UI
    setMessages(prev => [...prev, message]);
  };
  
  const sendImage = async (imageUrl: string) => {
    const message = await messageService.sendImageMessage(chatId, imageUrl);
    setMessages(prev => [...prev, message]);
  };
  
  return {
    messages,
    loading,
    sendMessage,
    sendImage
  };
};
```

**Responsibilities**:
- Load messages from SQLite
- Set up Firebase real-time listener
- Provide message sending functions
- Manage local state
- Handle optimistic updates

---

## TypeScript Types

### `types/message.ts`

```typescript
export type MessageType = 'text' | 'image' | 'system';

export type SyncStatus = 'pending' | 'synced' | 'failed';

export type DeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  content?: string;
  type: MessageType;
  imageUrl?: string;
  timestamp: number;
  syncStatus: SyncStatus;
  deliveryStatus: DeliveryStatus;
  readBy?: string[];
  deliveredTo?: string[];
}
```

### `types/chat.ts`

```typescript
export type ChatType = 'direct' | 'group';

export interface Chat {
  id: string;
  type: ChatType;
  name?: string; // For groups
  groupPicture?: string;
  participants: string[];
  admins?: string[]; // For groups
  lastMessage?: {
    content: string;
    timestamp: number;
    senderId: string;
  };
  createdAt: number;
  updatedAt: number;
}
```

### `types/user.ts`

```typescript
export interface User {
  uid: string;
  email: string;
  displayName: string;
  profilePicture?: string;
  online: boolean;
  lastSeen: number;
  fcmToken?: string;
  typing?: {
    chatId: string;
    isTyping: boolean;
    updatedAt: number;
  };
}
```

---

## Environment Variables

### `.env` file

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Note**: Add `.env` to `.gitignore`

---

## Firebase Security Rules

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Chats collection
    match /chats/{chatId} {
      allow read: if request.auth.uid in resource.data.participants;
      allow create: if request.auth.uid in request.resource.data.participants;
      allow update: if request.auth.uid in resource.data.participants;
      
      // Messages subcollection
      match /messages/{messageId} {
        allow read: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
        allow create: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants
                      && request.auth.uid == request.resource.data.senderId;
        allow update: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      }
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /chat-images/{chatId}/{imageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /profile-pictures/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

---

## Package.json Dependencies

```json
{
  "dependencies": {
    "expo": "~49.0.0",
    "expo-router": "^2.0.0",
    "expo-sqlite": "~11.3.0",
    "expo-notifications": "~0.20.0",
    "expo-image-picker": "~14.3.0",
    "@react-native-community/netinfo": "^9.4.1",
    "firebase": "^10.3.0",
    "react-native-uuid": "^2.0.1",
    "react": "18.2.0",
    "react-native": "0.72.4"
  }
}
```

---

## Development Workflow

### 1. Initial Setup
```bash
# Create Expo app with Router
npx create-expo-app@latest chat_iq -t expo-template-blank-typescript

# Install dependencies
cd chat_iq
npx expo install expo-router expo-sqlite expo-notifications expo-image-picker
npm install firebase react-native-uuid @react-native-community/netinfo

# Setup Firebase
# - Create project in Firebase Console
# - Enable Auth, Firestore, Storage, Cloud Messaging
# - Add web app config to .env
```

### 2. Database Initialization
- Create SQLite schema on first app launch
- Run migrations if needed (version-based)
- Test database CRUD operations

### 3. Firebase Setup
- Initialize in app root
- Configure Firestore indexes
- Deploy security rules
- Test authentication flow

### 4. Feature Development
- Build vertically (complete one-on-one first)
- Test each feature as built
- Use two devices for real-time testing
- Commit frequently

### 5. Testing Checklist
- Force quit test
- Offline send test
- Rapid-fire test
- Group chat test
- Notification test (foreground)
- Poor network test
- Background/foreground test

---

## Code Quality Guidelines

### TypeScript Usage
- Use TypeScript for all files
- Define interfaces for all data models
- Avoid `any` type (use proper types)
- Enable strict mode

### Error Handling
- Try-catch all async operations
- Show user-friendly error messages
- Log errors for debugging
- Never fail silently

### Performance
- Implement pagination (50 messages per load)
- Limit Firestore listeners
- Clean up listeners on unmount
- Use FlatList for message lists (virtualization)
- Debounce typing indicators

### Code Organization
- One component per file
- Separate business logic from UI
- Use custom hooks for reusable logic
- Keep components small and focused

---

## Next: Starter Code Generation

After reviewing this architecture, we'll generate:
1. Expo project initialization
2. Firebase configuration
3. SQLite database service
4. Authentication screens with Expo Router
5. Basic project structure

Ready to proceed with starter code?

