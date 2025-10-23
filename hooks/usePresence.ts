/**
 * usePresence hook
 * Tracks a user's online status and last seen timestamp
 */

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/services/firebase/config';

interface PresenceData {
  online: boolean;
  lastSeen: number;
  loading: boolean;
}

export function usePresence(userId: string | undefined): PresenceData {
  const [online, setOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    let unsubscribe: (() => void) | undefined;
    
    const setupListener = async () => {
      try {
        console.log('🔵 [usePresence] Setting up listener for user:', userId);
        const firestore = await getFirebaseFirestore();
        console.log('✅ [usePresence] Firestore instance obtained');
        
        const userRef = doc(firestore, 'users', userId);
        
        unsubscribe = onSnapshot(
          userRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              setOnline(data.online || false);
              
              // Handle Firestore Timestamp
              const lastSeenValue = data.lastSeen;
              if (lastSeenValue?.toMillis) {
                setLastSeen(lastSeenValue.toMillis());
              } else if (typeof lastSeenValue === 'number') {
                setLastSeen(lastSeenValue);
              } else {
                setLastSeen(0);
              }
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error listening to user presence:', error);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error setting up presence listener:', error);
        setLoading(false);
      }
    };
    
    setupListener();
    
    return () => {
      console.log('Cleaning up presence listener');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId]);
  
  return { online, lastSeen, loading };
}




