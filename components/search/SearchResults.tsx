/**
 * SearchResults Component
 * Displays search results organized by category:
 * - Messages (with context preview)
 * - Chats
 * - Users
 */

import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SearchResult, UserSearchResult } from '@/services/search/SearchService';
import { Chat } from '@/types/chat';
import { formatTimestamp, getInitials } from '@/utils/formatters';
import type { SearchResult as AISearchResult } from '@/services/ai/types';
import { useState } from 'react';

interface SearchResultsProps {
  results: SearchResult;
  searchQuery: string;
  loading?: boolean;
  onUserSelect?: (user: UserSearchResult) => void;
}

export function SearchResults({ results, searchQuery, loading, onUserSelect }: SearchResultsProps) {
  const router = useRouter();
  const hasResults = 
    results.messages.length > 0 || 
    results.chats.length > 0 || 
    results.users.length > 0;

  if (!searchQuery) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search" size={64} color="#CCC" />
        <Text style={styles.emptyText}>Search messages by meaning...</Text>
        <Text style={styles.emptySubtext}>Try "What did we decide about the API?"</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="hourglass-outline" size={64} color="#CCC" />
        <Text style={styles.emptyText}>Searching...</Text>
      </View>
    );
  }

  if (!hasResults) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="sad-outline" size={64} color="#CCC" />
        <Text style={styles.emptyText}>No results found</Text>
        <Text style={styles.emptySubtext}>Try a different search term or adjust filters</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={[
        { type: 'section', title: 'Messages', count: results.messages.length },
        ...results.messages.map(m => ({ type: 'message', data: m })),
        { type: 'section', title: 'Chats', count: results.chats.length },
        ...results.chats.map(c => ({ type: 'chat', data: c })),
        { type: 'section', title: 'Users', count: results.users.length },
        ...results.users.map(u => ({ type: 'user', data: u })),
      ].filter(item => 
        item.type === 'section' ? (item.count as number) > 0 : true
      )}
      keyExtractor={(item, index) => `${item.type}-${index}`}
      renderItem={({ item }) => {
        if (item.type === 'section') {
          return <SectionHeader title={item.title as string} count={item.count as number} />;
        }
        if (item.type === 'message') {
          return (
            <AIMessageResultItem
              result={item.data as AISearchResult}
              searchQuery={searchQuery}
              onPress={() => router.push(`/(tabs)/chats/${(item.data as AISearchResult).chatId}`)}
            />
          );
        }
        if (item.type === 'chat') {
          return (
            <ChatResultItem
              chat={item.data as Chat}
              onPress={() => router.push(`/(tabs)/chats/${(item.data as Chat).id}`)}
            />
          );
        }
        if (item.type === 'user') {
          return (
            <UserResultItem
              user={item.data as UserSearchResult}
              onPress={() => onUserSelect?.(item.data as UserSearchResult)}
            />
          );
        }
        return null;
      }}
      contentContainerStyle={styles.listContent}
    />
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>{count}</Text>
    </View>
  );
}

function AIMessageResultItem({ 
  result, 
  searchQuery, 
  onPress 
}: { 
  result: AISearchResult; 
  searchQuery: string; 
  onPress: () => void;
}) {
  const [showContext, setShowContext] = useState(false);
  
  // Highlight search term in content
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <Text key={index} style={styles.highlight}>{part}</Text>
      ) : (
        part
      )
    );
  };

  const hasContext = result.context && (result.context.before.length > 0 || result.context.after.length > 0);

  return (
    <TouchableOpacity style={styles.resultItem} onPress={onPress}>
      <View style={styles.iconContainer}>
        {result.isPriority ? (
          <Ionicons name="alert-circle" size={24} color="#FF3B30" />
        ) : (
          <Ionicons name="chatbubble-outline" size={24} color="#007AFF" />
        )}
      </View>
      
      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>{result.chatName || 'Chat'}</Text>
          {result.relevanceScore >= 0.8 && (
            <View style={styles.relevanceBadge}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.relevanceText}>Highly relevant</Text>
            </View>
          )}
        </View>

        {/* Context: Messages before */}
        {showContext && hasContext && result.context!.before.length > 0 && (
          <View style={styles.contextContainer}>
            {result.context!.before.map((msg, idx) => (
              <Text key={`before-${idx}`} style={styles.contextText} numberOfLines={1}>
                <Text style={styles.contextSender}>{msg.sender}: </Text>
                {msg.content}
              </Text>
            ))}
          </View>
        )}

        {/* Main message */}
        <Text style={styles.resultSubtitle} numberOfLines={showContext ? undefined : 2}>
          <Text style={styles.mainMessageSender}>{result.senderName}: </Text>
          {highlightText(result.content, searchQuery)}
        </Text>

        {/* Context: Messages after */}
        {showContext && hasContext && result.context!.after.length > 0 && (
          <View style={styles.contextContainer}>
            {result.context!.after.map((msg, idx) => (
              <Text key={`after-${idx}`} style={styles.contextText} numberOfLines={1}>
                <Text style={styles.contextSender}>{msg.sender}: </Text>
                {msg.content}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.resultFooter}>
          <Text style={styles.resultTime}>
            {formatTimestamp(result.timestamp)}
          </Text>
          {hasContext && (
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                setShowContext(!showContext);
              }}
              style={styles.contextToggle}
            >
              <Ionicons 
                name={showContext ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color="#007AFF" 
              />
              <Text style={styles.contextToggleText}>
                {showContext ? 'Hide' : 'Show'} context
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ChatResultItem({ chat, onPress }: { chat: Chat; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.resultItem} onPress={onPress}>
      <View style={[styles.iconContainer, styles.avatarContainer]}>
        <Text style={styles.avatarText}>{getInitials(chat.name || 'Chat')}</Text>
      </View>
      
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle}>{chat.name || 'Chat'}</Text>
        {chat.lastMessage && (
          <Text style={styles.resultSubtitle} numberOfLines={1}>
            {chat.lastMessage.content || '📷 Image'}
          </Text>
        )}
        <Text style={styles.resultTime}>
          {chat.type === 'group' ? `${chat.participants.length} members` : 'Direct chat'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function UserResultItem({ user, onPress }: { user: UserSearchResult; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.resultItem} onPress={onPress}>
      <View style={[styles.iconContainer, styles.avatarContainer]}>
        <Text style={styles.avatarText}>{getInitials(user.displayName)}</Text>
        {user.online && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle}>{user.displayName}</Text>
        {user.email && (
          <Text style={styles.resultSubtitle} numberOfLines={1}>
            {user.email}
          </Text>
        )}
        <Text style={styles.resultTime}>
          {user.online ? 'Online' : 'Offline'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontSize: 14,
    color: '#999',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarContainer: {
    backgroundColor: '#007AFF',
    position: 'relative',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resultTime: {
    fontSize: 12,
    color: '#999',
  },
  highlight: {
    backgroundColor: '#FFEB3B',
    fontWeight: '600',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  relevanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  relevanceText: {
    fontSize: 10,
    color: '#B8860B',
    fontWeight: '600',
  },
  contextContainer: {
    marginVertical: 6,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E5EA',
  },
  contextText: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
    marginBottom: 2,
  },
  contextSender: {
    fontWeight: '600',
    color: '#666',
  },
  mainMessageSender: {
    fontWeight: '600',
    color: '#000',
  },
  resultFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  contextToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contextToggleText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});
