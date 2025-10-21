/**
 * GroupInfoScreen
 * Shows group details and allows:
 * - Viewing participants
 * - Adding participants (admin only)
 * - Removing participants (admin only)
 * - Promoting/demoting admins (admin only)
 * - Editing group name (admin only)
 * - Leaving group
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { groupService } from '@/services/groups/GroupService';
import { db } from '@/services/database/sqlite';
import { useAuth } from '@/contexts/AuthContext';
import { Chat } from '@/types/chat';
import { getInitials } from '@/utils/formatters';

interface Participant {
  uid: string;
  displayName: string;
  profilePicture?: string;
  online?: boolean;
  isAdmin: boolean;
}

export default function GroupInfoScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useAuth();
  
  const [chat, setChat] = useState<Chat | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  
  // Load group info
  useEffect(() => {
    loadGroupInfo();
  }, [chatId]);
  
  const loadGroupInfo = async () => {
    if (!chatId || !user) return;
    
    setLoading(true);
    
    try {
      // Load chat from SQLite
      const chatData = await db.getChat(chatId);
      setChat(chatData);
      
      // Check if current user is admin
      const isAdmin = await groupService.isAdmin(chatId, user.uid);
      setIsCurrentUserAdmin(isAdmin);
      
      // Load participants with info
      const participantsData = await groupService.getParticipantsWithInfo(chatId);
      setParticipants(participantsData);
      
    } catch (error) {
      console.error('Error loading group info:', error);
      Alert.alert('Error', 'Failed to load group information');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.leaveGroup(chatId);
              Alert.alert('Success', 'You have left the group', [
                {
                  text: 'OK',
                  onPress: () => router.replace('/(tabs)/chats'),
                },
              ]);
            } catch (error) {
              console.error('Error leaving group:', error);
              Alert.alert('Error', 'Failed to leave group');
            }
          },
        },
      ]
    );
  };
  
  const handleRemoveParticipant = (participant: Participant) => {
    Alert.alert(
      'Remove Participant',
      `Remove ${participant.displayName} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.removeParticipant(chatId, participant.uid);
              await loadGroupInfo(); // Refresh
              Alert.alert('Success', 'Participant removed');
            } catch (error: any) {
              console.error('Error removing participant:', error);
              Alert.alert('Error', error.message || 'Failed to remove participant');
            }
          },
        },
      ]
    );
  };
  
  const handlePromoteToAdmin = async (participant: Participant) => {
    try {
      await groupService.promoteToAdmin(chatId, participant.uid);
      await loadGroupInfo(); // Refresh
      Alert.alert('Success', `${participant.displayName} is now an admin`);
    } catch (error: any) {
      console.error('Error promoting user:', error);
      Alert.alert('Error', error.message || 'Failed to promote user');
    }
  };
  
  const handleDemoteFromAdmin = async (participant: Participant) => {
    try {
      await groupService.demoteFromAdmin(chatId, participant.uid);
      await loadGroupInfo(); // Refresh
      Alert.alert('Success', `${participant.displayName} is no longer an admin`);
    } catch (error: any) {
      console.error('Error demoting user:', error);
      Alert.alert('Error', error.message || 'Failed to demote user');
    }
  };
  
  const showParticipantOptions = (participant: Participant) => {
    const isMe = participant.uid === user?.uid;
    
    const options: any[] = [];
    
    if (!isMe && isCurrentUserAdmin) {
      if (participant.isAdmin) {
        options.push({
          text: 'Demote from Admin',
          onPress: () => handleDemoteFromAdmin(participant),
        });
      } else {
        options.push({
          text: 'Make Admin',
          onPress: () => handlePromoteToAdmin(participant),
        });
      }
      
      options.push({
        text: 'Remove from Group',
        onPress: () => handleRemoveParticipant(participant),
        style: 'destructive',
      });
    }
    
    options.push({ text: 'Cancel', style: 'cancel' });
    
    if (options.length > 1) {
      Alert.alert(participant.displayName, 'Choose an action', options);
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }
  
  if (!chat) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text>Group not found</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#007AFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Group Info</Text>
          
          <View style={styles.backButton} />
        </View>
        
        <ScrollView style={styles.content}>
          {/* Group Details */}
          <View style={styles.groupHeader}>
            <View style={styles.groupAvatar}>
              <Text style={styles.groupAvatarText}>
                {getInitials(chat.name || 'Group')}
              </Text>
            </View>
            
            <Text style={styles.groupName}>{chat.name || 'Group Chat'}</Text>
            <Text style={styles.participantCount}>
              {participants.length} participants
            </Text>
          </View>
          
          {/* Participants Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Participants</Text>
            
            {participants.map((participant) => (
              <TouchableOpacity
                key={participant.uid}
                style={styles.participantItem}
                onPress={() => showParticipantOptions(participant)}
                disabled={participant.uid === user?.uid && !isCurrentUserAdmin}
              >
                <View style={styles.participantAvatar}>
                  <Text style={styles.participantAvatarText}>
                    {getInitials(participant.displayName)}
                  </Text>
                  {participant.online && (
                    <View style={styles.onlineDot} />
                  )}
                </View>
                
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>
                    {participant.displayName}
                    {participant.uid === user?.uid && ' (You)'}
                  </Text>
                  {participant.isAdmin && (
                    <Text style={styles.adminBadge}>Admin</Text>
                  )}
                </View>
                
                {isCurrentUserAdmin && participant.uid !== user?.uid && (
                  <Ionicons name="chevron-forward" size={20} color="#CCC" />
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Actions */}
          <View style={styles.section}>
            {isCurrentUserAdmin && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  Alert.alert('Coming Soon', 'Add participants feature coming soon!');
                }}
              >
                <Ionicons name="person-add" size={24} color="#007AFF" />
                <Text style={styles.actionItemText}>Add Participants</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.actionItem, styles.actionItemDanger]}
              onPress={handleLeaveGroup}
            >
              <Ionicons name="exit-outline" size={24} color="#FF3B30" />
              <Text style={styles.actionItemTextDanger}>Leave Group</Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  groupHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  groupAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupAvatarText: {
    fontSize: 36,
    fontWeight: '600',
    color: '#FFF',
  },
  groupName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  participantCount: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  participantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  participantAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    color: '#000',
    marginBottom: 2,
  },
  adminBadge: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  actionItemText: {
    fontSize: 16,
    color: '#007AFF',
  },
  actionItemDanger: {
    // No special styling for container
  },
  actionItemTextDanger: {
    fontSize: 16,
    color: '#FF3B30',
  },
});




