/**
 * ProjectDescriptionModal component
 * Modal for editing project description with character counter
 */

import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

interface ProjectDescriptionModalProps {
  visible: boolean;
  initialDescription: string;
  onSave: (description: string) => void;
  onCancel: () => void;
}

const MAX_CHARS = 500;

export function ProjectDescriptionModal({
  visible,
  initialDescription,
  onSave,
  onCancel,
}: ProjectDescriptionModalProps) {
  const [description, setDescription] = useState(initialDescription);
  const charCount = description.length;
  const remaining = MAX_CHARS - charCount;
  const percentage = (charCount / MAX_CHARS) * 100;

  useEffect(() => {
    setDescription(initialDescription);
  }, [initialDescription, visible]);

  const handleSave = () => {
    if (description.trim().length > 0) {
      onSave(description);
    }
  };

  // Calculate circle progress
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on usage
  const getColor = () => {
    if (percentage >= 100) return '#FF3B30'; // Red when at limit
    if (percentage >= 90) return '#FF9500'; // Orange when close
    return '#007AFF'; // Blue otherwise
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Edit Project Description</Text>

            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveButton}
              disabled={description.trim().length === 0 || charCount > MAX_CHARS}
            >
              <Text style={[
                styles.saveText,
                (description.trim().length === 0 || charCount > MAX_CHARS) && styles.saveTextDisabled
              ]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Provide context to help AI track your project more effectively
          </Text>

          {/* Text Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={(text) => {
                // Allow typing but prevent exceeding limit
                if (text.length <= MAX_CHARS) {
                  setDescription(text);
                }
              }}
              placeholder="Enter project description..."
              placeholderTextColor="#999"
              multiline
              autoFocus
              maxLength={MAX_CHARS}
              textAlignVertical="top"
            />
          </View>

          {/* Character Counter with Circular Progress */}
          <View style={styles.counterContainer}>
            <View style={styles.circleContainer}>
              <Svg width={40} height={40}>
                {/* Background circle */}
                <Circle
                  cx={20}
                  cy={20}
                  r={radius}
                  stroke="#E5E5EA"
                  strokeWidth={3}
                  fill="none"
                />
                {/* Progress circle */}
                <Circle
                  cx={20}
                  cy={20}
                  r={radius}
                  stroke={getColor()}
                  strokeWidth={3}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 20 20)`}
                />
              </Svg>
              <View style={styles.counterTextContainer}>
                <Text style={[styles.counterNumber, { color: getColor() }]}>
                  {remaining}
                </Text>
              </View>
            </View>

            <Text style={styles.counterLabel}>
              {remaining} characters remaining
            </Text>
          </View>

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Tips for better tracking:</Text>
            <Text style={styles.tipText}>• Describe the project's goals and scope</Text>
            <Text style={styles.tipText}>• Mention key deliverables or milestones</Text>
            <Text style={styles.tipText}>• Include relevant context for decision-making</Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    marginBottom: 16,
  },
  cancelButton: {
    padding: 4,
    minWidth: 60,
  },
  cancelText: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    padding: 4,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  saveTextDisabled: {
    color: '#CCC',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    padding: 12,
    minHeight: 200,
    marginBottom: 16,
  },
  input: {
    fontSize: 16,
    color: '#000',
    minHeight: 180,
    ...Platform.select({
      ios: {
        paddingTop: 0,
      },
      android: {
        textAlignVertical: 'top',
      },
    }),
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  circleContainer: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  counterTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterNumber: {
    fontSize: 12,
    fontWeight: '600',
  },
  counterLabel: {
    fontSize: 14,
    color: '#666',
  },
  tipsContainer: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
});
