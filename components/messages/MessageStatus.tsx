/**
 * MessageStatus Component
 * Displays delivery/read status icons for sent messages
 * 
 * Status Icons:
 * 🕐 - Sending (syncStatus: 'pending')
 * ✓ - Sent (deliveryStatus: 'sent')
 * ✓✓ - Delivered (deliveryStatus: 'delivered')
 * ✓✓ (blue) - Read (deliveryStatus: 'read')
 * ❌ - Failed (syncStatus: 'failed')
 */

import { Text, StyleSheet } from 'react-native';
import { Message } from '@/types/message';

interface MessageStatusProps {
  message: Message;
  isGroup?: boolean;
}

export function MessageStatus({ message, isGroup = false }: MessageStatusProps) {
  const { syncStatus, deliveryStatus, readBy, deliveredTo, senderId } = message;
  
  // Only show status for sent messages
  // (Don't show for received messages)
  
  // Failed to sync
  if (syncStatus === 'failed') {
    return <Text style={styles.failed}>❌</Text>;
  }
  
  // Still syncing to Firebase
  if (syncStatus === 'pending') {
    return <Text style={styles.sending}>🕐</Text>;
  }
  
  // Check if message has been read
  if (readBy && readBy.length > 0) {
    if (isGroup) {
      // For groups, show count if multiple people read it
      const readCount = readBy.filter(id => id !== senderId).length;
      if (readCount > 0) {
        return <Text style={styles.read}>✓✓</Text>;
      }
    } else {
      // For direct chats, if other person read it (more than just sender)
      if (readBy.length > 1) {
        return <Text style={styles.read}>✓✓</Text>;
      }
    }
  }
  
  // Check if message has been delivered
  if (deliveredTo && deliveredTo.length > 0) {
    if (isGroup) {
      // For groups, if delivered to anyone besides sender
      const deliveredCount = deliveredTo.filter(id => id !== senderId).length;
      if (deliveredCount > 0) {
        return <Text style={styles.delivered}>✓✓</Text>;
      }
    } else {
      // For direct chats, if delivered to other person
      if (deliveredTo.length > 1) {
        return <Text style={styles.delivered}>✓✓</Text>;
      }
    }
  }
  
  // Message sent but not yet delivered
  if (deliveryStatus === 'sent' || syncStatus === 'synced') {
    return <Text style={styles.sent}>✓</Text>;
  }
  
  // Default: sending
  return <Text style={styles.sending}>🕐</Text>;
}

const styles = StyleSheet.create({
  sending: {
    fontSize: 12,
    opacity: 0.7,
  },
  sent: {
    fontSize: 12,
    color: '#999',
  },
  delivered: {
    fontSize: 12,
    color: '#999',
  },
  read: {
    fontSize: 12,
    color: '#007AFF', // Blue to indicate read
  },
  failed: {
    fontSize: 12,
  },
});




