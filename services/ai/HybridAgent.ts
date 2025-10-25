/**
 * Hybrid AI Agent Service
 * Routes queries between client-side (simple/fast) and server-side (complex/RAG) agents
 */

import { getFunctions, httpsCallable, Functions } from 'firebase/functions';
import { onAuthStateChanged, Auth } from 'firebase/auth';
import { initializeFirebase } from '@/services/firebase/config';
import { aiAgent, AgentMessage, AgentResponse } from './agent/AIAgent';

export type QueryComplexity = 'simple' | 'complex' | 'rag' | 'knowledge';

interface HybridAgentOptions {
  forceMode?: 'client' | 'server';
  userId?: string;
  chatId?: string;
}

/**
 * Determine query complexity to route appropriately
 */
function assessQueryComplexity(query: string, history: AgentMessage[]): QueryComplexity {
  const lowerQuery = query.toLowerCase();

  // RAG/Knowledge Bank indicators - queries that need chat history search
  const ragKeywords = [
    // Explicit search/retrieval
    'search', 'find', 'look for', 'recall', 'remember',
    'what did', 'when did', 'who said', 'history',
    'previous', 'before', 'ago', 'past conversation',
    'knowledge bank', 'similar to', 'related to',

    // Content references
    'mention', 'mentioned', 'talked about', 'discussed', 'discuss',
    'said', 'conversation', 'chat', 'message',

    // Contextual queries about shared knowledge
    'we use', 'we have', 'we decided', 'our',
    'in the chat', 'in chats', 'in our', 'from the'
  ];

  // Complex reasoning indicators
  const complexKeywords = [
    'analyze', 'compare', 'summarize all', 'across all',
    'multiple', 'various', 'different chats',
    'pattern', 'trend', 'insight', 'decision'
  ];

  // Only use "simple" mode for greetings or meta questions
  const simpleKeywords = [
    'hello', 'hi ', 'hey', 'help', 'what is chatiq', 'how does this work'
  ];

  // Check if it's a simple greeting/meta question
  if (simpleKeywords.some(keyword => lowerQuery.includes(keyword))) {
    return 'simple';
  }

  // Check for complex reasoning
  if (complexKeywords.some(keyword => lowerQuery.includes(keyword))) {
    return 'complex';
  }

  // Check for RAG needs
  if (ragKeywords.some(keyword => lowerQuery.includes(keyword))) {
    return 'rag';
  }

  // Check conversation history - if it's getting long, might need server-side
  if (history.length > 10) {
    return 'complex';
  }

  // Default to RAG for all other queries (assume user wants chat context)
  return 'rag';
}

/**
 * Hybrid Agent - Intelligently routes between client and server
 */
export class HybridAgent {
  private functions: Functions | null = null;
  private functionsPromise: Promise<Functions> | null = null;
  private lastTokenRefresh: number = 0;

  /**
   * Wait for Firebase Auth to be ready
   */
  private async waitForAuth(auth: Auth, timeoutMs: number = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (auth.currentUser) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        unsubscribe();
        reject(new Error('Timeout waiting for auth state'));
      }, timeoutMs);

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

  /**
   * Get Firebase Functions instance (cached with token refresh)
   */
  private async getFunctionsInstance(): Promise<Functions> {
    // If we're already getting the functions instance, wait for that promise
    if (this.functionsPromise) {
      console.log('🔍 [HybridAgent] Reusing existing initialization promise');
      return this.functionsPromise;
    }

    // If we have a cached instance and token was refreshed recently (within 5 minutes), use it
    const now = Date.now();
    if (this.functions && (now - this.lastTokenRefresh) < 5 * 60 * 1000) {
      console.log('🔍 [HybridAgent] Using cached Functions instance');
      return this.functions;
    }

    // Create new promise for initialization
    this.functionsPromise = (async () => {
      try {
        console.log('🔍 [HybridAgent] Initializing Firebase...');
        const { app, auth } = await initializeFirebase();

        // Wait for auth state to be ready
        await this.waitForAuth(auth);
        const currentUser = auth.currentUser;

        if (!currentUser) {
          throw new Error('User must be authenticated to use AI features');
        }

        console.log('🔍 [HybridAgent] User authenticated:', currentUser.uid);

        // Force token refresh
        const token = await currentUser.getIdToken(true);
        console.log('🔍 [HybridAgent] Auth token refreshed, length:', token.length);
        this.lastTokenRefresh = Date.now();

        // Get or create Functions instance
        if (!this.functions) {
          this.functions = getFunctions(app, 'us-central1');
          console.log('🔍 [HybridAgent] Functions instance created');
        }

        // Small delay to ensure token is attached
        await new Promise(resolve => setTimeout(resolve, 100));

        return this.functions!;
      } finally {
        this.functionsPromise = null;
      }
    })();

    return this.functionsPromise;
  }

  /**
   * Generate response using optimal routing
   * NOTE: Always uses server-side (LangChain + RAG) for security
   * Client-side agent disabled - OpenAI keys should not be exposed to client
   */
  async generateResponse(
    userMessage: string,
    conversationHistory: AgentMessage[] = [],
    options: HybridAgentOptions = {}
  ): Promise<AgentResponse> {
    try {
      // Assess complexity for LangChain routing
      const complexity = options.forceMode
        ? (options.forceMode === 'client' ? 'simple' : 'rag')
        : assessQueryComplexity(userMessage, conversationHistory);

      console.log(`🤖 [HybridAgent] Query complexity: ${complexity}`);
      console.log('🔥 [HybridAgent] Using server-side agent (LangChain + RAG + LangSmith)');

      // Get Functions instance (with proper auth)
      const functions = await this.getFunctionsInstance();

      // Always route to server-side for security (no exposed API keys)
      const knowledgeAgentFn = httpsCallable(functions, 'knowledgeAgent');
      const result = await knowledgeAgentFn({
        question: userMessage,
        userId: options.userId,
        chatId: options.chatId,
        queryType: complexity === 'rag' || complexity === 'knowledge' ? 'rag' : 'general',
        conversationHistory: conversationHistory.slice(-5), // Last 5 messages for context
      });

      const data = result.data as any;

      if (!data.success) {
        throw new Error(data.error || 'Server-side agent failed');
      }

      return {
        text: data.answer,
        toolCalls: data.sources ? [{ name: 'rag_retrieval', args: { sources: data.sources } }] : [],
        usage: undefined, // Server doesn't return usage stats
      };

    } catch (error: any) {
      console.error('❌ [HybridAgent] Server-side agent error:', error);
      console.error('❌ [HybridAgent] Error details:', error.message);

      // Return helpful error message
      throw new Error(
        'AI Assistant is temporarily unavailable. Please try again. ' +
        `(${error.code || error.message})`
      );
    }
  }
  
  /**
   * Stream response (client-side only for now)
   */
  async streamResponse(
    userMessage: string,
    conversationHistory: AgentMessage[] = []
  ) {
    // Streaming only supported on client-side currently
    return await aiAgent.streamResponse(userMessage, conversationHistory);
  }
  
  /**
   * Search knowledge bank via server-side
   */
  async searchKnowledge(
    query: string,
    filters: { userId?: string; chatId?: string; type?: string } = {},
    limit = 5
  ) {
    try {
      console.log(`🔍 [HybridAgent] Searching knowledge bank: ${query}`);

      // Get Functions instance (with proper auth)
      const functions = await this.getFunctionsInstance();

      const searchFn = httpsCallable(functions, 'searchVectorStore');
      const result = await searchFn({
        query,
        filter: filters,
        limit,
      });

      const data = result.data as any;

      if (!data.success) {
        throw new Error('Search failed');
      }

      return data.results;

    } catch (error: any) {
      console.error('❌ [HybridAgent] Search error:', error);
      throw new Error(error.message || 'Knowledge search failed');
    }
  }
  
  /**
   * Embed content into knowledge bank
   */
  async embedContent(
    id: string,
    text: string,
    metadata: {
      type: 'message' | 'summary' | 'decision';
      chatId: string;
      userId: string;
      [key: string]: any;
    }
  ) {
    try {
      console.log(`📝 [HybridAgent] Embedding content: ${id}`);

      // Get Functions instance (with proper auth)
      const functions = await this.getFunctionsInstance();

      const embedFn = httpsCallable(functions, 'embedContent');
      const result = await embedFn({
        id,
        text,
        metadata,
      });

      const data = result.data as any;

      if (!data.success) {
        throw new Error('Embedding failed');
      }

      return data;

    } catch (error: any) {
      console.error('❌ [HybridAgent] Embed error:', error);
      throw new Error(error.message || 'Content embedding failed');
    }
  }
}

/**
 * Export singleton instance
 */
export const hybridAgent = new HybridAgent();

/**
 * Convenience function for quick queries
 */
export async function askAgent(
  question: string,
  options: HybridAgentOptions = {}
): Promise<string> {
  const response = await hybridAgent.generateResponse(question, [], options);
  return response.text;
}

