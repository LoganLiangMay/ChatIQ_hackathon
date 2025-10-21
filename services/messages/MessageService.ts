/**
 * MessageService - Main service for message operations
 * Handles sending text messages, image messages, and coordinating between SQLite and Firebase
 */

import { v4 as uuidv4 } from 'uuid';
import { getAuth } from 'firebase/auth';
import { db } from '../database/sqlite';
import { messageQueue } from './MessageQueue';
import { Message } from '@/types/message';

class MessageService {
  /**
   * Send a text message
   * 1. Save to SQLite immediately (critical for persistence)
   * 2. Attempt Firebase sync
   * 3. Return message for optimistic UI update
   */
  async sendTextMessage(chatId: string, content: string): Promise<Message> {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Create message object
    const message: Message = {
      id: uuidv4(),
      chatId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'Unknown',
      content,
      type: 'text',
      timestamp: Date.now(),
      syncStatus: 'pending',
      deliveryStatus: 'sending',
      readBy: [currentUser.uid],
      deliveredTo: [currentUser.uid]
    };
    
    try {
      // CRITICAL: Write to SQLite FIRST (ensures persistence)
      await db.insertMessage(message);
      console.log('✅ Message saved to SQLite:', message.id);
      
      // Add to MessageQueue for Firebase sync (handles retry automatically)
      await messageQueue.addToQueue(message);
      console.log('📤 Message added to sync queue:', message.id);
      
      return message;
      
    } catch (error) {
      console.error('❌ CRITICAL: Failed to save message to SQLite:', error);
      throw error; // This is critical - must notify user
    }
  }
  
  /**
   * Send an image message
   * (Implementation for PR #8, placeholder for now)
   */
  async sendImageMessage(chatId: string, imageUrl: string): Promise<Message> {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    const message: Message = {
      id: uuidv4(),
      chatId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'Unknown',
      content: '',
      type: 'image',
      imageUrl,
      timestamp: Date.now(),
      syncStatus: 'pending',
      deliveryStatus: 'sending',
      readBy: [currentUser.uid],
      deliveredTo: [currentUser.uid]
    };
    
    try {
      await db.insertMessage(message);
      
      // Add to MessageQueue for Firebase sync
      await messageQueue.addToQueue(message);
      
      return message;
      
    } catch (error) {
      console.error('Failed to save image message:', error);
      throw error;
    }
  }
  
  /**
   * Load messages for a chat from SQLite
   */
  async loadMessages(chatId: string, limit: number = 50): Promise<Message[]> {
    try {
      const messages = await db.getMessages(chatId, limit);
      return messages;
    } catch (error) {
      console.error('Failed to load messages from SQLite:', error);
      return [];
    }
  }
  
  /**
   * Mark a message as delivered
   * 1. Update SQLite immediately (for offline support)
   * 2. Update Firestore (with error handling)
   */
  async markAsDelivered(chatId: string, messageId: string, userId: string): Promise<void> {
    try {
      // Update SQLite first (critical for persistence)
      await db.markMessageAsDelivered(messageId, userId);
      console.log('✅ Message marked as delivered in SQLite:', messageId);
      
      // Update Firestore (non-blocking)
      const { markMessageAsDelivered: firestoreMarkDelivered } = await import('../firebase/firestore');
      firestoreMarkDelivered(chatId, messageId, userId).catch((error) => {
        console.error('Failed to mark as delivered in Firestore:', error);
        // Don't throw - SQLite update succeeded, which is most important
      });
    } catch (error) {
      console.error('Failed to mark message as delivered:', error);
      throw error;
    }
  }
  
  /**
   * Mark a message as read
   * 1. Update SQLite immediately (for offline support)
   * 2. Update Firestore (with error handling)
   */
  async markAsRead(chatId: string, messageId: string, userId: string): Promise<void> {
    try {
      // Update SQLite first (critical for persistence)
      await db.markMessageAsRead(messageId, userId);
      console.log('✅ Message marked as read in SQLite:', messageId);
      
      // Update Firestore (non-blocking)
      const { markMessageAsRead: firestoreMarkRead } = await import('../firebase/firestore');
      firestoreMarkRead(chatId, messageId, userId).catch((error) => {
        console.error('Failed to mark as read in Firestore:', error);
        // Don't throw - SQLite update succeeded, which is most important
      });
    } catch (error) {
      console.error('Failed to mark message as read:', error);
      throw error;
    }
  }
  
  /**
   * Mark all unread messages in a chat as read (batch operation)
   * Used when user opens/views a chat
   */
  async markAllMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      // Update SQLite first (returns list of updated message IDs)
      const updatedMessageIds = await db.markAllMessagesAsRead(chatId, userId);
      
      if (updatedMessageIds.length === 0) {
        console.log('No unread messages to mark as read in chat:', chatId);
        return;
      }
      
      console.log(`✅ Marked ${updatedMessageIds.length} messages as read in SQLite`);
      
      // Update Firestore for each message (non-blocking)
      const { markMessageAsRead: firestoreMarkRead } = await import('../firebase/firestore');
      Promise.all(
        updatedMessageIds.map(messageId => 
          firestoreMarkRead(chatId, messageId, userId)
        )
      ).catch((error) => {
        console.error('Failed to mark messages as read in Firestore:', error);
        // Don't throw - SQLite updates succeeded, which is most important
      });
    } catch (error) {
      console.error('Failed to mark all messages as read:', error);
      throw error;
    }
  }
}

export const messageService = new MessageService();

