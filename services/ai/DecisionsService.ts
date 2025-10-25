/**
 * Decisions Service
 * Manages decision tracking in Firestore for persistence across app
 */

import { collection, doc, setDoc, updateDoc, deleteDoc, query, where, getDocs, serverTimestamp, orderBy } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/services/firebase/config';
import type { Decision } from './types';

interface DecisionWithChat extends Decision {
  chatId: string;
}

export class DecisionsService {
  /**
   * Save decisions to Firestore
   */
  async saveDecisions(
    userId: string,
    chatId: string,
    decisions: Decision[]
  ): Promise<void> {
    try {
      const firestore = await getFirebaseFirestore();
      const batch = [];

      for (const decision of decisions) {
        const docRef = doc(firestore, 'decisions', decision.id);
        batch.push(
          setDoc(docRef, {
            ...decision,
            userId,
            chatId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        );
      }

      await Promise.all(batch);
      console.log('✅ Saved', decisions.length, 'decisions to Firestore');
    } catch (error) {
      console.error('Error saving decisions:', error);
      throw error;
    }
  }

  /**
   * Get all decisions for a user
   */
  async getUserDecisions(userId: string): Promise<DecisionWithChat[]> {
    try {
      const firestore = await getFirebaseFirestore();
      const q = query(
        collection(firestore, 'decisions'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const decisions: DecisionWithChat[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        decisions.push({
          id: doc.id,
          decision: data.decision,
          context: data.context,
          participants: data.participants || [],
          timestamp: data.timestamp,
          extractedFrom: data.extractedFrom,
          chatId: data.chatId,
        });
      });

      return decisions;
    } catch (error) {
      console.error('Error getting decisions:', error);
      return [];
    }
  }

  /**
   * Get decisions for a specific chat
   */
  async getChatDecisions(userId: string, chatId: string): Promise<Decision[]> {
    try {
      const firestore = await getFirebaseFirestore();
      const q = query(
        collection(firestore, 'decisions'),
        where('userId', '==', userId),
        where('chatId', '==', chatId),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const decisions: Decision[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        decisions.push({
          id: doc.id,
          decision: data.decision,
          context: data.context,
          participants: data.participants || [],
          timestamp: data.timestamp,
          extractedFrom: data.extractedFrom,
        });
      });

      return decisions;
    } catch (error) {
      console.error('Error getting chat decisions:', error);
      return [];
    }
  }

  /**
   * Delete decision
   */
  async deleteDecision(decisionId: string): Promise<void> {
    try {
      const firestore = await getFirebaseFirestore();
      await deleteDoc(doc(firestore, 'decisions', decisionId));
      console.log('✅ Deleted decision:', decisionId);
    } catch (error) {
      console.error('Error deleting decision:', error);
      throw error;
    }
  }

  /**
   * Delete all decisions for a chat
   */
  async deleteChatDecisions(userId: string, chatId: string): Promise<void> {
    try {
      const decisions = await this.getChatDecisions(userId, chatId);
      await Promise.all(decisions.map(decision => this.deleteDecision(decision.id)));
      console.log('✅ Deleted all decisions for chat:', chatId);
    } catch (error) {
      console.error('Error deleting chat decisions:', error);
      throw error;
    }
  }

  /**
   * Search decisions by keyword
   */
  async searchDecisions(userId: string, keyword: string): Promise<DecisionWithChat[]> {
    try {
      // Get all user decisions first (Firestore doesn't support full-text search)
      const allDecisions = await this.getUserDecisions(userId);
      
      // Filter locally by keyword
      const lowerKeyword = keyword.toLowerCase();
      return allDecisions.filter(decision =>
        decision.decision.toLowerCase().includes(lowerKeyword) ||
        decision.context?.toLowerCase().includes(lowerKeyword)
      );
    } catch (error) {
      console.error('Error searching decisions:', error);
      return [];
    }
  }
}

export const decisionsService = new DecisionsService();

