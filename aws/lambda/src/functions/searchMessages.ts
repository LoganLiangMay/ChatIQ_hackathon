import { APIGatewayProxyHandler } from 'aws-lambda';
import { generateEmbedding } from '../shared/openai';
import { searchSimilarMessages } from '../shared/pinecone';
import { fetchUserName } from '../shared/firestore';

/**
 * AWS Lambda: Semantic Search
 * 
 * Searches messages using vector similarity in Pinecone
 * 
 * Cost-optimized:
 * - Only runs when user explicitly searches
 * - Single embedding generation per query
 * - Fast Pinecone lookup (<100ms)
 * 
 * Expected response time: <3s
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Search request:', event.body);

  try {
    const body = JSON.parse(event.body || '{}');
    const { query, limit = 10, userId, chatIds } = body;

    // Validate input
    if (!query || typeof query !== 'string') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Invalid query parameter',
        }),
      };
    }

    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'User ID required',
        }),
      };
    }

    const startTime = Date.now();

    // Step 1: Generate embedding for query
    console.log('Generating embedding for query:', query);
    const queryEmbedding = await generateEmbedding(query);

    // Step 2: Search Pinecone for similar messages
    const filter: Record<string, any> = {};
    
    // Filter by user's chats if provided
    if (chatIds && Array.isArray(chatIds) && chatIds.length > 0) {
      filter.chatId = { $in: chatIds };
    }

    console.log('Searching Pinecone with filter:', filter);
    const results = await searchSimilarMessages(
      'chat-messages',
      queryEmbedding,
      {
        topK: limit,
        filter,
        includeMetadata: true,
      }
    );

    // Step 3: Format results
    const formattedResults = await Promise.all(
      results.map(async (result) => {
        const metadata = result.metadata!;
        return {
          messageId: result.id,
          chatId: metadata.chatId,
          content: metadata.content,
          senderId: metadata.senderId,
          senderName: metadata.senderName,
          timestamp: metadata.timestamp,
          score: result.score,
          relevance: result.score > 0.8 ? 'high' : result.score > 0.6 ? 'medium' : 'low',
        };
      })
    );

    const duration = Date.now() - startTime;

    console.log(`Search complete in ${duration}ms, found ${formattedResults.length} results`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        results: formattedResults,
        query,
        duration,
        totalResults: formattedResults.length,
      }),
    };

  } catch (error: any) {
    console.error('Search error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Search failed',
        message: error.message,
      }),
    };
  }
};


