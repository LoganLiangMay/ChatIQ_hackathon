/**
 * Firestore operations for chats and messages
 */

import { doc, setDoc, updateDoc, serverTimestamp, arrayUnion, collection } from 'firebase/firestore';
import { getFirebaseFirestore } from './config';

// Lazy getter for firestore instance to avoid module load initialization
const getFirestore = () => getFirebaseFirestore();

/**
 * Create or update a chat document
 */
export async function createOrUpdateChat(chatId: string, data: any) {
  const chatRef = doc(getFirestore(), 'chats', chatId);
  await setDoc(chatRef, {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

/**
 * Update chat's last message
 */
export async function updateChatLastMessage(
  chatId: string, 
  content: string, 
  senderId: string,
  senderName: string
) {
  const chatRef = doc(getFirestore(), 'chats', chatId);
  await updateDoc(chatRef, {
    lastMessage: {
      content,
      senderId,
      senderName,
      timestamp: serverTimestamp()
    },
    updatedAt: serverTimestamp()
  });
}

/**
 * Mark message as delivered
 */
export async function markMessageAsDelivered(chatId: string, messageId: string, userId: string) {
  const messageRef = doc(getFirestore(), `chats/${chatId}/messages`, messageId);
  await updateDoc(messageRef, {
    deliveredTo: arrayUnion(userId)
  });
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(chatId: string, messageId: string, userId: string) {
  const messageRef = doc(getFirestore(), `chats/${chatId}/messages`, messageId);
  await updateDoc(messageRef, {
    readBy: arrayUnion(userId)
  });
}

/**
 * Update user online status
 */
export async function updateOnlineStatus(userId: string, online: boolean) {
  const userRef = doc(getFirestore(), 'users', userId);
  await updateDoc(userRef, {
    online,
    lastSeen: serverTimestamp()
  });
}

// Note: Firestore instance accessed lazily via getFirestore()
// Other Firebase functions should be imported directly from 'firebase/firestore'
