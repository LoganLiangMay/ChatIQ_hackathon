/**
 * BasicSearchResults Component
 * Displays iMessage-style search results grouped by category:
 * - People
 * - Photos
 * - Links
 * - Documents
 * - Messages
 */

import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BasicSearchResult, UserSearchResult } from '@/services/search/BasicSearchService';
import { Message } from '@/types/message';
import { Chat } from '@/types/chat';
import { Attachment } from '@/services/messages/AttachmentService';
import { formatTimestamp, getInitials } from '@/utils/formatters';
import { useState } from 'react';

interface BasicSearchResultsProps {
  results: BasicSearchResult;
  searchQuery: string;
  loading?: boolean;
  onUserSelect?: (user: UserSearchResult) => void;
}

export function BasicSearchResults({ results, searchQuery, loading, onUserSelect }: BasicSearchResultsProps) {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['messages', 'people']));

  const hasResults =
    results.messages.length > 0 ||
    results.chats.length > 0 ||
    results.users.length > 0 ||
    results.photos.length > 0 ||
    results.links.length > 0 ||
    results.documents.length > 0;

  if (!searchQuery) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search" size={64} color="#CCC" />
        <Text style={styles.emptyText}>Search messages, people, and media</Text>
        <Text style={styles.emptySubtext}>Try "meeting notes" or "photos from Alex"</Text>
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
        <Ionicons name="search-outline" size={64} color="#CCC" />
        <Text style={styles.emptyText}>No results found</Text>
        <Text style={styles.emptySubtext}>Try a different search term</Text>
      </View>
    );
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <FlatList
      data={[
        { type: 'section', title: 'People', count: results.users.length, key: 'people' },
        ...((expandedSections.has('people') ? results.users : results.users.slice(0, 3)).map(u => ({ type: 'user', data: u }))),
        { type: 'section', title: 'Photos', count: results.photos.length, key: 'photos' },
        ...((expandedSections.has('photos') ? results.photos : results.photos.slice(0, 6)).map(p => ({ type: 'photo', data: p }))),
        { type: 'section', title: 'Links', count: results.links.length, key: 'links' },
        ...((expandedSections.has('links') ? results.links : results.links.slice(0, 3)).map(l => ({ type: 'link', data: l }))),
        { type: 'section', title: 'Documents', count: results.documents.length, key: 'documents' },
        ...((expandedSections.has('documents') ? results.documents : results.documents.slice(0, 3)).map(d => ({ type: 'document', data: d }))),
        { type: 'section', title: 'Messages', count: results.messages.length, key: 'messages' },
        ...((expandedSections.has('messages') ? results.messages : results.messages.slice(0, 5)).map(m => ({ type: 'message', data: m }))),
      ].filter(item =>
        item.type === 'section' ? (item.count as number) > 0 : true
      )}
      keyExtractor={(item, index) => `${item.type}-${index}`}
      renderItem={({ item }) => {
        if (item.type === 'section') {
          return (
            <SectionHeader
              title={item.title as string}
              count={item.count as number}
              expanded={expandedSections.has(item.key as string)}
              onToggle={() => toggleSection(item.key as string)}
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
        if (item.type === 'photo') {
          return (
            <PhotoResultItem
              photo={item.data as Attachment}
              onPress={() => {
                // Navigate to message with photo
                router.push(`/(tabs)/chats/${(item.data as Attachment).chatId}`);
              }}
            />
          );
        }
        if (item.type === 'link') {
          return (
            <LinkResultItem
              link={item.data as Attachment}
              onPress={() => {
                // Navigate to message with link
                router.push(`/(tabs)/chats/${(item.data as Attachment).chatId}`);
              }}
            />
          );
        }
        if (item.type === 'document') {
          return (
            <DocumentResultItem
              document={item.data as Attachment}
              onPress={() => {
                // Navigate to message with document
                router.push(`/(tabs)/chats/${(item.data as Attachment).chatId}`);
              }}
            />
          );
        }
        if (item.type === 'message') {
          const msg = item.data as Message & { relevanceScore: number; chatName?: string };
          return (
            <MessageResultItem
              message={msg}
              searchQuery={searchQuery}
              onPress={() => router.push(`/(tabs)/chats/${msg.chatId}`)}
            />
          );
        }
        return null;
      }}
      contentContainerStyle={styles.listContent}
    />
  );
}

function SectionHeader({ title, count, expanded, onToggle }: { title: string; count: number; expanded: boolean; onToggle: () => void }) {
  if (count === 0) return null;

  return (
    <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
      <View style={styles.sectionLeft}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionCount}>{count}</Text>
        </View>
      </View>
      <Ionicons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={20}
        color="#666"
      />
    </TouchableOpacity>
  );
}

function MessageResultItem({
  message,
  searchQuery,
  onPress
}: {
  message: Message & { relevanceScore: number; chatName?: string };
  searchQuery: string;
  onPress: () => void;
}) {
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

  return (
    <TouchableOpacity style={styles.resultItem} onPress={onPress}>
      <View style={styles.iconContainer}>
        {message.priority?.isPriority ? (
          <Ionicons name="alert-circle" size={24} color="#FF3B30" />
        ) : (
          <Ionicons name="chatbubble-outline" size={24} color="#007AFF" />
        )}
      </View>

      <View style={styles.resultContent}>
        <Text style={styles.resultTitle}>{message.chatName || 'Chat'}</Text>
        <Text style={styles.resultSubtitle} numberOfLines={2}>
          <Text style={styles.senderName}>{message.senderName}: </Text>
          {highlightText(message.content || '', searchQuery)}
        </Text>
        <Text style={styles.resultTime}>{formatTimestamp(message.timestamp)}</Text>
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
        <Text style={styles.resultTime}>{user.online ? 'Online' : 'Offline'}</Text>
      </View>
    </TouchableOpacity>
  );
}

function PhotoResultItem({ photo, onPress }: { photo: Attachment; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.photoItem} onPress={onPress}>
      <Image source={{ uri: photo.url }} style={styles.photoThumbnail} resizeMode="cover" />
    </TouchableOpacity>
  );
}

function LinkResultItem({ link, onPress }: { link: Attachment; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.resultItem} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name="link" size={24} color="#007AFF" />
      </View>

      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {link.metadata?.domain || 'Link'}
        </Text>
        <Text style={styles.resultSubtitle} numberOfLines={1}>
          {link.url}
        </Text>
        <Text style={styles.resultTime}>{formatTimestamp(link.timestamp)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function DocumentResultItem({ document, onPress }: { document: Attachment; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.resultItem} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name="document-text" size={24} color="#34C759" />
      </View>

      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {document.metadata?.fileName || 'Document'}
        </Text>
        <Text style={styles.resultSubtitle} numberOfLines={1}>
          {document.metadata?.mimeType || 'File'}
        </Text>
        <Text style={styles.resultTime}>{formatTimestamp(document.timestamp)}</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  sectionBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
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
  senderName: {
    fontWeight: '600',
    color: '#000',
  },
  resultTime: {
    fontSize: 12,
    color: '#999',
  },
  highlight: {
    backgroundColor: '#FFEB3B',
    fontWeight: '600',
  },
  photoItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 2,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
});
