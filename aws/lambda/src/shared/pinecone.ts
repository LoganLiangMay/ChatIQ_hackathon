import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient: Pinecone | null = null;

/**
 * Get or create Pinecone client
 * Uses singleton pattern for connection reuse
 */
export function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY environment variable not set');
    }

    pineconeClient = new Pinecone({
      apiKey,
    });
  }
  return pineconeClient;
}

/**
 * Message metadata stored with vectors in Pinecone
 */
export interface MessageMetadata {
  chatId: string;
  messageId: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  content: string;
  isGroupChat: boolean;
}

/**
 * User knowledge metadata
 */
export interface KnowledgeMetadata {
  userId: string;
  category: 'project' | 'availability' | 'preference' | 'commitment' | 'technical' | 'contact' | 'other';
  fact: string;
  context: string;
  confidence: number;
  extractedAt: number;
  sourceMessages: string[]; // Array of message IDs
}

/**
 * Upsert message embeddings to Pinecone
 * 
 * @param indexName - Pinecone index name (e.g., 'chat-messages')
 * @param vectors - Array of vectors to upsert
 */
export async function upsertMessageVectors(
  indexName: string,
  vectors: Array<{
    id: string;
    values: number[];
    metadata: MessageMetadata;
  }>
): Promise<void> {
  const client = getPineconeClient();
  const index = client.index(indexName);

  try {
    await index.upsert(vectors);
    console.log(`Upserted ${vectors.length} vectors to ${indexName}`);
  } catch (error: any) {
    console.error('Error upserting vectors:', error);
    throw new Error(`Failed to upsert vectors: ${error.message}`);
  }
}

/**
 * Search for similar messages using vector similarity
 * 
 * @param indexName - Pinecone index name
 * @param queryVector - Query embedding vector
 * @param options - Search options
 * @returns Array of matching vectors with scores
 */
export async function searchSimilarMessages(
  indexName: string,
  queryVector: number[],
  options: {
    topK?: number;
    filter?: Record<string, any>;
    includeMetadata?: boolean;
  } = {}
): Promise<Array<{
  id: string;
  score: number;
  metadata?: MessageMetadata;
}>> {
  const client = getPineconeClient();
  const index = client.index(indexName);

  const {
    topK = 10,
    filter = {},
    includeMetadata = true,
  } = options;

  try {
    const response = await index.query({
      vector: queryVector,
      topK,
      filter,
      includeMetadata,
    });

    return response.matches.map(match => ({
      id: match.id,
      score: match.score || 0,
      metadata: match.metadata as MessageMetadata | undefined,
    }));
  } catch (error: any) {
    console.error('Error searching vectors:', error);
    throw new Error(`Vector search failed: ${error.message}`);
  }
}

/**
 * Delete vectors by ID
 * 
 * @param indexName - Pinecone index name
 * @param ids - Array of vector IDs to delete
 */
export async function deleteVectors(
  indexName: string,
  ids: string[]
): Promise<void> {
  const client = getPineconeClient();
  const index = client.index(indexName);

  try {
    await index.deleteMany(ids);
    console.log(`Deleted ${ids.length} vectors from ${indexName}`);
  } catch (error: any) {
    console.error('Error deleting vectors:', error);
    throw new Error(`Failed to delete vectors: ${error.message}`);
  }
}

/**
 * Get index stats
 */
export async function getIndexStats(indexName: string) {
  const client = getPineconeClient();
  const index = client.index(indexName);

  try {
    const stats = await index.describeIndexStats();
    return stats;
  } catch (error: any) {
    console.error('Error getting index stats:', error);
    throw new Error(`Failed to get index stats: ${error.message}`);
  }
}


