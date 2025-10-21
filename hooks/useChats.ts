/**
 * useChats hook
 * Manages chat list state:
 * - Loads chats from SQLite
 * - Sets up Firebase real-time listener for updates
 * - Returns sorted chat list
 */

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDoc, doc as firestoreDoc } from 'firebase/firestore';
import { firestore } from '@/services/firebase/firestore';
import { db } from '@/services/database/sqlite';
import { Chat, ChatListItem } from '@/types/chat';

interface UseChatsReturn {
  chats: ChatListItem[];
  loading: boolean;
  refreshChats: () => Promise<void>;
}

export function useChats(userId: string): UseChatsReturn {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load chats from SQLite
  const loadChats = async () => {
    if (!userId) return;
    
    try {
      const localChats = await db.getChats(userId);
      
      // Enrich with additional data for direct chats
      const enrichedChats = await Promise.all(
        localChats.map(async (chat) => {
          const chatListItem: ChatListItem = {
            ...chat,
            unreadCount: 0 // TODO: Calculate unread count
          };
          
          // For direct chats, get other user's info
          if (chat.type === 'direct' && chat.participants.length === 2) {
            const otherUserId = chat.participants.find(id => id !== userId);
            if (otherUserId) {
              try {
                // Try to get from Firestore
                const userDoc = await getDoc(firestoreDoc(firestore, 'users', otherUserId));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  chatListItem.otherUser = {
                    uid: otherUserId,
                    displayName: userData.displayName || 'Unknown User',
                    profilePicture: userData.profilePicture,
                    online: userData.online || false
                  };
                }
              } catch (error) {
                console.log('Could not fetch other user info:', otherUserId);
              }
            }
          }
          
          return chatListItem;
        })
      );
      
      setChats(enrichedChats);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load chats:', error);
      setLoading(false);
    }
  };
  
  // Initial load
  useEffect(() => {
    loadChats();
  }, [userId]);
  
  // Set up Firebase listener for chat updates
  useEffect(() => {
    if (!userId) return;
    
    const chatsRef = collection(firestore, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const chatData = change.doc.data();
        const chatId = change.doc.id;
        
        if (change.type === 'added' || change.type === 'modified') {
          const chat: Chat = {
            id: chatId,
            type: chatData.type,
            name: chatData.name,
            groupPicture: chatData.groupPicture,
            participants: chatData.participants,
            admins: chatData.admins,
            lastMessage: chatData.lastMessage ? {
              content: chatData.lastMessage.content,
              timestamp: chatData.lastMessage.timestamp?.toMillis?.() || Date.now(),
              senderId: chatData.lastMessage.senderId,
              senderName: chatData.lastMessage.senderName
            } : undefined,
            createdAt: chatData.createdAt?.toMillis?.() || Date.now(),
            updatedAt: chatData.updatedAt?.toMillis?.() || Date.now()
          };
          
          // Save to SQLite
          await db.insertChat(chat);
          
          // Reload chats to refresh UI
          await loadChats();
        }
        
        if (change.type === 'removed') {
          await db.deleteChat(chatId);
          await loadChats();
        }
      });
    }, (error) => {
      console.error('Firestore chats listener error:', error);
    });
    
    return () => {
      console.log('Cleaning up chats listener');
      unsubscribe();
    };
  }, [userId]);
  
  return {
    chats,
    loading,
    refreshChats: loadChats
  };
}




