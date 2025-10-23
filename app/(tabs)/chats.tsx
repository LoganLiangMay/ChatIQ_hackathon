import { View, Text, StyleSheet, SectionList, TouchableOpacity, ActivityIndicator, Alert, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useChats } from '@/hooks/useChats';
import { ChatListItem } from '@/components/chat/ChatListItem';
import { NetworkStatus } from '@/components/ui/NetworkStatus';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';

export default function ChatsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { chats, loading, refreshChats } = useChats(user?.uid || '');
  
  // 🚨 Separate urgent chats from regular chats
  const chatSections = useMemo(() => {
    const urgentChats = chats.filter(chat => 
      chat.lastMessage?.priority?.isPriority && 
      chat.lastMessage.priority.score >= 0.6 // High or critical only
    );
    
    const sections = [];
    
    // Add urgent section if there are urgent chats
    if (urgentChats.length > 0) {
      sections.push({
        title: 'Urgent Messages',
        data: urgentChats,
        urgent: true
      });
    }
    
    // Add all chats section
    sections.push({
      title: 'All Chats',
      data: chats,
      urgent: false
    });
    
    return sections;
  }, [chats]);
  
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
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <NetworkStatus />
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <NetworkStatus />
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
        
        {/* Chat List with Urgent Section */}
        {chats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No chats yet</Text>
            <Text style={styles.emptySubtext}>
              Start a conversation or wait for someone to message you
            </Text>
          </View>
        ) : (
          <SectionList
            sections={chatSections}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ChatListItem chat={item} />}
            renderSectionHeader={({ section }) => (
              <View style={[
                styles.sectionHeader,
                section.urgent && styles.urgentSectionHeader
              ]}>
                {section.urgent && (
                  <Ionicons name="alert-circle" size={20} color="#FF3B30" style={styles.urgentIcon} />
                )}
                <Text style={[
                  styles.sectionHeaderText,
                  section.urgent && styles.urgentSectionHeaderText
                ]}>
                  {section.title}
                  {section.urgent && ` (${section.data.length})`}
                </Text>
              </View>
            )}
            onRefresh={refreshChats}
            refreshing={loading}
            stickySectionHeadersEnabled={true}
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  urgentSectionHeader: {
    backgroundColor: '#FFE5E5',
    borderBottomColor: '#FFB8B8',
  },
  urgentIcon: {
    marginRight: 8,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  urgentSectionHeaderText: {
    color: '#FF3B30',
  },
});

