/**
 * Project Overview Modal
 * Displays AI-generated project insights with tree diagrams and progress circles
 */

import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import aiService from '@/services/ai/AIService';
import type { TreeDiagramData, ProgressData } from '@/services/ai/types';

interface Props {
  chatId: string;
  visible: boolean;
  onClose: () => void;
}

export function ProjectOverviewModal({ chatId, visible, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'progress' | 'tree'>('progress');
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<TreeDiagramData | null>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  
  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, activeTab]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'progress' && !progressData) {
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
      }
      
      if (activeTab === 'tree' && !treeData) {
        // Call extractDecisions and detectBlockers to generate tree
        const [decisions, blockers] = await Promise.all([
          aiService.trackDecisions(chatId, 30),
          aiService.detectBlockers(chatId, 30),
        ]);
        
        // Generate Mermaid code
        let mermaidCode = 'graph TD\n';
        mermaidCode += 'A[Project Start] --> B[Discussions]\n';
        
        // Add decisions
        decisions.slice(0, 5).forEach((d: any, i: number) => {
          const nodeId = `D${i}`;
          const text = d.decision.substring(0, 40).replace(/"/g, "'");
          mermaidCode += `B --> ${nodeId}["✓ ${text}..."]\n`;
        });
        
        // Add blockers
        blockers.slice(0, 3).forEach((b: any, i: number) => {
          const nodeId = `B${i}`;
          const text = b.blocker.substring(0, 30).replace(/"/g, "'");
          mermaidCode += `D0 --> ${nodeId}["🚫 ${text}..."]\n`;
        });
        
        setTreeData({
          mermaidCode,
          nodeCount: Math.min(decisions.length, 5) + Math.min(blockers.length, 3),
        });
      }
    } catch (error: any) {
      console.error('Error loading project data:', error);
      Alert.alert('Error', error.message || 'Failed to load project overview');
    } finally {
      setLoading(false);
    }
  };
  
  const renderProgressTab = () => {
    if (!progressData) return null;

    return (
      <View style={styles.tabContent}>
        {/* Progress Display */}
        <View style={{
          alignItems: 'center',
          paddingVertical: 32,
        }}>
          <Text style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: '#34C759',
          }}>{progressData.progress}%</Text>
          <Text style={{
            fontSize: 18,
            color: '#8E8E93',
            marginTop: 8,
          }}>Project Complete</Text>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{progressData.decisionsCount}</Text>
            <Text style={styles.statLabel}>Decisions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{progressData.blockersCount}</Text>
            <Text style={styles.statLabel}>Blockers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: getStatusColor(progressData.status) }]}>
              {progressData.status}
            </Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>
        
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.infoText}>
            Progress is calculated based on decisions made vs. blockers encountered. 
            AI analyzes the last 30 messages in this chat.
          </Text>
        </View>
      </View>
    );
  };
  
  const renderTreeTab = () => {
    if (!treeData) return null;
    
    const mermaidHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
        <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
        <style>
          body { 
            margin: 0; 
            padding: 20px; 
            background: white;
            overflow-x: auto;
          }
          .mermaid { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-width: 100%;
          }
        </style>
      </head>
      <body>
        <div class="mermaid">
          ${treeData.mermaidCode}
        </div>
        <script>
          mermaid.initialize({ 
            startOnLoad: true,
            theme: 'default',
            flowchart: { 
              useMaxWidth: true,
              htmlLabels: true,
              curve: 'basis'
            }
          });
        </script>
      </body>
      </html>
    `;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.infoText}>
            This diagram shows decision flows and blockers. Pinch to zoom, scroll to explore.
          </Text>
        </View>
        
        <WebView
          source={{ html: mermaidHtml }}
          style={styles.webview}
          scalesPageToFit
          scrollEnabled
          originWhitelist={['*']}
        />
      </View>
    );
  };
  
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Project Overview</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
        </View>
        
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'progress' && styles.tabActive]}
            onPress={() => setActiveTab('progress')}
          >
            <Ionicons 
              name="analytics" 
              size={20} 
              color={activeTab === 'progress' ? '#007AFF' : '#8E8E93'} 
            />
            <Text style={[styles.tabText, activeTab === 'progress' && styles.tabTextActive]}>
              Progress
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tree' && styles.tabActive]}
            onPress={() => setActiveTab('tree')}
          >
            <Ionicons 
              name="git-network" 
              size={20} 
              color={activeTab === 'tree' ? '#007AFF' : '#8E8E93'} 
            />
            <Text style={[styles.tabText, activeTab === 'tree' && styles.tabTextActive]}>
              Decision Flow
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Analyzing project...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            {activeTab === 'progress' ? renderProgressTab() : renderTreeTab()}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return '#34C759';
    case 'in-progress': return '#007AFF';
    case 'blocked': return '#FF3B30';
    case 'planning': return '#FF9500';
    default: return '#8E8E93';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: { fontSize: 20, fontWeight: '600' },
  closeButton: { padding: 4 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  tabText: { fontSize: 15, color: '#8E8E93' },
  tabTextActive: { color: '#007AFF', fontWeight: '600' },
  content: { flex: 1 },
  tabContent: { padding: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  chartCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: 200,
    height: 200,
  },
  progressPercent: { fontSize: 48, fontWeight: '700', color: '#000' },
  progressLabel: { fontSize: 16, color: '#666', marginTop: 4 },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 32,
    marginBottom: 20,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '600', color: '#000' },
  statLabel: { fontSize: 14, color: '#666', marginTop: 4 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 10,
    gap: 12,
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
  },
  webview: {
    flex: 1,
    minHeight: Dimensions.get('window').height - 250,
    marginTop: 20,
  },
});

