/**
 * Persona Agent - IQT Mode (Impersonation Query Thread)
 * Generates AI responses mimicking the user's communication style
 * Uses personality profile + RAG + key messages for context
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';

// Initialize Pinecone client (reuse singleton pattern from knowledgeAgent)
let pineconeClient: Pinecone | null = null;
let vectorStore: PineconeStore | null = null;

function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.EXPO_PUBLIC_PINECONE_API_KEY || functions.config().pinecone?.api_key;
    if (!apiKey) {
      throw new Error('Pinecone API key not configured');
    }
    pineconeClient = new Pinecone({ apiKey });
  }
  return pineconeClient;
}

async function getVectorStore(): Promise<PineconeStore> {
  if (!vectorStore) {
    const pc = getPineconeClient();
    const indexName = functions.config().pinecone?.index || process.env.EXPO_PUBLIC_PINECONE_INDEX || 'chatiq-messages';
    const index = pc.Index(indexName);

    const apiKey = functions.config().openai?.api_key || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
      apiKey: apiKey,
    });

    vectorStore = new PineconeStore(embeddings, {
      pineconeIndex: index,
      textKey: 'content',
    });
  }
  return vectorStore;
}

/**
 * Extract keywords from query for bulletin lookup
 */
function extractKeywords(query: string): string[] {
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
    'in', 'to', 'of', 'for', 'with', 'as', 'by', 'from', 'this', 'that'
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => !stopWords.has(word) && word.length > 3)
    .slice(0, 5); // Limit to top 5 keywords
}

/**
 * Persona Agent - Main IQT Function
 */
export const personaAgent = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { query, userId, chatId } = data;

    if (!query || !userId || !chatId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters: query, userId, chatId');
    }

    console.log(`🤖 [PersonaAgent] Query for user ${userId}: ${query}`);

    // Step 1: Fetch personality profile from Firestore
    const personalityDoc = await admin.firestore().doc(`users/${userId}/personality`).get();
    const personality = personalityDoc.exists
      ? personalityDoc.data()!
      : {
          tone: 'neutral',
          avgLength: 100,
          phrases: [],
          enabled: false
        };

    // Check if IQT mode is enabled
    if (!personality.enabled) {
      console.log(`⚠️ [PersonaAgent] IQT mode disabled for user ${userId}`);
      return {
        responseText: null,
        confidence: 0,
        sources: [],
        reason: 'IQT mode is disabled'
      };
    }

    // Step 2: Bulletin Lookup - Find relevant key messages
    const keywords = extractKeywords(query);
    console.log(`🔍 [PersonaAgent] Extracted keywords: ${keywords.join(', ')}`);

    let bulletins: Array<{ id: string; text: string }> = [];

    if (keywords.length > 0) {
      const bulletinQuery = admin.firestore()
        .collection(`users/${userId}/keyMessages`)
        .where('tags', 'array-contains-any', keywords)
        .limit(5);

      const bulletinsSnapshot = await bulletinQuery.get();
      bulletins = bulletinsSnapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text as string
      }));

      console.log(`📋 [PersonaAgent] Found ${bulletins.length} bulletins`);
    }

    // Step 3: Evaluate bulletin relevance with LLM
    const apiKey = functions.config().openai?.api_key || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new functions.https.HttpsError('internal', 'OpenAI API key not configured');
    }

    let highRelevanceBulletin: { id: string; text: string } | null = null;
    let maxBulletinScore = 0;

    if (bulletins.length > 0) {
      const llm = new ChatOpenAI({
        modelName: 'gpt-4o-mini',
        temperature: 0,
        apiKey
      });

      for (const bulletin of bulletins) {
        const relevancePrompt = PromptTemplate.fromTemplate(
          'On a scale of 0-100, how relevant is this text to answering the query? ' +
          'Respond with ONLY the number (e.g., "85").\n\n' +
          'Text: {text}\n' +
          'Query: {query}\n\n' +
          'Relevance score:'
        );

        const chain = RunnableSequence.from([
          relevancePrompt,
          llm,
          new StringOutputParser()
        ]);

        try {
          const scoreStr = await chain.invoke({ text: bulletin.text, query });
          const score = parseInt(scoreStr.trim(), 10);

          if (!isNaN(score) && score > maxBulletinScore) {
            maxBulletinScore = score;
            highRelevanceBulletin = bulletin;
          }

          console.log(`📊 [PersonaAgent] Bulletin relevance: ${score}%`);
        } catch (error) {
          console.error(`❌ [PersonaAgent] Failed to evaluate bulletin:`, error);
        }
      }
    }

    // Step 4: RAG Query with Pinecone (filter by userId)
    const store = await getVectorStore();

    // Perform similarity search with userId metadata filter
    const ragResults = await (store as any).similaritySearchWithScore(query, 5, { userId });

    console.log(`🔍 [PersonaAgent] RAG search returned ${ragResults?.length || 0} results`);

    // Filter results with score > 0.7 (higher similarity = lower distance in some implementations)
    // Note: Pinecone uses cosine similarity, so higher is better
    const relevantRags = ragResults.filter(([_, score]: [any, number]) => score > 0.7);

    console.log(`✅ [PersonaAgent] ${relevantRags.length} relevant RAG results (score > 0.7)`);

    // Step 5: Confidence Check
    const ragConfidence = relevantRags.length > 0
      ? Math.max(...relevantRags.map(([_, s]: [any, number]) => s))
      : 0;
    const bulletinConfidence = maxBulletinScore / 100;
    const overallConfidence = Math.max(ragConfidence, bulletinConfidence);

    console.log(`📊 [PersonaAgent] Confidence - RAG: ${ragConfidence.toFixed(2)}, Bulletin: ${bulletinConfidence.toFixed(2)}, Overall: ${overallConfidence.toFixed(2)}`);

    if (overallConfidence < 0.7) {
      console.log(`⚠️ [PersonaAgent] Confidence too low (${overallConfidence.toFixed(2)} < 0.7)`);
      return {
        responseText: null,
        confidence: overallConfidence,
        sources: [],
        reason: 'Confidence too low - insufficient context to generate accurate response'
      };
    }

    // Step 6: Generate Response with LLM
    const context = [
      ...relevantRags.map(([doc]: [any, number]) => doc.pageContent || doc.text || ''),
      highRelevanceBulletin ? highRelevanceBulletin.text : ''
    ].filter(Boolean).join('\n\n---\n\n');

    const prompt = PromptTemplate.fromTemplate(
      `You are responding AS this user (not to them). You must mimic their communication style exactly.

PERSONALITY PROFILE:
- Tone: {tone}
- Average response length: {avgLength} words
- Common phrases: {phrases}

KNOWLEDGE BASE CONTEXT:
{context}

CRITICAL INSTRUCTIONS:
1. Respond EXACTLY as this user would respond
2. Use ONLY information from the knowledge base context above
3. Match the tone and average length specified
4. Use the common phrases when natural
5. If the context doesn't contain enough information to answer confidently, respond with: "I'm not sure about that."
6. Be concise and natural

Question: {query}

Response as the user:`
    );

    const responseLlm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      apiKey
    });

    const chain = RunnableSequence.from([
      prompt,
      responseLlm,
      new StringOutputParser()
    ]);

    const responseText = await chain.invoke({
      tone: personality.tone || 'neutral',
      avgLength: personality.avgLength || 100,
      phrases: Array.isArray(personality.phrases) ? personality.phrases.join(', ') : '',
      context,
      query
    });

    console.log(`✅ [PersonaAgent] Response generated successfully`);

    // Step 7: Compile sources
    const sources = [
      ...relevantRags.map(([doc]: [any, number]) => ({
        type: 'rag' as const,
        id: doc.metadata?.id || 'unknown',
        preview: (doc.pageContent || '').substring(0, 100)
      })),
      highRelevanceBulletin ? {
        type: 'bulletin' as const,
        id: highRelevanceBulletin.id,
        preview: highRelevanceBulletin.text.substring(0, 100)
      } : null
    ].filter(Boolean);

    return {
      responseText,
      confidence: overallConfidence,
      sources,
      reason: 'success'
    };

  } catch (error: any) {
    console.error('❌ [PersonaAgent] Error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to generate persona response'
    );
  }
});
