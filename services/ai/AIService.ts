import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase/config';
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
  private functions = getFunctions(app);
  private awsApiUrl: string;

  constructor() {
    // AWS API Gateway URL from environment
    this.awsApiUrl = process.env.AWS_API_GATEWAY_URL || '';
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
      const summarize = httpsCallable(this.functions, 'summarizeThread');
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
      const extract = httpsCallable(this.functions, 'extractActionItems');
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
      const detect = httpsCallable(this.functions, 'detectPriority');
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
      const track = httpsCallable(this.functions, 'trackDecisions');
      const result = await track({ chatId, messageLimit });
      const data = result.data as { decisions: Decision[] };
      return data.decisions;
    } catch (error: any) {
      console.error('Error tracking decisions:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Semantic search across messages
   * 
   * Uses AWS Lambda + Pinecone for vector search
   * 
   * @param query - Search query (natural language)
   * @param limit - Maximum results (default: 10)
   * @returns Relevant messages ranked by similarity
   */
  async searchMessages(
    query: string,
    limit: number = 10
  ): Promise<SearchResult[]> {
    if (!this.awsApiUrl) {
      throw new Error('AWS API Gateway URL not configured');
    }

    try {
      const response = await fetch(`${this.awsApiUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, limit }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results as SearchResult[];
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


