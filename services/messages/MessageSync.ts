/**
 * MessageSync - Handles syncing messages to Firebase
 * Core responsibility: Take a local message and sync it to Firestore
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore, updateChatLastMessage } from '../firebase/firestore';
import { Message } from '@/types/message';
import { db } from '../database/sqlite';

/**
 * Sync a message to Firebase
 * This is called by the MessageQueue for each pending message
 */
export async function syncMessageToFirebase(message: Message): Promise<void> {
  try {
    // 1. Write message to Firestore
    const messageRef = doc(firestore, `chats/${message.chatId}/messages`, message.id);
    
    await setDoc(messageRef, {
      senderId: message.senderId,
      senderName: message.senderName,
      content: message.content || '',
      type: message.type,
      imageUrl: message.imageUrl || '',
      timestamp: serverTimestamp(),
      readBy: [message.senderId],
      deliveredTo: [message.senderId]
    });
    
    console.log('✅ Message synced to Firebase:', message.id);
    
    // 2. Update chat's lastMessage
    await updateChatLastMessage(
      message.chatId,
      message.content || (message.type === 'image' ? '📷 Image' : ''),
      message.senderId,
      message.senderName
    );
    
    // 3. Update SQLite status to synced
    await db.updateMessageStatus(message.id, 'synced', 'sent');
    
  } catch (error) {
    console.error('❌ Firebase sync failed for message:', message.id, error);
    
    // Mark as failed in SQLite
    await db.updateMessageStatus(message.id, 'failed', 'failed');
    
    throw error; // Let MessageQueue handle retry logic
  }
}

/**
 * Batch sync multiple messages (for optimization)
 */
export async function batchSyncMessages(messages: Message[]): Promise<void> {
  // For now, sync sequentially
  // TODO: Implement actual batch writes for performance
  for (const message of messages) {
    try {
      await syncMessageToFirebase(message);
    } catch (error) {
      console.error('Failed to sync message in batch:', message.id);
      // Continue with other messages
    }
  }
}




