/**
 * MessageBubble component
 * Displays a single message with styling based on sender
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TouchableOpacity, Platform, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/types/message';
import { formatTimestamp } from '@/utils/formatters';
import { MessageStatus } from './MessageStatus';
import { ImageMessage } from './ImageMessage';
import { ImageViewer } from './ImageViewer';
import { PriorityBadge } from '@/components/ai/PriorityBadge';
import { mediumHaptic } from '@/utils/haptics';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
  showSenderName?: boolean; // For group chats
  isGroup?: boolean;
  showStatus?: boolean; // Whether to show checkmarks (default: false for iMessage style)
}

export function MessageBubble({
  message,
  currentUserId,
  showSenderName = false,
  isGroup = false,
  showStatus = false // iMessage style: don't show checkmarks on individual messages
}: MessageBubbleProps) {
  const isSentByMe = message.senderId === currentUserId;
  const [viewerVisible, setViewerVisible] = useState(false);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);

  const handleLongPress = () => {
    if (message.type === 'text') {
      mediumHaptic();
      setContextMenuVisible(true);
    }
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(message.content);
      mediumHaptic();
      setContextMenuVisible(false);
    } catch (error) {
      console.error('Failed to copy:', error);
      setContextMenuVisible(false);
    }
  };

  // Extract keywords from message content for key message tagging
  const extractKeywords = (text: string): string[] => {
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
      'in', 'to', 'of', 'for', 'with', 'as', 'by', 'from', 'this', 'that',
      'it', 'be', 'are', 'was', 'were', 'been', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may',
      'can', 'if', 'then', 'so', 'not', 'no', 'yes'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 5); // Limit to 5 keywords
  };

  const handlePinKeyMessage = async () => {
    try {
      mediumHaptic();
      setContextMenuVisible(false);

      const db = getFirestore();
      const keywords = extractKeywords(message.content);

      // Save to users/{userId}/keyMessages/{messageId}
      await setDoc(
        doc(db, `users/${currentUserId}/keyMessages/${message.id}`),
        {
          text: message.content,
          tags: keywords,
          sourceMessageId: message.id,
          sourceChatId: message.chatId || '',
          timestamp: Timestamp.now(),
          category: 'manual' // User manually pinned this
        }
      );

      Alert.alert(
        'Key Message Saved',
        `Message pinned with tags: ${keywords.join(', ') || 'none'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to pin key message:', error);
      Alert.alert('Error', 'Failed to save key message');
    }
  };

  const MessageContent = (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={400} // Like iMessage
      disabled={message.type !== 'text'}
    >
      <View style={[
        styles.container,
        isSentByMe ? styles.myMessage : styles.otherMessage,
        message.type === 'image' && styles.imageMessage
      ]}>
        {/* Sender name (for group chats) */}
        {showSenderName && !isSentByMe && (
          <Text style={styles.senderName}>{message.senderName}</Text>
        )}

        {/* 🤖 AI: Priority Badge (for incoming high-priority messages) */}
        {!isSentByMe && message.priority && message.priority.isPriority && (
          <View style={styles.priorityBadgeContainer}>
            <PriorityBadge
              urgencyLevel={message.priority.urgencyLevel}
              score={message.priority.score}
              compact={false}
            />
          </View>
        )}

        {/* Message content */}
        {message.type === 'text' && (
          <Text style={[
            styles.content,
            isSentByMe ? styles.myContent : styles.otherContent
          ]}>
            {message.content}
          </Text>
        )}

        {/* Image message */}
        {message.type === 'image' && message.imageUrl && (
          <>
            <ImageMessage
              imageUrl={message.imageUrl}
              onPress={() => setViewerVisible(true)}
            />

            <ImageViewer
              visible={viewerVisible}
              imageUrl={message.imageUrl}
              onClose={() => setViewerVisible(false)}
            />
          </>
        )}

        {/* Timestamp only (no status checkmarks on individual messages) */}
        <View style={styles.footer}>
          <Text style={[
            styles.timestamp,
            isSentByMe ? styles.myTimestamp : styles.otherTimestamp
          ]}>
            {formatTimestamp(message.timestamp)}
          </Text>

          {/* Optional: Show status checkmarks (if showStatus is true) */}
          {isSentByMe && showStatus && (
            <MessageStatus message={message} isGroup={isGroup} />
          )}
        </View>
      </View>
    </Pressable>
  );

  return (
    <>
      {MessageContent}

      {/* Context Menu Modal (like iMessage) */}
      <Modal
        visible={contextMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setContextMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setContextMenuVisible(false)}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 50 : 30}
            style={StyleSheet.absoluteFill}
            tint="dark"
          />

          <View style={styles.contextMenuContainer}>
            {/* Highlighted Message Preview */}
            <View style={[
              styles.messagePreview,
              isSentByMe ? styles.myMessage : styles.otherMessage,
            ]}>
              <Text style={[
                styles.content,
                isSentByMe ? styles.myContent : styles.otherContent
              ]}>
                {message.content}
              </Text>
            </View>

            {/* Menu Items */}
            <View style={styles.contextMenuActions}>
              {/* Copy Button */}
              <TouchableOpacity
                style={styles.contextMenuItem}
                onPress={handleCopy}
              >
                <Ionicons name="copy-outline" size={20} color="#007AFF" />
                <Text style={styles.contextMenuText}>Copy</Text>
              </TouchableOpacity>

              {/* Pin as Key Message Button */}
              <TouchableOpacity
                style={styles.contextMenuItem}
                onPress={handlePinKeyMessage}
              >
                <Ionicons name="bookmark-outline" size={20} color="#007AFF" />
                <Text style={styles.contextMenuText}>Pin as Key Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
    marginHorizontal: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  imageMessage: {
    backgroundColor: 'transparent',
    padding: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  priorityBadgeContainer: {
    marginBottom: 6,
  },
  content: {
    fontSize: 16,
    lineHeight: 20,
  },
  myContent: {
    color: '#FFFFFF',
  },
  otherContent: {
    color: '#000000',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: '#666',
  },
  // Context Menu Styles (iMessage-like)
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextMenuContainer: {
    alignItems: 'center',
    gap: 12,
  },
  contextMenuActions: {
    gap: 8,
    alignItems: 'center',
  },
  messagePreview: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    // Shadow for emphasis
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  contextMenuItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    // Shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  contextMenuText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
});

