/**
 * GroupService
 * Handles group chat operations:
 * - Creating groups
 * - Adding/removing participants
 * - Promoting/demoting admins
 * - Updating group info
 */

import { generateUUID } from '@/utils/uuid';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  serverTimestamp,
  getDoc 
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from '@/services/firebase/config';
import { db } from '@/services/database/sqlite';
import { Chat } from '@/types/chat';

class GroupService {
  /**
   * Create a new group chat
   */
  async createGroup(
    name: string,
    participantIds: string[],
    groupPicture?: string
  ): Promise<string> {
    const auth = await getFirebaseAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Ensure creator is in participants
    if (!participantIds.includes(currentUser.uid)) {
      participantIds.push(currentUser.uid);
    }
    
    // Must have at least 2 participants (creator + 1 other)
    if (participantIds.length < 2) {
      throw new Error('Group must have at least 2 participants');
    }
    
    const chatId = generateUUID();
    
    const groupData: Chat = {
      id: chatId,
      type: 'group',
      name,
      groupPicture,
      participants: participantIds,
      admins: [currentUser.uid], // Creator is admin
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    try {
      const firestore = await getFirebaseFirestore();
      
      // Create in Firestore
      const chatRef = doc(firestore, 'chats', chatId);
      await setDoc(chatRef, {
        ...groupData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Save to SQLite
      await db.insertChat(groupData);
      
      console.log('✅ Group created:', chatId, name);
      return chatId;
      
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  }
  
  /**
   * Add participants to a group
   */
  async addParticipants(
    chatId: string,
    userIds: string[]
  ): Promise<void> {
    const auth = await getFirebaseAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    try {
      // Check if current user is admin
      const isAdmin = await this.isAdmin(chatId, currentUser.uid);
      if (!isAdmin) {
        throw new Error('Only admins can add participants');
      }
      
      const firestore = await getFirebaseFirestore();
      
      // Update Firestore
      const chatRef = doc(firestore, 'chats', chatId);
      await updateDoc(chatRef, {
        participants: arrayUnion(...userIds),
        updatedAt: serverTimestamp(),
      });
      
      // Update SQLite
      const chat = await db.getChat(chatId);
      if (chat) {
        const updatedParticipants = [...new Set([...chat.participants, ...userIds])];
        await db.updateChat(chatId, {
          ...chat,
          participants: updatedParticipants,
          updatedAt: Date.now(),
        });
      }
      
      console.log('✅ Participants added to group:', chatId, userIds);
      
    } catch (error) {
      console.error('Failed to add participants:', error);
      throw error;
    }
  }
  
  /**
   * Remove a participant from a group
   */
  async removeParticipant(
    chatId: string,
    userId: string
  ): Promise<void> {
    const auth = await getFirebaseAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    try {
      // Check if current user is admin
      const isAdmin = await this.isAdmin(chatId, currentUser.uid);
      if (!isAdmin && userId !== currentUser.uid) {
        throw new Error('Only admins can remove participants');
      }
      
      const firestore = await getFirebaseFirestore();
      
      // Update Firestore
      const chatRef = doc(firestore, 'chats', chatId);
      await updateDoc(chatRef, {
        participants: arrayRemove(userId),
        admins: arrayRemove(userId), // Also remove from admins if they were one
        updatedAt: serverTimestamp(),
      });
      
      // Update SQLite
      const chat = await db.getChat(chatId);
      if (chat) {
        const updatedParticipants = chat.participants.filter(id => id !== userId);
        const updatedAdmins = (chat.admins || []).filter(id => id !== userId);
        await db.updateChat(chatId, {
          ...chat,
          participants: updatedParticipants,
          admins: updatedAdmins,
          updatedAt: Date.now(),
        });
      }
      
      console.log('✅ Participant removed from group:', chatId, userId);
      
    } catch (error) {
      console.error('Failed to remove participant:', error);
      throw error;
    }
  }
  
  /**
   * Promote a user to admin
   */
  async promoteToAdmin(
    chatId: string,
    userId: string
  ): Promise<void> {
    const auth = await getFirebaseAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    try {
      // Check if current user is admin
      const isAdmin = await this.isAdmin(chatId, currentUser.uid);
      if (!isAdmin) {
        throw new Error('Only admins can promote users');
      }
      
      const firestore = await getFirebaseFirestore();
      
      // Update Firestore
      const chatRef = doc(firestore, 'chats', chatId);
      await updateDoc(chatRef, {
        admins: arrayUnion(userId),
        updatedAt: serverTimestamp(),
      });
      
      // Update SQLite
      const chat = await db.getChat(chatId);
      if (chat) {
        const updatedAdmins = [...new Set([...(chat.admins || []), userId])];
        await db.updateChat(chatId, {
          ...chat,
          admins: updatedAdmins,
          updatedAt: Date.now(),
        });
      }
      
      console.log('✅ User promoted to admin:', chatId, userId);
      
    } catch (error) {
      console.error('Failed to promote user:', error);
      throw error;
    }
  }
  
  /**
   * Demote an admin to regular participant
   */
  async demoteFromAdmin(
    chatId: string,
    userId: string
  ): Promise<void> {
    const auth = await getFirebaseAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    try {
      // Check if current user is admin
      const isAdmin = await this.isAdmin(chatId, currentUser.uid);
      if (!isAdmin) {
        throw new Error('Only admins can demote users');
      }
      
      // Prevent demoting the last admin
      const chat = await db.getChat(chatId);
      if (chat && chat.admins && chat.admins.length === 1 && chat.admins[0] === userId) {
        throw new Error('Cannot demote the last admin');
      }
      
      const firestore = await getFirebaseFirestore();
      
      // Update Firestore
      const chatRef = doc(firestore, 'chats', chatId);
      await updateDoc(chatRef, {
        admins: arrayRemove(userId),
        updatedAt: serverTimestamp(),
      });
      
      // Update SQLite
      if (chat) {
        const updatedAdmins = (chat.admins || []).filter(id => id !== userId);
        await db.updateChat(chatId, {
          ...chat,
          admins: updatedAdmins,
          updatedAt: Date.now(),
        });
      }
      
      console.log('✅ User demoted from admin:', chatId, userId);
      
    } catch (error) {
      console.error('Failed to demote user:', error);
      throw error;
    }
  }
  
  /**
   * Update group name
   */
  async updateGroupName(
    chatId: string,
    name: string
  ): Promise<void> {
    const auth = await getFirebaseAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    try {
      // Check if current user is admin
      const isAdmin = await this.isAdmin(chatId, currentUser.uid);
      if (!isAdmin) {
        throw new Error('Only admins can update group name');
      }
      
      const firestore = await getFirebaseFirestore();
      
      // Update Firestore
      const chatRef = doc(firestore, 'chats', chatId);
      await updateDoc(chatRef, {
        name,
        updatedAt: serverTimestamp(),
      });
      
      // Update SQLite
      const chat = await db.getChat(chatId);
      if (chat) {
        await db.updateChat(chatId, {
          ...chat,
          name,
          updatedAt: Date.now(),
        });
      }
      
      console.log('✅ Group name updated:', chatId, name);
      
    } catch (error) {
      console.error('Failed to update group name:', error);
      throw error;
    }
  }
  
  /**
   * Update group picture
   */
  async updateGroupPicture(
    chatId: string,
    groupPicture: string
  ): Promise<void> {
    const auth = await getFirebaseAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    try {
      // Check if current user is admin
      const isAdmin = await this.isAdmin(chatId, currentUser.uid);
      if (!isAdmin) {
        throw new Error('Only admins can update group picture');
      }
      
      const firestore = await getFirebaseFirestore();
      
      // Update Firestore
      const chatRef = doc(firestore, 'chats', chatId);
      await updateDoc(chatRef, {
        groupPicture,
        updatedAt: serverTimestamp(),
      });
      
      // Update SQLite
      const chat = await db.getChat(chatId);
      if (chat) {
        await db.updateChat(chatId, {
          ...chat,
          groupPicture,
          updatedAt: Date.now(),
        });
      }
      
      console.log('✅ Group picture updated:', chatId);
      
    } catch (error) {
      console.error('Failed to update group picture:', error);
      throw error;
    }
  }
  
  /**
   * Leave a group
   */
  async leaveGroup(chatId: string): Promise<void> {
    const auth = await getFirebaseAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    try {
      await this.removeParticipant(chatId, currentUser.uid);
      console.log('✅ Left group:', chatId);
      
    } catch (error) {
      console.error('Failed to leave group:', error);
      throw error;
    }
  }
  
  /**
   * Check if user is admin of a group
   */
  async isAdmin(chatId: string, userId: string): Promise<boolean> {
    try {
      // Check SQLite first (faster)
      const chat = await db.getChat(chatId);
      if (chat) {
        return (chat.admins || []).includes(userId);
      }
      
      // Fallback to Firestore
      const firestore = await getFirebaseFirestore();
      const chatRef = doc(firestore, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        return (data.admins || []).includes(userId);
      }
      
      return false;
      
    } catch (error) {
      console.error('Failed to check admin status:', error);
      return false;
    }
  }
  
  /**
   * Get group participants with user info
   */
  async getParticipantsWithInfo(chatId: string): Promise<any[]> {
    try {
      // Try SQLite first
      let chat = await db.getChat(chatId);
      
      // ✅ Fallback to Firestore if SQLite is empty (Expo Go)
      if (!chat) {
        console.log('📱 SQLite empty, fetching group chat from Firestore:', chatId);
        const firestore = await getFirebaseFirestore();
        const chatRef = doc(firestore, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);
        
        if (chatDoc.exists()) {
          const data = chatDoc.data();
          chat = {
            id: chatId,
            name: data.name || 'Group',
            type: 'group' as const,
            participants: data.participants || [],
            admins: data.admins || [],
            participantDetails: data.participantDetails || {}, // ✅ FIXED: Use participantDetails
            createdAt: data.createdAt?.toMillis?.() || Date.now(),
            updatedAt: data.updatedAt?.toMillis?.() || Date.now(),
          };
        } else {
          throw new Error('Chat not found in Firestore');
        }
      }
      
      const firestore = await getFirebaseFirestore();
      
      // Fetch user info for each participant
      const participantsWithInfo = await Promise.all(
        chat.participants.map(async (userId) => {
          try {
            const userRef = doc(firestore, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                uid: userId,
                displayName: userData.displayName || 'Unknown',
                profilePicture: userData.profilePicture,
                online: userData.online || false,
                isAdmin: (chat.admins || []).includes(userId),
              };
            }
            
            return {
              uid: userId,
              displayName: 'Unknown',
              isAdmin: (chat.admins || []).includes(userId),
            };
          } catch (error) {
            console.error('Error fetching user info:', userId, error);
            return {
              uid: userId,
              displayName: 'Unknown',
              isAdmin: (chat.admins || []).includes(userId),
            };
          }
        })
      );
      
      return participantsWithInfo;
      
    } catch (error) {
      console.error('Failed to get participants with info:', error);
      throw error;
    }
  }
}

export const groupService = new GroupService();

