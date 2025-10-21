/**
 * useMessages hook
 * Manages message state for a chat:
 * - Loads messages from SQLite on mount
 * - Sets up Firebase real-time listener
 * - Provides sendMessage function
 * - Handles optimistic UI updates
 */

import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { AppState } from 'react-native';
import { firestore } from '@/services/firebase/firestore';
import { db } from '@/services/database/sqlite';
import { messageService } from '@/services/messages/MessageService';
import { notificationService } from '@/services/notifications/NotificationService';
import { Message } from '@/types/message';

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  sending: boolean;
  sendMessage: (content: string) => Promise<void>;
  sendImage: (imageUrl: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function useMessages(chatId: string, currentUserId: string): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Load messages from SQLite on mount (offline-first)
  useEffect(() => {
    if (!chatId) return;
    
    const loadMessages = async () => {
      try {
        const localMessages = await db.getMessages(chatId, 50);
        setMessages(localMessages.reverse()); // Reverse because SQLite returns DESC, we want ASC for display
        setLoading(false);
      } catch (error) {
        console.error('Failed to load messages from SQLite:', error);
        setLoading(false);
      }
    };
    
    loadMessages();
  }, [chatId]);
  
  // Set up Firebase real-time listener
  useEffect(() => {
    if (!chatId || !currentUserId) return;
    
    const messagesRef = collection(firestore, `chats/${chatId}/messages`);
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const firestoreMessage = change.doc.data();
          const messageId = change.doc.id;
          
          // Only process messages not sent by current user (to avoid duplicates from optimistic updates)
          if (firestoreMessage.senderId !== currentUserId) {
            const message: Message = {
              id: messageId,
              chatId,
              senderId: firestoreMessage.senderId,
              senderName: firestoreMessage.senderName,
              content: firestoreMessage.content,
              type: firestoreMessage.type,
              imageUrl: firestoreMessage.imageUrl,
              timestamp: firestoreMessage.timestamp?.toMillis?.() || Date.now(),
              syncStatus: 'synced',
              deliveryStatus: 'delivered',
              readBy: firestoreMessage.readBy || [],
              deliveredTo: firestoreMessage.deliveredTo || []
            };
            
            try {
              // Save to SQLite
              await db.insertOrUpdateMessage(message);
              
              // Mark as delivered immediately
              await messageService.markAsDelivered(chatId, messageId, currentUserId);
              
              // Show notification if app is in background
              const currentAppState = AppState.currentState;
              if (currentAppState === 'background' || currentAppState === 'inactive') {
                // Get chat info for notification
                const chat = await db.getChat(chatId);
                if (chat) {
                  await notificationService.showMessageNotification(
                    chatId,
                    chat.name || firestoreMessage.senderName,
                    firestoreMessage.senderName,
                    message.content || '📷 Image',
                    chat.type === 'group'
                  );
                }
              }
              
              // Update UI state
              setMessages(prev => {
                // Check if message already exists
                const exists = prev.some(m => m.id === messageId);
                if (exists) return prev;
                
                // Add and sort by timestamp
                return [...prev, message].sort((a, b) => a.timestamp - b.timestamp);
              });
              
              console.log('✅ Received new message and marked as delivered:', messageId);
              
            } catch (error) {
              console.error('Failed to process received message:', error);
            }
          }
        }
      });
    }, (error) => {
      console.error('Firestore listener error:', error);
    });
    
    return () => {
      console.log('Cleaning up Firestore listener for chat:', chatId);
      unsubscribe();
    };
  }, [chatId, currentUserId]);
  
  // Send text message
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    setSending(true);
    
    try {
      const message = await messageService.sendTextMessage(chatId, content);
      
      // Optimistic UI update
      setMessages(prev => [...prev, message]);
      
      console.log('✅ Message sent:', message.id);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error to user
      throw error;
    } finally {
      setSending(false);
    }
  };
  
  // Send image message (placeholder for PR #8)
  const sendImage = async (imageUrl: string) => {
    setSending(true);
    
    try {
      const message = await messageService.sendImageMessage(chatId, imageUrl);
      setMessages(prev => [...prev, message]);
      
    } catch (error) {
      console.error('Failed to send image:', error);
      throw error;
    } finally {
      setSending(false);
    }
  };
  
  // Mark all unread messages in the chat as read
  const markAllAsRead = async () => {
    try {
      await messageService.markAllMessagesAsRead(chatId, currentUserId);
      
      // Refresh messages from SQLite to show updated read status
      const updatedMessages = await db.getMessages(chatId, 50);
      setMessages(updatedMessages.reverse());
      
      console.log('✅ All messages marked as read in chat:', chatId);
    } catch (error) {
      console.error('Failed to mark all messages as read:', error);
    }
  };
  
  return {
    messages,
    loading,
    sending,
    sendMessage,
    sendImage,
    markAllAsRead
  };
}

