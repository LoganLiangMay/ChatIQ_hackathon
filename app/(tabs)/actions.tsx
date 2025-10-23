/**
 * Actions Screen
 * Shows all pending action items from all chats in one place
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useChats } from '@/hooks/useChats';
import { actionItemsService } from '@/services/ai/ActionItemsService';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/services/firebase/config';
import type { ActionItem } from '@/services/ai/types';

interface ActionItemWithChat extends ActionItem {
  chatId: string;
  chatName: string;
}

export default function ActionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { chats } = useChats(user?.uid || '');
  const { extractActionItems } = require('@/hooks/useAI').useAI();
  const [allActionItems, setAllActionItems] = useState<ActionItemWithChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  // Auto-scan all chats for action items on first load
  const scanAllChats = async () => {
    if (!user?.uid || !chats || chats.length === 0) return;
    
    setScanning(true);
    console.log('🔍 Scanning', chats.length, 'chats for action items...');
    
    try {
      let totalItemsFound = 0;
      
      // Extract action items from each chat (in parallel for speed)
      const extractPromises = chats.slice(0, 10).map(async (chat) => {
        try {
          const items = await extractActionItems(chat.id, 50);
          
          if (items && items.length > 0) {
            // Filter and save to Firestore
            const filteredItems = items.map((item: any) => ({
              ...item,
              owner: item.owner === 'null' ? undefined : item.owner,
              deadline: item.deadline === 'null' ? undefined : item.deadline,
            }));
            
            await actionItemsService.saveActionItems(user.uid!, chat.id, filteredItems);
            totalItemsFound += filteredItems.length;
            console.log(`✅ Found ${filteredItems.length} action items in ${chat.id}`);
          }
        } catch (error) {
          console.error(`Error extracting from chat ${chat.id}:`, error);
        }
      });
      
      await Promise.all(extractPromises);
      console.log(`✅ Scan complete! Found ${totalItemsFound} total action items`);
    } catch (error) {
      console.error('Error scanning chats:', error);
      Alert.alert('Error', 'Failed to scan chats for action items');
    } finally {
      setScanning(false);
    }
  };

  // Load action items with real-time updates
  useEffect(() => {
    if (!user?.uid) return;

    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      try {
        const firestore = await getFirebaseFirestore();
        const q = query(
          collection(firestore, 'actionItems'),
          where('userId', '==', user.uid)
        );

        unsubscribe = onSnapshot(q, async (snapshot) => {
          const items: ActionItemWithChat[] = [];

          snapshot.forEach((doc) => {
            const data = doc.data();
            const chat = chats.find(c => c.id === data.chatId);
            const chatName = chat?.type === 'group' 
              ? chat.name || 'Group Chat'
              : chat?.participantDetails?.[Object.keys(chat.participantDetails || {}).find(id => id !== user.uid) || '']?.displayName || 'Direct Chat';

            items.push({
              id: doc.id,
              task: data.task,
              owner: data.owner,
              deadline: data.deadline,
              status: data.status,
              extractedFrom: data.extractedFrom,
              chatId: data.chatId,
              chatName,
            });
          });

          // Sort by status (pending first) then by creation time
          items.sort((a, b) => {
            if (a.status !== b.status) {
              return a.status === 'pending' ? -1 : 1;
            }
            return 0;
          });

          setAllActionItems(items);
          setLoading(false);
          console.log('📋 Loaded', items.length, 'action items');
          
          // If no items found and we have chats, trigger auto-scan
          if (items.length === 0 && chats.length > 0 && !scanning) {
            console.log('📋 No action items found, triggering auto-scan...');
            await scanAllChats();
          }
        });
      } catch (error) {
        console.error('Error setting up action items listener:', error);
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, chats]);

  const loadAllActions = async () => {
    await scanAllChats();
  };

  const handleToggleItem = async (id: string) => {
    const item = allActionItems.find(i => i.id === id);
    if (!item) return;

    const newStatus = item.status === 'completed' ? 'pending' : 'completed';

    // Optimistic update
    setAllActionItems(prev => prev.map(i =>
      i.id === id
        ? { ...i, status: newStatus }
        : i
    ));

    // Update Firestore
    try {
      await actionItemsService.updateActionItemStatus(
        id,
        newStatus,
        item.chatId,
        item.extractedFrom?.messageId
      );
    } catch (error) {
      console.error('Error updating action item:', error);
      // Revert on error
      setAllActionItems(prev => prev.map(i =>
        i.id === id
          ? { ...i, status: item.status }
          : i
      ));
      Alert.alert('Error', 'Failed to update action item');
    }
  };

  const handleItemPress = (chatId: string) => {
    router.push(`/chats/${chatId}`);
  };

  const sections = [
    {
      title: 'Pending',
      data: allActionItems.filter(item => item.status === 'pending'),
    },
    {
      title: 'Completed',
      data: allActionItems.filter(item => item.status === 'completed'),
    },
  ].filter(section => section.data.length > 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>All Actions</Text>
          <TouchableOpacity onPress={loadAllActions} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading || scanning ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>
              {scanning ? 'Scanning chats for action items...' : 'Loading action items...'}
            </Text>
            {scanning && (
              <Text style={styles.loadingSubtext}>
                This may take a moment
              </Text>
            )}
          </View>
        ) : allActionItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkbox-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No action items found</Text>
            <Text style={styles.emptySubtext}>
              No pending action items were found in your recent conversations
            </Text>
            <TouchableOpacity onPress={loadAllActions} style={styles.rescanButton}>
              <Ionicons name="refresh" size={20} color="#007AFF" />
              <Text style={styles.rescanButtonText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{section.title}</Text>
                <Text style={styles.sectionCount}>{section.data.length}</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleItemPress(item.chatId)}
                activeOpacity={0.7}
              >
                <TouchableOpacity
                  onPress={() => handleToggleItem(item.id)}
                  style={styles.checkbox}
                >
                  {item.status === 'completed' ? (
                    <Ionicons name="checkmark-circle" size={28} color="#34C759" />
                  ) : (
                    <Ionicons name="ellipse-outline" size={28} color="#007AFF" />
                  )}
                </TouchableOpacity>

                <View style={styles.itemContent}>
                  <Text style={[
                    styles.taskText,
                    item.status === 'completed' && styles.taskCompleted
                  ]}>
                    {item.task}
                  </Text>
                  
                  <View style={styles.metadata}>
                    <Ionicons name="chatbubble-outline" size={12} color="#666" />
                    <Text style={styles.chatName}>{item.chatName}</Text>
                    
                    {item.deadline && item.deadline !== 'null' && (
                      <>
                        <Text style={styles.metadataDot}>•</Text>
                        <Ionicons name="time-outline" size={12} color="#666" />
                        <Text style={styles.metadataText}>{item.deadline}</Text>
                      </>
                    )}
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#C6C6C8" />
              </TouchableOpacity>
            )}
            stickySectionHeadersEnabled={true}
          />
        )}
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  rescanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F2F2F7',
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  checkbox: {
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chatName: {
    fontSize: 13,
    color: '#666',
  },
  metadataDot: {
    fontSize: 13,
    color: '#C6C6C8',
    marginHorizontal: 4,
  },
  metadataText: {
    fontSize: 13,
    color: '#666',
  },
});

