/**
 * Firestore operations for chats and messages
 */

import { doc, setDoc, updateDoc, serverTimestamp, arrayUnion, collection, getDoc } from 'firebase/firestore';
import { getFirebaseFirestore, getFirebaseAuth, getFirebaseFirestoreSync } from './config';

// Lazy getter for firestore instance - use sync version for operations (assumes already initialized)
const getFirestore = () => getFirebaseFirestoreSync();

/**
 * Create or update a chat document
 */
export async function createOrUpdateChat(chatId: string, data: any) {
  const chatRef = doc(getFirestore(), 'chats', chatId);
  await setDoc(chatRef, {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

/**
 * Update chat's last message
 */
export async function updateChatLastMessage(
  chatId: string, 
  content: string, 
  senderId: string,
  senderName: string
) {
  const chatRef = doc(getFirestore(), 'chats', chatId);
  await updateDoc(chatRef, {
    lastMessage: {
      content,
      senderId,
      senderName,
      timestamp: serverTimestamp()
    },
    updatedAt: serverTimestamp()
  });
}

/**
 * Mark message as delivered
 */
export async function markMessageAsDelivered(chatId: string, messageId: string, userId: string) {
  const messageRef = doc(getFirestore(), `chats/${chatId}/messages`, messageId);
  await updateDoc(messageRef, {
    deliveredTo: arrayUnion(userId)
  });
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(chatId: string, messageId: string, userId: string) {
  const messageRef = doc(getFirestore(), `chats/${chatId}/messages`, messageId);
  await updateDoc(messageRef, {
    readBy: arrayUnion(userId)
  });
}

/**
 * Update user online status
 */
export async function updateOnlineStatus(userId: string, online: boolean) {
  const userRef = doc(getFirestore(), 'users', userId);
  await updateDoc(userRef, {
    online,
    lastSeen: serverTimestamp()
  });
}

/**
 * Create a direct chat between two users
 */
export async function createDirectChat(userIds: string[]): Promise<string> {
  // Verify authentication first
  const auth = await getFirebaseAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ User not authenticated');
    throw new Error('User must be authenticated to create a chat');
  }
  
  console.log('✅ User authenticated:', currentUser.uid);

  if (userIds.length !== 2) {
    throw new Error('Direct chat requires exactly 2 users');
  }

  console.log('🔵 Creating direct chat for users:', userIds);

  // Create deterministic chat ID (sorted to ensure consistency)
  const sortedIds = [...userIds].sort();
  const chatId = sortedIds.join('-');
  const chatRef = doc(getFirestore(), 'chats', chatId);

  console.log('🔵 Chat ID:', chatId);

  // Check if chat already exists
  try {
    const chatSnapshot = await getDoc(chatRef);
    if (chatSnapshot.exists()) {
      console.log('✅ Direct chat already exists:', chatId);
      return chatId;
    }
  } catch (error) {
    console.log('⚠️  Could not check existing chat (might be permissions), creating new one:', error);
    // Continue to create - if it exists, Firestore will handle it
  }

  // Fetch user details
  console.log('🔵 Fetching user details...');
  const [user1, user2] = await Promise.all(
    sortedIds.map(async (uid) => {
      try {
        const userRef = doc(getFirestore(), 'users', uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        return { 
          uid, 
          displayName: (userData.displayName as string) || 'Unknown',
          profilePicture: (userData.profilePicture as string | null) || null,
        };
      } catch (error) {
        console.error('Error fetching user details for', uid, error);
        return { 
          uid, 
          displayName: 'Unknown',
          profilePicture: null,
        };
      }
    })
  );

  console.log('🔵 User details:', { user1: user1.displayName, user2: user2.displayName });

  // Create new direct chat
  const chatData = {
    id: chatId,
    type: 'direct',
    participants: sortedIds, // Use sorted IDs to ensure consistency
    participantDetails: {
      [user1.uid]: {
        displayName: user1.displayName,
        profilePicture: user1.profilePicture,
      },
      [user2.uid]: {
        displayName: user2.displayName,
        profilePicture: user2.profilePicture,
      },
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: null,
  };

  console.log('🔵 Creating chat document with data:', {
    ...chatData,
    participants: sortedIds,
  });

  try {
    await setDoc(chatRef, chatData);
    console.log('✅ Direct chat created successfully:', chatId);
    return chatId;
  } catch (error) {
    console.error('❌ Error creating chat document:', error);
    console.error('Chat data that failed:', chatData);
    throw error;
  }
}

/**
 * Create a group chat with multiple participants
 */
export async function createGroupChat(
  groupName: string,
  participantIds: string[],
  metadata?: {
    projectType?: 'group' | 'project';
    projectDescription?: string;
    aiTrackingEnabled?: boolean;
    groupPicture?: string;
  }
): Promise<string> {
  const auth = await getFirebaseAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error('❌ User not authenticated');
    throw new Error('User must be authenticated to create a group');
  }

  console.log('✅ User authenticated:', currentUser.uid);

  // Ensure current user is in participants
  if (!participantIds.includes(currentUser.uid)) {
    participantIds.push(currentUser.uid);
  }

  // Must have at least 3 participants for a group
  if (participantIds.length < 3) {
    throw new Error('Group chat requires at least 3 participants');
  }

  console.log('🔵 Creating group chat for', participantIds.length, 'participants');

  // Generate group ID using expo-crypto
  const { generateUUID } = await import('@/utils/uuid');
  const chatId = generateUUID();
  const chatRef = doc(getFirestore(), 'chats', chatId);

  console.log('🔵 Group Chat ID:', chatId);

  // Fetch participant details
  const participantDetails: { [userId: string]: any } = {};
  await Promise.all(
    participantIds.map(async (uid) => {
      try {
        const userRef = doc(getFirestore(), 'users', uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        participantDetails[uid] = {
          displayName: (userData.displayName as string) || 'Unknown',
          profilePicture: (userData.profilePicture as string | null) || null,
        };
      } catch (error) {
        console.error('Error fetching user details for', uid, error);
        participantDetails[uid] = {
          displayName: 'Unknown',
          profilePicture: null,
        };
      }
    })
  );

  console.log('🔵 Participant details loaded for', Object.keys(participantDetails).length, 'users');

  // Create group chat document
  const chatData = {
    id: chatId,
    type: 'group',
    name: groupName,
    groupPicture: metadata?.groupPicture || null,
    participants: participantIds,
    participantDetails,
    admins: [currentUser.uid], // Creator is admin
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: null,
    // Project tracking fields
    projectType: metadata?.projectType || 'group',
    projectDescription: metadata?.projectDescription || null,
    aiTrackingEnabled: metadata?.aiTrackingEnabled || false,
  };

  console.log('🔵 Creating group chat document...');

  try {
    await setDoc(chatRef, chatData);
    console.log('✅ Group chat created successfully:', chatId);
    return chatId;
  } catch (error) {
    console.error('❌ Error creating group chat document:', error);
    console.error('Chat data that failed:', chatData);
    throw error;
  }
}

// Note: Firestore instance accessed lazily via getFirestore()
// Other Firebase functions should be imported directly from 'firebase/firestore'
