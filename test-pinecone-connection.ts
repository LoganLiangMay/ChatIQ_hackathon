import { Pinecone } from '@pinecone-database/pinecone';

async function testPineconeConnection() {
  console.log('🧪 Testing Pinecone connection...\n');

  try {
    // Initialize Pinecone
    const pc = new Pinecone({
      apiKey: 'pcsk_6diFbM_PHRSx5E5WGQB19XFm77XTpEj2DqWbm7nJQrDRDCmkhEvoDgCeqGY8YuxUuUB53G',
    });

    console.log('✅ Pinecone client initialized');

    // Get index
    const index = pc.index('chatiq-messages');
    console.log('✅ Connected to index: chatiq-messages');

    // Get index stats
    const stats = await index.describeIndexStats();
    console.log('✅ Index stats retrieved:');
    console.log(`   - Total vectors: ${stats.totalRecordCount || 0}`);
    console.log(`   - Dimensions: ${stats.dimension || 0}`);
    console.log(`   - Namespaces: ${Object.keys(stats.namespaces || {}).length}`);

    console.log('\n🎉 All tests passed! Pinecone is working correctly.');
    return true;
  } catch (error) {
    console.error('❌ Error testing Pinecone connection:');
    console.error(error);
    return false;
  }
}

testPineconeConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
