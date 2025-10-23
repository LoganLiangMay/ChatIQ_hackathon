import { EventBridgeHandler } from 'aws-lambda';
import { fetchUserChats, fetchMessages, fetchUserNamesBatch, storeKnowledge } from '../shared/firestore';
import { generateEmbeddingsBatch } from '../shared/openai';
import { upsertMessageVectors, MessageMetadata } from '../shared/pinecone';
import { callChatCompletion } from '../shared/openai';

/**
 * AWS Lambda: Knowledge Base Builder
 * 
 * Runs hourly via EventBridge
 * Processes new messages and builds knowledge base
 * 
 * Heavy processing tasks:
 * 1. Generate embeddings for new messages (batch)
 * 2. Store embeddings in Pinecone
 * 3. Extract user knowledge from conversations
 * 4. Update Firestore knowledge collection
 * 
 * Cost-optimized:
 * - Batch processing (hourly, not real-time)
 * - Generates embeddings in batches of 100
 * - Only processes messages from last hour
 * - Uses GPT-4-mini for knowledge extraction
 */
export const handler: EventBridgeHandler<'Scheduled Event', any, void> = async (event) => {
  console.log('Knowledge builder triggered:', event);

  const startTime = Date.now();
  
  try {
    // For MVP, we'll process a sample of users
    // In production, you'd fetch active users from Firestore
    const SAMPLE_USER_IDS = process.env.SAMPLE_USER_IDS?.split(',') || [];

    if (SAMPLE_USER_IDS.length === 0) {
      console.log('No users to process. Set SAMPLE_USER_IDS env var.');
      return;
    }

    let totalMessagesProcessed = 0;
    let totalEmbeddingsGenerated = 0;
    let totalKnowledgeItems = 0;

    for (const userId of SAMPLE_USER_IDS) {
      console.log(`Processing user: ${userId}`);

      // Step 1: Fetch user's chats
      const chatIds = await fetchUserChats(userId);
      console.log(`User has ${chatIds.length} chats`);

      // Step 2: Fetch recent messages (last hour)
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const allMessages: Array<{
        chatId: string;
        messageId: string;
        content: string;
        senderId: string;
        timestamp: number;
        imageUrl?: string;
      }> = [];

      for (const chatId of chatIds) {
        const messages = await fetchMessages(chatId, 100, oneHourAgo);
        
        messages.forEach(msg => {
          allMessages.push({
            chatId,
            messageId: msg.id,
            content: msg.content || '[Image]',
            senderId: msg.senderId,
            timestamp: msg.timestamp,
            imageUrl: msg.imageUrl,
          });
        });
      }

      console.log(`Found ${allMessages.length} new messages`);
      
      if (allMessages.length === 0) {
        continue;
      }

      totalMessagesProcessed += allMessages.length;

      // Step 3: Fetch sender names
      const senderIds = Array.from(new Set(allMessages.map(m => m.senderId)));
      const senderNames = await fetchUserNamesBatch(senderIds);

      // Step 4: Generate embeddings in batches
      const messageBatches = [];
      for (let i = 0; i < allMessages.length; i += 100) {
        messageBatches.push(allMessages.slice(i, i + 100));
      }

      for (const batch of messageBatches) {
        const texts = batch.map(m => m.content);
        const embeddings = await generateEmbeddingsBatch(texts);
        
        totalEmbeddingsGenerated += embeddings.length;

        // Step 5: Store in Pinecone
        const vectors = batch.map((msg, idx) => ({
          id: msg.messageId,
          values: embeddings[idx],
          metadata: {
            chatId: msg.chatId,
            messageId: msg.messageId,
            senderId: msg.senderId,
            senderName: senderNames.get(msg.senderId) || 'Unknown',
            timestamp: msg.timestamp,
            content: msg.content,
            isGroupChat: chatIds.length > 2, // Simple heuristic
          } as MessageMetadata,
        }));

        await upsertMessageVectors('chat-messages', vectors);
      }

      // Step 6: Extract knowledge from user's messages
      const userMessages = allMessages.filter(m => m.senderId === userId);
      
      if (userMessages.length > 0) {
        const knowledgePrompt = generateKnowledgePrompt(userMessages);
        const knowledgeResponse = await callChatCompletion(
          knowledgePrompt,
          {
            model: 'gpt-4o-mini',
            temperature: 0.3,
            maxTokens: 1000,
          }
        );

        // Parse knowledge items
        try {
          const knowledgeItems = JSON.parse(knowledgeResponse);
          if (Array.isArray(knowledgeItems) && knowledgeItems.length > 0) {
            await storeKnowledge(userId, knowledgeItems.map(item => ({
              ...item,
              sourceMessages: userMessages.map(m => m.messageId),
            })));
            totalKnowledgeItems += knowledgeItems.length;
          }
        } catch (parseError) {
          console.warn('Failed to parse knowledge response:', parseError);
        }
      }
    }

    const duration = Date.now() - startTime;

    console.log('Knowledge builder complete:', {
      duration,
      totalMessagesProcessed,
      totalEmbeddingsGenerated,
      totalKnowledgeItems,
    });

  } catch (error: any) {
    console.error('Knowledge builder error:', error);
    throw error;
  }
};

/**
 * Generate prompt for knowledge extraction
 */
function generateKnowledgePrompt(
  messages: Array<{ content: string; timestamp: number }>
): Array<{ role: string; content: string }> {
  const messagesText = messages
    .map(m => m.content)
    .join('\n');

  return [
    {
      role: 'system',
      content: `You extract factual knowledge from user messages to build a knowledge base.

Extract information about:
- Project status and details
- Availability and schedule
- Preferences and opinions
- Commitments and agreements
- Technical knowledge
- Contact information

Return JSON array:
[
  {
    "category": "project|availability|preference|commitment|technical|contact|other",
    "fact": "factual statement",
    "context": "additional context",
    "confidence": 0.0-1.0
  }
]`,
    },
    {
      role: 'user',
      content: `Extract knowledge from these messages:\n\n${messagesText}`,
    },
  ];
}


