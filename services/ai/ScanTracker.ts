/**
 * ScanTracker Service
 * Tracks last scan timestamps for incremental AI processing
 * Prevents re-scanning the same messages multiple times
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/services/firebase/config';

export type ScanType = 'actionItems' | 'decisions';

interface ScanRecord {
  lastScannedTimestamp: number;
  lastScannedAt: number;
  messageCount: number;
}

export class ScanTracker {
  /**
   * Get last scan timestamp for a chat
   * Returns 0 if never scanned before
   */
  async getLastScanTimestamp(
    userId: string,
    chatId: string,
    scanType: ScanType
  ): Promise<number> {
    try {
      const firestore = await getFirebaseFirestore();
      const docRef = doc(firestore, 'users', userId, 'scanTracking', `${chatId}_${scanType}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as ScanRecord;
        return data.lastScannedTimestamp || 0;
      }

      return 0; // Never scanned before
    } catch (error) {
      console.error('Error getting last scan timestamp:', error);
      return 0; // Default to scanning everything
    }
  }

  /**
   * Update last scan timestamp for a chat
   */
  async updateLastScanTimestamp(
    userId: string,
    chatId: string,
    scanType: ScanType,
    lastMessageTimestamp: number,
    messageCount: number
  ): Promise<void> {
    try {
      const firestore = await getFirebaseFirestore();
      const docRef = doc(firestore, 'users', userId, 'scanTracking', `${chatId}_${scanType}`);

      await setDoc(docRef, {
        lastScannedTimestamp: lastMessageTimestamp,
        lastScannedAt: Date.now(),
        messageCount,
        scanType,
        chatId,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      console.log(`✅ Updated scan timestamp for ${chatId} (${scanType}): ${new Date(lastMessageTimestamp).toISOString()}`);
    } catch (error) {
      console.error('Error updating scan timestamp:', error);
      throw error;
    }
  }

  /**
   * Check if a chat needs scanning
   * Returns true if there are new messages since last scan
   */
  async needsScanning(
    userId: string,
    chatId: string,
    scanType: ScanType,
    latestMessageTimestamp: number
  ): Promise<boolean> {
    const lastScan = await this.getLastScanTimestamp(userId, chatId, scanType);
    return latestMessageTimestamp > lastScan;
  }

  /**
   * Reset scan tracking for a chat (force rescan)
   */
  async resetScanTracking(
    userId: string,
    chatId: string,
    scanType: ScanType
  ): Promise<void> {
    try {
      const firestore = await getFirebaseFirestore();
      const docRef = doc(firestore, 'users', userId, 'scanTracking', `${chatId}_${scanType}`);

      await setDoc(docRef, {
        lastScannedTimestamp: 0,
        lastScannedAt: 0,
        messageCount: 0,
        scanType,
        chatId,
        updatedAt: serverTimestamp(),
      });

      console.log(`🔄 Reset scan tracking for ${chatId} (${scanType})`);
    } catch (error) {
      console.error('Error resetting scan tracking:', error);
      throw error;
    }
  }
}

export const scanTracker = new ScanTracker();
