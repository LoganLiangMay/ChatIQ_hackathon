/**
 * Individual Chat Screen
 * Displays messages and allows sending new messages
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { usePresence } from '@/hooks/usePresence';
import { useTyping } from '@/hooks/useTyping';
import { useAI } from '@/hooks/useAI';
import { db } from '@/services/database/sqlite';
import { imageService } from '@/services/storage/ImageService';
import { actionItemsService } from '@/services/ai/ActionItemsService';
import { Chat } from '@/types/chat';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/messages/MessageList';
import { MessageInput } from '@/components/messages/MessageInput';
import { TypingIndicator } from '@/components/messages/TypingIndicator';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SummaryModal } from '@/components/ai/SummaryModal';
import { SummaryHistory } from '@/components/ai/SummaryHistory';
import { ActionItemsList } from '@/components/ai/ActionItemsList';
import type { ActionItem } from '@/services/ai/types';

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [chatLoading, setChatLoading] = useState(true);
  const [otherUserId, setOtherUserId] = useState<string | undefined>(undefined);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showSummaryHistory, setShowSummaryHistory] = useState(false);
  
  const { messages, loading, sending, sendMessage, sendImage, markAllAsRead } = useMessages(
    chatId || '',
    user?.uid || ''
  );
  
  // Get other user's presence (for direct chats)
  const { online, lastSeen } = usePresence(otherUserId);
  
  // Typing indicators
  const { typingUsers, startTyping, stopTyping } = useTyping(
    chatId || '',
    user?.uid || '',
    user?.displayName || 'Unknown'
  );
  
  // AI features
  const { summarizeThread, extractActionItems, loading: aiLoading, error: aiError } = useAI();
  const [summaryData, setSummaryData] = useState<any>(null);
  const [showActionItemsModal, setShowActionItemsModal] = useState(false);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [lastActionItemsCheck, setLastActionItemsCheck] = useState<number>(0); // Track when we last extracted action items
  
  // Load chat details
  useEffect(() => {
    if (!chatId || !user) return;
    
    const loadChat = async () => {
      try {
        // Try SQLite first (for production builds)
        let chatData = await db.getChat(chatId);
        
        // If SQLite is empty (Expo Go), fetch from Firestore
        if (!chatData) {
          console.log('📱 SQLite empty, fetching chat from Firestore:', chatId);
          const { getFirebaseFirestore } = await import('@/services/firebase/config');
          const { doc, getDoc } = await import('firebase/firestore');
          
          const firestore = await getFirebaseFirestore();
          const chatRef = doc(firestore, 'chats', chatId);
          const chatSnap = await getDoc(chatRef);
          
          if (chatSnap.exists()) {
            const firestoreData = chatSnap.data();
            chatData = {
              id: chatId,
              type: firestoreData.type,
              name: firestoreData.name,
              groupPicture: firestoreData.groupPicture,
              participants: firestoreData.participants,
              participantDetails: firestoreData.participantDetails,
              admins: firestoreData.admins,
              lastMessage: firestoreData.lastMessage ? {
                content: firestoreData.lastMessage.content,
                timestamp: firestoreData.lastMessage.timestamp?.toMillis?.() || Date.now(),
                senderId: firestoreData.lastMessage.senderId,
                senderName: firestoreData.lastMessage.senderName
              } : undefined,
              createdAt: firestoreData.createdAt?.toMillis?.() || Date.now(),
              updatedAt: firestoreData.updatedAt?.toMillis?.() || Date.now()
            };
            console.log('✅ Chat loaded from Firestore:', chatData.id, chatData.participantDetails);
          }
        }
        
        setChat(chatData);
        
        // For direct chats, determine the other user's ID
        if (chatData && chatData.type === 'direct') {
          const otherId = chatData.participants.find(id => id !== user.uid);
          setOtherUserId(otherId);
        }
      } catch (error) {
        console.error('Failed to load chat:', error);
      } finally {
        setChatLoading(false);
      }
    };
    
    loadChat();
  }, [chatId, user]);
  
  // Mark all messages as read when screen is focused
  useFocusEffect(() => {
    if (chatId && user?.uid) {
      // Mark as read after a short delay to ensure messages are loaded
      const timer = setTimeout(() => {
        markAllAsRead();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  });
  
  // Get chat display name
  const getChatName = () => {
    if (!chat || !user) return 'Chat';
    
    if (chat.type === 'group') {
      return chat.name || 'Group Chat';
    }
    
    // For direct chats, show other user's name from participantDetails
    const otherUserId = chat.participants.find(id => id !== user.uid);
    if (otherUserId && chat.participantDetails && chat.participantDetails[otherUserId]) {
      return chat.participantDetails[otherUserId].displayName;
    }
    
    return 'Chat'; // Fallback
  };
  
  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (error) {
      console.error('Error sending message:', error);
      // TODO: Show error to user
    }
  };
  
  const handleSendImage = async (imageUri: string) => {
    if (!chatId) return;
    
    try {
      // Upload image to Firebase Storage
      const imageUrl = await imageService.uploadImage(imageUri, chatId);
      
      // Send image message
      await sendImage(imageUrl);
      
    } catch (error) {
      console.error('Error sending image:', error);
      Alert.alert('Error', 'Failed to send image. Please try again.');
    }
  };
  
  const handleSummarize = async () => {
    if (!chatId) return;
    
    try {
      console.log('🤖 Generating AI summary for chat:', chatId);
      setShowSummaryModal(true);
      setSummaryData(null);
      
      const result = await summarizeThread(chatId, 50);
      
      if (result) {
        console.log('✅ Summary generated:', result);
        setSummaryData(result);
      } else if (aiError) {
        console.error('❌ Summary error:', aiError);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      Alert.alert('Error', 'Failed to generate summary. Please try again.');
    }
  };
  
  const handleExtractActions = useCallback(async () => {
    if (!chatId) return;
    
    try {
      // Check if there are new messages since last extraction
      const latestMessageTime = messages.length > 0 ? Math.max(...messages.map(m => m.timestamp)) : 0;
      const shouldRegenerate = latestMessageTime > lastActionItemsCheck;
      
      setShowActionItemsModal(true);
      
      // If we have cached action items and no new messages, just show them
      if (!shouldRegenerate && actionItems.length > 0) {
        console.log('📋 Using cached action items (no new messages)');
        return;
      }
      
      console.log('🤖 Extracting action items for chat:', chatId);
      setActionItems([]); // Clear previous items
      
      const items = await extractActionItems(chatId, 50);
      
      if (items && items.length > 0) {
        console.log('✅ Action items extracted:', items.length);
        
        // Filter out items with "null" string values
        const filteredItems = items.map(item => ({
          ...item,
          owner: item.owner === 'null' ? undefined : item.owner,
          deadline: item.deadline === 'null' ? undefined : item.deadline,
        }));
        
        setActionItems(filteredItems);
        setLastActionItemsCheck(Date.now()); // Update last check time
        
        // Save to Firestore for cross-chat access
        if (user?.uid && chatId) {
          await actionItemsService.saveActionItems(user.uid, chatId, filteredItems);
        }
      } else if (aiError) {
        console.error('❌ Action items error:', aiError);
        Alert.alert('No Action Items', 'No action items found in this conversation.');
      }
    } catch (error) {
      console.error('Error extracting action items:', error);
      Alert.alert('Error', 'Failed to extract action items. Please try again.');
    }
  }, [chatId, messages, lastActionItemsCheck, actionItems, extractActionItems, aiError, user]);
  
  const handleToggleActionItem = async (id: string) => {
    // Update local state immediately for responsive UI
    const item = actionItems.find(i => i.id === id);
    if (!item) return;
    
    const newStatus = item.status === 'completed' ? 'pending' : 'completed';
    
    setActionItems(prev => prev.map(i => 
      i.id === id 
        ? { ...i, status: newStatus }
        : i
    ));
    
    // Update Firestore and remove priority if completed
    try {
      if (chatId && item.extractedFrom) {
        await actionItemsService.updateActionItemStatus(
          id,
          newStatus,
          chatId,
          item.extractedFrom.messageId
        );
        
        if (newStatus === 'completed') {
          console.log('✅ Action completed, priority removed from message');
        }
      }
    } catch (error) {
      console.error('Error updating action item:', error);
      // Revert on error
      setActionItems(prev => prev.map(i => 
        i.id === id 
          ? { ...i, status: item.status }
          : i
      ));
    }
  };
  
  if (!chatId || !user) {
    return null;
  }
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <ChatHeader
          chatId={chatId}
          chatName={getChatName()}
          chatType={chat?.type || 'direct'}
          online={online}
          lastSeen={lastSeen}
          participantCount={chat?.participants.length}
          onSummarize={handleSummarize}
          onExtractActions={handleExtractActions}
          onViewHistory={() => setShowSummaryHistory(true)}
        />
        
        {/* Offline Banner */}
        <OfflineBanner />
        
        {/* Messages */}
        <View style={styles.messagesContainer}>
          <MessageList
            messages={messages}
            currentUserId={user.uid}
            loading={loading && chatLoading}
            showSenderNames={chat?.type === 'group'}
          />
          
          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <TypingIndicator
              userName={typingUsers[0]}
              typingUsers={typingUsers}
              isGroup={chat?.type === 'group'}
            />
          )}
        </View>
        
        {/* Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          onSendImage={handleSendImage}
          sending={sending}
          onTypingStart={startTyping}
          onTypingStop={stopTyping}
        />
        
        {/* AI Summary Modal */}
        <SummaryModal
          visible={showSummaryModal}
          summary={summaryData}
          loading={aiLoading}
          error={aiError}
          onClose={() => setShowSummaryModal(false)}
        />
        
        {/* AI Summary History Modal */}
        <SummaryHistory
          visible={showSummaryHistory}
          chatId={chatId || null}
          chatName={getChatName()}
          onClose={() => setShowSummaryHistory(false)}
        />
        
        {/* AI Action Items Modal */}
        <ActionItemsList
          visible={showActionItemsModal}
          actionItems={actionItems}
          loading={aiLoading}
          onClose={() => setShowActionItemsModal(false)}
          onToggle={handleToggleActionItem}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
});

