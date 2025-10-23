/**
 * Action Items Service
 * Manages action items in Firestore for persistence across app
 */

import { collection, doc, setDoc, updateDoc, deleteDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/services/firebase/config';
import type { ActionItem } from './types';

export class ActionItemsService {
  /**
   * Save action items to Firestore
   */
  async saveActionItems(
    userId: string,
    chatId: string,
    items: ActionItem[]
  ): Promise<void> {
    try {
      const firestore = await getFirebaseFirestore();
      const batch = [];

      for (const item of items) {
        const docRef = doc(firestore, 'actionItems', item.id);
        batch.push(
          setDoc(docRef, {
            ...item,
            userId,
            chatId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        );
      }

      await Promise.all(batch);
      console.log('✅ Saved', items.length, 'action items to Firestore');
    } catch (error) {
      console.error('Error saving action items:', error);
      throw error;
    }
  }

  /**
   * Get all action items for a user
   */
  async getUserActionItems(userId: string): Promise<ActionItem[]> {
    try {
      const firestore = await getFirebaseFirestore();
      const q = query(
        collection(firestore, 'actionItems'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      const items: ActionItem[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          task: data.task,
          owner: data.owner,
          deadline: data.deadline,
          status: data.status,
          extractedFrom: data.extractedFrom,
        });
      });

      return items;
    } catch (error) {
      console.error('Error getting action items:', error);
      return [];
    }
  }

  /**
   * Get action items for a specific chat
   */
  async getChatActionItems(userId: string, chatId: string): Promise<ActionItem[]> {
    try {
      const firestore = await getFirebaseFirestore();
      const q = query(
        collection(firestore, 'actionItems'),
        where('userId', '==', userId),
        where('chatId', '==', chatId)
      );

      const snapshot = await getDocs(q);
      const items: ActionItem[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          task: data.task,
          owner: data.owner,
          deadline: data.deadline,
          status: data.status,
          extractedFrom: data.extractedFrom,
        });
      });

      return items;
    } catch (error) {
      console.error('Error getting chat action items:', error);
      return [];
    }
  }

  /**
   * Update action item status
   * When marking as completed, optionally remove priority from the source message
   */
  async updateActionItemStatus(
    itemId: string,
    status: 'pending' | 'completed',
    chatId?: string,
    messageId?: string
  ): Promise<void> {
    try {
      const firestore = await getFirebaseFirestore();
      
      // Update action item
      const itemRef = doc(firestore, 'actionItems', itemId);
      await updateDoc(itemRef, {
        status,
        updatedAt: serverTimestamp(),
      });

      // If completed and we have message info, remove priority from the message
      if (status === 'completed' && chatId && messageId) {
        try {
          const messageRef = doc(firestore, 'chats', chatId, 'messages', messageId);
          await updateDoc(messageRef, {
            priority: null,
          });
          console.log('✅ Removed priority from message:', messageId);

          // Also update chat's lastMessage if this was the last message
          const chatRef = doc(firestore, 'chats', chatId);
          const { getDoc } = await import('firebase/firestore');
          const chatDoc = await getDoc(chatRef);
          
          if (chatDoc.exists()) {
            const chatData = chatDoc.data();
            // Check if the completed action's message was an urgent/critical priority message
            if (chatData.lastMessage?.priority && chatData.lastMessage.priority.isPriority) {
              // Only remove if this specific message was the source
              const messageRef = doc(firestore, 'chats', chatId, 'messages', messageId);
              const messageDoc = await getDoc(messageRef);
              
              if (messageDoc.exists() && !messageDoc.data().priority) {
                // Message priority was removed, update chat too
                await updateDoc(chatRef, {
                  'lastMessage.priority': null,
                });
                console.log('✅ Removed priority from chat lastMessage');
              }
            }
          }
        } catch (err) {
          console.warn('Could not remove priority from message:', err);
        }
      }

      console.log('✅ Updated action item status:', itemId, '→', status);
    } catch (error) {
      console.error('Error updating action item:', error);
      throw error;
    }
  }

  /**
   * Delete action item
   */
  async deleteActionItem(itemId: string): Promise<void> {
    try {
      const firestore = await getFirebaseFirestore();
      await deleteDoc(doc(firestore, 'actionItems', itemId));
      console.log('✅ Deleted action item:', itemId);
    } catch (error) {
      console.error('Error deleting action item:', error);
      throw error;
    }
  }

  /**
   * Delete all action items for a chat
   */
  async deleteChatActionItems(userId: string, chatId: string): Promise<void> {
    try {
      const items = await this.getChatActionItems(userId, chatId);
      await Promise.all(items.map(item => this.deleteActionItem(item.id)));
      console.log('✅ Deleted all action items for chat:', chatId);
    } catch (error) {
      console.error('Error deleting chat action items:', error);
      throw error;
    }
  }
}

export const actionItemsService = new ActionItemsService();

