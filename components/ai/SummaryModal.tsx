import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import type { SummaryResult } from '../../services/ai/types';

interface SummaryModalProps {
  visible: boolean;
  summary: SummaryResult | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
}

/**
 * Summary Modal Component
 * 
 * Displays AI-generated thread summaries with:
 * - Status indicator (Actions Needed, No New Info, etc.)
 * - Main summary text
 * - Message count and participant info
 * - Time range of conversation
 * - Loading and error states
 */
export function SummaryModal({ visible, summary, loading, error, onClose }: SummaryModalProps) {
  // Debug logging
  if (visible && summary) {
    console.log('📊 Summary Modal Data:', {
      messageCount: summary.messageCount,
      participants: summary.participants.length,
      summaryLength: summary.summary?.length || 0,
      summaryPreview: summary.summary?.substring(0, 50) + '...'
    });
  }
  
  // Determine status from summary content
  const getStatus = (summaryText: string): { label: string; color: string; icon: string } => {
    const lower = summaryText.toLowerCase();
    
    // Check for action items or decisions
    if (lower.includes('action') || lower.includes('decision') || lower.includes('next step')) {
      return { label: 'Actions Needed', color: '#FF9500', icon: '⚡' };
    }
    
    // Check for important/urgent content
    if (lower.includes('important') || lower.includes('urgent') || lower.includes('critical')) {
      return { label: 'Important Update', color: '#FF3B30', icon: '🔴' };
    }
    
    // Check for unclear/no info
    if (lower.includes('unclear') || lower.includes('no textual') || lower.includes('no explicit') || 
        lower.includes('no decisions') || lower.includes('challenging to extract')) {
      return { label: 'No New Info', color: '#8E8E93', icon: '💬' };
    }
    
    // Check for planning/scheduling
    if (lower.includes('meeting') || lower.includes('schedule') || lower.includes('deadline')) {
      return { label: 'Planning Discussed', color: '#5856D6', icon: '📅' };
    }
    
    // Default - general discussion
    return { label: 'General Discussion', color: '#007AFF', icon: '💡' };
  };
  
  const status = summary ? getStatus(summary.summary) : null;
  
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>💬 Thread Summary</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Generating summary...</Text>
            </View>
          )}

          {/* Error State */}
          {error && !loading && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Summary Content */}
          {summary && !loading && !error && (
            <>
              {/* Status Indicator */}
              {status && (
                <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                  <Text style={styles.statusIcon}>{status.icon}</Text>
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>
              )}
              
              {/* Metadata */}
              <View style={styles.metadata}>
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>Messages</Text>
                  <Text style={styles.metadataValue}>{summary.messageCount}</Text>
                </View>
                <View style={styles.metadataDivider} />
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>Participants</Text>
                  <Text style={styles.metadataValue}>{summary.participants.length}</Text>
                </View>
                <View style={styles.metadataDivider} />
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>Time Range</Text>
                  <Text style={styles.metadataValue}>
                    {formatTimeRange(summary.timeRange.start, summary.timeRange.end)}
                  </Text>
                </View>
              </View>

              {/* Summary Text */}
              <ScrollView 
                style={styles.content} 
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={true}
              >
                <Text style={styles.summaryTitle}>Summary</Text>
                <Text style={styles.summaryText}>{summary.summary}</Text>

                {/* Participants */}
                <Text style={styles.participantsTitle}>Participants</Text>
                <View style={styles.participantsList}>
                  {summary.participants.map((name, index) => (
                    <View key={index} style={styles.participantItem}>
                      <Text style={styles.participantDot}>•</Text>
                      <Text style={styles.participantName}>{name}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Action Button */}
              <TouchableOpacity style={styles.actionButton} onPress={onClose}>
                <Text style={styles.actionButtonText}>Done</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function formatTimeRange(start: any, end: any): string {
  // Handle Firestore Timestamp objects
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: '#666',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  metadata: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F8F8F8',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
  },
  metadataItem: {
    flex: 1,
    alignItems: 'center',
  },
  metadataDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  metadataLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    minHeight: 200, // Ensure minimum height
  },
  contentContainer: {
    paddingBottom: 20, // Add padding at bottom for scrolling
    flexGrow: 1, // Allow content to grow
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#000', // Changed to black for better visibility
    marginBottom: 24,
    backgroundColor: '#F8F8F8', // Add light background
    padding: 12, // Add padding
    borderRadius: 8, // Add rounded corners
  },
  participantsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  participantsList: {
    marginBottom: 20,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantDot: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 8,
  },
  participantName: {
    fontSize: 15,
    color: '#333',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
});


