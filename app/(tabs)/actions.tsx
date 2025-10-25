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
import { scanTracker } from '@/services/ai/ScanTracker';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/services/firebase/config';
import type { ActionItem } from '@/services/ai/types';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

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
  const [hasScanned, setHasScanned] = useState(false);
  const [shouldScan, setShouldScan] = useState(false);

  // Load action items with real-time updates
  useEffect(() => {
    if (!user?.uid) return;

    let unsubscribe: (() => void) | undefined;
    let isMounted = true; // Track if component is mounted

    // ⚡ INCREMENTAL SCAN: Only scans NEW messages since last scan
    const scanAllChats = async (forceRescan = false) => {
      if (!isMounted || !user?.uid || !chats || chats.length === 0) return;
      if (!forceRescan && hasScanned) return;

      setScanning(true);
      if (!forceRescan) setHasScanned(true);

      try {
        let totalItemsFound = 0;
        let chatsScanned = 0;
        let chatsSkipped = 0;

        console.log('🔍 Checking', chats.length, 'chats for new messages...');

        // Process chats with concurrency limit (5 at a time)
        const BATCH_SIZE = 5;
        const chatsToCheck = chats.slice(0, 15); // Check up to 15 chats

        for (let i = 0; i < chatsToCheck.length; i += BATCH_SIZE) {
          if (!isMounted) break;

          const batch = chatsToCheck.slice(i, i + BATCH_SIZE);

          await Promise.all(batch.map(async (chat) => {
            if (!isMounted) return;

            try {
              // Get last scan timestamp
              const lastScan = await scanTracker.getLastScanTimestamp(
                user.uid!,
                chat.id,
                'actionItems'
              );

              // Check if chat has new messages
              const latestMessageTime = chat.lastMessage?.timestamp || 0;

              if (!forceRescan && latestMessageTime <= lastScan) {
                chatsSkipped++;
                console.log(`⏭️ Skipping ${chat.id} - no new messages`);
                return;
              }

              console.log(`📊 Scanning ${chat.id} for NEW action items (since ${new Date(lastScan).toLocaleString()})...`);

              // Extract action items (function will only process messages after lastScan)
              const items = await extractActionItems(chat.id, 50);

              if (!isMounted) return;

              if (items && items.length > 0) {
                // Filter and save to Firestore
                const filteredItems = items.map((item: any) => ({
                  ...item,
                  owner: item.owner === 'null' ? undefined : item.owner,
                  deadline: item.deadline === 'null' ? undefined : item.deadline,
                }));

                await actionItemsService.saveActionItems(user.uid!, chat.id, filteredItems);

                if (isMounted) {
                  totalItemsFound += filteredItems.length;
                  console.log(`✅ Found ${filteredItems.length} new action items in ${chat.id}`);
                }
              }

              // Update scan timestamp
              await scanTracker.updateLastScanTimestamp(
                user.uid!,
                chat.id,
                'actionItems',
                latestMessageTime,
                items?.length || 0
              );

              chatsScanned++;

            } catch (error) {
              if (isMounted) {
                console.error(`Error extracting from chat ${chat.id}:`, error);
              }
            }
          }));
        }

        if (isMounted) {
          console.log(`✅ Scan complete! Scanned: ${chatsScanned}, Skipped: ${chatsSkipped}, Found: ${totalItemsFound} new action items`);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error scanning chats:', error);
          Alert.alert('Error', 'Failed to scan chats for action items');
        }
      } finally {
        if (isMounted) {
          setScanning(false);
        }
      }
    };

    const setupListener = async () => {
      if (!isMounted) return;
      
      try {
        const firestore = await getFirebaseFirestore();
        
        if (!isMounted) return;
        
        const q = query(
          collection(firestore, 'actionItems'),
          where('userId', '==', user.uid)
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          if (!isMounted) return; // Don't process if unmounted
          
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

          if (isMounted) {
            setAllActionItems(items);
            setLoading(false);
            console.log('📋 Loaded', items.length, 'action items');
            
            // If no items found and we have chats, trigger auto-scan (only once)
            if (items.length === 0 && chats.length > 0 && !hasScanned) {
              console.log('📋 No action items found, triggering auto-scan...');
              scanAllChats();
            }
            
            // If manual rescan requested
            if (shouldScan && isMounted) {
              console.log('📋 Manual rescan requested...');
              setShouldScan(false);
              scanAllChats(true);
            }
          }
        });
      } catch (error) {
        if (isMounted) {
          console.error('Error setting up action items listener:', error);
          setLoading(false);
        }
      }
    };

    setupListener();

    return () => {
      isMounted = false; // Mark component as unmounted
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid, chats.length, shouldScan]); // Use chats.length instead of chats to avoid unnecessary re-runs

  const loadAllActions = () => {
    setShouldScan(true);
  };

  const handleToggleItem = async (id: string) => {
    try {
      const item = allActionItems.find(i => i.id === id);
      if (!item) {
        console.warn('Action item not found:', id);
        return;
      }

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
        console.log('✅ Action item toggled:', id, '→', newStatus);
      } catch (error) {
        console.error('Error updating action item:', error);
        // Revert on error
        setAllActionItems(prev => prev.map(i =>
          i.id === id
            ? { ...i, status: item.status }
            : i
        ));
        Alert.alert('Error', 'Failed to update action item. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error in handleToggleItem:', error);
      // Don't show alert for unexpected errors, just log them
    }
  };

  const handleItemPress = (chatId: string) => {
    try {
      console.log('📱 Navigating to chat:', chatId);
      router.push(`/chats/${chatId}`);
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Failed to open chat. Please try again.');
    }
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
    <ErrorBoundary>
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
    </ErrorBoundary>
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

