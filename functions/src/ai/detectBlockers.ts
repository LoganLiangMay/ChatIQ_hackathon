/**
 * AI Feature: Blocker Detection
 * Detects project blockers preventing progress
 * 
 * Identifies obstacles like waiting on dependencies, technical issues, or approval needs.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { callChatCompletion } from './openai';

export const detectBlockers = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '512MB',
  })
  .https.onCall(async (data, context) => {
    try {
      // Verify authentication
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated to detect blockers'
        );
      }

      const { chatId, limit = 30 } = data;

      if (!chatId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'chatId is required'
        );
      }

      const userId = context.auth.uid;

      // Verify user has access to this chat
      const chatDoc = await admin.firestore()
        .collection('chats')
        .doc(chatId)
        .get();

      if (!chatDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Chat not found'
        );
      }

      const chatData = chatDoc.data();
      if (!chatData?.participants.includes(userId)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'User is not a participant in this chat'
        );
      }

      // Get recent messages
      const messagesSnapshot = await admin.firestore()
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      console.log(`📊 [detectBlockers] Chat ${chatId}: Found ${messagesSnapshot.size} messages`);

      if (messagesSnapshot.empty) {
        console.log('❌ No messages found in chat');
        return { blockers: [] };
      }

      // Format messages for AI
      // Filter out images and empty messages (same logic as summarize.ts)
      const messages = messagesSnapshot.docs.reverse().map(doc => {
        const data = doc.data();

        // Check for image first, then content (prevent "📷 [Image]" in AI analysis)
        let content: string;
        if (data.imageUrl) {
          return null; // Skip images - they don't contain blocker information
        } else if (data.content && data.content.trim()) {
          content = data.content;
        } else {
          return null; // Skip empty messages
        }

        return {
          messageId: doc.id,
          sender: data.senderName || 'Unknown',
          content,
          timestamp: data.timestamp?.toMillis?.() || Date.now(),
        };
      }).filter((msg): msg is NonNullable<typeof msg> => msg !== null);

      if (messages.length === 0) {
        console.log('❌ No text messages after filtering');
        return { blockers: [] };
      }

      // AI prompt for blocker detection
      const prompt = [
        {
          role: 'system',
          content: `You are an AI that detects project blockers in team conversations.
        
Blockers are obstacles preventing progress:
- "waiting on X", "blocked by Y", "can't proceed until Z"
- "stuck on", "need approval from", "dependencies not ready"
- Technical issues: "server down", "API broken", "deployment failed"
- Resource constraints: "waiting for budget", "need more time", "understaffed"

For each blocker, extract:
1. Blocker description (concise, actionable)
2. Context (why it's blocking progress)
3. Severity: low (minor delay), medium (significant delay), high (project-stopping)`,
        },
        {
          role: 'user',
          content: `Analyze these messages for blockers:

${messages.map(m => `[${m.messageId}] ${m.sender}: ${m.content}`).join('\n')}

Return JSON array (empty array if no blockers found):
[
  {
    "blocker": "brief description",
    "context": "why it's blocking",
    "severity": "low" | "medium" | "high",
    "messageId": "id"
  }
]`,
        },
      ];

      const response = await callChatCompletion(prompt, {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 800,
      });

      const aiResult = response.choices[0].message.content;
      
      if (!aiResult) {
        console.log('❌ AI returned empty result');
        return { blockers: [] };
      }

      // Parse AI response
      let blockers;
      try {
        blockers = JSON.parse(aiResult);
        console.log(`✅ AI parsed successfully, found ${blockers.length} blockers`);
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.log('AI response:', aiResult);
        return { blockers: [] };
      }

      // Ensure blockers is an array
      if (!Array.isArray(blockers)) {
        console.error('Blockers is not an array:', blockers);
        blockers = [];
      }

      // Add metadata to blockers
      const enrichedBlockers = blockers.map((b: any) => ({
        id: `blocker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        blocker: b.blocker,
        context: b.context,
        severity: b.severity || 'medium',
        timestamp: Date.now(),
        extractedFrom: { messageId: b.messageId },
      }));

      return {
        blockers: enrichedBlockers,
        chatId,
        extractedAt: Date.now(),
        messageCount: messages.length,
      };

    } catch (error: any) {
      console.error('Error detecting blockers:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to detect blockers',
        error.message
      );
    }
  });

