import { useState } from 'react';
import aiService from '../services/ai/AIService';
import type {
  SummaryResult,
  ActionItem,
  Decision,
  PriorityDetection,
  SearchResult,
} from '../services/ai/types';

/**
 * useAI Hook
 * 
 * React hook for accessing AI features
 * Provides loading states and error handling
 */
export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Summarize a conversation thread
   */
  const summarizeThread = async (
    chatId: string,
    messageLimit?: number
  ): Promise<SummaryResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiService.summarizeThread(chatId, messageLimit);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to summarize thread';
      setError(errorMessage);
      console.error('Summary error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Extract action items from conversation
   */
  const extractActionItems = async (
    chatId: string,
    messageLimit?: number
  ): Promise<ActionItem[] | null> => {
    setLoading(true);
    setError(null);
    try {
      const items = await aiService.extractActionItems(chatId, messageLimit);
      return items;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to extract action items';
      setError(errorMessage);
      console.error('Action items error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Detect if a message is high priority
   */
  const detectPriority = async (
    messageId: string,
    content: string,
    chatId: string
  ): Promise<PriorityDetection | null> => {
    setLoading(true);
    setError(null);
    try {
      const detection = await aiService.detectPriority(messageId, content, chatId);
      return detection;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to detect priority';
      setError(errorMessage);
      console.error('Priority detection error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Track decisions made in conversation
   */
  const trackDecisions = async (
    chatId: string,
    messageLimit?: number
  ): Promise<Decision[] | null> => {
    setLoading(true);
    setError(null);
    try {
      const decisions = await aiService.trackDecisions(chatId, messageLimit);
      return decisions;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to track decisions';
      setError(errorMessage);
      console.error('Decision tracking error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Semantic search across messages
   */
  const searchMessages = async (
    query: string,
    limit?: number
  ): Promise<SearchResult[] | null> => {
    setLoading(true);
    setError(null);
    try {
      const results = await aiService.searchMessages(query, limit);
      return results;
    } catch (err: any) {
      const errorMessage = err.message || 'Search failed';
      setError(errorMessage);
      console.error('Search error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get AI-generated daily digest
   */
  const getDailyDigest = async () => {
    setLoading(true);
    setError(null);
    try {
      const digest = await aiService.getDailyDigest();
      return digest;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get digest';
      setError(errorMessage);
      console.error('Digest error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  return {
    loading,
    error,
    clearError,
    // AI Features
    summarizeThread,
    extractActionItems,
    detectPriority,
    trackDecisions,
    searchMessages,
    getDailyDigest,
  };
}


