import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Root index route - redirects to appropriate screen based on auth state
 */
export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Redirect based on auth state
    if (user) {
      console.log('User authenticated, redirecting to chats');
      router.replace('/(tabs)/chats');
    } else {
      console.log('User not authenticated, redirecting to sign in');
      router.replace('/(auth)/sign-in');
    }
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

