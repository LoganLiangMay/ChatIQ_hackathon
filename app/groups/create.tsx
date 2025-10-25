/**
 * Group Chat Creation - User Selection Screen
 * Allows user to select multiple participants from registered users
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/services/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface User {
  uid: string;
  displayName: string;
  email: string;
  profilePicture?: string | null;
  online: boolean;
}

export default function CreateGroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const firestore = await getFirebaseFirestore();
      const usersRef = collection(firestore, 'users');
      const snapshot = await getDocs(usersRef);

      const allUsers = snapshot.docs
        .map(doc => ({
          uid: doc.id,
          displayName: doc.data().displayName || 'Unknown User',
          email: doc.data().email || '',
          profilePicture: doc.data().profilePicture || null,
          online: doc.data().online || false,
        }))
        .filter(u => u.uid !== user?.uid) // Exclude current user
        .sort((a, b) => a.displayName.localeCompare(b.displayName)); // Sort alphabetically

      setUsers(allUsers);
      console.log('✅ Loaded', allUsers.length, 'users from database');
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleNext = () => {
    if (selectedUsers.length >= 2) {
      // Navigate to group name screen with selected user IDs
      router.push({
        pathname: '/groups/name',
        params: { userIds: selectedUsers.join(',') },
      });
    }
  };

  const filteredUsers = users.filter(
    user =>
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUser = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.includes(item.uid);

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => toggleUser(item.uid)}
        activeOpacity={0.7}
      >
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {item.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.displayName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>

        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <Ionicons name="checkmark" size={18} color="#FFF" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Group</Text>
            <View style={styles.placeholderButton} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Group</Text>
          <TouchableOpacity
            onPress={handleNext}
            style={styles.nextButton}
            disabled={selectedUsers.length < 2}
          >
            <Text
              style={[
                styles.nextText,
                selectedUsers.length < 2 && styles.nextTextDisabled,
              ]}
            >
              Next
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8E8E93"
          />
        </View>

        {/* Selected Count */}
        {selectedUsers.length > 0 && (
          <View style={styles.selectedBanner}>
            <Text style={styles.selectedText}>
              {selectedUsers.length} participant{selectedUsers.length > 1 ? 's' : ''} selected
            </Text>
          </View>
        )}

        {/* User List */}
        <FlatList
          data={filteredUsers}
          keyExtractor={item => item.uid}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>No users found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Add more users to create a group chat'}
              </Text>
            </View>
          }
        />

        {/* Bottom Hint */}
        {selectedUsers.length < 2 && users.length > 0 && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>
              Select at least 2 participants to create a group
            </Text>
          </View>
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
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  nextButton: {
    paddingVertical: 8,
  },
  nextText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  nextTextDisabled: {
    color: '#C7C7CC',
  },
  placeholderButton: {
    width: 60,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#000',
  },
  selectedBanner: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  selectedText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
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
    marginTop: 60,
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
  hintContainer: {
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderTopWidth: 0.5,
    borderTopColor: '#C6C6C8',
  },
  hintText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
