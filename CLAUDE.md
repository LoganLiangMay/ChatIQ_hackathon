# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ChatIQ/MessageAI** is a React Native + Expo messaging application with advanced AI features powered by OpenAI, Firebase, and Vercel AI SDK. The app combines real-time messaging with intelligent AI analysis including priority detection, action item extraction, decision tracking, semantic search, and conversational AI assistance.

## Tech Stack

- **Frontend**: React Native 0.81.4 + Expo SDK 54 + Expo Router 6
- **Backend**: Firebase Cloud Functions (Node.js 18)
- **Database**: Firebase Firestore (NoSQL, real-time sync)
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth with AsyncStorage persistence
- **AI/ML**: Vercel AI SDK (v5.0.78), OpenAI GPT-4o-mini, LangChain, Pinecone (vector DB)
- **Language**: TypeScript 5.1-5.2
- **Notifications**: Expo Push Notifications

## Development Commands

### Frontend (React Native/Expo)

```bash
# Start development server
npm start
# or
npx expo start

# Clear cache and restart (use when things break)
npx expo start --clear

# Platform-specific
npm run ios          # Launch iOS simulator
npm run android      # Launch Android emulator
npm run web          # Launch web version

# Fix Expo dependencies
npx expo install --fix

# Increase file watchers (required on macOS)
ulimit -n 10240
```

### Backend (Firebase Functions)

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode (auto-rebuild on changes)
npm run build:watch

# Local development with emulators
npm run serve

# Deploy to Firebase
npm run deploy

# View logs
npm run logs
```

### Testing

```bash
# Unit tests (Jest)
npm test

# E2E tests (Detox)
detox test --configuration ios

# Firebase emulators
firebase emulators:start
```

## Architecture Overview

### Directory Structure

```
/app/                           # Expo Router file-based routing
  /(auth)/                      # Authentication flows
  /(tabs)/                      # Bottom tab navigation
    chats.tsx                   # Main chat list
    chats/[chatId].tsx          # Individual chat screen
    actions.tsx                 # Action Items (Feature #3)
    decisions.tsx               # Decision Tracking (Feature #4)
    search.tsx                  # Semantic Search (Feature #5)
    ai-assistant.tsx            # Conversational AI
  /groups/                      # Group management

/components/                    # Reusable UI components
  /ai/                         # AI-specific UI (ActionItemsList, SummaryModal, etc.)
  /chat/                       # Chat interface components
  /messages/                   # Message display components

/services/                      # Business logic layer
  /ai/                         # AI service integration
    AIService.ts               # Main AI service (calls Firebase Functions)
    HybridAgent.ts             # Intelligent client/server routing
    types.ts                   # TypeScript interfaces
    ActionItemsService.ts
    DecisionsService.ts
    ProjectsService.ts
    /agent/                    # Client-side Vercel AI SDK agent
  /firebase/
    config.ts                  # Firebase initialization (lazy loading)
    firestore.ts               # Firestore operations
  /messages/                   # Message management
  /search/                     # Search service

/functions/                     # Firebase Cloud Functions
  /src/
    index.ts                   # Main entry point
    /ai/                       # AI Cloud Functions
      summarize.ts             # Thread summarization (Feature #2)
      detectPriority.ts        # Priority detection (Feature #1)
      extractActions.ts        # Action items (Feature #3)
      extractDecisions.ts      # Decision tracking (Feature #4)
      searchMessages.ts        # Semantic search (Feature #5)
      knowledgeAgent.ts        # Server-side conversational agent
      dailySummaries.ts        # Daily digest generation
      embeddings.ts            # Vector embedding utilities
      prompts.ts               # OpenAI prompt templates
      openai.ts                # OpenAI client setup
      /agent/                  # Server-side LangChain agent

/types/                        # TypeScript type definitions
  chat.ts                      # Chat, Message, User interfaces

firestore.rules                # Security rules (user + participant-based)
firestore.indexes.json         # Composite indexes for queries
```

### Firestore Data Model

```
users/{userId}
  - displayName, email, profilePicture, expoPushToken

chats/{chatId}
  - type: 'direct' | 'group'
  - participants: userId[]
  - participantDetails: {userId: {displayName, profilePicture}}
  - admins: userId[] (for groups)
  - name: string (for groups)
  - projectDescription: string
  - aiTrackingEnabled: boolean
  - lastMessage: {content, senderId, timestamp}

  messages/{messageId}
    - content, senderId, senderName, timestamp
    - isPriority: boolean
    - priorityScore: number (0-1)
    - readBy: userId[]
    - deliveredTo: userId[]

actionItems/{itemId}
  - userId, task, owner, deadline, status
  - chatId, extractedFrom: {messageId, timestamp}

decisions/{decisionId}
  - userId, decision, context, participants
  - timestamp, extractedFrom: {messageId}
  - topic, relatedProject, sentiment
```

### AI Features Architecture

**5 Core AI Features + Conversational Agent:**

1. **Priority Detection** (Feature #1)
   - Automatic trigger on message creation via Firestore trigger
   - Cloud Function analyzes message with OpenAI
   - Updates `isPriority` and `priorityScore` fields
   - 2-6 second latency, non-blocking

2. **Thread Summarization** (Feature #2)
   - User-triggered via "Summarize" button
   - HTTPSCallable: `summarizeThread(chatId, limit)`
   - Returns structured summary in <3 seconds

3. **Action Items Extraction** (Feature #3)
   - Auto-scan on app load + manual trigger
   - HTTPSCallable: `extractActionItems(chatId, limit)`
   - Stores in `actionItems` collection with real-time sync
   - Smart caching prevents duplicate extractions

4. **Decision Tracking** (Feature #4)
   - Auto-scan for decision phrases ("we decided...", "let's go with...")
   - HTTPSCallable: `extractDecisions(chatId, limit)`
   - Cross-device sync via Firestore

5. **Semantic Search** (Feature #5)
   - Vector similarity search with Pinecone
   - HTTPSCallable: `searchMessages(query, filters, limit)`
   - Returns contextual results with surrounding messages
   - Filters: person, date range, chat, priority

6. **Conversational AI Assistant** (Feature #6)
   - Hybrid routing via `HybridAgent.ts`:
     - Simple queries → Client-side Vercel AI SDK (fast, ~500ms)
     - Complex queries → Server-side LangChain + Pinecone
   - Client: Streaming support with `streamText` from Vercel AI SDK
   - Server: `knowledgeAgent` function with LangSmith tracing
   - Tools: Wraps Features 1-5 for orchestration

### Data Flow Patterns

**Real-time Messaging:**
```
User sends message → Firestore write → Firestore trigger fires
                  ↓
Cloud Function: detectPriority (OpenAI analysis)
                  ↓
Update message document → Real-time listeners update UI
                  ↓
Send push notifications to participants
```

**AI Feature Request:**
```
User triggers feature → Service layer (e.g., AIService.ts)
                      ↓
HTTPSCallable to Firebase Function
                      ↓
OpenAI/LangChain processing
                      ↓
Return result → Display in UI + optionally store in Firestore
```

**Hybrid Agent Routing:**
```
User asks question → HybridAgent.ts assesses complexity
                   ↓
Simple query: Client-side Vercel AI SDK agent (fast path)
Complex/RAG query: Server-side knowledgeAgent + Pinecone
                   ↓
Stream response to UI
```

## Key Implementation Patterns

### 1. Lazy Firebase Initialization
Firebase services use lazy initialization to prevent race conditions:
```typescript
// services/firebase/config.ts
let initialized = false;
export function getFirebaseApp() {
  if (!initialized) {
    initializeApp(config);
    initialized = true;
  }
  return getApp();
}
```

### 2. Service Layer Abstraction
All external APIs go through service layers (`AIService.ts`, `firestore.ts`) for:
- Centralized error handling
- Consistent interfaces
- Easier testing/mocking

### 3. Real-time Sync with Firestore Listeners
Prefer Firestore `onSnapshot` listeners over polling:
```typescript
const unsubscribe = onSnapshot(query, (snapshot) => {
  // Update state with real-time data
});
```

### 4. Cost-Optimized AI Usage
- Use `gpt-4o-mini` (not full GPT-4) for cost efficiency
- Limit message context (50-100 messages)
- Implement caching to avoid re-processing
- Batch operations where possible

### 5. Hybrid Client/Server AI
Route intelligently based on query complexity:
- Client: Simple queries, fast response, streaming
- Server: Complex queries, RAG with Pinecone, LangSmith tracing

## Configuration Files

### Environment Variables (.env)

**Required for Frontend:**
```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

**Required for Backend (functions/.env):**
```bash
OPENAI_API_KEY=
PINECONE_API_KEY=
PINECONE_INDEX_NAME=
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=
LANGCHAIN_PROJECT=
```

### Firebase Configuration

- `firestore.rules`: User + participant-based access control
- `firestore.indexes.json`: Composite indexes for queries (participants + timestamp, etc.)
- `.firebaserc`: Firebase project ID

### Expo Configuration

- `app.json`: App metadata, iOS/Android config, permissions
- Bundle ID: `com.gauntlet.messageai`

## Code Style Guidelines (from .cursor/rules)

### TypeScript/React Native
- Use functional components, avoid classes
- Prefer interfaces over types
- Avoid enums; use maps instead
- Use descriptive variable names (isLoading, hasError)
- Structure: exported component → subcomponents → helpers → types

### File Organization
- Use lowercase with dashes for directories (e.g., `components/chat-input/`)
- Favor named exports

### Error Handling
- Handle errors at the beginning of functions
- Use early returns to avoid deep nesting
- Implement global error boundaries
- Use Zod for runtime validation

### Performance
- Minimize useState/useEffect; prefer Context + useReducer
- Use useMemo and useCallback to prevent re-renders
- Implement lazy loading for non-critical components
- Optimize images with expo-image

### Testing
- Unit tests with Jest
- E2E tests with Detox for critical flows
- Use Firebase Emulator Suite for local testing
- Test offline functionality

## Common Development Tasks

### Adding a New AI Feature

1. Define Cloud Function in `functions/src/ai/yourFeature.ts`
2. Export in `functions/src/index.ts`:
   ```typescript
   export { yourFeature } from './ai/yourFeature';
   ```
3. Add TypeScript types in both:
   - `functions/src/ai/types.ts` (server-side)
   - `services/ai/types.ts` (client-side)
4. Add method to `AIService` class in `services/ai/AIService.ts`:
   ```typescript
   async yourFeature(params) {
     const functions = await this.getFunctionsInstance();
     const fn = httpsCallable(functions, 'yourFeature');
     const result = await fn(params);
     return result.data;
   }
   ```
5. Build and deploy:
   ```bash
   cd functions
   npm run build
   cd ..
   firebase deploy --only functions:yourFeature
   ```
6. Create UI components in `components/ai/`
7. Integrate in appropriate screen under `app/(tabs)/`

**Important:** Always add the method to `AIService` - don't call Firebase Functions directly from components!

### Debugging Firebase Functions

```bash
# View logs
firebase functions:log

# Deploy specific function
firebase deploy --only functions:detectBlockers

# Or in code
import * as functions from 'firebase-functions';
functions.logger.info('Debug message', { context: data });
```

**Common Issue: "unauthenticated" errors**
- Ensure the function is deployed: `firebase deploy --only functions:functionName`
- Check that `AIService.getFunctionsInstance()` waits for auth to be ready
- Verify user is signed in before calling AI features

### Testing Firestore Security Rules

```bash
# Start emulators
firebase emulators:start

# Run tests against emulator
npm test
```

### Handling Breaking Changes (SDK Upgrades)

Recent upgrade from Expo SDK 53 → 54 required:
- Updating Firestore imports (`modular` API)
- Making SQLite optional for Expo Go compatibility
- Adjusting React Native imports

Always check:
1. Expo's upgrade guide
2. Breaking changes in dependencies
3. Update `package.json` and `functions/package.json` in sync

## Important Notes

### Firebase Function Timeouts
- Default timeout: 60 seconds
- Increase for long-running operations in `functions/src/index.ts`:
  ```typescript
  export const yourFunction = functions
    .runWith({ timeoutSeconds: 300, memory: '1GB' })
    .https.onCall(async (data, context) => { ... });
  ```

### Pinecone Setup Status
- Pinecone integration is **partially implemented**
- Vector search available but index configuration may need completion
- Check `PINECONE-SETUP-GUIDE.md` for setup instructions

### Cost Considerations
- Each OpenAI call costs ~$0.0002-$0.005
- Monitor usage in OpenAI dashboard
- Consider implementing rate limiting for production

### Security Rules
- Messages are immutable (cannot be deleted by security rules)
- Participant-based access: users only see chats they're in
- Admin-only operations for group settings

## Troubleshooting

### Metro Bundler Issues
```bash
# Clear cache
npx expo start --clear

# Reset Metro cache
rm -rf node_modules/.cache

# Increase file watchers
ulimit -n 10240
```

### Firebase Functions Not Deploying
```bash
# Rebuild TypeScript
cd functions
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Deploy specific function
firebase deploy --only functions:functionName
```

### Expo Go SDK Compatibility
- Using Expo SDK 54 requires Expo Go app version 54.x
- Some features (SQLite) are optional for Expo Go compatibility
- For full features, use development build: `npx expo prebuild`

## Additional Documentation

- **Primary Guide**: `memory-bank/task-list-prs.md`
- **Architecture**: `memory-bank/code-architecture.md`
- **AI Features**: `AI-PHASE-2-PROGRESS.md`, `MVP-AI-FEATURES-COMPLETE.md`
- **Deployment**: `AI-SDK-DEPLOYMENT-SUCCESS.md`
- **Setup Guides**: `documentation/setup-guides/`
