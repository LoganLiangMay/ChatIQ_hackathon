/**
 * OfflineBanner Component
 * Displays a banner at the top when user is offline
 */

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkState } from '@/hooks/useNetworkState';

export function OfflineBanner() {
  const { isOffline } = useNetworkState();
  
  if (!isOffline) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={16} color="#FFF" />
      <Text style={styles.text}>
        No internet connection - Messages will send when back online
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9500',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  text: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
});




