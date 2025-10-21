/**
 * MessageBubble component
 * Displays a single message with styling based on sender
 */

import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '@/types/message';
import { formatTimestamp } from '@/utils/formatters';
import { MessageStatus } from './MessageStatus';
import { ImageMessage } from './ImageMessage';
import { ImageViewer } from './ImageViewer';

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
  showSenderName?: boolean; // For group chats
  isGroup?: boolean;
}

export function MessageBubble({ message, currentUserId, showSenderName = false, isGroup = false }: MessageBubbleProps) {
  const isSentByMe = message.senderId === currentUserId;
  const [viewerVisible, setViewerVisible] = useState(false);
  
  return (
    <View style={[
      styles.container,
      isSentByMe ? styles.myMessage : styles.otherMessage,
      message.type === 'image' && styles.imageMessage
    ]}>
      {/* Sender name (for group chats) */}
      {showSenderName && !isSentByMe && (
        <Text style={styles.senderName}>{message.senderName}</Text>
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
      
      {/* Timestamp and status */}
      <View style={styles.footer}>
        <Text style={[
          styles.timestamp,
          isSentByMe ? styles.myTimestamp : styles.otherTimestamp
        ]}>
          {formatTimestamp(message.timestamp)}
        </Text>
        
        {/* Status indicator (only for sent messages) */}
        {isSentByMe && (
          <MessageStatus message={message} isGroup={isGroup} />
        )}
      </View>
    </View>
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
});

