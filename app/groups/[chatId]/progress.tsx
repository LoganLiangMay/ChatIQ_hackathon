/**
 * Project Progress Screen
 * Shows AI-calculated project progress and statistics
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import aiService from '@/services/ai/AIService';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

interface ProgressData {
  progress: number;
  decisionsCount: number;
  blockersCount: number;
  status: 'planning' | 'in-progress' | 'blocked' | 'completed';
}

export default function ProjectProgressScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);

  useEffect(() => {
    loadProgress();
  }, [chatId]);

  const loadProgress = async () => {
    if (!chatId) return;

    setLoading(true);
    try {
      // Call extractDecisions and detectBlockers to calculate progress
      const [decisions, blockers] = await Promise.all([
        aiService.trackDecisions(chatId, 30),
        aiService.detectBlockers(chatId, 30),
      ]);

      // Calculate progress
      const totalActions = decisions.length + blockers.length;
      const progress = totalActions > 0
        ? Math.round((decisions.length / totalActions) * 100)
        : 0;

      const status = blockers.length > 2 ? 'blocked'
        : decisions.length > 5 ? 'in-progress'
        : 'planning';

      setProgressData({
        progress,
        decisionsCount: decisions.length,
        blockersCount: blockers.length,
        status,
      });
    } catch (error: any) {
      console.error('Error loading project progress:', error);
      Alert.alert('Error', error.message || 'Failed to load project progress');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProgress();
    setRefreshing(false);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'in-progress': return '#007AFF';
      case 'blocked': return '#FF3B30';
      case 'planning': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'in-progress': return 'hourglass';
      case 'blocked': return 'alert-circle';
      case 'planning': return 'bulb';
      default: return 'help-circle';
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color="#007AFF" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Project Progress</Text>

            <TouchableOpacity
              onPress={loadProgress}
              style={styles.refreshButton}
              disabled={loading}
            >
              <Ionicons
                name={loading ? 'hourglass' : 'refresh'}
                size={24}
                color="#007AFF"
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#007AFF"
              />
            }
          >
            {loading && !progressData ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Analyzing project...</Text>
              </View>
            ) : progressData ? (
              <>
                {/* Progress Circle */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressCircle}>
                    <Text style={styles.progressPercent}>{progressData.progress}%</Text>
                  </View>
                  <Text style={styles.progressLabel}>Project Complete</Text>
                </View>

                {/* Status Card */}
                <View style={styles.statusCard}>
                  <Ionicons
                    name={getStatusIcon(progressData.status)}
                    size={32}
                    color={getStatusColor(progressData.status)}
                  />
                  <View style={styles.statusInfo}>
                    <Text style={styles.statusLabel}>Current Status</Text>
                    <Text
                      style={[
                        styles.statusValue,
                        { color: getStatusColor(progressData.status) },
                      ]}
                    >
                      {progressData.status.split('-').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </Text>
                  </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <View style={styles.statIconContainer}>
                      <Ionicons name="checkmark-circle" size={28} color="#34C759" />
                    </View>
                    <Text style={styles.statValue}>{progressData.decisionsCount}</Text>
                    <Text style={styles.statLabel}>Decisions Made</Text>
                  </View>

                  <View style={styles.statCard}>
                    <View style={styles.statIconContainer}>
                      <Ionicons name="alert-circle" size={28} color="#FF3B30" />
                    </View>
                    <Text style={styles.statValue}>{progressData.blockersCount}</Text>
                    <Text style={styles.statLabel}>Blockers</Text>
                  </View>
                </View>

                {/* Info Box */}
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>How Progress is Calculated</Text>
                    <Text style={styles.infoText}>
                      Progress is calculated based on decisions made vs. blockers encountered.
                      AI analyzes the last 30 messages in this project to determine the current state.
                    </Text>
                  </View>
                </View>

                {/* Status Descriptions */}
                <View style={styles.statusDescriptions}>
                  <Text style={styles.sectionTitle}>Status Guide</Text>

                  <View style={styles.statusDescItem}>
                    <Ionicons name="bulb" size={20} color="#FF9500" />
                    <View style={styles.statusDescContent}>
                      <Text style={styles.statusDescTitle}>Planning</Text>
                      <Text style={styles.statusDescText}>
                        Early stage with few decisions made
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statusDescItem}>
                    <Ionicons name="hourglass" size={20} color="#007AFF" />
                    <View style={styles.statusDescContent}>
                      <Text style={styles.statusDescTitle}>In Progress</Text>
                      <Text style={styles.statusDescText}>
                        Active development with multiple decisions
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statusDescItem}>
                    <Ionicons name="alert-circle" size={20} color="#FF3B30" />
                    <View style={styles.statusDescContent}>
                      <Text style={styles.statusDescTitle}>Blocked</Text>
                      <Text style={styles.statusDescText}>
                        Multiple blockers need attention
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statusDescItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                    <View style={styles.statusDescContent}>
                      <Text style={styles.statusDescTitle}>Completed</Text>
                      <Text style={styles.statusDescText}>
                        All decisions made, no blockers remaining
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="analytics-outline" size={80} color="#CCC" />
                <Text style={styles.emptyText}>No Progress Data</Text>
                <Text style={styles.emptySubtext}>
                  Start a conversation in this project to track progress
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  refreshButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  progressContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  progressCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#34C759',
  },
  progressPercent: {
    fontSize: 56,
    fontWeight: '700',
    color: '#34C759',
  },
  progressLabel: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statusInfo: {
    flex: 1,
    marginLeft: 16,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
  },
  statusDescriptions: {
    backgroundColor: '#FFF',
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  statusDescItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statusDescContent: {
    flex: 1,
    marginLeft: 12,
  },
  statusDescTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  statusDescText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 24,
    fontSize: 22,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
});
