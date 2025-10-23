import { APIGatewayProxyHandler } from 'aws-lambda';
import { callChatCompletion, generateEmbedding } from '../shared/openai';
import { searchSimilarMessages } from '../shared/pinecone';
import { getFirestore } from '../shared/firestore';

/**
 * AWS Lambda: AI Assistant
 * 
 * Answers questions on user's behalf using knowledge base
 * 
 * Multi-step process:
 * 1. Understand the question
 * 2. Search knowledge base (Pinecone)
 * 3. Retrieve user knowledge (Firestore)
 * 4. Generate answer using GPT-4-mini
 * 5. Identify missing knowledge if needed
 * 
 * Response time target: <15s (advanced AI)
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('AI Assistant request:', event.body);

  try {
    const body = JSON.parse(event.body || '{}');
    const { question, userId, context } = body;

    // Validate input
    if (!question || typeof question !== 'string') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Invalid question parameter',
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

    // Step 1: Generate embedding for question
    console.log('Generating embedding for question:', question);
    const questionEmbedding = await generateEmbedding(question);

    // Step 2: Search for relevant messages in Pinecone
    console.log('Searching for relevant messages...');
    const relevantMessages = await searchSimilarMessages(
      'chat-messages',
      questionEmbedding,
      {
        topK: 5,
        filter: { senderId: userId }, // Only search user's own messages
        includeMetadata: true,
      }
    );

    // Step 3: Fetch user's stored knowledge from Firestore
    console.log('Fetching user knowledge...');
    const firestore = getFirestore();
    const knowledgeSnapshot = await firestore
      .collection('users')
      .doc(userId)
      .collection('knowledge')
      .orderBy('confidence', 'desc')
      .limit(10)
      .get();

    const knowledgeItems = knowledgeSnapshot.docs.map(doc => doc.data());

    // Step 4: Build context for AI
    const messageContext = relevantMessages
      .map(msg => `- ${msg.metadata?.content}`)
      .join('\n');

    const knowledgeContext = knowledgeItems
      .map(item => `- ${item.fact} (${item.category}, confidence: ${item.confidence})`)
      .join('\n');

    // Step 5: Generate answer using GPT-4-mini
    console.log('Generating answer...');
    const prompt = [
      {
        role: 'system',
        content: `You are an AI assistant answering questions on behalf of a user.

Use the provided context (messages and knowledge) to answer accurately.

If you don't have enough information:
- Say so clearly
- List what information is missing
- Suggest what questions to ask the user

Be concise, friendly, and helpful.`,
      },
      {
        role: 'user',
        content: `Question: ${question}

User's Recent Messages:
${messageContext || 'No relevant messages found'}

User's Knowledge Base:
${knowledgeContext || 'No knowledge items found'}

Additional Context:
${context || 'None provided'}

Please answer the question or explain what information is missing.`,
      },
    ];

    const answer = await callChatCompletion(prompt, {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 500,
    });

    // Step 6: Detect if we need more information
    const needsMoreInfo = answer.toLowerCase().includes("don't have") ||
                          answer.toLowerCase().includes("don't know") ||
                          answer.toLowerCase().includes("missing") ||
                          answer.toLowerCase().includes("need more");

    const duration = Date.now() - startTime;

    console.log(`AI Assistant complete in ${duration}ms`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        answer,
        confidence: needsMoreInfo ? 'low' : 'high',
        needsMoreInfo,
        relevantMessagesFound: relevantMessages.length,
        knowledgeItemsUsed: knowledgeItems.length,
        duration,
      }),
    };

  } catch (error: any) {
    console.error('AI Assistant error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'AI Assistant failed',
        message: error.message,
      }),
    };
  }
};


