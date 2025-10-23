/**
 * Firebase Cloud Functions for MessageAI
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Login: firebase login
 * 3. Initialize functions: firebase init functions
 * 4. Copy this file to functions/src/index.ts
 * 5. Install dependencies: cd functions && npm install
 * 6. Deploy: firebase deploy --only functions
 * 
 * NOTE: This file is provided for reference. You'll need to:
 * - Set up a Firebase project with Functions enabled
 * - Configure billing (Functions require Blaze plan)
 * - Deploy using Firebase CLI
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Process new messages: Send push notifications + AI priority detection
 * Triggers on: /chats/{chatId}/messages/{messageId}
 */
export const onMessageCreated = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    try {
      const messageData = snapshot.data();
      const { chatId, messageId } = context.params;
      
      // Get sender ID
      const senderId = messageData.senderId;
      const senderName = messageData.senderName || 'Someone';
      const content = messageData.content || '📷 Image';
      
      // Get chat data
      const chatDoc = await admin.firestore()
        .collection('chats')
        .doc(chatId)
        .get();
      
      if (!chatDoc.exists) {
        console.log('Chat not found:', chatId);
        return null;
      }
      
      const chatData = chatDoc.data();
      const participants = chatData?.participants || [];
      const chatName = chatData?.name;
      const isGroup = chatData?.type === 'group';
      
      // Get all participants except sender
      const recipients = participants.filter((uid: string) => uid !== senderId);
      
      if (recipients.length === 0) {
        console.log('No recipients to notify');
        return null;
      }
      
      // Fetch push tokens for all recipients
      const userDocs = await admin.firestore()
        .collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', recipients)
        .get();
      
      const tokens: string[] = [];
      userDocs.forEach(doc => {
        const userData = doc.data();
        if (userData.expoPushToken) {
          tokens.push(userData.expoPushToken);
        }
      });
      
      // Send push notifications (only if tokens exist)
      let result = null;
      if (tokens.length === 0) {
        console.log('⏭️ No push tokens found, skipping push notifications');
      } else {
        // Prepare notification payload
        const notificationTitle = isGroup ? chatName : senderName;
        const notificationBody = isGroup ? `${senderName}: ${content}` : content;
        
        // Send notifications using Expo Push Notification service
        const messages = tokens.map(token => ({
          to: token,
          sound: 'default',
          title: notificationTitle,
          body: notificationBody,
          data: {
            type: 'message',
            chatId,
            senderId,
            senderName,
          },
          badge: 1, // Will be updated by client
        }));
        
        // Send to Expo Push Notification service
        const expoPushUrl = 'https://exp.host/--/api/v2/push/send';
        
        const response = await fetch(expoPushUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messages),
        });
        
        result = await response.json();
        console.log('✅ Push notifications sent:', result);
      }
      
      // ===============================================
      // 🤖 AI: Auto-detect priority for text messages
      // ===============================================
      if (messageData.type === 'text' && messageData.content && !messageData.priority) {
        try {
          console.log('✅ Auto-detecting priority for message:', messageId);
          
          // Import AI functions (dynamic to avoid issues)
          const { callChatCompletion } = require('./ai/openai');
          const { PROMPTS } = require('./ai/prompts');
          
          // Call OpenAI to detect priority
          const messages = PROMPTS.detectPriority(messageData.content);
          const aiResponse = await callChatCompletion(messages, {
            model: 'gpt-4o-mini',
            temperature: 0.3,
            maxTokens: 200,
          });

          const aiResult = aiResponse.choices[0].message.content;
          
          if (aiResult) {
            const parsed = JSON.parse(aiResult);
            
            // Only save if it's actually a priority message (medium or higher)
            if (parsed.isPriority && parsed.score >= 0.3) {
              const priorityData = {
                isPriority: parsed.isPriority,
                score: Number(parsed.score),
                urgencyLevel: parsed.urgencyLevel,
                reason: parsed.reason,
              };

              // Update message with priority
              await snapshot.ref.update({ priority: priorityData });
              
              // Update lastMessage in chat document
              // Wait 500ms for chat document to be updated with the latest message
              await new Promise(resolve => setTimeout(resolve, 500));
              
              const chatRef = admin.firestore().collection('chats').doc(chatId);
              const chatDoc = await chatRef.get();
              
              if (chatDoc.exists) {
                const chatData = chatDoc.data();
                
                // Check if this message is still the last message (within 2 seconds)
                const chatTimestamp = chatData?.lastMessage?.timestamp?.toMillis?.() || chatData?.lastMessage?.timestamp;
                const messageTimestamp = messageData.timestamp?.toMillis?.() || messageData.timestamp;
                const timeDiff = Math.abs(chatTimestamp - messageTimestamp);
                
                // If timestamps are within 2 seconds, this is likely the last message
                if (timeDiff < 2000) {
                  await chatRef.update({ 'lastMessage.priority': priorityData });
                }
              }

              console.log('✅ Priority detected and saved:', {
                messageId,
                urgencyLevel: parsed.urgencyLevel,
                score: parsed.score
              });
            }
          }
        } catch (aiError: any) {
          // Don't fail the whole function if AI fails
          console.error('⚠️ AI priority detection failed (non-critical):', {
            error: aiError.message,
            stack: aiError.stack,
            messageId
          });
        }
      }
      // ===============================================
      
      return result;
      
    } catch (error) {
      console.error('Error in onMessageCreated:', error);
      return null;
    }
  });

/**
 * Clean up old typing indicators
 * Runs every 5 minutes
 */
export const cleanupTypingIndicators = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    try {
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      const chatsSnapshot = await admin.firestore()
        .collection('chats')
        .get();
      
      let cleanupCount = 0;
      
      for (const chatDoc of chatsSnapshot.docs) {
        const chatData = chatDoc.data();
        const typing = chatData.typing || {};
        
        let hasStaleTyping = false;
        const updates: any = {};
        
        for (const [userId, typingData] of Object.entries(typing)) {
          const timestamp = (typingData as any).timestamp;
          const timestampMs = timestamp?.toMillis ? timestamp.toMillis() : timestamp;
          
          if (timestampMs < fiveMinutesAgo) {
            updates[`typing.${userId}`] = admin.firestore.FieldValue.delete();
            hasStaleTyping = true;
          }
        }
        
        if (hasStaleTyping) {
          await chatDoc.ref.update(updates);
          cleanupCount++;
        }
      }
      
      console.log(`Cleaned up stale typing indicators in ${cleanupCount} chats`);
      return null;
      
    } catch (error) {
      console.error('Error cleaning up typing indicators:', error);
      return null;
    }
  });

/**
 * Update user's online status to offline after 5 minutes of inactivity
 * Runs every minute
 */
export const updateInactiveUsers = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    try {
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where('online', '==', true)
        .get();
      
      let updatedCount = 0;
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const lastSeen = userData.lastSeen;
        const lastSeenMs = lastSeen?.toMillis ? lastSeen.toMillis() : lastSeen;
        
        if (lastSeenMs && lastSeenMs < fiveMinutesAgo) {
          await userDoc.ref.update({
            online: false,
          });
          updatedCount++;
        }
      }
      
      console.log(`Updated ${updatedCount} inactive users to offline`);
      return null;
      
    } catch (error) {
      console.error('Error updating inactive users:', error);
      return null;
    }
  });

/**
 * AI Features - Priority Detection
 * Analyze message content for urgency indicators
 */
export { detectPriority } from './ai/detectPriority';

/**
 * AI Features - Thread Summarization
 * Generate concise summaries of conversation threads
 */
export { summarizeThread } from './ai/summarize';

/**
 * AI Features - Action Item Extraction
 * Extract tasks and commitments from conversations
 */
export { extractActionItems } from './ai/extractActions';
