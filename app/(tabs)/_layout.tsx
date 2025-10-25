import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false, // Hide header for seamless iMessage-like design
        tabBarShowLabel: false, // Hide text labels under icons
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0.5,
          borderTopColor: '#C6C6C8',
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12, // Extra padding for iPhone home indicator
          height: Platform.OS === 'ios' ? 88 : 64, // Taller on iOS for safe area
        },
      }}
    >
      <Tabs.Screen
        name="chats"
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route);
          // Hide tab bar when on individual chat screen
          return {
            title: 'Chats',
            tabBarIcon: ({ color }) => (
              <Ionicons name="chatbubbles" size={28} color={color} />
            ),
            href: '/chats',
            tabBarStyle: routeName === '[chatId]'
              ? {
                  position: 'absolute',
                  bottom: -100, // Move offscreen instead of display:none
                  height: 0,
                  overflow: 'hidden',
                }
              : {
                  backgroundColor: '#FFFFFF',
                  borderTopWidth: 0.5,
                  borderTopColor: '#C6C6C8',
                  paddingTop: 12,
                  paddingBottom: Platform.OS === 'ios' ? 28 : 12,
                  height: Platform.OS === 'ios' ? 88 : 64,
                },
          };
        }}
      />
      <Tabs.Screen
        name="actions"
        options={{
          title: 'Actions',
          tabBarIcon: ({ color }) => (
            <Ionicons name="checkbox-outline" size={28} color={color} />
          ),
          href: '/actions',
        }}
      />
      <Tabs.Screen
        name="decisions"
        options={{
          title: 'Decisions',
          href: null, // Hidden - decisions are now project-specific
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => (
            <Ionicons name="search" size={28} color={color} />
          ),
          href: null, // Hide from tabs, accessible via chats screen
        }}
      />
      <Tabs.Screen
        name="ai-assistant"
        options={{
          title: 'AI Assistant',
          tabBarIcon: ({ color }) => (
            <Ionicons name="sparkles" size={28} color={color} />
          ),
          href: '/ai-assistant',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

