/**
 * useTyping hook
 * Manages typing indicators for a chat
 * - Broadcasts when current user is typing
 * - Listens for when other users are typing
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/services/firebase/firestore';

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

interface UseTypingReturn {
  typingUsers: string[]; // Array of user names who are typing
  setIsTyping: (typing: boolean) => void;
  startTyping: () => void;
  stopTyping: () => void;
}

const TYPING_TIMEOUT = 3000; // 3 seconds

export function useTyping(chatId: string, currentUserId: string, currentUserName: string): UseTypingReturn {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingUpdateRef = useRef<number>(0);
  
  // Listen to typing status from Firestore
  useEffect(() => {
    if (!chatId) return;
    
    const chatRef = doc(firestore, 'chats', chatId);
    
    const unsubscribe = onSnapshot(
      chatRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const typingData = data.typing || {};
          
          const now = Date.now();
          const activeTypers: string[] = [];
          
          // Filter out stale typing indicators and current user
          Object.entries(typingData).forEach(([userId, userData]: [string, any]) => {
            if (userId === currentUserId) return; // Don't show own typing
            
            const timestamp = userData.timestamp?.toMillis?.() || userData.timestamp || 0;
            const isRecent = (now - timestamp) < TYPING_TIMEOUT;
            
            if (isRecent) {
              activeTypers.push(userData.userName || 'Someone');
            }
          });
          
          setTypingUsers(activeTypers);
        }
      },
      (error) => {
        console.error('Error listening to typing status:', error);
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [chatId, currentUserId]);
  
  // Broadcast typing status to Firestore
  const updateTypingStatus = useCallback(async (isTyping: boolean) => {
    if (!chatId || !currentUserId) return;
    
    try {
      const chatRef = doc(firestore, 'chats', chatId);
      
      if (isTyping) {
        // Set typing status
        await updateDoc(chatRef, {
          [`typing.${currentUserId}`]: {
            userId: currentUserId,
            userName: currentUserName,
            timestamp: serverTimestamp(),
          },
        });
      } else {
        // Remove typing status
        await updateDoc(chatRef, {
          [`typing.${currentUserId}`]: null,
        });
      }
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }, [chatId, currentUserId, currentUserName]);
  
  // Start typing (called when user starts typing)
  const startTyping = useCallback(() => {
    const now = Date.now();
    
    // Throttle typing updates (max once per second)
    if (now - lastTypingUpdateRef.current < 1000) {
      return;
    }
    
    lastTypingUpdateRef.current = now;
    updateTypingStatus(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Auto-stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, TYPING_TIMEOUT);
  }, [updateTypingStatus]);
  
  // Stop typing (called when user sends message or clears input)
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    updateTypingStatus(false);
  }, [updateTypingStatus]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Clear typing status when component unmounts
      updateTypingStatus(false);
    };
  }, [updateTypingStatus]);
  
  return {
    typingUsers,
    setIsTyping: (typing: boolean) => typing ? startTyping() : stopTyping(),
    startTyping,
    stopTyping,
  };
}




