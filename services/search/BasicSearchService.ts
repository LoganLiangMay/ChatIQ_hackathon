/**
 * BasicSearchService
 * Fast, local, iMessage-style search with category grouping and smart ranking
 */

import { db } from '@/services/database/sqlite';
import { attachmentService, Attachment } from '@/services/messages/AttachmentService';
import { Message } from '@/types/message';
import { Chat } from '@/types/chat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/services/firebase/config';

const SEARCH_HISTORY_KEY = '@search_history';
const MAX_HISTORY_ITEMS = 20;

export interface BasicSearchResult {
  messages: (Message & { relevanceScore: number; chatName?: string })[];
  chats: Chat[];
  users: UserSearchResult[];
  photos: Attachment[];
  links: Attachment[];
  documents: Attachment[];
}

export interface UserSearchResult {
  uid: string;
  displayName: string;
  email?: string;
  profilePicture?: string;
  online?: boolean;
}

class BasicSearchService {
  /**
   * Main search method - searches across all categories
   */
  async searchAll(
    searchQuery: string,
    currentUserId: string
  ): Promise<BasicSearchResult> {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return this.emptyResult();
    }

    const query = searchQuery.trim();

    // Save to search history (async, don't await)
    this.saveToHistory(query).catch(console.error);

    // Search all categories in parallel
    const [messages, chats, users, photos, links, documents] = await Promise.all([
      this.searchMessages(query, currentUserId),
      this.searchChats(query, currentUserId),
      this.searchUsers(query, currentUserId),
      this.searchPhotos(query),
      this.searchLinks(query),
      this.searchDocuments(query),
    ]);

    return {
      messages,
      chats,
      users,
      photos,
      links,
      documents,
    };
  }

  /**
   * Search messages with smart ranking
   */
  private async searchMessages(
    searchQuery: string,
    currentUserId: string
  ): Promise<(Message & { relevanceScore: number; chatName?: string })[]> {
    try {
      // Try FTS5-powered search with ranking
      const messages = await db.searchMessagesWithRanking(searchQuery, currentUserId, 50);

      // Enrich with chat names
      const enriched = await Promise.all(
        messages.map(async (msg) => {
          try {
            const chat = await db.getChat(msg.chatId);
            return {
              ...msg,
              chatName: chat?.name || 'Unknown Chat',
            };
          } catch {
            return {
              ...msg,
              chatName: 'Unknown Chat',
            };
          }
        })
      );

      return enriched;
    } catch (error) {
      console.error('Message search error:', error);
      return [];
    }
  }

  /**
   * Search chats by name
   */
  private async searchChats(searchQuery: string, currentUserId: string): Promise<Chat[]> {
    try {
      return await db.searchChats(searchQuery, currentUserId);
    } catch (error) {
      console.error('Chat search error:', error);
      return [];
    }
  }

  /**
   * Search users in Firestore
   */
  private async searchUsers(
    searchQuery: string,
    currentUserId: string,
    limitCount: number = 10
  ): Promise<UserSearchResult[]> {
    try {
      const firestore = await getFirebaseFirestore();
      const usersRef = collection(firestore, 'users');

      // Firestore doesn't support case-insensitive search or LIKE queries
      // So we'll fetch users and filter client-side
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
      console.error('User search error:', error);
      return [];
    }
  }

  /**
   * Search photos
   */
  private async searchPhotos(searchQuery: string): Promise<Attachment[]> {
    try {
      return await attachmentService.searchAttachments(searchQuery, 'photo');
    } catch (error) {
      console.error('Photo search error:', error);
      return [];
    }
  }

  /**
   * Search links
   */
  private async searchLinks(searchQuery: string): Promise<Attachment[]> {
    try {
      return await attachmentService.searchAttachments(searchQuery, 'link');
    } catch (error) {
      console.error('Link search error:', error);
      return [];
    }
  }

  /**
   * Search documents
   */
  private async searchDocuments(searchQuery: string): Promise<Attachment[]> {
    try {
      return await attachmentService.searchAttachments(searchQuery, 'document');
    } catch (error) {
      console.error('Document search error:', error);
      return [];
    }
  }

  /**
   * Search within a specific chat (in-conversation search)
   */
  async searchInChat(
    chatId: string,
    searchQuery: string
  ): Promise<(Message & { relevanceScore: number })[]> {
    try {
      const allMessages = await db.searchMessagesWithRanking(searchQuery, '', 100);

      // Filter to only this chat
      return allMessages.filter((msg) => msg.chatId === chatId);
    } catch (error) {
      console.error('In-chat search error:', error);
      return [];
    }
  }

  /**
   * Get search history
   */
  async getSearchHistory(): Promise<string[]> {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to get search history:', error);
      return [];
    }
  }

  /**
   * Save query to search history
   */
  private async saveToHistory(query: string): Promise<void> {
    try {
      const history = await this.getSearchHistory();

      // Remove if already exists
      const filtered = history.filter((q) => q !== query);

      // Add to beginning
      const updated = [query, ...filtered].slice(0, MAX_HISTORY_ITEMS);

      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  /**
   * Clear search history
   */
  async clearSearchHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  }

  /**
   * Get popular searches (most frequent)
   */
  async getPopularSearches(limit: number = 5): Promise<string[]> {
    // For now, just return recent history
    // In future, could track frequency
    const history = await this.getSearchHistory();
    return history.slice(0, limit);
  }

  /**
   * Get result counts for each category
   */
  getResultCounts(result: BasicSearchResult): {
    messages: number;
    chats: number;
    users: number;
    photos: number;
    links: number;
    documents: number;
    total: number;
  } {
    const counts = {
      messages: result.messages.length,
      chats: result.chats.length,
      users: result.users.length,
      photos: result.photos.length,
      links: result.links.length,
      documents: result.documents.length,
      total: 0,
    };

    counts.total =
      counts.messages +
      counts.chats +
      counts.users +
      counts.photos +
      counts.links +
      counts.documents;

    return counts;
  }

  /**
   * Check if results are empty
   */
  hasResults(result: BasicSearchResult): boolean {
    return this.getResultCounts(result).total > 0;
  }

  /**
   * Empty result object
   */
  private emptyResult(): BasicSearchResult {
    return {
      messages: [],
      chats: [],
      users: [],
      photos: [],
      links: [],
      documents: [],
    };
  }
}

export const basicSearchService = new BasicSearchService();
