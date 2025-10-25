import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { SummaryResult } from '../../services/ai/types';

interface SummaryModalProps {
  visible: boolean;
  summary: SummaryResult | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.75; // 75% of screen height

/**
 * Minimal Summary Modal Component
 *
 * Clean, modern design with:
 * - Smooth slide-up animation
 * - Minimal visual elements
 * - Focus on readability
 * - Consistent dimensions
 */
export function SummaryModal({ visible, summary, loading, error, onClose }: SummaryModalProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up and fade in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down and fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Handle Bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Thread Summary</Text>
              {summary?.cached && (
                <View style={styles.cachedBadge}>
                  <Ionicons name="flash-outline" size={12} color="#34C759" />
                  <Text style={styles.cachedText}>Instant</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* Loading State */}
            {loading && (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.statusText}>Analyzing conversation...</Text>
              </View>
            )}

            {/* Error State */}
            {error && !loading && (
              <View style={styles.centerContent}>
                <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Summary Content */}
            {summary && !loading && !error && (
              <>
                {/* Metadata Pills */}
                <View style={styles.metadataContainer}>
                  <View style={styles.pill}>
                    <Ionicons name="chatbubbles-outline" size={14} color="#8E8E93" />
                    <Text style={styles.pillText}>{summary.messageCount} messages</Text>
                  </View>
                  <View style={styles.pill}>
                    <Ionicons name="people-outline" size={14} color="#8E8E93" />
                    <Text style={styles.pillText}>{summary.participants.length} people</Text>
                  </View>
                  <View style={styles.pill}>
                    <Ionicons name="time-outline" size={14} color="#8E8E93" />
                    <Text style={styles.pillText}>{formatTimeRange(summary.timeRange.start, summary.timeRange.end)}</Text>
                  </View>
                </View>

                {/* Summary Text */}
                <View style={styles.summaryContainer}>
                  <Text style={styles.summaryText}>{summary.summary}</Text>
                </View>

                {/* Participants */}
                {summary.participants.length > 0 && (
                  <View style={styles.participantsSection}>
                    <Text style={styles.sectionTitle}>Participants</Text>
                    <View style={styles.participantsList}>
                      {summary.participants.map((name, index) => (
                        <View key={index} style={styles.participantChip}>
                          <Text style={styles.participantName}>{name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Bottom Spacing */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function formatTimeRange(start: any, end: any): string {
  const startMs = typeof start === 'object' && start._seconds
    ? start._seconds * 1000
    : start;
  const endMs = typeof end === 'object' && end._seconds
    ? end._seconds * 1000
    : end;

  const duration = endMs - startMs;
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const days = Math.floor(duration / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return `${days}d`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return '<1h';
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: MODAL_HEIGHT,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 5,
    backgroundColor: '#D1D1D6',
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    letterSpacing: 0.3,
  },
  cachedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#34C75915',
    borderRadius: 12,
  },
  cachedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34C759',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  statusText: {
    marginTop: 16,
    fontSize: 15,
    color: '#8E8E93',
  },
  errorText: {
    marginTop: 16,
    fontSize: 15,
    color: '#FF3B30',
    textAlign: 'center',
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 20,
    paddingBottom: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
  },
  pillText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  summaryContainer: {
    paddingVertical: 20,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#000',
    letterSpacing: 0.2,
  },
  participantsSection: {
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  participantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  participantChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#007AFF15',
    borderRadius: 20,
  },
  participantName: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});
