/**
 * AI Feature: Decision Tracking
 * Extract decisions made in conversations
 * 
 * Identifies when teams agree on specific courses of action or resolutions.
 * Helps track what was decided, when, and by whom.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { callChatCompletion } from './openai';
import { PROMPTS } from './prompts';

export const extractDecisions = functions
  .runWith({
    timeoutSeconds: 120, // 2 minutes for processing large histories
    memory: '512MB', // Increased memory
  })
  .https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to extract decisions'
      );
    }

    const { chatId, limit = 30 } = data; // Reduced from 50 to 30 for faster processing

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

    // Get recent messages from the chat
    const messagesSnapshot = await admin.firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    console.log(`📊 Chat ${chatId}: Found ${messagesSnapshot.size} messages`);

    if (messagesSnapshot.empty) {
      console.log('❌ No messages found in chat');
      return { decisions: [], projects: [] };
    }

    // Format messages for AI
    // Filter out images and empty messages (same logic as summarize.ts)
    console.log(`📝 Total docs in snapshot: ${messagesSnapshot.docs.length}`);

    const allDocs = messagesSnapshot.docs.reverse(); // Chronological order
    console.log(`📝 After reverse: ${allDocs.length}`);

    const messages = allDocs.map(doc => {
      const data = doc.data();

      // Check for image first, then content (prevent "📷 [Image]" in AI analysis)
      let content: string;
      if (data.imageUrl) {
        console.log(`  Message ${doc.id}: Skipping image message`);
        return null; // Skip images - they don't contain decision information
      } else if (data.content && data.content.trim()) {
        content = data.content;
      } else {
        console.log(`  Message ${doc.id}: Skipping empty message`);
        return null; // Skip empty messages
      }

      // Handle missing senderName by looking up from participants
      let senderName = data.senderName || 'Unknown';
      if (!data.senderName && data.senderId) {
        // Try to find name from participants list
        const participant = participantIds.find((id: string) => id === data.senderId);
        if (participant) {
          senderName = `User_${data.senderId.substring(0, 6)}`;
        }
      }

      console.log(`  Message ${doc.id}: type="${data.type || 'text'}", senderName="${senderName}", content="${content.substring(0, 30)}..."`);

      return {
        messageId: doc.id,
        sender: senderName,
        content,
        timestamp: data.timestamp?.toMillis?.() || data.timestamp || Date.now(),
      };
    }).filter((msg): msg is NonNullable<typeof msg> => msg !== null);

    console.log(`📝 Final formatted messages: ${messages.length}`);
    
    if (messages.length === 0) {
      console.log('❌ No text messages after filtering');
      return { decisions: [], projects: [] };
    }

    // Get participant names for context
    const participantIds = chatData.participants;
    const participantNames = await Promise.all(
      participantIds.map(async (uid: string) => {
        const userDoc = await admin.firestore()
          .collection('users')
          .doc(uid)
          .get();
        return userDoc.exists ? userDoc.data()?.displayName || 'Unknown' : 'Unknown';
      })
    );

    // Get project description for context (if available)
    const projectDescription = chatData.projectDescription || '';

    // Call OpenAI to extract decisions with project context
    const prompt = PROMPTS.trackDecisions(messages, projectDescription);
    const aiResponse = await callChatCompletion(prompt, {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 1000,
    });

    const aiResult = aiResponse.choices[0].message.content;
    
    if (!aiResult) {
      console.log('❌ AI returned empty result');
      return { decisions: [], projects: [] };
    }

    // Parse AI response
    let parsed;
    try {
      parsed = JSON.parse(aiResult);
      console.log(`✅ AI parsed successfully, found ${Array.isArray(parsed) ? parsed.length : (parsed.decisions?.length || 0)} decisions`);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('AI response:', aiResult);
      return { decisions: [], projects: [] };
    }

    // Handle both old format (array) and new format (object with decisions + projects)
    let decisions = Array.isArray(parsed) ? parsed : (parsed.decisions || []);
    let projects = parsed.projects || [];
    
    console.log(`📋 Returning ${decisions.length} decisions and ${projects.length} projects`);

    // Ensure decisions is an array
    if (!Array.isArray(decisions)) {
      console.error('Decisions is not an array:', decisions);
      decisions = [];
    }

    // Add metadata to decisions
    const enrichedDecisions = decisions.map((decision: any) => ({
      id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      decision: decision.decision,
      context: decision.context || null,
      participants: decision.participants || participantNames,
      timestamp: decision.timestamp || Date.now(),
      extractedFrom: {
        chatId,
        messageId: decision.messageId,
      },
      // Enhanced fields
      decisionThread: decision.decisionThread || null,
      topic: decision.topic || null,
      relatedProject: decision.relatedProject || null,
      confidence: decision.confidence || null,
      sentiment: decision.sentiment || null,
    }));

    // Add metadata to projects
    const enrichedProjects = projects.map((project: any) => ({
      id: `project_${project.name.toLowerCase().replace(/\s+/g, '_')}_${chatId}`,
      name: project.name,
      type: project.type || 'project',
      chatId,
      firstMentioned: Date.now(),
      lastUpdated: Date.now(),
      mentions: (project.mentions || []).map((m: any) => ({
        messageId: m.messageId,
        chatId,
        timestamp: messages.find(msg => msg.messageId === m.messageId)?.timestamp || Date.now(),
        content: m.content,
      })),
      status: {
        current: project.status || 'unknown',
        timeline: [{
          status: project.status || 'unknown',
          timestamp: Date.now(),
          messageId: project.mentions?.[0]?.messageId || '',
        }],
      },
      sentiment: project.sentiment || {
        confusion: 0,
        blockerCount: 0,
        confidence: 1,
        areas: [],
      },
      relatedDecisions: enrichedDecisions
        .filter((d: any) => d.relatedProject === project.name)
        .map((d: any) => d.id),
      participants: participantNames,
    }));

    return {
      decisions: enrichedDecisions,
      projects: enrichedProjects,
      chatId,
      extractedAt: Date.now(),
      messageCount: messages.length,
    };

  } catch (error: any) {
    console.error('Error extracting decisions:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to extract decisions',
      error.message
    );
  }
});

