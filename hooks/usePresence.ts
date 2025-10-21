/**
 * usePresence hook
 * Tracks a user's online status and last seen timestamp
 */

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/services/firebase/firestore';

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
    
    const userRef = doc(firestore, 'users', userId);
    
    const unsubscribe = onSnapshot(
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
    
    return () => {
      unsubscribe();
    };
  }, [userId]);
  
  return { online, lastSeen, loading };
}




