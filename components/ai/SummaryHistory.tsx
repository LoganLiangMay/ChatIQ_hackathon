import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
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
 * Minimal Summary History Component
 *
 * Clean timeline of daily summaries with:
 * - Smooth animations
 * - Card-based layout
 * - Expandable summaries
 * - Minimal visual clutter
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

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }

    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

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
          <TouchableOpacity onPress={onClose} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={28} color="#8E8E93" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>History</Text>
            {chatName && <Text style={styles.headerSubtitle}>{chatName}</Text>}
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        {loading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.centerContent}>
            <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadSummaries}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && summaries.length === 0 && (
          <View style={styles.centerContent}>
            <Ionicons name="document-text-outline" size={64} color="#D1D1D6" />
            <Text style={styles.emptyTitle}>No Summaries Yet</Text>
            <Text style={styles.emptyText}>
              Summaries will appear here as conversations happen.
            </Text>
          </View>
        )}

        {!loading && !error && summaries.length > 0 && (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {summaries.map((summary, index) => (
              <SummaryCard
                key={summary.id}
                summary={summary}
                isExpanded={expandedSummary === summary.id}
                onToggle={() => toggleExpand(summary.id)}
                formatDate={formatDate}
                index={index}
              />
            ))}

            {/* End Indicator */}
            <View style={styles.endIndicator}>
              <Text style={styles.endText}>
                {summaries.length} {summaries.length === 1 ? 'summary' : 'summaries'}
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

/**
 * Individual Summary Card Component
 */
function SummaryCard({
  summary,
  isExpanded,
  onToggle,
  formatDate,
  index,
}: {
  summary: DailySummary;
  isExpanded: boolean;
  onToggle: () => void;
  formatDate: (date: string) => string;
  index: number;
}) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 50,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, []);

  const isLongSummary = summary.summary.length > 200;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Date and Metadata */}
      <View style={styles.cardHeader}>
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>{formatDate(summary.date)}</Text>
          <Text style={styles.messageCount}>{summary.messageCount} msg</Text>
        </View>
        <View
          style={[
            styles.badge,
            {
              backgroundColor:
                summary.generatedBy === 'auto' ? '#34C75915' : '#007AFF15',
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: summary.generatedBy === 'auto' ? '#34C759' : '#007AFF',
              },
            ]}
          >
            {summary.generatedBy === 'auto' ? 'Auto' : 'Manual'}
          </Text>
        </View>
      </View>

      {/* Summary Text */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onToggle}
        disabled={!isLongSummary}
      >
        <Text
          style={styles.summaryText}
          numberOfLines={isExpanded ? undefined : 4}
        >
          {summary.summary}
        </Text>
        {isLongSummary && (
          <View style={styles.expandButton}>
            <Text style={styles.expandText}>
              {isExpanded ? 'Show less' : 'Show more'}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#007AFF"
            />
          </View>
        )}
      </TouchableOpacity>

      {/* Participants (only show if expanded or few participants) */}
      {summary.participants.length > 0 &&
        (isExpanded || summary.participants.length <= 3) && (
          <View style={styles.participantsRow}>
            <Ionicons name="people-outline" size={14} color="#8E8E93" />
            <Text style={styles.participantsText} numberOfLines={1}>
              {summary.participants.join(', ')}
            </Text>
          </View>
        )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#8E8E93',
  },
  errorText: {
    marginTop: 16,
    fontSize: 15,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  messageCount: {
    fontSize: 13,
    color: '#8E8E93',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#000',
    letterSpacing: 0.2,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  expandText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  participantsText: {
    fontSize: 13,
    color: '#8E8E93',
    flex: 1,
  },
  endIndicator: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  endText: {
    fontSize: 13,
    color: '#8E8E93',
  },
});
