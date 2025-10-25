import { Pinecone } from '@pinecone-database/pinecone';
import { generateEmbedding, generateEmbeddingsBatch } from '@/functions/src/ai/openai';

/**
 * Pinecone Vector Database Service
 * For RAG (Retrieval Augmented Generation) with message embeddings
 */

// Initialize Pinecone client
const pc = new Pinecone({
  apiKey: process.env.EXPO_PUBLIC_PINECONE_API_KEY || '',
});

// Get the index
const indexName = process.env.EXPO_PUBLIC_PINECONE_INDEX || 'chatiq-messages';
const index = pc.index(indexName);

/**
 * Message Embedding Interface
 */
export interface MessageEmbedding {
  messageId: string;
  chatId: string;
  content: string;
  embedding: number[];
  timestamp: number;
  metadata: {
    senderId: string;
    senderName: string;
    chatName?: string;
    isPriority?: boolean;
    hasActionItems?: boolean;
    hasDecision?: boolean;
  };
}

/**
 * Generate embedding for a single message and store in Pinecone
 */
export async function embedMessage(
  messageId: string,
  chatId: string,
  content: string,
  metadata: MessageEmbedding['metadata']
): Promise<void> {
  try {
    // Generate embedding using OpenAI
    const embedding = await generateEmbedding(content);
    
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
    throw error;
  }
}

/**
 * Generate embeddings for multiple messages in batch
 */
export async function embedMessagesBatch(
  messages: Array<{
    messageId: string;
    chatId: string;
    content: string;
    metadata: MessageEmbedding['metadata'];
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
    
    // Upsert to Pinecone in batches of 100
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
    }
    
    console.log(`✅ Embedded ${messages.length} messages in batch`);
  } catch (error: any) {
    console.error('❌ Error batch embedding messages:', error);
    throw error;
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
    throw error;
  }
}

/**
 * Delete message embedding from Pinecone
 */
export async function deleteMessageEmbedding(messageId: string): Promise<void> {
  try {
    await index.deleteOne(messageId);
    console.log('✅ Deleted message embedding:', messageId);
  } catch (error: any) {
    console.error('❌ Error deleting message embedding:', error);
    throw error;
  }
}

/**
 * Delete all embeddings for a chat
 */
export async function deleteChatEmbeddings(chatId: string): Promise<void> {
  try {
    await index.deleteMany({
      chatId,
    });
    console.log('✅ Deleted all embeddings for chat:', chatId);
  } catch (error: any) {
    console.error('❌ Error deleting chat embeddings:', error);
    throw error;
  }
}

/**
 * Get index statistics
 */
export async function getIndexStats(): Promise<any> {
  try {
    const stats = await index.describeIndexStats();
    return stats;
  } catch (error: any) {
    console.error('❌ Error getting index stats:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Export Pinecone client and index for advanced usage
export { pc, index };

