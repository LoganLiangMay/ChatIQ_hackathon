/**
 * useChats hook
 * Manages chat list state:
 * - Loads chats from SQLite
 * - Sets up Firebase real-time listener for updates
 * - Returns sorted chat list
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDoc, doc as firestoreDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/services/firebase/config';
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
  
  // Load chats from SQLite (or Firestore if SQLite is empty)
  const loadChats = useCallback(async () => {
    if (!userId) return;
    
    try {
      let localChats = await db.getChats(userId);
      
      // If SQLite is empty (Expo Go), fetch from Firestore
      if (localChats.length === 0) {
        console.log('📱 SQLite empty, fetching chats from Firestore for user:', userId);
        try {
          const firestore = await getFirebaseFirestore();
          const chatsRef = collection(firestore, 'chats');
          const q = query(
            chatsRef,
            where('participants', 'array-contains', userId),
            orderBy('updatedAt', 'desc')
          );
          
          const { getDocs } = await import('firebase/firestore');
          const snapshot = await getDocs(q);
          
          localChats = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              type: data.type,
              name: data.name,
              groupPicture: data.groupPicture,
              participants: data.participants,
              participantDetails: data.participantDetails,
              admins: data.admins,
              lastMessage: data.lastMessage ? {
                content: data.lastMessage.content,
                timestamp: data.lastMessage.timestamp?.toMillis?.() || Date.now(),
                senderId: data.lastMessage.senderId,
                senderName: data.lastMessage.senderName,
                priority: data.lastMessage.priority // 🤖 AI: Include priority data
              } : undefined,
              createdAt: data.createdAt?.toMillis?.() || Date.now(),
              updatedAt: data.updatedAt?.toMillis?.() || Date.now()
            } as Chat;
          });
          
          console.log('✅ Loaded', localChats.length, 'chats from Firestore');
        } catch (error) {
          console.error('Failed to fetch chats from Firestore:', error);
        }
      }
      
      // Enrich with additional data for direct chats
      const enrichedChats = await Promise.all(
        localChats.map(async (chat) => {
          const chatListItem: ChatListItem = {
            ...chat,
            unreadCount: 0 // TODO: Calculate unread count
          };
          
          // For direct chats, get other user's display name from participantDetails
          if (chat.type === 'direct' && chat.participants.length === 2) {
            const otherUserId = chat.participants.find(id => id !== userId);
            if (otherUserId) {
              // First try participantDetails (already in chat document)
              if (chat.participantDetails && chat.participantDetails[otherUserId]) {
                chatListItem.otherUser = {
                  uid: otherUserId,
                  displayName: chat.participantDetails[otherUserId].displayName,
                  profilePicture: chat.participantDetails[otherUserId].profilePicture || undefined,
                  online: false // Will be updated by real-time listener if needed
                };
              } else {
                // Fallback: fetch from users collection
                try {
                  const firestore = await getFirebaseFirestore();
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
  }, [userId]);
  
  // Initial load
  useEffect(() => {
    loadChats();
  }, [loadChats]);
  
  // Set up Firebase listener for chat updates
  useEffect(() => {
    if (!userId) return;
    
    let unsubscribe: (() => void) | undefined;
    
    const setupListener = async () => {
      try {
        console.log('🔵 [useChats] Setting up Firestore listener for user:', userId);
        const firestore = await getFirebaseFirestore();
        console.log('✅ [useChats] Firestore instance obtained');
        
        const chatsRef = collection(firestore, 'chats');
        const q = query(
          chatsRef,
          where('participants', 'array-contains', userId),
          orderBy('updatedAt', 'desc')
        );
        
        unsubscribe = onSnapshot(q, async (snapshot) => {
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
                participantDetails: chatData.participantDetails,
                admins: chatData.admins,
                lastMessage: chatData.lastMessage ? {
                  content: chatData.lastMessage.content,
                  timestamp: chatData.lastMessage.timestamp?.toMillis?.() || Date.now(),
                  senderId: chatData.lastMessage.senderId,
                  senderName: chatData.lastMessage.senderName,
                  priority: chatData.lastMessage.priority // 🤖 AI: Include priority data
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
      } catch (error) {
        console.error('Error setting up Firestore listener in useChats:', error);
      }
    };
    
    setupListener();
    
    return () => {
      console.log('Cleaning up chats listener');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId, loadChats]);
  
  return {
    chats,
    loading,
    refreshChats: loadChats
  };
}




