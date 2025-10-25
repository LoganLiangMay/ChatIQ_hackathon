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

      const { chatId, limit = 30, forceRefresh = false } = data;

      if (!chatId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'chatId is required'
        );
      }

      const userId = context.auth.uid;
      const firestore = admin.firestore();

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

      // ===============================================
      // 🚀 Smart Caching: Check for recent blocker analysis
      // ===============================================
      if (!forceRefresh) {
        const dateKey = new Date().toISOString().split('T')[0];
        const cacheRef = firestore
          .collection('chats')
          .doc(chatId)
          .collection('blockers_cache')
          .doc(dateKey);

        const cachedDoc = await cacheRef.get();

        if (cachedDoc.exists) {
          const cachedData = cachedDoc.data();
          const lastMessageTimestamp = cachedData?.lastMessageTimestamp;

          // Get the latest message in the chat
          const latestMessageSnap = await firestore
            .collection('chats')
            .doc(chatId)
            .collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

          if (!latestMessageSnap.empty) {
            const latestMessage = latestMessageSnap.docs[0].data();
            const latestMessageTime = latestMessage.timestamp;

            // Normalize timestamps to numbers for comparison
            const cachedTimestamp = typeof lastMessageTimestamp === 'object' && lastMessageTimestamp._seconds
              ? lastMessageTimestamp._seconds * 1000 + Math.floor(lastMessageTimestamp._nanoseconds / 1000000)
              : lastMessageTimestamp;

            const currentTimestamp = typeof latestMessageTime === 'object' && latestMessageTime._seconds
              ? latestMessageTime._seconds * 1000 + Math.floor(latestMessageTime._nanoseconds / 1000000)
              : latestMessageTime;

            // If no new messages since last analysis, return cached version
            if (cachedTimestamp && currentTimestamp <= cachedTimestamp) {
              functions.logger.info('✅ Returning cached blockers (no new messages)', {
                chatId,
                cachedDate: dateKey,
                lastMessageTimestamp: cachedTimestamp,
                latestMessageTime: currentTimestamp,
              });

              return {
                blockers: cachedData.blockers || [],
                chatId,
                extractedAt: cachedData.extractedAt,
                messageCount: cachedData.messageCount,
                cached: true,
              };
            }

            functions.logger.info('📝 New messages detected, analyzing for blockers', {
              chatId,
              lastCachedTimestamp: cachedTimestamp,
              currentMessageTimestamp: currentTimestamp,
            });
          }
        }
      } else {
        functions.logger.info('🔄 Force refresh requested, re-analyzing blockers', { chatId });
      }
      // ===============================================

      // Get recent messages
      const messagesSnapshot = await firestore
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

      // Save newest message info BEFORE reversing (for cache tracking)
      const newestMessage = messagesSnapshot.docs[0]; // DESC order, so first = newest
      const newestMessageId = newestMessage.id;
      const newestMessageTimestamp = newestMessage.data().timestamp;

      // Format messages for AI
      // Filter out images and empty messages (same logic as summarize.ts)
      const messages = messagesSnapshot.docs.slice().reverse().map(doc => {
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

      // ===============================================
      // 💾 Auto-save to Firestore cache
      // ===============================================
      const extractedAt = Date.now();
      try {
        const dateKey = new Date().toISOString().split('T')[0];
        const cacheRef = firestore
          .collection('chats')
          .doc(chatId)
          .collection('blockers_cache')
          .doc(dateKey);

        const cacheData = {
          blockers: enrichedBlockers,
          chatId,
          extractedAt,
          messageCount: messages.length,
          lastMessageId: newestMessageId,
          lastMessageTimestamp: newestMessageTimestamp,
          createdAt: Date.now(),
          userId,
        };

        await cacheRef.set(cacheData, { merge: true });

        console.log('✅ Blockers cached to Firestore', {
          chatId,
          date: dateKey,
          blockersCount: enrichedBlockers.length,
        });
      } catch (cacheError: any) {
        console.warn('⚠️ Failed to cache blockers (non-critical)', {
          chatId,
          error: cacheError.message,
        });
      }
      // ===============================================

      return {
        blockers: enrichedBlockers,
        chatId,
        extractedAt,
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

