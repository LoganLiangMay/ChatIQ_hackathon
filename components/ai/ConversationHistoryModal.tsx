/**
 * ConversationHistoryModal - ChatGPT-style conversation history sidebar
 * Shows previous conversations and allows switching between them
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ConversationSession } from '@/services/ai/ConversationService';

interface ConversationHistoryModalProps {
  visible: boolean;
  sessions: ConversationSession[];
  currentSessionId: string | null;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  onNewConversation: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export function ConversationHistoryModal({
  visible,
  sessions,
  currentSessionId,
  onClose,
  onSelectSession,
  onNewConversation,
  onDeleteSession,
}: ConversationHistoryModalProps) {
  const handleDelete = (sessionId: string, title: string) => {
    Alert.alert(
      'Delete Conversation',
      `Delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteSession(sessionId),
        },
      ]
    );
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const groupSessionsByDate = (): { title: string; sessions: ConversationSession[] }[] => {
    const groups: { [key: string]: ConversationSession[] } = {
      Today: [],
      Yesterday: [],
      'Last 7 Days': [],
      'Last 30 Days': [],
      Older: [],
    };

    const now = new Date();

    sessions.forEach(session => {
      const date = new Date(session.updatedAt);
      const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

      if (diffDays === 0) {
        groups['Today'].push(session);
      } else if (diffDays === 1) {
        groups['Yesterday'].push(session);
      } else if (diffDays < 7) {
        groups['Last 7 Days'].push(session);
      } else if (diffDays < 30) {
        groups['Last 30 Days'].push(session);
      } else {
        groups['Older'].push(session);
      }
    });

    return Object.entries(groups)
      .filter(([_, sessions]) => sessions.length > 0)
      .map(([title, sessions]) => ({ title, sessions }));
  };

  const groupedSessions = groupSessionsByDate();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Conversation History</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          {/* New Conversation Button */}
          <View style={styles.newButtonContainer}>
            <TouchableOpacity
              style={styles.newButton}
              onPress={() => {
                onNewConversation();
                onClose();
              }}
            >
              <Ionicons name="add-circle" size={24} color="#007AFF" />
              <Text style={styles.newButtonText}>New Conversation</Text>
            </TouchableOpacity>
          </View>

          {/* Sessions List */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {groupedSessions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color="#CCC" />
                <Text style={styles.emptyText}>No conversations yet</Text>
                <Text style={styles.emptySubtext}>
                  Start a new conversation to see it here
                </Text>
              </View>
            ) : (
              groupedSessions.map(group => (
                <View key={group.title} style={styles.group}>
                  <Text style={styles.groupTitle}>{group.title}</Text>
                  {group.sessions.map(session => (
                    <TouchableOpacity
                      key={session.id}
                      style={[
                        styles.sessionItem,
                        session.id === currentSessionId && styles.sessionItemActive,
                      ]}
                      onPress={() => {
                        onSelectSession(session.id);
                        onClose();
                      }}
                    >
                      <View style={styles.sessionContent}>
                        <View style={styles.sessionIcon}>
                          <Ionicons
                            name="chatbubble-ellipses"
                            size={20}
                            color={session.id === currentSessionId ? '#007AFF' : '#666'}
                          />
                        </View>
                        <View style={styles.sessionInfo}>
                          <Text
                            style={[
                              styles.sessionTitle,
                              session.id === currentSessionId && styles.sessionTitleActive,
                            ]}
                            numberOfLines={1}
                          >
                            {session.title}
                          </Text>
                          <Text style={styles.sessionMeta}>
                            {session.messages.length} messages · {formatDate(session.updatedAt)}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(session.id, session.title);
                        }}
                      >
                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  newButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 12,
  },
  newButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  group: {
    paddingTop: 16,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sessionItemActive: {
    backgroundColor: '#F0F8FF',
  },
  sessionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  sessionTitleActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  sessionMeta: {
    fontSize: 13,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
});
