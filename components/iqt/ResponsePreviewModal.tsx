/**
 * ResponsePreviewModal Component
 * Preview AI-generated responses with confidence score and sources
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Source {
  type: 'rag' | 'bulletin';
  content: string;
  score?: number;
}

interface ResponsePreviewProps {
  visible: boolean;
  responseText: string;
  confidence: number;
  sources: Source[];
  reason?: string;
  chatId: string;
  onSend: (text: string) => Promise<void>;
  onIgnore: () => void;
  onClose: () => void;
}

export function ResponsePreviewModal({
  visible,
  responseText,
  confidence,
  sources,
  reason,
  chatId,
  onSend,
  onIgnore,
  onClose
}: ResponsePreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(responseText);
  const [sending, setSending] = useState(false);

  // Reset edited text when responseText changes
  React.useEffect(() => {
    setEditedText(responseText);
    setIsEditing(false);
  }, [responseText]);

  const handleSend = async () => {
    try {
      setSending(true);
      await onSend(isEditing ? editedText : responseText);
      onClose();
    } catch (error: any) {
      console.error('Failed to send response:', error);
      Alert.alert('Error', error.message || 'Failed to send response');
    } finally {
      setSending(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedText(responseText);
    setIsEditing(false);
  };

  const getConfidenceColor = () => {
    if (confidence >= 0.8) return '#34C759';
    if (confidence >= 0.6) return '#FF9500';
    return '#FF3B30';
  };

  const getConfidenceLabel = () => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="sparkles" size={24} color="#007AFF" />
            <Text style={styles.headerTitle}>AI Response Preview</Text>
          </View>
          <TouchableOpacity onPress={onClose} disabled={sending}>
            <Ionicons name="close" size={28} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Confidence Score */}
          <View style={styles.confidenceCard}>
            <View style={styles.confidenceHeader}>
              <Text style={styles.confidenceLabel}>Confidence Score</Text>
              <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor() }]}>
                <Text style={styles.confidenceValue}>
                  {Math.round(confidence * 100)}%
                </Text>
              </View>
            </View>
            <Text style={[styles.confidenceText, { color: getConfidenceColor() }]}>
              {getConfidenceLabel()}
            </Text>
            {reason && (
              <Text style={styles.reasonText}>{reason}</Text>
            )}
          </View>

          {/* Response Preview/Edit */}
          <View style={styles.responseCard}>
            <View style={styles.responseHeader}>
              <Text style={styles.responseLabel}>
                {isEditing ? 'Edit Response' : 'Generated Response'}
              </Text>
              {!isEditing && (
                <TouchableOpacity onPress={handleEdit} disabled={sending}>
                  <Ionicons name="pencil" size={20} color="#007AFF" />
                </TouchableOpacity>
              )}
            </View>

            {isEditing ? (
              <>
                <TextInput
                  style={styles.responseInput}
                  value={editedText}
                  onChangeText={setEditedText}
                  multiline
                  placeholder="Edit your response..."
                  placeholderTextColor="#999"
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={styles.cancelEditButton}
                  onPress={handleCancelEdit}
                  disabled={sending}
                >
                  <Text style={styles.cancelEditText}>Cancel Edit</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.responseText}>{responseText}</Text>
            )}
          </View>

          {/* Sources */}
          {sources.length > 0 && (
            <View style={styles.sourcesCard}>
              <Text style={styles.sourcesLabel}>Sources Used</Text>
              {sources.map((source, index) => (
                <View key={index} style={styles.sourceItem}>
                  <View style={styles.sourceHeader}>
                    <Ionicons
                      name={source.type === 'rag' ? 'document-text' : 'bookmark'}
                      size={16}
                      color="#007AFF"
                    />
                    <Text style={styles.sourceType}>
                      {source.type === 'rag' ? 'Knowledge Base' : 'Key Message'}
                    </Text>
                    {source.score !== undefined && (
                      <Text style={styles.sourceScore}>
                        {Math.round(source.score * 100)}%
                      </Text>
                    )}
                  </View>
                  <Text style={styles.sourceContent} numberOfLines={3}>
                    {source.content}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.infoText}>
              This response was generated based on your personality profile and knowledge base.
              You can send it as-is, edit it, or ignore it.
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.ignoreButton]}
            onPress={onIgnore}
            disabled={sending}
          >
            <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
            <Text style={styles.ignoreButtonText}>Ignore</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.sendButton, sending && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={sending}
          >
            {sending ? (
              <>
                <ActivityIndicator color="#FFF" size="small" />
                <Text style={styles.sendButtonText}>Sending...</Text>
              </>
            ) : (
              <>
                <Ionicons name="send" size={20} color="#FFF" />
                <Text style={styles.sendButtonText}>
                  {isEditing ? 'Send Edited' : 'Send'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000'
  },
  content: {
    flex: 1,
    padding: 20
  },
  confidenceCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  confidenceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000'
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF'
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4
  },
  reasonText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginTop: 4
  },
  responseCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  responseLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000'
  },
  responseText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22
  },
  responseInput: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#000',
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#007AFF'
  },
  cancelEditButton: {
    marginTop: 8,
    alignSelf: 'flex-end'
  },
  cancelEditText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500'
  },
  sourcesCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  sourcesLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12
  },
  sourceItem: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6
  },
  sourceType: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#007AFF'
  },
  sourceScore: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666'
  },
  sourceContent: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 16
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#C6C6C8'
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12
  },
  ignoreButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#FF3B30'
  },
  ignoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30'
  },
  sendButton: {
    backgroundColor: '#007AFF'
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC'
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF'
  }
});
