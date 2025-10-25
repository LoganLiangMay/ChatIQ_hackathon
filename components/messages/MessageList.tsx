/**
 * MessageList component
 * Displays a list of messages using FlatList (inverted for chat UI)
 * Shows iMessage-style read receipts below the last sent message
 */

import { FlatList, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Message } from '@/types/message';
import { MessageBubble } from './MessageBubble';
import { ReadReceipt } from './ReadReceipt';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  loading?: boolean;
  showSenderNames?: boolean; // For group chats
  onEndReached?: () => void; // For pagination
}

export function MessageList({ 
  messages, 
  currentUserId, 
  loading = false,
  showSenderNames = false,
  onEndReached 
}: MessageListProps) {
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }
  
  if (messages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No messages yet</Text>
        <Text style={styles.emptySubtext}>Send a message to start the conversation</Text>
      </View>
    );
  }
  
  // Find the last message sent by current user (for read receipt)
  const lastSentMessage = [...messages]
    .reverse()
    .find(msg => msg.senderId === currentUserId);
  
  // Reverse messages for inverted list (newest at top/bottom of screen)
  const reversedMessages = [...messages].reverse();

  return (
    <FlatList
      data={reversedMessages}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => {
        const isLastSentMessage = lastSentMessage && item.id === lastSentMessage.id;

        return (
          <View>
            <MessageBubble
              message={item}
              currentUserId={currentUserId}
              showSenderName={showSenderNames}
              isGroup={showSenderNames}
              showStatus={false} // Don't show checkmarks on individual messages
            />

            {/* Show "Read [time]" below the last sent message only (iMessage style) */}
            {isLastSentMessage && item.senderId === currentUserId && (
              <View style={styles.readReceiptContainer}>
                <ReadReceipt message={item} isGroup={showSenderNames} />
              </View>
            )}
          </View>
        );
      }}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      inverted={true} // Show newest messages at bottom (like iMessage)
      onEndReached={onEndReached}
      onEndReachedThreshold={0.1}
      // Keep messages at bottom when new ones arrive
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
      }}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  readReceiptContainer: {
    alignSelf: 'flex-end',
    marginRight: 8,
    marginBottom: 4,
  },
});

