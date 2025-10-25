import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { callChatCompletion } from './openai';
import { PROMPTS } from './prompts';
import type { SummarizeThreadRequest, SummarizeThreadResponse } from './types';

/**
 * Summarize a conversation thread
 * 
 * Fetches recent messages from Firestore and generates a summary using GPT-4-mini.
 * Optimized for cost:
 * - Limits message count (default: 50, max: 100)
 * - Uses GPT-4-mini instead of GPT-4
 * - Single API call per summarization
 * 
 * Response time target: <3s for 50 messages
 */
export const summarizeThread = functions.https.onCall(
  async (data: SummarizeThreadRequest, context): Promise<SummarizeThreadResponse> => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to summarize threads'
      );
    }

    const { chatId, messageLimit = 50 } = data;

    // Validate input
    if (!chatId || typeof chatId !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Chat ID is required'
      );
    }

    // Enforce max limit to control costs
    const limit = Math.min(messageLimit, 100);

    try {
      const firestore = admin.firestore();

      // Verify user is a participant (security check)
      const chatDoc = await firestore.collection('chats').doc(chatId).get();
      
      if (!chatDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Chat not found');
      }

      const chatData = chatDoc.data();
      const participants = chatData?.participants || [];

      if (!participants.includes(context.auth.uid)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'User is not a participant in this chat'
        );
      }

      // Fetch messages with efficient query
      // Order by timestamp DESC, limit to specified count
      const messagesSnap = await firestore
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      if (messagesSnap.empty) {
        throw new functions.https.HttpsError(
          'not-found',
          'No messages found in this chat'
        );
      }

      functions.logger.info('Fetching messages for summarization', {
        chatId,
        messageCount: messagesSnap.size,
        userId: context.auth.uid,
      });

      // Fetch sender names in parallel (batch read optimization)
      const senderIds = Array.from(
        new Set(messagesSnap.docs.map((doc) => doc.data().senderId))
      );

      const userDocs = await Promise.all(
        senderIds.map((id) => firestore.collection('users').doc(id).get())
      );

      const userNames = new Map<string, string>();
      userDocs.forEach((doc) => {
        if (doc.exists) {
          userNames.set(doc.id, doc.data()?.displayName || 'Unknown');
        }
      });

      // Build message array in chronological order
      // Filter out empty messages and format images properly
      const messages = messagesSnap.docs
        .reverse() // Reverse to get chronological order
        .map((doc) => {
          const data = doc.data();
          // Proper logic: Check for image first, then content
          let content: string;
          if (data.imageUrl) {
            content = '📷 [Image]';
          } else if (data.content && data.content.trim()) {
            content = data.content;
          } else {
            return null; // Filter out empty messages
          }

          return {
            sender: userNames.get(data.senderId) || 'Unknown',
            content,
            timestamp: data.timestamp,
          };
        })
        .filter((msg): msg is NonNullable<typeof msg> => msg !== null); // Remove nulls

      // Check if we have any valid messages after filtering
      if (messages.length === 0) {
        throw new functions.https.HttpsError(
          'not-found',
          'No valid text messages found in this chat (only empty or image messages)'
        );
      }

      // Extract metadata
      const participantNames = Array.from(
        new Set(messages.map((m) => m.sender))
      );
      
      const timeRange = {
        start: messages[0].timestamp,
        end: messages[messages.length - 1].timestamp,
      };

      // Generate summary using OpenAI
      functions.logger.info('Calling OpenAI for summarization', {
        messageCount: messages.length,
        participants: participantNames.length,
      });

      const promptMessages = PROMPTS.summarizeThread(messages);
      const startTime = Date.now();

      const response = await callChatCompletion(promptMessages, {
        model: 'gpt-4o-mini', // Cost-efficient model
        temperature: 0.7,
        maxTokens: 500, // Limit output length to control costs
      });

      const duration = Date.now() - startTime;

      const summary = response.choices[0].message.content || 'Unable to generate summary';

      functions.logger.info('Summarization complete', {
        chatId,
        duration,
        summaryLength: summary.length,
        tokensUsed: response.usage?.total_tokens || 0,
      });

      // ===============================================
      // 💾 Auto-save summary to Firestore for history
      // ===============================================
      const dateKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const now = Date.now();
      
      try {
        const summaryRef = firestore
          .collection('chats')
          .doc(chatId)
          .collection('summaries')
          .doc(dateKey);
        
        const existingSummary = await summaryRef.get();
        
        await summaryRef.set({
          date: dateKey,
          summary,
          messageCount: messages.length,
          participants: participantNames,
          timeRange,
          createdAt: existingSummary.exists ? existingSummary.data()!.createdAt : now,
          updatedAt: now,
          generatedBy: 'manual',
          userId: context.auth.uid,
        }, { merge: true });
        
        functions.logger.info('Summary saved to Firestore', {
          chatId,
          date: dateKey,
          isUpdate: existingSummary.exists,
        });
        
        // Embed for RAG (async, don't wait)
        embedSummaryForRAG(chatId, dateKey, summary, {
          messageCount: messages.length,
          participants: participantNames,
        }).catch((error) => {
          functions.logger.warn('Failed to embed summary (non-critical)', {
            chatId,
            date: dateKey,
            error: error.message,
          });
        });
        
      } catch (saveError: any) {
        // Non-critical - log but don't fail the request
        functions.logger.warn('Failed to save summary to Firestore (non-critical)', {
          chatId,
          error: saveError.message,
        });
      }
      // ===============================================

      return {
        summary,
        messageCount: messages.length,
        timeRange,
        participants: participantNames,
      };

    } catch (error: any) {
      functions.logger.error('Error summarizing thread', {
        error: error.message,
        chatId,
        userId: context.auth?.uid,
      });

      // Handle specific error types
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      // Wrap other errors
      throw new functions.https.HttpsError(
        'internal',
        `Failed to summarize thread: ${error.message}`
      );
    }
  }
);

/**
 * Helper: Embed summary for RAG (Pinecone)
 * Makes summaries searchable by AI Assistant
 */
async function embedSummaryForRAG(
  chatId: string,
  dateKey: string,
  summary: string,
  metadata: { messageCount: number; participants: string[] }
): Promise<void> {
  try {
    // Import embedding function
    const { embedMessage } = require('./embeddings');
    
    // Create unique ID for summary
    const summaryId = `summary_${chatId}_${dateKey}`;
    
    // Embed with enriched metadata
    await embedMessage(
      summaryId,
      chatId,
      `Daily Summary (${dateKey}): ${summary}`,
      {
        type: 'daily_summary',
        date: dateKey,
        messageCount: metadata.messageCount,
        participants: metadata.participants.join(', '),
        generatedBy: 'manual',
      }
    );
    
    functions.logger.info('Summary embedded for RAG', {
      chatId,
      date: dateKey,
      summaryId,
    });
    
  } catch (error: any) {
    // Non-critical error - log and continue
    functions.logger.warn('Summary embedding failed', {
      chatId,
      date: dateKey,
      error: error.message,
    });
  }
}

