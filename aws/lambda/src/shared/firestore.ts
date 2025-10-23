import * as admin from 'firebase-admin';

let initialized = false;

/**
 * Initialize Firebase Admin SDK
 * Only initializes once (singleton pattern)
 */
export function initializeFirebase(): admin.app.App {
  if (!initialized) {
    // Check if running in Firebase environment
    if (admin.apps.length === 0) {
      // AWS Lambda environment - use service account
      const projectId = process.env.FIREBASE_PROJECT_ID;
      
      if (!projectId) {
        throw new Error('FIREBASE_PROJECT_ID environment variable not set');
      }

      admin.initializeApp({
        projectId,
        // In production, use a service account key or workload identity
        // For now, we'll use application default credentials
      });
    }
    initialized = true;
  }
  return admin.app();
}

/**
 * Get Firestore instance
 */
export function getFirestore(): admin.firestore.Firestore {
  initializeFirebase();
  return admin.firestore();
}

/**
 * Fetch messages from a chat
 * 
 * @param chatId - Chat ID
 * @param limit - Maximum number of messages to fetch
 * @param startAfter - Timestamp to start after (for pagination)
 * @returns Array of messages
 */
export async function fetchMessages(
  chatId: string,
  limit: number = 100,
  startAfter?: number
): Promise<Array<{
  id: string;
  content: string;
  senderId: string;
  timestamp: number;
  imageUrl?: string;
}>> {
  const firestore = getFirestore();
  
  let query = firestore
    .collection('chats')
    .doc(chatId)
    .collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(limit);

  if (startAfter) {
    query = query.startAfter(startAfter);
  }

  const snapshot = await query.get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data() as any,
  }));
}

/**
 * Fetch all chats for a user
 * 
 * @param userId - User ID
 * @returns Array of chat IDs
 */
export async function fetchUserChats(userId: string): Promise<string[]> {
  const firestore = getFirestore();
  
  const snapshot = await firestore
    .collection('chats')
    .where('participants', 'array-contains', userId)
    .get();

  return snapshot.docs.map(doc => doc.id);
}

/**
 * Fetch user display name
 * 
 * @param userId - User ID
 * @returns Display name or 'Unknown'
 */
export async function fetchUserName(userId: string): Promise<string> {
  const firestore = getFirestore();
  
  const doc = await firestore.collection('users').doc(userId).get();
  
  if (!doc.exists) {
    return 'Unknown';
  }

  return doc.data()?.displayName || 'Unknown';
}

/**
 * Batch fetch user names
 * 
 * @param userIds - Array of user IDs
 * @returns Map of userId -> displayName
 */
export async function fetchUserNamesBatch(userIds: string[]): Promise<Map<string, string>> {
  const firestore = getFirestore();
  const userNames = new Map<string, string>();

  // Firestore has a limit of 10 documents per getAll call
  // We'll batch in chunks of 10
  const chunks = [];
  for (let i = 0; i < userIds.length; i += 10) {
    chunks.push(userIds.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    const docs = await Promise.all(
      chunk.map(id => firestore.collection('users').doc(id).get())
    );

    docs.forEach(doc => {
      if (doc.exists) {
        userNames.set(doc.id, doc.data()?.displayName || 'Unknown');
      }
    });
  }

  return userNames;
}

/**
 * Store AI-generated knowledge to Firestore
 * 
 * @param userId - User ID
 * @param knowledge - Knowledge items
 */
export async function storeKnowledge(
  userId: string,
  knowledge: Array<{
    category: string;
    fact: string;
    context: string;
    confidence: number;
    sourceMessages: string[];
  }>
): Promise<void> {
  const firestore = getFirestore();
  const batch = firestore.batch();

  knowledge.forEach(item => {
    const ref = firestore
      .collection('users')
      .doc(userId)
      .collection('knowledge')
      .doc();

    batch.set(ref, {
      ...item,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
  console.log(`Stored ${knowledge.length} knowledge items for user ${userId}`);
}


