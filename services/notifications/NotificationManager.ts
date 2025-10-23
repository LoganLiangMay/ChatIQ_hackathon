/**
 * NotificationManager
 * Handles both in-app banners (foreground) and local notifications (background)
 */

import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';

interface MessageNotification {
  chatId: string;
  senderName: string;
  message: string;
  senderId: string;
}

class NotificationManager {
  private currentAppState: string = AppState.currentState;
  private inAppBannerCallback?: (notification: MessageNotification) => void;
  private permissionsGranted: boolean = false;

  constructor() {
    // Monitor app state changes
    AppState.addEventListener('change', (nextAppState) => {
      console.log('🔵 [NotificationManager] App state changed:', this.currentAppState, '→', nextAppState);
      this.currentAppState = nextAppState;
    });

    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    console.log('✅ [NotificationManager] Initialized');
  }

  /**
   * Register callback for in-app banners
   */
  setInAppBannerCallback(callback: (notification: MessageNotification) => void) {
    this.inAppBannerCallback = callback;
    console.log('✅ [NotificationManager] In-app banner callback registered');
  }

  /**
   * Handle incoming message notification
   */
  async handleIncomingMessage(
    chatId: string,
    senderName: string,
    message: string,
    senderId: string,
    currentUserId: string
  ) {
    // Don't notify for own messages
    if (senderId === currentUserId) {
      console.log('🔵 [NotificationManager] Skipping notification for own message');
      return;
    }

    const notification: MessageNotification = {
      chatId,
      senderName,
      message,
      senderId,
    };

    console.log('🔵 [NotificationManager] Handling notification, app state:', this.currentAppState);

    // Check app state
    if (this.currentAppState === 'active') {
      // App is in foreground → Show in-app banner
      console.log('📱 [NotificationManager] Showing in-app banner');
      this.showInAppBanner(notification);
    } else {
      // App is in background → Schedule local notification
      console.log('🔔 [NotificationManager] Scheduling local notification');
      await this.scheduleLocalNotification(notification);
    }
  }

  /**
   * Show in-app banner (foreground)
   */
  private showInAppBanner(notification: MessageNotification) {
    if (this.inAppBannerCallback) {
      this.inAppBannerCallback(notification);
      console.log('✅ [NotificationManager] In-app banner triggered');
    } else {
      console.warn('⚠️  [NotificationManager] No in-app banner callback registered');
    }
  }

  /**
   * Schedule local notification (background)
   */
  private async scheduleLocalNotification(notification: MessageNotification) {
    if (!this.permissionsGranted) {
      console.warn('⚠️  [NotificationManager] Permissions not granted, skipping notification');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.senderName,
          body: notification.message,
          sound: true,
          data: {
            chatId: notification.chatId,
            senderId: notification.senderId,
          },
        },
        trigger: null, // Show immediately
      });
      
      console.log('✅ [NotificationManager] Local notification scheduled');
    } catch (error) {
      console.error('❌ [NotificationManager] Failed to schedule local notification:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      console.log('🔵 [NotificationManager] Current permission status:', existingStatus);

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('🔵 [NotificationManager] Requested permissions, new status:', finalStatus);
      }

      this.permissionsGranted = finalStatus === 'granted';
      
      if (this.permissionsGranted) {
        console.log('✅ [NotificationManager] Notification permissions granted');
      } else {
        console.warn('⚠️  [NotificationManager] Notification permissions denied');
      }

      return this.permissionsGranted;
    } catch (error) {
      console.error('❌ [NotificationManager] Failed to request permissions:', error);
      return false;
    }
  }

  /**
   * Handle notification tap (when user taps a notification)
   */
  async setupNotificationHandler(router: any) {
    // Handle notification tap
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const chatId = response.notification.request.content.data.chatId;
      
      if (chatId) {
        console.log('🔵 [NotificationManager] Notification tapped, navigating to chat:', chatId);
        router.push(`/(tabs)/chats/${chatId}`);
      }
    });

    return subscription;
  }
}

export const notificationManager = new NotificationManager();


