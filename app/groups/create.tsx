/**
 * CreateGroupScreen
 * Allows user to create a new group chat by:
 * 1. Entering group name
 * 2. Selecting participants
 * 3. Creating the group
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { groupService } from '@/services/groups/GroupService';
import { useAuth } from '@/contexts/AuthContext';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  
  // Placeholder user IDs for testing
  // In a real app, you'd fetch users from Firestore and show a searchable list
  const availableUsers = [
    { uid: 'user2', displayName: 'Alice Johnson' },
    { uid: 'user3', displayName: 'Bob Smith' },
    { uid: 'user4', displayName: 'Carol Davis' },
  ];
  
  const handleToggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };
  
  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one participant');
      return;
    }
    
    setCreating(true);
    
    try {
      const chatId = await groupService.createGroup(
        groupName.trim(),
        selectedUsers
      );
      
      Alert.alert('Success', 'Group created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            router.replace(`/(tabs)/chats/${chatId}`);
          },
        },
      ]);
      
    } catch (error) {
      console.error('Failed to create group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setCreating(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={28} color="#007AFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>New Group</Text>
          
          <TouchableOpacity
            onPress={handleCreate}
            disabled={creating || !groupName.trim() || selectedUsers.length === 0}
            style={styles.createButton}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text
                style={[
                  styles.createButtonText,
                  (!groupName.trim() || selectedUsers.length === 0) && styles.createButtonTextDisabled,
                ]}
              >
                Create
              </Text>
            )}
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          {/* Group Name Input */}
          <View style={styles.section}>
            <View style={styles.groupIconContainer}>
              <View style={styles.groupIcon}>
                <Ionicons name="people" size={32} color="#FFF" />
              </View>
            </View>
            
            <TextInput
              style={styles.groupNameInput}
              placeholder="Group name"
              placeholderTextColor="#999"
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
              autoFocus
            />
          </View>
          
          {/* Participant Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Add Participants ({selectedUsers.length})
            </Text>
            
            {availableUsers.map((user) => {
              const isSelected = selectedUsers.includes(user.uid);
              
              return (
                <TouchableOpacity
                  key={user.uid}
                  style={styles.userItem}
                  onPress={() => handleToggleUser(user.uid)}
                >
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {user.displayName.charAt(0)}
                    </Text>
                  </View>
                  
                  <Text style={styles.userName}>{user.displayName}</Text>
                  
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#FFF" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            
            {availableUsers.length === 0 && (
              <Text style={styles.emptyText}>No users available</Text>
            )}
          </View>
        </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  createButton: {
    padding: 4,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  createButtonTextDisabled: {
    color: '#CCC',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  groupIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  groupIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupNameInput: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  userName: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 40,
  },
});




