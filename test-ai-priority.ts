/**
 * Test Priority Detection AI Function
 * 
 * Run with: npx ts-node test-ai-priority.ts
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { initializeApp } from 'firebase/app';

// Initialize Firebase (using your existing config)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Test messages
const testMessages = [
  { content: 'URGENT: Server is down!', expected: 'critical' },
  { content: 'Can you review the PR by EOD?', expected: 'high' },
  { content: 'When you have time, check this out', expected: 'low' },
  { content: 'Meeting in 5 minutes!', expected: 'high' },
  { content: 'Hey, how\'s it going?', expected: 'low' },
];

async function testPriorityDetection() {
  console.log('🧪 Testing Priority Detection AI Function\n');

  const detectPriority = httpsCallable(functions, 'detectPriority');
  let correct = 0;

  for (const test of testMessages) {
    try {
      const startTime = Date.now();
      
      const result = await detectPriority({
        messageId: 'test-' + Date.now(),
        content: test.content,
        chatId: 'test-chat',
        senderId: 'test-user',
      });

      const duration = Date.now() - startTime;
      const data = result.data as any;

      const isCorrect = data.urgencyLevel === test.expected;
      if (isCorrect) correct++;

      console.log(`${isCorrect ? '✅' : '❌'} "${test.content.substring(0, 40)}..."`);
      console.log(`   Expected: ${test.expected}, Got: ${data.urgencyLevel}`);
      console.log(`   Score: ${data.score.toFixed(2)}, Time: ${duration}ms`);
      console.log(`   Reason: ${data.reason}\n`);

    } catch (error: any) {
      console.error(`❌ Error: ${error.message}\n`);
    }
  }

  console.log(`\n📊 Results: ${correct}/${testMessages.length} correct (${(correct/testMessages.length * 100).toFixed(0)}%)`);
  console.log(`🎯 Target: >90% accuracy`);

  if (correct / testMessages.length >= 0.9) {
    console.log('✅ PASSED: Feature #1 meets accuracy requirements!');
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT: Accuracy below 90%');
  }
}

testPriorityDetection().catch(console.error);


