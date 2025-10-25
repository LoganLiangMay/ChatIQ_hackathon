#!/usr/bin/env tsx

/**
 * Pinecone Connection Test Script
 * Tests connection to Pinecone and verifies setup
 */

import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

async function testPineconeConnection() {
  console.log('🔍 Testing Pinecone Connection...\n');

  // Check for required environment variables
  const apiKey = process.env.EXPO_PUBLIC_PINECONE_API_KEY;
  const environment = process.env.EXPO_PUBLIC_PINECONE_ENVIRONMENT || 'us-east-1-aws';
  const indexName = process.env.EXPO_PUBLIC_PINECONE_INDEX || 'chatiq-messages';

  if (!apiKey) {
    console.error('❌ Error: EXPO_PUBLIC_PINECONE_API_KEY not found in .env.local');
    console.log('\n📝 Please add to .env.local:');
    console.log('EXPO_PUBLIC_PINECONE_API_KEY=pcsk_your_api_key_here');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded:');
  console.log(`   API Key: ${apiKey.substring(0, 20)}...`);
  console.log(`   Environment: ${environment}`);
  console.log(`   Index: ${indexName}\n`);

  try {
    // Initialize Pinecone
    console.log('🔌 Connecting to Pinecone...');
    const pc = new Pinecone({ apiKey });
    console.log('✅ Pinecone client initialized\n');

    // Get index
    console.log(`📊 Accessing index: ${indexName}...`);
    const index = pc.index(indexName);
    console.log('✅ Index accessed\n');

    // Get index stats
    console.log('📈 Fetching index statistics...');
    const stats = await index.describeIndexStats();
    console.log('✅ Index statistics:');
    console.log(`   Dimension: ${stats.dimension}`);
    console.log(`   Total vectors: ${stats.totalRecordCount || 0}`);
    console.log(`   Index fullness: ${stats.indexFullness || 0}\n`);

    // Test upsert (write)
    console.log('✍️  Testing upsert (write)...');
    const testVector = new Array(1536).fill(0.1); // Dummy 1536-dim vector
    await index.upsert([
      {
        id: 'test-message-' + Date.now(),
        values: testVector,
        metadata: {
          content: 'Test message for connection verification',
          chatId: 'test-chat',
          timestamp: Date.now(),
          test: true,
        },
      },
    ]);
    console.log('✅ Test upsert successful\n');

    // Test query (read)
    console.log('🔍 Testing query (read)...');
    const results = await index.query({
      vector: testVector,
      topK: 5,
      includeMetadata: true,
      filter: { test: true }, // Only get test messages
    });
    console.log('✅ Test query successful:');
    console.log(`   Found ${results.matches.length} matches`);
    if (results.matches.length > 0) {
      console.log(`   Top match score: ${results.matches[0].score?.toFixed(4)}`);
    }
    console.log('');

    // Cleanup test vectors
    console.log('🧹 Cleaning up test vectors...');
    const testIds = results.matches
      .filter(m => m.metadata?.test === true)
      .map(m => m.id);
    if (testIds.length > 0) {
      await index.deleteMany(testIds);
      console.log(`✅ Deleted ${testIds.length} test vectors\n`);
    }

    console.log('✅ All tests passed! Pinecone is ready to use.\n');
    console.log('📝 Next steps:');
    console.log('1. Configure Firebase Functions: ./FIREBASE-PINECONE-CONFIG.sh');
    console.log('2. Deploy functions with embeddings');
    console.log('3. Start sending messages to auto-embed them\n');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify your Pinecone API key is correct');
    console.log('2. Check that index "chatiq-messages" exists in Pinecone Console');
    console.log('3. Ensure index has 1536 dimensions');
    console.log('4. Verify your internet connection\n');
    process.exit(1);
  }
}

// Run the test
testPineconeConnection().catch(console.error);

