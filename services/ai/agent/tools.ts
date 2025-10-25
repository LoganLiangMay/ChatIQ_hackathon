import { tool } from 'ai';
import { z } from 'zod';
import { aiService } from '../AIService';

/**
 * AI Agent Tools
 * Wraps existing AI features as tools for the agent to use
 */

/**
 * Tool 1: Summarize Thread
 * Summarizes a conversation thread
 */
export const summarizeTool = tool({
  description: `Summarize a conversation thread. 
  Use this when the user asks to summarize a chat, get key points, or understand what was discussed.
  Returns: Summary with key points, decisions, action items, and participants.`,
  parameters: z.object({
    chatId: z.string().describe('The chat ID to summarize'),
    messageLimit: z.number().optional().default(50).describe('Number of recent messages to include'),
  }),
  execute: async ({ chatId, messageLimit }) => {
    try {
      const result = await aiService.summarizeThread(chatId, messageLimit);
      return {
        summary: result.summary,
        messageCount: result.messageCount,
        participants: result.participants,
        timeRange: result.timeRange,
      };
    } catch (error: any) {
      return { error: error.message || 'Failed to summarize thread' };
    }
  },
});

/**
 * Tool 2: Extract Action Items
 * Extracts actionable tasks from conversations
 */
export const extractActionsTool = tool({
  description: `Extract action items and tasks from a conversation.
  Use this when the user wants to know what tasks need to be done, who is responsible for what, or what deadlines exist.
  Returns: List of action items with owners, deadlines, and status.`,
  parameters: z.object({
    chatId: z.string().describe('The chat ID to extract actions from'),
    messageLimit: z.number().optional().default(50),
  }),
  execute: async ({ chatId, messageLimit }) => {
    try {
      const actions = await aiService.extractActionItems(chatId, messageLimit);
      return {
        actionItems: actions.map(a => ({
          task: a.task,
          owner: a.owner,
          deadline: a.deadline,
          status: a.status,
          priority: a.priority,
        })),
        count: actions.length,
      };
    } catch (error: any) {
      return { error: error.message || 'Failed to extract action items' };
    }
  },
});

/**
 * Tool 3: Track Decisions
 * Finds decisions made in conversations
 */
export const trackDecisionsTool = tool({
  description: `Track decisions made in conversations.
  Use this when the user asks what was decided, what choices were made, or what agreements were reached.
  Returns: List of decisions with context, participants, and timestamps.`,
  parameters: z.object({
    chatId: z.string().describe('The chat ID to track decisions in'),
    messageLimit: z.number().optional().default(100),
  }),
  execute: async ({ chatId, messageLimit }) => {
    try {
      const decisions = await aiService.trackDecisions(chatId, messageLimit);
      return {
        decisions: decisions.map(d => ({
          decision: d.decision,
          context: d.context,
          participants: d.participants,
          timestamp: d.timestamp,
        })),
        count: decisions.length,
      };
    } catch (error: any) {
      return { error: error.message || 'Failed to track decisions' };
    }
  },
});

/**
 * Tool 4: Semantic Search
 * Searches messages by meaning
 */
export const searchMessagesTool = tool({
  description: `Search messages semantically across all conversations.
  Use this when the user wants to find specific information, recall past conversations, or search by meaning.
  Returns: Relevant messages with context, ranked by relevance.`,
  parameters: z.object({
    query: z.string().describe('The search query (natural language)'),
    filters: z.object({
      chatId: z.string().optional(),
      senderId: z.string().optional(),
      dateFrom: z.number().optional(),
      dateTo: z.number().optional(),
      priorityOnly: z.boolean().optional(),
    }).optional(),
    limit: z.number().optional().default(10),
  }),
  execute: async ({ query, filters, limit }) => {
    try {
      const results = await aiService.searchMessages(query, filters, limit);
      return {
        results: results.map(r => ({
          content: r.content,
          sender: r.senderName,
          chat: r.chatName,
          timestamp: r.timestamp,
          relevance: r.relevanceScore,
          context: r.context,
        })),
        count: results.length,
      };
    } catch (error: any) {
      return { error: error.message || 'Failed to search messages' };
    }
  },
});

/**
 * Tool 5: Get User Chats
 * Retrieves list of user's chats (for context)
 */
export const getUserChatsTool = tool({
  description: `Get a list of the user's chats.
  Use this when the user asks about their conversations, chat list, or to find a specific chat.
  Returns: List of chats with names and IDs.`,
  parameters: z.object({
    limit: z.number().optional().default(20),
  }),
  execute: async ({ limit }) => {
    try {
      // This would need to be implemented to fetch from Firestore
      // For now, return a placeholder
      return {
        chats: [],
        count: 0,
        message: 'Chat list feature - to be connected to Firestore',
      };
    } catch (error: any) {
      return { error: error.message || 'Failed to get chats' };
    }
  },
});

/**
 * Export all tools
 */
export const agentTools = {
  summarizeThread: summarizeTool,
  extractActions: extractActionsTool,
  trackDecisions: trackDecisionsTool,
  searchMessages: searchMessagesTool,
  getUserChats: getUserChatsTool,
};

