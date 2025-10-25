/**
 * ConversationService - Manages AI Assistant conversation history
 * Saves and loads conversation sessions like ChatGPT
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AgentMessage } from './agent/AIAgent';

export interface ConversationSession {
  id: string;
  title: string; // Auto-generated from first message or manually set
  messages: AgentMessage[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = '@chatiq_ai_conversations';
const MAX_SESSIONS = 50; // Keep last 50 conversations

/**
 * ConversationService class - singleton pattern
 */
class ConversationService {
  private sessions: ConversationSession[] = [];
  private currentSessionId: string | null = null;

  /**
   * Initialize service - load sessions from storage
   */
  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.sessions = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      this.sessions = [];
    }
  }

  /**
   * Save sessions to storage
   */
  private async save(): Promise<void> {
    try {
      // Keep only last MAX_SESSIONS
      const toSave = this.sessions
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_SESSIONS);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      this.sessions = toSave;
    } catch (error) {
      console.error('Failed to save conversation history:', error);
    }
  }

  /**
   * Create a new conversation session
   */
  async createNewSession(): Promise<ConversationSession> {
    const session: ConversationSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.sessions.unshift(session); // Add to beginning
    this.currentSessionId = session.id;
    await this.save();

    return session;
  }

  /**
   * Get current session or create new one
   */
  async getCurrentSession(): Promise<ConversationSession> {
    // If no current session, create one
    if (!this.currentSessionId) {
      return await this.createNewSession();
    }

    // Find current session
    const session = this.sessions.find(s => s.id === this.currentSessionId);

    // If not found, create new one
    if (!session) {
      return await this.createNewSession();
    }

    return session;
  }

  /**
   * Add message to current session
   */
  async addMessage(message: AgentMessage): Promise<void> {
    const session = await this.getCurrentSession();

    session.messages.push(message);
    session.updatedAt = Date.now();

    // Auto-generate title from first user message
    if (session.title === 'New Conversation' && message.role === 'user') {
      session.title = this.generateTitle(message.content);
    }

    await this.save();
  }

  /**
   * Update messages in current session (bulk)
   */
  async updateMessages(messages: AgentMessage[]): Promise<void> {
    const session = await this.getCurrentSession();

    session.messages = messages;
    session.updatedAt = Date.now();

    // Auto-generate title from first user message
    if (session.title === 'New Conversation' && messages.length > 0) {
      const firstUserMsg = messages.find(m => m.role === 'user');
      if (firstUserMsg) {
        session.title = this.generateTitle(firstUserMsg.content);
      }
    }

    await this.save();
  }

  /**
   * Generate title from message content
   */
  private generateTitle(content: string): string {
    // Take first 40 characters, remove newlines, trim
    const cleaned = content
      .replace(/\n/g, ' ')
      .trim()
      .substring(0, 40);

    return cleaned.length < content.length ? `${cleaned}...` : cleaned;
  }

  /**
   * Get all sessions (sorted by most recent)
   */
  getSessions(): ConversationSession[] {
    return [...this.sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * Load a specific session
   */
  async loadSession(sessionId: string): Promise<ConversationSession | null> {
    const session = this.sessions.find(s => s.id === sessionId);
    if (session) {
      this.currentSessionId = sessionId;
      return session;
    }
    return null;
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    this.sessions = this.sessions.filter(s => s.id !== sessionId);

    // If we deleted the current session, clear current ID
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }

    await this.save();
  }

  /**
   * Clear all sessions
   */
  async clearAllSessions(): Promise<void> {
    this.sessions = [];
    this.currentSessionId = null;
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Rename session
   */
  async renameSession(sessionId: string, newTitle: string): Promise<void> {
    const session = this.sessions.find(s => s.id === sessionId);
    if (session) {
      session.title = newTitle;
      session.updatedAt = Date.now();
      await this.save();
    }
  }
}

/**
 * Export singleton instance
 */
export const conversationService = new ConversationService();
