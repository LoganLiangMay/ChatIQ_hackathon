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
import { getFirebaseFirestore } from '@/services/firebase/config';
import { db } from '@/services/database/sqlite';
import { messageService } from '@/services/messages/MessageService';
import { notificationManager } from '@/services/notifications/NotificationManager';
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

    let unsubscribe: (() => void) | undefined;
    let isInitialLoad = true; // Track if this is the first snapshot

    const setupListener = async () => {
      try {
        console.log('🔵 [useMessages] Setting up Firestore listener for chat:', chatId);
        const firestore = await getFirebaseFirestore();
        console.log('✅ [useMessages] Firestore instance obtained');

        const messagesRef = collection(firestore, `chats/${chatId}/messages`);
        const q = query(
          messagesRef,
          orderBy('timestamp', 'desc'),
          limit(50)
        );

        unsubscribe = onSnapshot(q, async (snapshot) => {
          const isRealtime = !isInitialLoad;
          isInitialLoad = false; // After first snapshot, all subsequent are realtime

          snapshot.docChanges().forEach(async (change) => {
            const firestoreMessage = change.doc.data();
            const messageId = change.doc.id;
            
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
              deliveredTo: firestoreMessage.deliveredTo || [],
              priority: firestoreMessage.priority || undefined // Include priority if it exists
            };
            
            if (change.type === 'added') {
              try {
                // Save to SQLite (no-op in Expo Go, but works in production)
                await db.insertOrUpdateMessage(message);

                // Mark as delivered immediately (only for messages from others)
                if (firestoreMessage.senderId !== currentUserId) {
                  await messageService.markAsDelivered(chatId, messageId, currentUserId);

                  // ✅ ONLY trigger notification for REALTIME messages (not initial load)
                  // This prevents toast notifications when entering a chat
                  if (isRealtime) {
                    await notificationManager.handleIncomingMessage(
                      chatId,
                      firestoreMessage.senderName,
                      message.content || '📷 Image',
                      firestoreMessage.senderId,
                      currentUserId
                    );
                  }

                  // 🤖 AI: Priority detection now happens server-side automatically
                  // when the message is created. No client-side detection needed!
                }
                
                // Update UI state (duplicate check by ID, but update delivery status if changed)
                setMessages(prev => {
                  // Check if message already exists
                  const existingIndex = prev.findIndex(m => m.id === messageId);
                  
                  if (existingIndex !== -1) {
                    // Message exists - update it (especially delivery status)
                    const existingMessage = prev[existingIndex];
                    
                    // Only update if status actually changed
                    if (existingMessage.deliveryStatus !== message.deliveryStatus || 
                        existingMessage.syncStatus !== message.syncStatus) {
                      console.log(`🔄 Updating message ${messageId}: ${existingMessage.deliveryStatus} → ${message.deliveryStatus}`);
                      const updated = [...prev];
                      updated[existingIndex] = { ...existingMessage, ...message };
                      return updated;
                    }
                    
                    console.log('Duplicate message detected, no changes:', messageId);
                    return prev;
                  }
                  
                  // New message - add and sort by timestamp
                  const updated = [...prev, message].sort((a, b) => a.timestamp - b.timestamp);
                  console.log('✅ Message added to UI:', messageId, 'from:', firestoreMessage.senderName);
                  return updated;
                });
                
              } catch (error) {
                console.error('Failed to process received message:', error);
              }
            }
            
            // ✅ NEW: Handle modified events for read receipts and delivery status
            if (change.type === 'modified') {
              try {
                console.log(`🔄 Message modified (read receipts): ${messageId}`);
                
                // Update SQLite
                await db.insertOrUpdateMessage(message);
                
                // Update UI state
                setMessages(prev => {
                  const existingIndex = prev.findIndex(m => m.id === messageId);
                  
                  if (existingIndex !== -1) {
                    const updated = [...prev];
                    updated[existingIndex] = { ...updated[existingIndex], ...message };
                    console.log(`✅ Updated read receipt for ${messageId}: readBy=${message.readBy?.length}, deliveredTo=${message.deliveredTo?.length}`);
                    return updated;
                  }
                  
                  return prev;
                });
              } catch (error) {
                console.error('Failed to process modified message:', error);
              }
            }
          });
        }, (error) => {
          console.error('Firestore listener error:', error);
        });
      } catch (error) {
        console.error('Error setting up Firestore listener in useMessages:', error);
      }
    };
    
    setupListener();
    
    return () => {
      console.log('Cleaning up Firestore listener for chat:', chatId);
      if (unsubscribe) {
        unsubscribe();
      }
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
      
      // Only refresh from SQLite if available (not in Expo Go)
      // Otherwise, keep current state (messages come from Firestore real-time)
      const updatedMessages = await db.getMessages(chatId, 50);
      if (updatedMessages.length > 0) {
        setMessages(updatedMessages.reverse());
        console.log('✅ Refreshed messages from SQLite:', updatedMessages.length);
      } else {
        console.log('✅ SQLite empty (Expo Go), keeping Firestore real-time messages');
      }
      
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

