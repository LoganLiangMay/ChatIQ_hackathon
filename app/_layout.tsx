import { useEffect, useState, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text, AppState, AppStateStatus } from 'react-native';
import { getAuth } from 'firebase/auth';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { MessageBanner } from '@/components/notifications/MessageBanner';
import { initializeFirebase } from '@/services/firebase/config';
import { initializeDatabase } from '@/services/database/sqlite';
import { networkMonitor } from '@/services/network/NetworkMonitor';
import { messageQueue } from '@/services/messages/MessageQueue';
import { notificationManager } from '@/services/notifications/NotificationManager';
import { updateOnlineStatus } from '@/services/firebase/firestore';

export default function RootLayout() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);
  
  // Banner state for in-app notifications
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerData, setBannerData] = useState<any>(null);
  
  // Initialize app
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Initializing app...');
        
        // Initialize Firebase
        await initializeFirebase();
        console.log('Firebase initialized');
        
        // Initialize SQLite database
        await initializeDatabase();
        console.log('Database initialized');
        
        // Initialize NetworkMonitor
        networkMonitor.init();
        console.log('NetworkMonitor initialized');
        
        setIsReady(true);
        console.log('App initialization complete');
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    };
    
    initialize();
    
    // Cleanup on unmount
    return () => {
      networkMonitor.cleanup();
      messageQueue.cleanup();
    };
  }, []);
  
  // Handle app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      // App came to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 App came to foreground');
        
        // Retry pending messages
        messageQueue.retryPendingMessages();
        
        // Update online status
        if (currentUser) {
          try {
            await updateOnlineStatus(currentUser.uid, true);
            console.log('✅ User status updated to online');
          } catch (error) {
            console.error('Failed to update online status:', error);
          }
        }
      }
      
      // App went to background
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        console.log('📱 App went to background');
        
        // Update offline status
        if (currentUser) {
          try {
            await updateOnlineStatus(currentUser.uid, false);
            console.log('✅ User status updated to offline');
          } catch (error) {
            console.error('Failed to update offline status:', error);
          }
        }
      }
      
      appState.current = nextAppState;
    });
    
    return () => {
      subscription.remove();
    };
  }, []);
  
  // Initialize notification manager
  useEffect(() => {
    if (!isReady) return;
    
    // Setup in-app banner callback
    notificationManager.setInAppBannerCallback((notification) => {
      console.log('📱 [RootLayout] Showing in-app banner:', notification.senderName);
      setBannerData(notification);
      setBannerVisible(true);
    });
    
    // Request notification permissions
    notificationManager.requestPermissions();
    
    // Setup notification tap handler
    const setupHandler = async () => {
      const subscription = await notificationManager.setupNotificationHandler(router);
      return subscription;
    };
    
    const cleanupPromise = setupHandler();
    
    return () => {
      cleanupPromise.then(sub => sub.remove());
    };
  }, [isReady, router]);
  
  const handleRetry = async () => {
    setError(null);
    setIsReady(false);
    
    // Re-initialize
    try {
      await initializeFirebase();
      await initializeDatabase();
      networkMonitor.init();
      setIsReady(true);
    } catch (err) {
      console.error('Retry initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize');
    }
  };

  if (error) {
    return (
      <ErrorMessage
        title="Startup Error"
        message={error}
        onRetry={handleRetry}
        retryText="Retry"
      />
    );
  }
  
  if (!isReady) {
    return (
      <LoadingSpinner 
        fullScreen 
        text="Initializing app..." 
      />
    );
  }
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        {/* In-app notification banner */}
        {bannerVisible && bannerData && (
          <MessageBanner
            senderName={bannerData.senderName}
            message={bannerData.message}
            chatId={bannerData.chatId}
            visible={bannerVisible}
            onDismiss={() => setBannerVisible(false)}
          />
        )}
        
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="groups" />
        </Stack>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  error: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    padding: 20
  }
});

