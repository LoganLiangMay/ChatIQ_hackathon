import { View, Text, StyleSheet } from 'react-native';

interface PriorityBadgeProps {
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  compact?: boolean;
}

/**
 * Priority Badge Component
 * 
 * Displays visual indicator for high-priority messages
 * - Low priority: Not shown
 * - Medium: Orange badge with warning icon
 * - High: Red badge with warning icon
 * - Critical: Red badge with alarm icon
 */
export function PriorityBadge({ urgencyLevel, score, compact = false }: PriorityBadgeProps) {
  // Don't show badge for low priority
  if (urgencyLevel === 'low' || score < 0.3) {
    return null;
  }

  const colors = {
    medium: '#FFA500', // Orange
    high: '#FF6B6B',   // Red
    critical: '#FF0000', // Bright red
  };

  const icons = {
    medium: '⚠️',
    high: '⚠️',
    critical: '🚨',
  };

  const backgroundColor = colors[urgencyLevel as 'medium' | 'high' | 'critical'];
  const icon = icons[urgencyLevel as 'medium' | 'high' | 'critical'];

  if (compact) {
    // Compact version - just icon
    return (
      <View style={[styles.compactBadge, { backgroundColor }]}>
        <Text style={styles.compactIcon}>{icon}</Text>
      </View>
    );
  }

  // Full version - icon + text
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.text}>{urgencyLevel.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: 12,
  },
  text: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  compactBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactIcon: {
    fontSize: 12,
  },
});


