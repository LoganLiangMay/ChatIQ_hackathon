/**
 * Development Helper Utilities
 * Functions to help with testing and development
 * 
 * WARNING: These are for development only!
 * Do not use in production code.
 */

import { v4 as uuidv4 } from 'uuid';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/services/firebase/firestore';
import { db } from '@/services/database/sqlite';

/**
 * Create a test direct chat between current user and another user
 * This is useful for testing the messaging functionality
 */
export async function createTestDirectChat(otherUserId: string, otherUserName: string): Promise<string> {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('Not authenticated');
  }
  
  const chatId = uuidv4();
  
  // Create chat in Firestore
  await setDoc(doc(firestore, 'chats', chatId), {
    type: 'direct',
    participants: [currentUser.uid, otherUserId],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: null
  });
  
  // Create chat in SQLite
  await db.insertChat({
    id: chatId,
    type: 'direct',
    participants: [currentUser.uid, otherUserId],
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  
  console.log('✅ Test chat created:', chatId);
  return chatId;
}

/**
 * Create a test user in Firestore (for testing)
 */
export async function createTestUser(userId: string, displayName: string, email: string) {
  await setDoc(doc(firestore, 'users', userId), {
    uid: userId,
    email,
    displayName,
    online: false,
    lastSeen: serverTimestamp(),
    createdAt: serverTimestamp()
  });
  
  console.log('✅ Test user created:', userId, displayName);
}

/**
 * Quick function to log current user info
 */
export function logCurrentUser() {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (user) {
    console.log('📱 Current User:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });
  } else {
    console.log('❌ No user logged in');
  }
}

/**
 * Example usage in your app:
 * 
 * 1. Import in your screen:
 *    import { createTestDirectChat, logCurrentUser } from '@/utils/devHelpers';
 * 
 * 2. Call from a test button:
 *    await createTestDirectChat('test-user-2', 'Test User 2');
 * 
 * 3. This creates a chat that will appear in your chat list
 */




