/**
 * Group Chat Creation - Group Name Screen
 * Allows user to enter group name and create the group
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getDoc, doc } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/services/firebase/config';
import { createGroupChat } from '@/services/firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface Participant {
  uid: string;
  displayName: string;
}

export default function GroupNameScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [groupName, setGroupName] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [projectType, setProjectType] = useState<'group' | 'project'>('group');
  const [projectDescription, setProjectDescription] = useState('');

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    try {
      const userIds = (params.userIds as string).split(',');
      const firestore = await getFirebaseFirestore();

      // Fetch participant details
      const participantPromises = userIds.map(async uid => {
        try {
          const userRef = doc(firestore, 'users', uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            return {
              uid,
              displayName: userSnap.data().displayName || 'Unknown',
            };
          }
          return { uid, displayName: 'Unknown' };
        } catch (error) {
          console.error('Error fetching user:', uid, error);
          return { uid, displayName: 'Unknown' };
        }
      });

      const participantData = await Promise.all(participantPromises);
      setParticipants(participantData);
    } catch (error) {
      console.error('Failed to load participants:', error);
      Alert.alert('Error', 'Failed to load participant details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Group Name Required', 'Please enter a name for your group');
      return;
    }

    if (projectType === 'project' && !projectDescription.trim()) {
      Alert.alert('Description Required', 'Please provide a description for your project to enable AI tracking.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be signed in to create a group');
      return;
    }

    setCreating(true);

    try {
      const userIds = (params.userIds as string).split(',');
      
      // Include current user in participants
      const allParticipants = [user.uid, ...userIds];

      console.log('Creating group chat:', groupName, allParticipants, 'Type:', projectType);

      // Create group chat with project metadata
      const chatId = await createGroupChat(groupName, allParticipants, {
        projectType,
        projectDescription: projectType === 'project' ? projectDescription : undefined,
        aiTrackingEnabled: projectType === 'project',
      });

      console.log('✅ Group chat created:', chatId);

      // Navigate to the new group chat
      router.replace(`/(tabs)/chats/${chatId}`);
    } catch (error) {
      console.error('Failed to create group:', error);
      Alert.alert('Error', 'Failed to create group chat. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isValidName = groupName.trim().length > 0 && groupName.trim().length <= 50;
  const totalParticipants = participants.length + 1; // +1 for current user

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Group</Text>
            <View style={styles.placeholderButton} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Group</Text>
          <View style={styles.placeholderButton} />
        </View>

        {/* Group Name Input */}
        <View style={styles.nameSection}>
          <Text style={styles.label}>Group Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter group name"
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
              placeholderTextColor="#8E8E93"
              autoFocus
            />
            <Text style={styles.charCount}>{groupName.length}/50</Text>
          </View>
        </View>

        {/* Type Selector */}
        <View style={styles.typeSection}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.typePicker}>
            <TouchableOpacity
              style={[styles.typeOption, projectType === 'group' && styles.typeOptionActive]}
              onPress={() => setProjectType('group')}
            >
              <Text style={[styles.typeOptionText, projectType === 'group' && styles.typeOptionTextActive]}>
                Group (Casual Chat)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeOption, projectType === 'project' && styles.typeOptionActive]}
              onPress={() => setProjectType('project')}
            >
              <Text style={[styles.typeOptionText, projectType === 'project' && styles.typeOptionTextActive]}>
                Project (Track Progress)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Project Description (only for projects) */}
        {projectType === 'project' && (
          <View style={styles.descriptionSection}>
            <Text style={styles.label}>Project Description</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Describe the project goals, scope, or team context..."
              value={projectDescription}
              onChangeText={setProjectDescription}
              multiline
              numberOfLines={4}
              maxLength={300}
              placeholderTextColor="#8E8E93"
            />
            <Text style={styles.charCount}>{projectDescription.length}/300</Text>
            <View style={styles.aiNoteContainer}>
              <Ionicons name="bulb-outline" size={16} color="#007AFF" />
              <Text style={styles.aiNote}>
                Tip: The AI will use this description and chat messages to track project progress, decisions, blockers, and sentiment. Keep it updated for accurate insights!
              </Text>
            </View>
          </View>
        )}

        {/* Participants List */}
        <View style={styles.participantsSection}>
          <Text style={styles.label}>Participants ({totalParticipants})</Text>
          <View style={styles.participantsList}>
            {/* Current User */}
            <View style={styles.participantItem}>
              <View style={styles.participantAvatar}>
                <Text style={styles.participantAvatarText}>
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <Text style={styles.participantName}>
                {user?.displayName || 'You'} (You)
              </Text>
            </View>

            {/* Selected Participants */}
            {participants.map(participant => (
              <View key={participant.uid} style={styles.participantItem}>
                <View style={styles.participantAvatar}>
                  <Text style={styles.participantAvatarText}>
                    {participant.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.participantName}>{participant.displayName}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, (!isValidName || creating) && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={!isValidName || creating}
        >
          {creating ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.createButtonText}>Create Group</Text>
          )}
        </TouchableOpacity>

        {/* Hint */}
        <Text style={styles.hint}>
          A group chat allows you to message multiple people at once.
        </Text>
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
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
  backButton: {
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  placeholderButton: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameSection: {
    padding: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#000',
  },
  charCount: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  participantsSection: {
    padding: 20,
    paddingTop: 0,
  },
  participantsList: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 8,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  participantName: {
    fontSize: 16,
    color: '#000',
  },
  createButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  typeSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  typePicker: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  typeOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FF',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  typeOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  descriptionSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  descriptionInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  aiNoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E3F2FF',
    borderRadius: 8,
    gap: 8,
  },
  aiNote: {
    flex: 1,
    fontSize: 12,
    color: '#007AFF',
    lineHeight: 16,
  },
});


