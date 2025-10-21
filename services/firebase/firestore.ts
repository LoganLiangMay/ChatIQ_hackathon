/**
 * Firestore operations for chats and messages
 */

import { getFirestore, doc, setDoc, updateDoc, serverTimestamp, arrayUnion, collection } from 'firebase/firestore';
import { app } from './config';

const firestore = getFirestore(app);

/**
 * Create or update a chat document
 */
export async function createOrUpdateChat(chatId: string, data: any) {
  const chatRef = doc(firestore, 'chats', chatId);
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
  const chatRef = doc(firestore, 'chats', chatId);
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
  const messageRef = doc(firestore, `chats/${chatId}/messages`, messageId);
  await updateDoc(messageRef, {
    deliveredTo: arrayUnion(userId)
  });
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(chatId: string, messageId: string, userId: string) {
  const messageRef = doc(firestore, `chats/${chatId}/messages`, messageId);
  await updateDoc(messageRef, {
    readBy: arrayUnion(userId)
  });
}

/**
 * Update user online status
 */
export async function updateOnlineStatus(userId: string, online: boolean) {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    online,
    lastSeen: serverTimestamp()
  });
}

export { firestore, doc, setDoc, updateDoc, serverTimestamp, arrayUnion, collection };




