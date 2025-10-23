/**
 * ReadReceipt Component
 * Displays "Read [time]" or "Delivered" below the last message (iMessage style)
 */

import { Text, StyleSheet } from 'react-native';
import { Message } from '@/types/message';
import { formatTimestamp } from '@/utils/formatters';

interface ReadReceiptProps {
  message: Message;
  isGroup?: boolean;
}

export function ReadReceipt({ message, isGroup = false }: ReadReceiptProps) {
  const { syncStatus, readBy, deliveredTo, senderId, timestamp } = message;
  
  // Failed to sync
  if (syncStatus === 'failed') {
    return <Text style={styles.failed}>Not Delivered</Text>;
  }
  
  // Still syncing to Firebase
  if (syncStatus === 'pending') {
    return <Text style={styles.pending}>Sending...</Text>;
  }
  
  // Check if message has been read
  // For direct chats: Check if anyone OTHER than sender has read it
  // For group chats: Show count of readers
  const readersExcludingSender = readBy ? readBy.filter(id => id !== senderId) : [];
  const deliveredExcludingSender = deliveredTo ? deliveredTo.filter(id => id !== senderId) : [];
  
  if (readersExcludingSender.length > 0) {
    if (isGroup) {
      // For groups, show who has read it
      const readCount = readersExcludingSender.length;
      
      // ✅ FIXED: "Read by everyone" only if ALL recipients (excluding sender) have read
      // Note: In groups, not all participants may have received the message yet
      // So we compare against deliveredTo (who actually got it)
      if (readCount === deliveredExcludingSender.length && deliveredExcludingSender.length > 0) {
        return <Text style={styles.read}>Read by everyone</Text>;
      }
      return <Text style={styles.read}>Read by {readCount}</Text>;
    } else {
      // For direct chats, if other person (not sender) has read it
      return <Text style={styles.read}>Read {formatTimestamp(timestamp)}</Text>;
    }
  }
  
  // ✅ Check if message has been delivered (but not read yet)
  if (deliveredExcludingSender.length > 0) {
    return <Text style={styles.delivered}>Delivered</Text>;
  }
  
  // Default: just sent (no one has received yet)
  return null;
}

const styles = StyleSheet.create({
  pending: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'right',
  },
  delivered: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'right',
  },
  read: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'right',
  },
  failed: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    textAlign: 'right',
  },
});

