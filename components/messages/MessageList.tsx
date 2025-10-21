/**
 * MessageList component
 * Displays a list of messages using FlatList (inverted for chat UI)
 */

import { FlatList, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Message } from '@/types/message';
import { MessageBubble } from './MessageBubble';

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
  
  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
          <MessageBubble
            message={item}
            currentUserId={currentUserId}
            showSenderName={showSenderNames}
            isGroup={showSenderNames}
          />
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.1}
      // Keep messages at bottom
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
});

