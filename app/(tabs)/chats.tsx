import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useChats } from '@/hooks/useChats';
import { ChatListItem } from '@/components/chat/ChatListItem';
import { Ionicons } from '@expo/vector-icons';

export default function ChatsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { chats, loading, refreshChats } = useChats(user?.uid || '');
  
  const handleNewChat = () => {
    // Show options: New Direct Chat or New Group
    Alert.alert(
      'New Chat',
      'Choose chat type',
      [
        {
          text: 'New Group',
          onPress: () => router.push('/groups/create'),
        },
        {
          text: 'New Direct Chat',
          onPress: () => {
            // Navigate to search to find users
            router.push('/(tabs)/chats/search');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };
  
  const handleSearch = () => {
    router.push('/(tabs)/chats/search');
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chats</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
                <Ionicons name="search-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNewChat} style={styles.newChatButton}>
                <Ionicons name="create-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading chats...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
              <Ionicons name="search-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNewChat} style={styles.newChatButton}>
              <Ionicons name="create-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Chat List */}
        {chats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No chats yet</Text>
            <Text style={styles.emptySubtext}>
              Start a conversation or wait for someone to message you
            </Text>
          </View>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ChatListItem chat={item} />}
            onRefresh={refreshChats}
            refreshing={loading}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchButton: {
    padding: 8,
  },
  newChatButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
  },
});

