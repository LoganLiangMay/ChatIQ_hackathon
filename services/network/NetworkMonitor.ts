/**
 * NetworkMonitor Service
 * Monitors network connectivity and triggers actions on state changes
 * 
 * Key Responsibilities:
 * - Detect online/offline state
 * - Notify listeners when network state changes
 * - Trigger message retry when connection restored
 * - Update user online status in Firestore
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { getAuth } from 'firebase/auth';
import { updateOnlineStatus } from '../firebase/firestore';

type NetworkStateListener = (isOnline: boolean) => void;

// Import messageQueue (will be initialized after this module)
let messageQueue: any = null;

// Lazy load messageQueue to avoid circular dependency
const getMessageQueue = () => {
  if (!messageQueue) {
    messageQueue = require('../messages/MessageQueue').messageQueue;
  }
  return messageQueue;
};

class NetworkMonitor {
  private isOnline: boolean = true;
  private listeners: NetworkStateListener[] = [];
  private unsubscribeNetInfo: (() => void) | null = null;
  private initialized: boolean = false;
  
  /**
   * Initialize the network monitor
   * Sets up NetInfo listener
   */
  init() {
    if (this.initialized) {
      console.log('NetworkMonitor already initialized');
      return;
    }
    
    console.log('🌐 Initializing NetworkMonitor...');
    
    // Subscribe to network state changes
    this.unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
      this.handleNetworkChange(state);
    });
    
    // Get initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      this.isOnline = state.isConnected ?? false;
      console.log(`🌐 Initial network state: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`);
    });
    
    this.initialized = true;
  }
  
  /**
   * Handle network state changes
   */
  private handleNetworkChange(state: NetInfoState) {
    const wasOnline = this.isOnline;
    const isNowOnline = state.isConnected ?? false;
    
    // Only process if state actually changed
    if (wasOnline === isNowOnline) {
      return;
    }
    
    this.isOnline = isNowOnline;
    
    if (isNowOnline && !wasOnline) {
      // Connection restored
      console.log('🟢 Network ONLINE - Connection restored');
      this.onConnectionRestored();
    } else if (!isNowOnline && wasOnline) {
      // Connection lost
      console.log('🔴 Network OFFLINE - Connection lost');
      this.onConnectionLost();
    }
    
    // Notify all listeners
    this.notifyListeners(isNowOnline);
  }
  
  /**
   * Called when connection is restored
   */
  private onConnectionRestored() {
    // Update user online status in Firestore
    const auth = getAuth();
    if (auth.currentUser) {
      updateOnlineStatus(auth.currentUser.uid, true).catch((error) => {
        console.error('Failed to update online status:', error);
      });
    }
    
    // Trigger MessageQueue to retry pending messages
    try {
      const queue = getMessageQueue();
      queue.retryPendingMessages();
      console.log('🔄 Triggered pending message retry on reconnection');
    } catch (error) {
      console.error('Failed to trigger message retry:', error);
    }
  }
  
  /**
   * Called when connection is lost
   */
  private onConnectionLost() {
    // Update user offline status in Firestore (may fail if truly offline)
    const auth = getAuth();
    if (auth.currentUser) {
      updateOnlineStatus(auth.currentUser.uid, false).catch(() => {
        // Expected to fail when offline, that's okay
        console.log('Could not update offline status (expected when offline)');
      });
    }
  }
  
  /**
   * Subscribe to network state changes
   * Returns unsubscribe function
   */
  subscribe(listener: NetworkStateListener): () => void {
    this.listeners.push(listener);
    
    // Immediately call with current state
    listener(this.isOnline);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Notify all listeners of network state change
   */
  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach(listener => {
      try {
        listener(isOnline);
      } catch (error) {
        console.error('NetworkMonitor listener error:', error);
      }
    });
  }
  
  /**
   * Get current online status
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }
  
  /**
   * Cleanup - remove listeners
   */
  cleanup() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
    this.listeners = [];
    this.initialized = false;
    console.log('🌐 NetworkMonitor cleaned up');
  }
  
  /**
   * Force check network state (useful for testing)
   */
  async checkNetworkState(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
    return this.isOnline;
  }
}

// Singleton instance
export const networkMonitor = new NetworkMonitor();

