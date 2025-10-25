/**
 * Decisions Screen
 * Shows all tracked decisions from all chats in one place
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useChats } from '@/hooks/useChats';
import { decisionsService } from '@/services/ai/DecisionsService';
import { scanTracker } from '@/services/ai/ScanTracker';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/services/firebase/config';
import type { Decision } from '@/services/ai/types';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

interface DecisionWithChat extends Decision {
  chatId: string;
  chatName: string;
}

export default function DecisionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { chats } = useChats(user?.uid || '');
  const { trackDecisions } = require('@/hooks/useAI').useAI();
  const [allDecisions, setAllDecisions] = useState<DecisionWithChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [shouldScan, setShouldScan] = useState(false);

  // Load decisions with real-time updates
  useEffect(() => {
    if (!user?.uid) return;

    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    // ⚡ INCREMENTAL SCAN: Only scans NEW messages since last scan
    const scanAllChats = async (forceRescan = false) => {
      if (!isMounted || !user?.uid || !chats || chats.length === 0) {
        console.log('⏭️ Skipping scan: not mounted or no chats');
        return;
      }
      if (!forceRescan && hasScanned) {
        console.log('⏭️ Already scanned, skipping');
        return;
      }

      setScanning(true);

      try {
        // Mark as scanned BEFORE starting to prevent re-triggers
        if (!forceRescan) setHasScanned(true);

        let totalDecisionsFound = 0;
        let chatsScanned = 0;
        let chatsSkipped = 0;
        let errorCount = 0;

        const chatsToCheck = chats.slice(0, Math.min(chats.length, 20)); // Check up to 20 chats
        console.log(`🔍 Checking ${chatsToCheck.length} chats for new messages...`);

        // Process in batches of 3 (slower but more reliable for decisions)
        const BATCH_SIZE = 3;

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
                'decisions'
              );

              // Check if chat has new messages
              const latestMessageTime = chat.lastMessage?.timestamp || 0;

              if (!forceRescan && latestMessageTime <= lastScan) {
                chatsSkipped++;
                console.log(`⏭️ Skipping ${chat.id} - no new messages`);
                return;
              }

              console.log(`📊 Scanning ${chat.id} for NEW decisions (since ${new Date(lastScan).toLocaleString()})...`);

              // Add 30-second timeout per chat (OpenAI can take time with large message batches)
              const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Timeout after 30s')), 30000);
              });

              // Extract decisions (reduced to 30 messages for faster processing)
              const decisions = await Promise.race([
                trackDecisions(chat.id, 30),
                timeoutPromise
              ]);

              if (!isMounted) return;

              if (decisions && decisions.length > 0) {
                await decisionsService.saveDecisions(user.uid!, chat.id, decisions);

                if (isMounted) {
                  totalDecisionsFound += decisions.length;
                  console.log(`✅ Found ${decisions.length} new decisions in chat`);
                }
              }

              // Update scan timestamp
              await scanTracker.updateLastScanTimestamp(
                user.uid!,
                chat.id,
                'decisions',
                latestMessageTime,
                decisions?.length || 0
              );

              chatsScanned++;

            } catch (error: any) {
              errorCount++;
              if (isMounted) {
                console.error(`❌ Error extracting decisions:`, error?.message || error);
              }
              // Continue to next chat
            }
          }));
        }

        if (isMounted) {
          console.log(`✅ Scan complete! Scanned: ${chatsScanned}, Skipped: ${chatsSkipped}, Found: ${totalDecisionsFound} decisions`);

          if (errorCount > 0 && totalDecisionsFound > 0) {
            Alert.alert(
              'Scan Complete',
              `Found ${totalDecisionsFound} decisions. ${errorCount} chats had errors.`,
              [{ text: 'OK' }]
            );
          }
        }
      } catch (error: any) {
        if (isMounted) {
          console.error('❌ Fatal error scanning chats:', error?.message || error);
          Alert.alert('Error', `Failed to scan: ${error?.message || 'Unknown error'}`);
        }
      } finally {
        if (isMounted) {
          console.log('🏁 Scan finished');
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
          collection(firestore, 'decisions'),
          where('userId', '==', user.uid)
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          if (!isMounted) return;
          
          const decisions: DecisionWithChat[] = [];

          snapshot.forEach((doc) => {
            const data = doc.data();
            const chat = chats.find(c => c.id === data.chatId);
            const chatName = chat?.type === 'group' 
              ? chat.name || 'Group Chat'
              : chat?.participantDetails?.[Object.keys(chat.participantDetails || {}).find(id => id !== user.uid) || '']?.displayName || 'Direct Chat';

            decisions.push({
              id: doc.id,
              decision: data.decision,
              context: data.context,
              participants: data.participants || [],
              timestamp: data.timestamp,
              extractedFrom: data.extractedFrom,
              chatId: data.chatId,
              chatName,
            });
          });

          // Sort by timestamp (most recent first)
          decisions.sort((a, b) => b.timestamp - a.timestamp);

          if (isMounted) {
            setAllDecisions(decisions);
            setLoading(false);
            console.log('📋 Loaded', decisions.length, 'decisions from Firestore');
            
            // If no decisions found and we have chats, trigger auto-scan (only once)
            if (decisions.length === 0 && chats.length > 0 && !hasScanned && !scanning) {
              console.log('📋 No decisions found, triggering auto-scan...');
              // Delay slightly to avoid race conditions
              setTimeout(() => {
                if (isMounted && !hasScanned) {
                  scanAllChats();
                }
              }, 500);
            }
            
            // If manual rescan requested
            if (shouldScan && isMounted && !scanning) {
              console.log('📋 Manual rescan requested...');
              setShouldScan(false);
              scanAllChats(true);
            }
          }
        });
      } catch (error) {
        if (isMounted) {
          console.error('Error setting up decisions listener:', error);
          setLoading(false);
        }
      }
    };

    setupListener();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid, chats.length, shouldScan]);

  const loadAllDecisions = () => {
    setShouldScan(true);
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

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Group decisions by date
  const groupedDecisions = allDecisions.reduce((acc, decision) => {
    const dateKey = formatDate(decision.timestamp);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(decision);
    return acc;
  }, {} as Record<string, DecisionWithChat[]>);

  const sections = Object.entries(groupedDecisions).map(([title, data]) => ({
    title,
    data,
  }));

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Decisions</Text>
            <TouchableOpacity onPress={loadAllDecisions} style={styles.refreshButton}>
              <Ionicons name="refresh" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading || scanning ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>
                {scanning ? 'Scanning chats for decisions...' : 'Loading decisions...'}
              </Text>
              {scanning && (
                <Text style={styles.loadingSubtext}>
                  This may take a moment
                </Text>
              )}
            </View>
          ) : allDecisions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="git-branch-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>No decisions found</Text>
              <Text style={styles.emptySubtext}>
                No decisions were tracked in your recent conversations
              </Text>
              <TouchableOpacity onPress={loadAllDecisions} style={styles.rescanButton}>
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
                  style={styles.decisionItem}
                  onPress={() => handleItemPress(item.chatId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name="git-branch" size={20} color="#007AFF" />
                  </View>

                  <View style={styles.itemContent}>
                    <Text style={styles.decisionText}>
                      {item.decision}
                    </Text>
                    
                    {item.context && (
                      <Text style={styles.contextText} numberOfLines={2}>
                        {item.context}
                      </Text>
                    )}
                    
                    <View style={styles.metadata}>
                      <Ionicons name="chatbubble-outline" size={12} color="#666" />
                      <Text style={styles.chatName}>{item.chatName}</Text>
                      
                      {item.participants && item.participants.length > 0 && (
                        <>
                          <Text style={styles.metadataDot}>•</Text>
                          <Ionicons name="people-outline" size={12} color="#666" />
                          <Text style={styles.metadataText}>
                            {item.participants.join(', ')}
                          </Text>
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
  decisionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  decisionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  contextText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
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
    maxWidth: 150,
  },
});

