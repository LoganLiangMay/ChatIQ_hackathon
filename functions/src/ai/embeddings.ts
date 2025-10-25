import { Pinecone } from '@pinecone-database/pinecone';
import * as functions from 'firebase-functions';
import { generateEmbedding, generateEmbeddingsBatch } from './openai';

/**
 * Pinecone Vector Database Service for Firebase Functions
 * Handles message embedding and semantic search
 */

// Initialize Pinecone client
const pc = new Pinecone({
  apiKey: functions.config().pinecone?.api_key || process.env.PINECONE_API_KEY || '',
});

// Get the index
const indexName = functions.config().pinecone?.index || process.env.PINECONE_INDEX || 'chatiq-messages';

/**
 * Get Pinecone index (lazy initialization)
 */
function getIndex() {
  return pc.index(indexName);
}

/**
 * Embed a single message and store in Pinecone
 */
export async function embedMessage(
  messageId: string,
  chatId: string,
  content: string,
  metadata: {
    senderId: string;
    senderName: string;
    chatName?: string;
    isPriority?: boolean;
    hasActionItems?: boolean;
    hasDecision?: boolean;
  }
): Promise<void> {
  try {
    // Generate embedding using OpenAI
    const embedding = await generateEmbedding(content);
    
    // Get index
    const index = getIndex();
    
    // Upsert to Pinecone
    await index.upsert([
      {
        id: messageId,
        values: embedding,
        metadata: {
          chatId,
          content,
          timestamp: Date.now(),
          ...metadata,
        },
      },
    ]);
    
    console.log('✅ Embedded message:', messageId);
  } catch (error: any) {
    console.error('❌ Error embedding message:', error);
    // Don't throw - embeddings are non-critical
  }
}

/**
 * Embed multiple messages in batch
 */
export async function embedMessagesBatch(
  messages: Array<{
    messageId: string;
    chatId: string;
    content: string;
    metadata: any;
  }>
): Promise<void> {
  try {
    // Generate embeddings in batch
    const contents = messages.map(m => m.content);
    const embeddings = await generateEmbeddingsBatch(contents);
    
    // Prepare vectors for Pinecone
    const vectors = messages.map((msg, idx) => ({
      id: msg.messageId,
      values: embeddings[idx],
      metadata: {
        chatId: msg.chatId,
        content: msg.content,
        timestamp: Date.now(),
        ...msg.metadata,
      },
    }));
    
    // Get index
    const index = getIndex();
    
    // Upsert to Pinecone in batches of 100
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
    }
    
    console.log(`✅ Embedded ${messages.length} messages in batch`);
  } catch (error: any) {
    console.error('❌ Error batch embedding messages:', error);
  }
}

/**
 * Search for similar messages using semantic search
 */
export async function searchSimilarMessages(
  query: string,
  topK: number = 10,
  filter?: Record<string, any>
): Promise<Array<{
  messageId: string;
  score: number;
  content: string;
  chatId: string;
  metadata: any;
}>> {
  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);
    
    // Get index
    const index = getIndex();
    
    // Query Pinecone
    const results = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      filter, // e.g., { chatId: 'chat_123' }
    });
    
    // Format results
    return results.matches.map(match => ({
      messageId: match.id,
      score: match.score || 0,
      content: (match.metadata?.content as string) || '',
      chatId: (match.metadata?.chatId as string) || '',
      metadata: match.metadata,
    }));
  } catch (error: any) {
    console.error('❌ Error searching similar messages:', error);
    return [];
  }
}

/**
 * Delete message embedding from Pinecone
 */
export async function deleteMessageEmbedding(messageId: string): Promise<void> {
  try {
    const index = getIndex();
    await index.deleteOne(messageId);
    console.log('✅ Deleted message embedding:', messageId);
  } catch (error: any) {
    console.error('❌ Error deleting message embedding:', error);
  }
}

/**
 * Export Pinecone client for advanced usage
 */
export { pc };

