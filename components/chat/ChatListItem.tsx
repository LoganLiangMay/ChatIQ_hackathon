/**
 * ChatListItem component
 * Displays a single chat in the chat list with preview
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ChatListItem as ChatListItemType } from '@/types/chat';
import { formatTimestamp, getInitials, truncate } from '@/utils/formatters';
import { PriorityBadge } from '@/components/ai/PriorityBadge';

interface ChatListItemProps {
  chat: ChatListItemType;
}

export function ChatListItem({ chat }: ChatListItemProps) {
  const router = useRouter();
  
  const handlePress = () => {
    router.push(`/(tabs)/chats/${chat.id}`);
  };
  
  // Get display name for chat
  const getDisplayName = () => {
    if (chat.type === 'group') {
      return chat.name || 'Group Chat';
    }
    return chat.otherUser?.displayName || 'Unknown User';
  };
  
  // Get avatar display (initials)
  const getAvatar = () => {
    const name = getDisplayName();
    return getInitials(name);
  };
  
  // Get last message preview
  const getLastMessagePreview = () => {
    if (!chat.lastMessage) return 'No messages yet';
    
    const content = chat.lastMessage.content || '📷 Image';
    return truncate(content, 50);
  };
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={[
          styles.avatar,
          // 🤖 AI: Red border for urgent chats
          chat.lastMessage?.priority?.isPriority && 
          chat.lastMessage.priority.score >= 0.6 && 
          styles.avatarUrgent
        ]}>
          <Text style={styles.avatarText}>{getAvatar()}</Text>
        </View>
        
        {/* Online indicator (for direct chats) */}
        {chat.type === 'direct' && chat.otherUser?.online && (
          <View style={styles.onlineIndicator} />
        )}
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {getDisplayName()}
          </Text>
          
          <View style={styles.headerRight}>
            {/* 🤖 AI: Priority indicator (compact) */}
            {chat.lastMessage?.priority?.isPriority && (
              <PriorityBadge
                urgencyLevel={chat.lastMessage.priority.urgencyLevel}
                score={chat.lastMessage.priority.score}
                compact={true}
              />
            )}
            
            {chat.lastMessage && (
              <Text style={styles.time}>
                {formatTimestamp(chat.lastMessage.timestamp)}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {getLastMessagePreview()}
          </Text>
          
          {/* Unread badge */}
          {chat.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{chat.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarUrgent: {
    borderWidth: 3,
    borderColor: '#FF3B30', // Red border for urgent chats
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  time: {
    fontSize: 13,
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
});




