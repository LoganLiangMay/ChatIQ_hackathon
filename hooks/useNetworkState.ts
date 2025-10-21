/**
 * useNetworkState hook
 * Provides network connectivity state to React components
 */

import { useState, useEffect } from 'react';
import { networkMonitor } from '@/services/network/NetworkMonitor';

interface NetworkState {
  isOnline: boolean;
  isOffline: boolean;
}

export function useNetworkState(): NetworkState {
  const [isOnline, setIsOnline] = useState(networkMonitor.getIsOnline());
  
  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = networkMonitor.subscribe((online) => {
      setIsOnline(online);
    });
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);
  
  return {
    isOnline,
    isOffline: !isOnline
  };
}




