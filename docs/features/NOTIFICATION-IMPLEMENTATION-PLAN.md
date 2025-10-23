# Notification Implementation Plan for MessageAI

## Goal
Implement a notification system that works in Expo Go using **Firestore listeners + Local Notifications + In-App Banners** pattern.

---

## Architecture

### Pattern: Firestore Listener → Local Notification/Banner

```
Firestore (messages collection)
    ↓ (onSnapshot listener)
App receives new message
    ↓
Check: App state (foreground/background)
    ↓
┌─────────────────────┬──────────────────────┐
│   Foreground        │     Background       │
│ Show in-app banner  │  Local notification  │
└─────────────────────┴──────────────────────┘
```

**Key Point**: We already have Firestore real-time listeners! No need for WebSockets.

---

## What You Have vs. What You Need

### ✅ Already Implemented:
1. **Firestore listeners** (`hooks/useMessages.ts` - line 60)
   - Already listening for new messages
   - Already detecting new messages in real-time

2. **NotificationService** (`services/notifications/NotificationService.ts`)
   - Has basic structure
   - Requests permissions
   - Shows notifications

3. **AppState detection** (`app/_layout.tsx` - line 57)
   - Already tracking if app is in background

### ❌ Missing:
1. **In-app banner component** (for foreground notifications)
2. **Local notification trigger** (when app is in background)
3. **Notification scheduling** based on AppState
4. **Sound/vibration/badge handling**

---

## Implementation Steps

### **Step 1: Create In-App Banner Component**

**File**: `components/notifications/MessageBanner.tsx`

```typescript
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface MessageBannerProps {
  senderName: string;
  message: string;
  chatId: string;
  visible: boolean;
  onDismiss: () => void;
}

export function MessageBanner({ 
  senderName, 
  message, 
  chatId, 
  visible, 
  onDismiss 
}: MessageBannerProps) {
  const router = useRouter();
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      // Slide down
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.spring(slideAnim, {
      toValue: -100,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const handlePress = () => {
    handleDismiss();
    router.push(`/(tabs)/chats/${chatId}`);
  };

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.banner,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <TouchableOpacity 
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {senderName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.textContent}>
          <Text style={styles.senderName} numberOfLines={1}>
            {senderName}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>
        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#FFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#007AFF',
    paddingTop: 50, // Account for status bar
    paddingBottom: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  textContent: {
    flex: 1,
  },
  senderName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
  },
});
```

---

### **Step 2: Create Notification Manager**

**File**: `services/notifications/NotificationManager.ts`

```typescript
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

  constructor() {
    // Monitor app state
    AppState.addEventListener('change', (nextAppState) => {
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
  }

  /**
   * Register callback for in-app banners
   */
  setInAppBannerCallback(callback: (notification: MessageNotification) => void) {
    this.inAppBannerCallback = callback;
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
    if (senderId === currentUserId) return;

    const notification: MessageNotification = {
      chatId,
      senderName,
      message,
      senderId,
    };

    // Check app state
    if (this.currentAppState === 'active') {
      // App is in foreground → Show in-app banner
      this.showInAppBanner(notification);
    } else {
      // App is in background → Schedule local notification
      await this.scheduleLocalNotification(notification);
    }
  }

  /**
   * Show in-app banner (foreground)
   */
  private showInAppBanner(notification: MessageNotification) {
    if (this.inAppBannerCallback) {
      this.inAppBannerCallback(notification);
    } else {
      console.warn('No in-app banner callback registered');
    }
  }

  /**
   * Schedule local notification (background)
   */
  private async scheduleLocalNotification(notification: MessageNotification) {
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
      
      console.log('✅ Local notification scheduled');
    } catch (error) {
      console.error('Failed to schedule local notification:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }
}

export const notificationManager = new NotificationManager();
```

---

### **Step 3: Update useMessages Hook**

**File**: `hooks/useMessages.ts` (modify existing)

Add notification trigger when receiving messages:

```typescript
import { notificationManager } from '@/services/notifications/NotificationManager';

// Inside onSnapshot callback (line ~70):
if (firestoreMessage.senderId !== currentUserId) {
  // Mark as delivered
  await messageService.markAsDelivered(chatId, messageId, currentUserId);
  
  // Get chat info for notification
  const chat = await db.getChat(chatId);
  
  // TRIGGER NOTIFICATION
  await notificationManager.handleIncomingMessage(
    chatId,
    firestoreMessage.senderName,
    message.content || '📷 Image',
    firestoreMessage.senderId,
    currentUserId
  );
}
```

---

### **Step 4: Add Banner to Root Layout**

**File**: `app/_layout.tsx`

```typescript
import { useState } from 'react';
import { MessageBanner } from '@/components/notifications/MessageBanner';
import { notificationManager } from '@/services/notifications/NotificationManager';

export default function RootLayout() {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerData, setBannerData] = useState<any>(null);

  // Initialize notification manager
  useEffect(() => {
    notificationManager.setInAppBannerCallback((notification) => {
      setBannerData(notification);
      setBannerVisible(true);
    });
    
    notificationManager.requestPermissions();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        {/* Banner overlay */}
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
```

---

## How It Works

### **Scenario 1: App in Foreground** (User is actively using the app)
1. New message arrives in Firestore
2. `useMessages` hook detects it via `onSnapshot`
3. Calls `notificationManager.handleIncomingMessage()`
4. Checks `AppState.currentState === 'active'`
5. Triggers in-app banner callback
6. **MessageBanner slides down from top** (looks like iOS notification)
7. User can tap to open chat or swipe to dismiss
8. Auto-dismisses after 4 seconds

### **Scenario 2: App in Background** (User switched to another app)
1. New message arrives in Firestore
2. `useMessages` hook still running (React Native keeps listeners alive briefly)
3. Calls `notificationManager.handleIncomingMessage()`
4. Checks `AppState.currentState === 'background'`
5. **Schedules local notification** via Expo Notifications API
6. **System notification appears** (looks like a real push notification)
7. User taps notification → Opens app to that chat

---

## Comparison: Push vs. This Pattern

| Feature | Real Push (FCM/APNs) | Firestore + Local |
|---------|---------------------|-------------------|
| Works in Expo Go | ❌ No | ✅ Yes |
| Foreground notifications | ✅ Yes | ✅ Yes (in-app banner) |
| Background notifications | ✅ Yes | ✅ Yes (local notif) |
| App closed notifications | ✅ Yes | ⚠️ Limited* |
| Setup complexity | 🔴 High | 🟢 Low |
| Server requirements | FCM/APNs | None |

*When app is completely closed, Firestore listeners stop. But:
- iOS: Keeps background processes running for ~10 mins
- Android: More aggressive, but still works for a bit
- For production, you'd add real push notifications

---

## Benefits of This Approach

1. ✅ **Works in Expo Go** (perfect for testing on your iPad)
2. ✅ **No FCM/APNs setup** needed during development
3. ✅ **UX is identical** to real push notifications
4. ✅ **Easy to implement** (just modify existing hooks)
5. ✅ **Can upgrade later** to real push without changing UI

---

## Next Steps

1. Create `MessageBanner` component
2. Create `NotificationManager` service
3. Update `useMessages` hook to trigger notifications
4. Add banner to `_layout.tsx`
5. Test:
   - Send message from browser (Kevin)
   - App in foreground → See banner
   - Switch to home screen → See system notification
   - Tap notification → Opens chat

---

## Real Push Notifications (Future)

When you're ready for production, upgrade to real push:

1. Keep the same `MessageBanner` (foreground)
2. Replace local notifications with FCM/APNs
3. Add Cloud Functions to send push when message created
4. Update `NotificationManager` to handle remote push

**Everything else stays the same!** The in-app banner and UX remain identical.

---

## Answering Your Original Question

> "local notifications"? Does that mean only foreground notifications or in-app banners that look like notifications?

**Answer**:
- **Local notifications**: System notifications (like push) but triggered by your app, not a server
- **They work in**: Background AND foreground
- **They look like**: Real system notifications (not just in-app UI)
- **In-app banners**: Custom UI that only shows when app is open

**The pattern combines both**:
- Foreground → In-app banner (custom UI)
- Background → Local notification (system UI)

This gives you the full push notification experience without needing FCM/APNs during development!


