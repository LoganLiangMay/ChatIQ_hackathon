/**
 * SearchService
 * Handles search operations across:
 * - Messages (SQLite)
 * - Chats (SQLite)
 * - Users (Firestore)
 */

import { db } from '@/services/database/sqlite';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/services/firebase/config';
import { Message } from '@/types/message';
import { Chat } from '@/types/chat';

export interface SearchResult {
  messages: MessageSearchResult[];
  chats: Chat[];
  users: UserSearchResult[];
}

export interface MessageSearchResult {
  message: Message;
  chatName?: string;
}

export interface UserSearchResult {
  uid: string;
  displayName: string;
  email?: string;
  profilePicture?: string;
  online?: boolean;
}

class SearchService {
  /**
   * Search across all categories
   */
  async searchAll(searchQuery: string, currentUserId: string): Promise<SearchResult> {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return {
        messages: [],
        chats: [],
        users: [],
      };
    }

    const query = searchQuery.trim().toLowerCase();

    // Execute all searches in parallel
    const [messages, chats, users] = await Promise.all([
      this.searchMessages(query, currentUserId),
      this.searchChats(query, currentUserId),
      this.searchUsers(query, currentUserId),
    ]);

    return {
      messages,
      chats,
      users,
    };
  }

  /**
   * Search messages in SQLite
   */
  async searchMessages(searchQuery: string, currentUserId: string, limitCount: number = 20): Promise<MessageSearchResult[]> {
    try {
      const messages = await db.searchMessages(searchQuery, limitCount);
      
      // Enrich with chat names
      const enrichedResults = await Promise.all(
        messages.map(async (message) => {
          try {
            const chat = await db.getChat(message.chatId);
            return {
              message,
              chatName: chat?.name || 'Unknown Chat',
            };
          } catch (error) {
            return {
              message,
              chatName: 'Unknown Chat',
            };
          }
        })
      );

      return enrichedResults;
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  /**
   * Search chats in SQLite
   */
  async searchChats(searchQuery: string, currentUserId: string): Promise<Chat[]> {
    try {
      const chats = await db.searchChats(searchQuery, currentUserId);
      return chats;
    } catch (error) {
      console.error('Error searching chats:', error);
      return [];
    }
  }

  /**
   * Search users in Firestore
   */
  async searchUsers(searchQuery: string, currentUserId: string, limitCount: number = 10): Promise<UserSearchResult[]> {
    try {
      const firestore = await getFirebaseFirestore();
      const usersRef = collection(firestore, 'users');
      
      // Firestore doesn't support case-insensitive search or LIKE queries
      // So we'll fetch users and filter client-side
      // For production, consider using Algolia or ElasticSearch
      
      const q = query(usersRef, limit(100)); // Fetch first 100 users
      const snapshot = await getDocs(q);
      
      const users: UserSearchResult[] = [];
      const lowerQuery = searchQuery.toLowerCase();
      
      snapshot.forEach((doc) => {
        const userData = doc.data();
        const displayName = (userData.displayName || '').toLowerCase();
        const email = (userData.email || '').toLowerCase();
        
        // Check if query matches displayName or email
        if (
          doc.id !== currentUserId && // Exclude current user
          (displayName.includes(lowerQuery) || email.includes(lowerQuery))
        ) {
          users.push({
            uid: doc.id,
            displayName: userData.displayName || 'Unknown',
            email: userData.email,
            profilePicture: userData.profilePicture,
            online: userData.online || false,
          });
        }
      });
      
      // Sort by relevance (exact matches first)
      users.sort((a, b) => {
        const aName = a.displayName.toLowerCase();
        const bName = b.displayName.toLowerCase();
        
        const aExact = aName.startsWith(lowerQuery);
        const bExact = bName.startsWith(lowerQuery);
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        return aName.localeCompare(bName);
      });
      
      return users.slice(0, limitCount);
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  /**
   * Get recent searches (placeholder for future implementation)
   */
  async getRecentSearches(currentUserId: string): Promise<string[]> {
    // Could store in AsyncStorage or SQLite
    // For now, return empty array
    return [];
  }

  /**
   * Save search query to history (placeholder for future implementation)
   */
  async saveSearchQuery(currentUserId: string, searchQuery: string): Promise<void> {
    // Could store in AsyncStorage or SQLite
    // For now, just log
    console.log('Search query saved:', searchQuery);
  }
}

export const searchService = new SearchService();




