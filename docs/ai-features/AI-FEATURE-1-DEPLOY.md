# Deploy AI Feature #1: Priority Message Detection

**Status:** Ready to Deploy ✅  
**Estimated Time:** 15-20 minutes  
**Points:** 3/15 (First AI feature!)

---

## What We've Built

### Firebase Cloud Function
- ✅ `functions/src/ai/detectPriority.ts` - AI priority detection logic
- ✅ `functions/src/ai/types.ts` - TypeScript interfaces
- ✅ `functions/src/ai/openai.ts` - OpenAI client wrapper
- ✅ `functions/src/ai/prompts.ts` - AI prompts
- ✅ `functions/src/index.ts` - Export added

### Mobile App Components
- ✅ `components/ai/PriorityBadge.tsx` - Visual priority indicator
- ✅ `hooks/useAI.ts` - React hook for AI features
- ✅ `services/ai/AIService.ts` - AI service class

---

## Step-by-Step Deployment

### Step 1: Install Firebase Functions Dependencies (5 min)

```bash
cd /Applications/Gauntlet/chat_iq/functions

# Install OpenAI package
npm install openai

# Install dev dependencies
npm install --save-dev @types/node

# Verify installation
npm list openai
```

**Expected output:**
```
chat_iq@1.0.0 /Applications/Gauntlet/chat_iq/functions
└── openai@4.20.0
```

### Step 2: Configure OpenAI API Key (2 min)

```bash
# Set Firebase config
firebase functions:config:set openai.api_key="YOUR_OPENAI_API_KEY"

# Verify (optional)
firebase functions:config:get
```

**For local testing, also create:**
```bash
echo "OPENAI_API_KEY=YOUR_KEY_HERE" > functions/.env
```

### Step 3: Build Functions (2 min)

```bash
cd /Applications/Gauntlet/chat_iq/functions

# Build TypeScript
npm run build
```

**Expected output:**
```
> build
> tsc

✓ Build completed successfully
```

### Step 4: Deploy to Firebase (3-5 min)

```bash
# Deploy just the detectPriority function
firebase deploy --only functions:detectPriority

# Or deploy all functions
firebase deploy --only functions
```

**Expected output:**
```
✔ functions[detectPriority(us-central1)] Successful update operation.
✔ Deploy complete!
```

### Step 5: Verify Deployment (1 min)

```bash
# List deployed functions
firebase functions:list

# Check logs
firebase functions:log --only detectPriority --limit 5
```

---

## Testing the Function

### Test 1: Manual Test via Firebase Console

1. Go to Firebase Console → Functions
2. Find `detectPriority` function
3. Click "Test" tab
4. Enter test data:
```json
{
  "messageId": "test-123",
  "content": "URGENT: Server is down!",
  "chatId": "test-chat",
  "senderId": "test-user"
}
```
5. Click "Run"
6. Verify response:
```json
{
  "isPriority": true,
  "score": 0.95,
  "urgencyLevel": "critical",
  "reason": "Message contains urgent keywords and indicates system failure"
}
```

### Test 2: From Mobile App

Add this test code to any component:

```typescript
import { useAI } from '../hooks/useAI';

// In your component
const { detectPriority, loading, error } = useAI();

const testPriority = async () => {
  const result = await detectPriority(
    'test-msg-123',
    'URGENT: Server is down!',
    'test-chat'
  );
  
  console.log('Priority result:', result);
  // Should output: { isPriority: true, urgencyLevel: 'critical', ... }
};
```

### Test 3: 10 Test Messages (for rubric)

Run these tests to validate >90% accuracy:

```typescript
const testMessages = [
  { content: 'URGENT: Server is down!', expected: 'critical' },
  { content: 'Can you review the PR by EOD?', expected: 'high' },
  { content: 'When you have time, check this out', expected: 'low' },
  { content: 'Meeting in 5 minutes!', expected: 'high' },
  { content: 'Hey, how\'s it going?', expected: 'low' },
  { content: 'ASAP: Need approval for deployment', expected: 'critical' },
  { content: 'Deadline is tomorrow morning', expected: 'high' },
  { content: 'FYI: Updated the docs', expected: 'low' },
  { content: 'BLOCKER: Can\'t merge until this is fixed', expected: 'critical' },
  { content: 'Let\'s discuss next week', expected: 'low' },
];

let correct = 0;
for (const test of testMessages) {
  const result = await detectPriority('test', test.content, 'test');
  if (result?.urgencyLevel === test.expected) correct++;
}

console.log(`Accuracy: ${(correct / testMessages.length) * 100}%`);
// Target: >90%
```

---

## Integrate into Chat UI

### Option 1: Show Badge on Chat List Item

Update `components/chat/ChatListItem.tsx`:

```typescript
import { PriorityBadge } from '../ai/PriorityBadge';
import { useAI } from '../../hooks/useAI';

export function ChatListItem({ chat }) {
  const { detectPriority } = useAI();
  const [priority, setPriority] = useState(null);

  useEffect(() => {
    // Check priority of last message
    if (chat.lastMessage?.content) {
      detectPriority(
        chat.lastMessage.id,
        chat.lastMessage.content,
        chat.id
      ).then(setPriority);
    }
  }, [chat.lastMessage]);

  return (
    <View style={styles.container}>
      {/* ... existing chat item UI ... */}
      
      {priority && priority.isPriority && (
        <PriorityBadge
          urgencyLevel={priority.urgencyLevel}
          score={priority.score}
          compact
        />
      )}
    </View>
  );
}
```

### Option 2: Auto-detect on Message Receive

Update `hooks/useMessages.ts` to auto-detect priority when messages arrive:

```typescript
// In message receive handler
const handleNewMessage = async (message: Message) => {
  // Save message
  await saveMessage(message);
  
  // Detect priority in background (don't block)
  detectPriority(message.id, message.content, message.chatId)
    .then(priority => {
      if (priority?.isPriority) {
        // Update message with priority flag
        // Show notification badge
        // Play urgent sound
      }
    })
    .catch(err => console.log('Priority detection failed:', err));
};
```

---

## Performance Monitoring

### Check Response Times

```typescript
const start = Date.now();
const result = await detectPriority('test', content, 'test');
const duration = Date.now() - start;

console.log(`Priority detection took ${duration}ms`);
// Target: <2000ms (2 seconds)
```

### Monitor Costs

```bash
# Check Firebase Functions usage
firebase functions:log --only detectPriority

# Monitor OpenAI costs
# Dashboard: https://platform.openai.com/usage
```

**Expected costs per 100 detections:**
- GPT-4-mini: ~500 tokens/request
- Cost: $0.150 per 1M input tokens
- 100 requests × 500 tokens = 50,000 tokens
- Cost: $0.0075 (~$0.01)

---

## Troubleshooting

### Error: "OpenAI API key not configured"

```bash
# Check config
firebase functions:config:get

# Set if missing
firebase functions:config:set openai.api_key="YOUR_KEY"

# Redeploy
firebase deploy --only functions:detectPriority
```

### Error: "Function execution took longer than 60s"

Increase timeout in `functions/firebase.json`:
```json
{
  "functions": {
    "timeout": 120,
    "memory": 512
  }
}
```

Then redeploy.

### Error: "CORS" or "Authentication failed"

Check that Firebase Auth is working:
```typescript
import { getAuth } from 'firebase/auth';
const auth = getAuth();
console.log('Current user:', auth.currentUser); // Should not be null
```

### Logs Show No Activity

```bash
# Check if function is deployed
firebase functions:list

# Check recent logs
firebase functions:log --only detectPriority --limit 20

# Enable debug logging
firebase functions:log --only detectPriority --debug
```

---

## Success Checklist

- [ ] OpenAI package installed
- [ ] API key configured
- [ ] Function deployed successfully
- [ ] Manual test passes (Firebase Console)
- [ ] Mobile app test works
- [ ] 10-message test >90% accuracy
- [ ] Response time <2s
- [ ] Badge displays in UI
- [ ] No errors in logs

---

## Next Steps

After Feature #1 is working:

1. **Test thoroughly** - Run all 10 test scenarios
2. **Measure accuracy** - Document results
3. **Measure performance** - Response times
4. **Update progress** - Mark Feature #1 complete in `ai-implementation-progress.md`
5. **Move to Feature #2** - Thread Summarization

---

## Quick Commands Reference

```bash
# Build
cd functions && npm run build

# Deploy
firebase deploy --only functions:detectPriority

# Test
firebase functions:shell
> detectPriority({content: 'URGENT: Test', messageId: 'test', chatId: 'test', senderId: 'test'})

# Logs
firebase functions:log --only detectPriority --follow

# Update
# (after code changes)
cd functions && npm run build && firebase deploy --only functions:detectPriority
```

---

**Status:** Ready to deploy! 🚀  
**Estimated deployment time:** 15-20 minutes  
**Next feature:** Thread Summarization (Feature #2)



