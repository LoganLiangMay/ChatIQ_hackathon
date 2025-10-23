/**
 * ActionItemsList Component
 * Displays extracted action items from a conversation with:
 * - Task description
 * - Owner (if identified)
 * - Deadline (if mentioned)
 * - Checkable status
 */

import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { ActionItem } from '@/services/ai/types';
import { formatTimestamp } from '@/utils/formatters';

interface ActionItemsListProps {
  visible: boolean;
  actionItems: ActionItem[];
  loading: boolean;
  onClose: () => void;
  onToggle?: (id: string) => void;
}

export function ActionItemsList({ visible, actionItems, loading, onClose, onToggle }: ActionItemsListProps) {
  const handleToggle = (id: string) => {
    if (onToggle) {
      onToggle(id);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="checkbox-outline" size={24} color="#007AFF" />
              <Text style={styles.title}>Action Items</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Extracting action items...</Text>
              </View>
            ) : (!actionItems || actionItems.length === 0) ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={64} color="#CCC" />
                <Text style={styles.emptyText}>No action items found</Text>
                <Text style={styles.emptySubtext}>
                  This conversation doesn't contain any tasks, commitments, or to-dos.
                </Text>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <Text style={styles.subtitle}>
                  {actionItems.length} action {actionItems.length === 1 ? 'item' : 'items'} found
                </Text>
                
                {actionItems.map((item) => (
                  <View key={item.id} style={styles.actionItem}>
                    {/* Checkbox */}
                    <TouchableOpacity
                      onPress={() => handleToggle(item.id)}
                      style={styles.checkbox}
                    >
                      {item.status === 'completed' ? (
                        <Ionicons name="checkmark-circle" size={28} color="#34C759" />
                      ) : (
                        <Ionicons name="ellipse-outline" size={28} color="#007AFF" />
                      )}
                    </TouchableOpacity>

                    {/* Content */}
                    <View style={styles.itemContent}>
                      <Text style={[
                        styles.taskText,
                        item.status === 'completed' && styles.taskCompleted
                      ]}>
                        {item.task}
                      </Text>

                      {/* Metadata */}
                      <View style={styles.metadata}>
                        {item.owner && item.owner !== 'null' && (
                          <View style={styles.metadataItem}>
                            <Ionicons name="person-outline" size={14} color="#666" />
                            <Text style={styles.metadataText}>{item.owner}</Text>
                          </View>
                        )}
                        
                        {item.deadline && item.deadline !== 'null' && item.deadline !== 'undefined' && (
                          <View style={styles.metadataItem}>
                            <Ionicons name="time-outline" size={14} color="#666" />
                            <Text style={styles.metadataText}>{item.deadline}</Text>
                          </View>
                        )}
                        
                        {item.extractedFrom && item.extractedFrom.timestamp && (
                          <View style={styles.metadataItem}>
                            <Ionicons name="chatbox-outline" size={14} color="#999" />
                            <Text style={styles.metadataTextSmall}>
                              {formatTimestamp(
                                typeof item.extractedFrom.timestamp === 'number' 
                                  ? item.extractedFrom.timestamp
                                  : (item.extractedFrom.timestamp as any)._seconds * 1000
                              )}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          {!loading && actionItems && actionItems.length > 0 && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Tap items to mark as complete
              </Text>
            </View>
          )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    minHeight: 400, // Ensure minimum height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden', // Prevent content overflow
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    minHeight: 200, // Ensure ScrollView has height
  },
  contentContainer: {
    padding: 20,
    flexGrow: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    lineHeight: 22,
    marginBottom: 8,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 13,
    color: '#666',
  },
  metadataTextSmall: {
    fontSize: 12,
    color: '#999',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#F8F8F8',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});
