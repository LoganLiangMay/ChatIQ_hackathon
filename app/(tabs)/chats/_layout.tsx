import { Stack } from 'expo-router';

export default function ChatsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        fullScreenGestureEnabled: false, // Only edge detection
        gestureResponseDistance: 35, // Small edge area (35px) like iMessage
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="[chatId]"
        options={{
          animation: 'slide_from_right',
          animationDuration: 200, // Faster transition
        }}
      />
      <Stack.Screen name="search" />
    </Stack>
  );
}
