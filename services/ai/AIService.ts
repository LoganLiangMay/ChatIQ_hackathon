import { getFunctions, httpsCallable, Functions } from 'firebase/functions';
import { onAuthStateChanged, Auth } from 'firebase/auth';
import { initializeFirebase } from '../firebase/config';
import type {
  SummaryResult,
  ActionItem,
  Decision,
  PriorityDetection,
  SearchResult,
  AIError,
} from './types';

/**
 * Main AI Service
 *
 * Provides AI features through Firebase Cloud Functions
 * and AWS Lambda (via API Gateway for advanced features)
 */
class AIService {
  private functions: Functions | null = null;
  private awsApiUrl: string;
  private functionsPromise: Promise<Functions> | null = null;
  private lastTokenRefresh: number = 0;

  constructor() {
    // AWS API Gateway URL from environment
    this.awsApiUrl = process.env.AWS_API_GATEWAY_URL || '';
  }

  /**
   * Get Firebase Functions instance (cached with token refresh)
   */
  private async waitForAuth(auth: Auth, timeoutMs: number = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      // If user is already loaded, resolve immediately
      if (auth.currentUser) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        unsubscribe();
        reject(new Error('Timeout waiting for auth state'));
      }, timeoutMs);

      // Wait for auth state to be ready
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        clearTimeout(timeout);
        unsubscribe();
        if (user) {
          resolve();
        } else {
          reject(new Error('User must be authenticated to use AI features'));
        }
      });
    });
  }

  private async getFunctionsInstance(): Promise<Functions> {
    // If we're already getting the functions instance, wait for that promise
    if (this.functionsPromise) {
      console.log('🔍 [getFunctionsInstance] Reusing existing initialization promise');
      return this.functionsPromise;
    }

    // If we have a cached instance and token was refreshed recently (within 5 minutes), use it
    const now = Date.now();
    if (this.functions && (now - this.lastTokenRefresh) < 5 * 60 * 1000) {
      console.log('🔍 [getFunctionsInstance] Using cached Functions instance');
      return this.functions;
    }

    // Create new promise for initialization
    this.functionsPromise = (async () => {
      try {
        console.log('🔍 [getFunctionsInstance] Initializing Firebase...');
        const { app, auth } = await initializeFirebase();
        console.log('🔍 [getFunctionsInstance] Firebase initialized');

        // Wait for auth state to be ready (loads from AsyncStorage)
        console.log('🔍 [getFunctionsInstance] Waiting for auth state...');
        await this.waitForAuth(auth);
        const currentUser = auth.currentUser;

        if (!currentUser) {
          throw new Error('User must be authenticated to use AI features');
        }

        console.log('🔍 [getFunctionsInstance] User authenticated:', currentUser.uid);

        // Force token refresh to ensure it's valid and attached
        try {
          const token = await currentUser.getIdToken(true);
          console.log('🔍 [getFunctionsInstance] Auth token refreshed, length:', token.length);
          this.lastTokenRefresh = Date.now();
        } catch (tokenError) {
          console.error('⚠️ [getFunctionsInstance] Failed to refresh token:', tokenError);
          throw tokenError;
        }

        // Create or reuse Functions instance with explicit region (us-central1)
        if (!this.functions) {
          this.functions = getFunctions(app, 'us-central1');
          console.log('🔍 [getFunctionsInstance] Functions instance created for us-central1');
        } else {
          console.log('🔍 [getFunctionsInstance] Reusing Functions instance');
        }

        // Add a small delay to ensure auth token is propagated
        await new Promise(resolve => setTimeout(resolve, 100));

        return this.functions!;
      } finally {
        // Clear the promise so future calls can create a new one if needed
        this.functionsPromise = null;
      }
    })();

    return this.functionsPromise;
  }

  /**
   * Summarize a conversation thread
   * 
   * @param chatId - Chat to summarize
   * @param messageLimit - Number of recent messages to include (default: 50)
   * @returns Summary with key points and decisions
   */
  async summarizeThread(
    chatId: string,
    messageLimit: number = 50
  ): Promise<SummaryResult> {
    try {
      const functions = await this.getFunctionsInstance();
      const summarize = httpsCallable(functions, 'summarizeThread');
      const result = await summarize({ chatId, messageLimit });
      return result.data as SummaryResult;
    } catch (error: any) {
      console.error('Error summarizing thread:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Extract action items from conversation
   * 
   * @param chatId - Chat to analyze
   * @param messageLimit - Number of recent messages to scan (default: 50)
   * @returns List of action items with owners and deadlines
   */
  async extractActionItems(
    chatId: string,
    messageLimit: number = 50
  ): Promise<ActionItem[]> {
    try {
      const functions = await this.getFunctionsInstance();
      const extract = httpsCallable(functions, 'extractActionItems');
      const result = await extract({ chatId, messageLimit });
      const data = result.data as { actionItems: ActionItem[] };
      return data.actionItems;
    } catch (error: any) {
      console.error('Error extracting action items:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Detect if a message is high priority
   * 
   * @param messageId - Message ID
   * @param content - Message content
   * @param chatId - Chat ID
   * @returns Priority detection result
   */
  async detectPriority(
    messageId: string,
    content: string,
    chatId: string
  ): Promise<PriorityDetection> {
    try {
      const functions = await this.getFunctionsInstance();
      const detect = httpsCallable(functions, 'detectPriority');
      const result = await detect({ messageId, content, chatId });
      return result.data as PriorityDetection;
    } catch (error: any) {
      console.error('Error detecting priority:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Track decisions made in conversation
   *
   * @param chatId - Chat to analyze
   * @param messageLimit - Number of messages to scan (default: 100)
   * @returns List of decisions with context
   */
  async trackDecisions(
    chatId: string,
    messageLimit: number = 100
  ): Promise<Decision[]> {
    try {
      const functions = await this.getFunctionsInstance();
      const extract = httpsCallable(functions, 'extractDecisions');
      const result = await extract({ chatId, limit: messageLimit });
      console.log('🔍 Raw function response:', JSON.stringify(result.data).substring(0, 200));
      const data = result.data as { decisions: Decision[] };
      console.log(`🔍 Extracted ${data.decisions?.length || 0} decisions from response`);
      return data.decisions || [];
    } catch (error: any) {
      console.error('Error tracking decisions:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Detect blockers in conversation
   *
   * @param chatId - Chat to analyze
   * @param messageLimit - Number of messages to scan (default: 30)
   * @returns List of blockers with severity
   */
  async detectBlockers(
    chatId: string,
    messageLimit: number = 30
  ): Promise<any[]> {
    try {
      console.log('🔍 [detectBlockers] Starting blocker detection for chat:', chatId);
      const functions = await this.getFunctionsInstance();
      console.log('🔍 [detectBlockers] Functions instance obtained');
      const detect = httpsCallable(functions, 'detectBlockers');
      console.log('🔍 [detectBlockers] Calling detectBlockers function...');
      const result = await detect({ chatId, limit: messageLimit });
      console.log('🔍 [detectBlockers] Function call successful');
      const data = result.data as { blockers: any[] };
      console.log(`🔍 [detectBlockers] Found ${data.blockers?.length || 0} blockers`);
      return data.blockers || [];
    } catch (error: any) {
      console.error('❌ [detectBlockers] Error:', error);
      console.error('❌ [detectBlockers] Error code:', error.code);
      console.error('❌ [detectBlockers] Error message:', error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Semantic search across messages
   * 
   * Uses Firebase Function with OpenAI for semantic re-ranking
   * 
   * @param query - Search query (natural language)
   * @param filters - Optional filters (chat, sender, date, priority)
   * @param limit - Maximum results (default: 20)
   * @returns Relevant messages ranked by similarity with context
   */
  async searchMessages(
    query: string,
    filters?: {
      chatId?: string;
      senderId?: string;
      dateFrom?: number;
      dateTo?: number;
      priorityOnly?: boolean;
      hasActionItems?: boolean;
    },
    limit: number = 20
  ): Promise<SearchResult[]> {
    try {
      const functions = await this.getFunctionsInstance();
      const search = httpsCallable(functions, 'searchMessages');
      const result = await search({ query, filters, limit });
      const data = result.data as { results: SearchResult[] };
      return data.results;
    } catch (error: any) {
      console.error('Error searching messages:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get AI-generated daily digest
   * 
   * Summary of important messages and actions across all chats
   * 
   * @returns Digest with key updates and action items
   */
  async getDailyDigest(): Promise<{
    summary: string;
    priorityMessages: number;
    actionItems: number;
    decisions: number;
  }> {
    if (!this.awsApiUrl) {
      throw new Error('AWS API Gateway URL not configured');
    }

    try {
      const response = await fetch(`${this.awsApiUrl}/digest`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Digest failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error getting daily digest:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle and format errors
   */
  private handleError(error: any): AIError {
    if (error.code && error.message) {
      return {
        code: error.code,
        message: error.message,
        details: error.details,
      };
    }

    return {
      code: 'unknown',
      message: error.message || 'An unknown error occurred',
      details: error,
    };
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;


