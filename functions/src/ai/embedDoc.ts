/**
 * Document Embedding Function
 * Handles uploading and embedding user documents into the knowledge base
 * Supports text files and PDFs (with pdf-parse dependency)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';

// Initialize Pinecone client (singleton)
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
 * Fetch file content from Firebase Storage URL
 */
async function fetchFileContent(fileUrl: string): Promise<string> {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    return await response.text();
  } catch (error: any) {
    console.error('Error fetching file:', error);
    throw new Error(`Failed to fetch file: ${error.message}`);
  }
}

/**
 * Extract filename from storage URL
 */
function extractFilename(url: string): string {
  try {
    const urlParts = url.split('/');
    const encodedFilename = urlParts[urlParts.length - 1].split('?')[0];
    return decodeURIComponent(encodedFilename);
  } catch {
    return 'unknown_file';
  }
}

/**
 * Embed Document Function
 * @param data.fileUrl - Firebase Storage download URL
 * @param data.userId - User ID for metadata filtering
 * @param data.fileName - Optional custom filename
 */
export const embedDoc = functions
  .runWith({
    timeoutSeconds: 300, // 5 minutes for large documents
    memory: '1GB'
  })
  .https.onCall(async (data, context) => {
    try {
      // Verify authentication
      if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
      }

      const { fileUrl, userId, fileName } = data;

      if (!fileUrl || !userId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Missing required parameters: fileUrl and userId'
        );
      }

      console.log(`📄 [EmbedDoc] Starting document embedding for user ${userId}`);
      console.log(`📄 [EmbedDoc] File URL: ${fileUrl.substring(0, 100)}...`);

      // Fetch file content
      const fileContent = await fetchFileContent(fileUrl);
      const actualFileName = fileName || extractFilename(fileUrl);

      console.log(`📄 [EmbedDoc] File content length: ${fileContent.length} characters`);

      if (fileContent.length < 10) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'File content is too short (minimum 10 characters)'
        );
      }

      // Create text splitter for chunking
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 50,
        separators: ['\n\n', '\n', '. ', ' ', '']
      });

      // Split document into chunks
      const docs = await splitter.createDocuments([fileContent]);

      console.log(`📄 [EmbedDoc] Split into ${docs.length} chunks`);

      // Get vector store
      const store = await getVectorStore();

      // Prepare documents with metadata
      const timestamp = Date.now();
      const documentsToEmbed = docs.map((doc, index) => ({
        pageContent: doc.pageContent,
        metadata: {
          id: `doc_${userId}_${timestamp}_${index}`,
          type: 'doc',
          userId,
          fileName: actualFileName,
          chunkIndex: index,
          totalChunks: docs.length,
          uploadedAt: timestamp
        }
      }));

      // Add documents to Pinecone
      await store.addDocuments(documentsToEmbed);

      console.log(`✅ [EmbedDoc] Successfully embedded ${docs.length} chunks`);

      // Store document metadata in Firestore
      await admin.firestore().collection(`users/${userId}/documents`).add({
        fileName: actualFileName,
        fileUrl,
        chunks: docs.length,
        characters: fileContent.length,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'embedded'
      });

      return {
        success: true,
        fileName: actualFileName,
        chunks: docs.length,
        characters: fileContent.length
      };

    } catch (error: any) {
      console.error('❌ [EmbedDoc] Error:', error);

      // Store error in Firestore for debugging
      if (data.userId) {
        try {
          await admin.firestore().collection(`users/${data.userId}/documents`).add({
            fileName: data.fileName || 'unknown',
            fileUrl: data.fileUrl,
            uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'error',
            error: error.message
          });
        } catch (firestoreError) {
          console.error('Failed to store error in Firestore:', firestoreError);
        }
      }

      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to embed document'
      );
    }
  });

/**
 * NOTE: PDF Support
 *
 * To enable PDF file support, install pdf-parse dependency:
 * npm install pdf-parse --save
 *
 * Then add PDF processing logic:
 *
 * import pdf from 'pdf-parse';
 *
 * if (actualFileName.toLowerCase().endsWith('.pdf')) {
 *   const response = await fetch(fileUrl);
 *   const buffer = await response.arrayBuffer();
 *   const pdfData = await pdf(Buffer.from(buffer));
 *   fileContent = pdfData.text;
 * }
 */
