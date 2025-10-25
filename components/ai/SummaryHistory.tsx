import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface DailySummary {
  id: string;
  date: string; // YYYY-MM-DD
  summary: string;
  messageCount: number;
  participants: string[];
  timeRange: {
    start: number;
    end: number;
  };
  createdAt: number;
  updatedAt: number;
  generatedBy: 'auto' | 'manual';
  userId?: string;
}

interface SummaryHistoryProps {
  visible: boolean;
  chatId: string | null;
  chatName?: string;
  onClose: () => void;
}

/**
 * Summary History Component
 * 
 * Displays historical daily summaries for a chat:
 * - Timeline view (most recent first)
 * - Date headers with day of week
 * - Expandable summary cards
 * - Auto/manual generation indicators
 * - Message count and participant info
 */
export function SummaryHistory({ visible, chatId, chatName, onClose }: SummaryHistoryProps) {
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSummary, setExpandedSummary] = useState<string | null>(null);

  useEffect(() => {
    if (visible && chatId) {
      loadSummaries();
    }
  }, [visible, chatId]);

  const loadSummaries = async () => {
    if (!chatId) return;

    setLoading(true);
    setError(null);

    try {
      const functions = getFunctions();
      const getChatSummaries = httpsCallable(functions, 'getChatSummaries');
      
      const result = await getChatSummaries({ chatId, limit: 30 });
      const data = result.data as { summaries: DailySummary[] };
      
      setSummaries(data.summaries || []);
    } catch (err: any) {
      console.error('Error loading summaries:', err);
      setError(err.message || 'Failed to load summaries');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if today
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }

    // Check if yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    // Format as "Mon, Jan 15"
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const toggleExpand = (summaryId: string) => {
    setExpandedSummary(expandedSummary === summaryId ? null : summaryId);
  };

  const getStatusColor = (generatedBy: 'auto' | 'manual'): string => {
    return generatedBy === 'auto' ? '#34C759' : '#007AFF';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Summary History</Text>
            {chatName && <Text style={styles.headerSubtitle}>{chatName}</Text>}
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading summaries...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadSummaries}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!loading && !error && summaries.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No Summaries Yet</Text>
            <Text style={styles.emptyText}>
              Daily summaries will appear here automatically, or you can generate one manually.
            </Text>
          </View>
        )}

        {/* Summaries Timeline */}
        {!loading && !error && summaries.length > 0 && (
          <ScrollView style={styles.summariesList} showsVerticalScrollIndicator={true}>
            {summaries.map((summary) => (
              <View key={summary.id} style={styles.summaryCard}>
                {/* Date Header */}
                <View style={styles.dateHeader}>
                  <View style={styles.dateLeft}>
                    <Text style={styles.dateText}>{formatDate(summary.date)}</Text>
                    <Text style={styles.messagCountText}>
                      {summary.messageCount} messages
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(summary.generatedBy) + '20' },
                    ]}
                  >
                    <Ionicons
                      name={summary.generatedBy === 'auto' ? 'time-outline' : 'person-outline'}
                      size={14}
                      color={getStatusColor(summary.generatedBy)}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(summary.generatedBy) },
                      ]}
                    >
                      {summary.generatedBy === 'auto' ? 'Auto' : 'Manual'}
                    </Text>
                  </View>
                </View>

                {/* Summary Preview/Full */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleExpand(summary.id)}
                >
                  <Text
                    style={styles.summaryText}
                    numberOfLines={expandedSummary === summary.id ? undefined : 3}
                  >
                    {summary.summary}
                  </Text>
                  
                  {summary.summary.length > 150 && (
                    <Text style={styles.expandText}>
                      {expandedSummary === summary.id ? 'Show less' : 'Show more'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Participants */}
                {summary.participants.length > 0 && (
                  <View style={styles.participantsContainer}>
                    <Ionicons name="people-outline" size={14} color="#8E8E93" />
                    <Text style={styles.participantsText}>
                      {summary.participants.join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {/* End Marker */}
            <View style={styles.endMarker}>
              <Text style={styles.endMarkerText}>
                Showing last {summaries.length} {summaries.length === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  headerRight: {
    width: 36, // Same as back button for centering
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  summariesList: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  messagCountText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#000',
    marginBottom: 8,
  },
  expandText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 4,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 6,
  },
  participantsText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  endMarker: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  endMarkerText: {
    fontSize: 13,
    color: '#8E8E93',
  },
});

