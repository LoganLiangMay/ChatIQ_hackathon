/**
 * MessageQueue Service
 * Handles offline message queuing and retry logic with exponential backoff
 * 
 * Key Responsibilities:
 * - Queue messages for sending
 * - Sequential processing (no concurrent SQLite writes)
 * - Retry failed messages with exponential backoff
 * - Retry on network reconnection
 * - Retry on app foreground
 */

import { db } from '../database/sqlite';
import { syncMessageToFirebase } from './MessageSync';
import { Message } from '@/types/message';

interface RetryState {
  messageId: string;
  attempt: number;
  timeout: NodeJS.Timeout;
}

class MessageQueue {
  private queue: Message[] = [];
  private processing: boolean = false;
  private retryStates: Map<string, RetryState> = new Map();
  private maxRetries: number = 5;
  
  /**
   * Add message to queue and process
   * Message should already be in SQLite before calling this
   */
  async addToQueue(message: Message): Promise<void> {
    console.log('📥 Adding message to queue:', message.id);
    
    // Add to queue
    this.queue.push(message);
    
    // Start processing if not already processing
    if (!this.processing) {
      this.processQueue();
    }
  }
  
  /**
   * Process the message queue sequentially
   * IMPORTANT: Sequential to avoid concurrent SQLite writes
   */
  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }
    
    this.processing = true;
    console.log('⚙️ Processing message queue...');
    
    while (this.queue.length > 0) {
      const message = this.queue.shift();
      
      if (!message) continue;
      
      try {
        await this.processMessage(message);
      } catch (error) {
        console.error('Failed to process message:', message.id, error);
        // Message already marked as failed in processMessage
      }
    }
    
    this.processing = false;
    console.log('✅ Queue processing complete');
  }
  
  /**
   * Process a single message
   */
  private async processMessage(message: Message): Promise<void> {
    try {
      // Attempt to sync to Firebase
      await syncMessageToFirebase(message);
      
      console.log('✅ Message synced successfully:', message.id);
      
      // Clear any existing retry timeout
      this.clearRetry(message.id);
      
    } catch (error) {
      console.error('❌ Message sync failed:', message.id, error);
      
      // Schedule retry with exponential backoff
      this.scheduleRetry(message.id, 0);
    }
  }
  
  /**
   * Schedule a retry with exponential backoff
   * Delays: 1s, 2s, 4s, 8s, 16s, max 30s
   */
  private scheduleRetry(messageId: string, attempt: number): void {
    // Check max retries
    if (attempt >= this.maxRetries) {
      console.log(`❌ Max retries reached for message: ${messageId}`);
      return;
    }
    
    // Calculate delay with exponential backoff
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    
    console.log(`⏳ Scheduling retry ${attempt + 1}/${this.maxRetries} for ${messageId} in ${delay}ms`);
    
    // Clear any existing retry for this message
    this.clearRetry(messageId);
    
    // Schedule the retry
    const timeout = setTimeout(async () => {
      await this.retryMessage(messageId, attempt + 1);
    }, delay);
    
    // Store retry state
    this.retryStates.set(messageId, {
      messageId,
      attempt: attempt + 1,
      timeout
    });
  }
  
  /**
   * Retry sending a specific message
   */
  private async retryMessage(messageId: string, attempt: number): Promise<void> {
    console.log(`🔄 Retrying message ${messageId} (attempt ${attempt})`);
    
    try {
      // Load message from SQLite
      const message = await db.getMessage(messageId);
      
      if (!message) {
        console.log('Message not found in SQLite:', messageId);
        this.clearRetry(messageId);
        return;
      }
      
      // Check if already synced
      if (message.syncStatus === 'synced') {
        console.log('Message already synced:', messageId);
        this.clearRetry(messageId);
        return;
      }
      
      // Attempt to sync
      await syncMessageToFirebase(message);
      
      console.log('✅ Retry successful:', messageId);
      this.clearRetry(messageId);
      
    } catch (error) {
      console.error(`❌ Retry failed for ${messageId}:`, error);
      
      // Schedule another retry if under max attempts
      if (attempt < this.maxRetries) {
        this.scheduleRetry(messageId, attempt);
      } else {
        console.log(`❌ Giving up on message after ${attempt} attempts:`, messageId);
        this.clearRetry(messageId);
      }
    }
  }
  
  /**
   * Retry all pending messages
   * Called when network is restored or app comes to foreground
   */
  async retryPendingMessages(): Promise<void> {
    console.log('🔄 Retrying all pending messages...');
    
    try {
      // Load all pending/failed messages from SQLite
      const pendingMessages = await db.getPendingMessages();
      
      if (pendingMessages.length === 0) {
        console.log('No pending messages to retry');
        return;
      }
      
      console.log(`Found ${pendingMessages.length} pending messages`);
      
      // Add all to queue for processing
      for (const message of pendingMessages) {
        // Clear any existing retry timeouts
        this.clearRetry(message.id);
        
        // Add to queue
        this.queue.push(message);
      }
      
      // Start processing
      if (!this.processing) {
        this.processQueue();
      }
      
    } catch (error) {
      console.error('Failed to retry pending messages:', error);
    }
  }
  
  /**
   * Clear retry timeout for a message
   */
  private clearRetry(messageId: string): void {
    const retryState = this.retryStates.get(messageId);
    
    if (retryState) {
      clearTimeout(retryState.timeout);
      this.retryStates.delete(messageId);
    }
  }
  
  /**
   * Clear all retry timeouts (for cleanup)
   */
  clearAllRetries(): void {
    console.log('Clearing all retry timeouts...');
    
    this.retryStates.forEach((state) => {
      clearTimeout(state.timeout);
    });
    
    this.retryStates.clear();
  }
  
  /**
   * Get queue status (for debugging)
   */
  getStatus(): { queueLength: number; processing: boolean; retryCount: number } {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      retryCount: this.retryStates.size
    };
  }
  
  /**
   * Cleanup - for app shutdown
   */
  cleanup(): void {
    this.clearAllRetries();
    this.queue = [];
    this.processing = false;
    console.log('MessageQueue cleaned up');
  }
}

// Singleton instance
export const messageQueue = new MessageQueue();




