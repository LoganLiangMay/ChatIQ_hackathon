# AI Infrastructure & Implementation Plan

**Project:** MessageAI MVP - Complete AI Feature Suite  
**Created:** October 22, 2025  
**Architecture:** Hybrid Firebase + AWS + Pinecone  
**Timeline:** 36-48 hours total (3-4 days)

---

## Executive Summary

This document provides the complete implementation plan for MessageAI's AI features, including:
- **5 Required AI Features** (15 points) - Thread summarization, action items, smart search, priority detection, decision tracking
- **Advanced AI Assistant** (10 points) - Knowledge base builder with autonomous question answering
- **Persona Fit** (5 points) - Remote Team Professional pain point mapping

**Total AI Points Target:** 30/30 (100%)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
4. [File Structure & Organization](#file-structure--organization)
5. [Deployment Strategy](#deployment-strategy)
6. [Testing & Validation](#testing--validation)
7. [Cost Management](#cost-management)
8. [Troubleshooting Guide](#troubleshooting-guide)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Chat UI    │  │  Search UI   │  │  Digest UI   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                       │
│                    │   AIService    │                       │
│                    └───────┬────────┘                       │
└────────────────────────────┼──────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
    ┌─────────────────┐         ┌──────────────────┐
    │ Firebase Cloud  │         │   AWS Lambda     │
    │   Functions     │         │   + EventBridge  │
    ├─────────────────┤         ├──────────────────┤
    │ • Summarize     │         │ • SearchMessages │
    │ • Extract       │         │ • KnowledgeBuilder│
    │ • Detect        │         │ • AIAssistant    │
    │ • Track         │         │ • MessageFilter  │
    └────────┬────────┘         └────────┬─────────┘
             │                           │
             │         ┌─────────────────┘
             │         │
             ▼         ▼
    ┌────────────────────────┐
    │      OpenAI API        │
    │   GPT-4 / GPT-4-mini   │
    └────────────────────────┘
                   │
                   ▼
    ┌────────────────────────┐
    │   Pinecone Vector DB   │
    │  • Message embeddings  │
    │  • User knowledge      │
    └────────────────────────┘
                   │
                   ▼
    ┌────────────────────────┐
    │   Firebase Firestore   │
    │   • Messages           │
    │   • Chat metadata      │
    └────────────────────────┘
```

### Data Flow

**Simple AI Features (Firebase Functions):**
1. User triggers action (e.g., "Summarize Thread")
2. Mobile app calls Firebase Cloud Function
3. Function fetches messages from Firestore
4. Function calls OpenAI API with prompt
5. Function returns AI response to mobile app
6. Mobile app displays result

**Advanced Features (AWS Lambda):**
1. EventBridge triggers Lambda hourly (batch processing)
2. Lambda fetches new/unread messages from Firestore
3. Lambda generates embeddings via OpenAI
4. Lambda stores embeddings in Pinecone
5. Lambda builds user knowledge base
6. On-demand: User queries search → Lambda retrieves from Pinecone

### Technology Decisions

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Simple AI Features | Firebase Cloud Functions | Quick deployment, auto-scaling, easy integration |
| Complex AI Features | AWS Lambda | Better control, EventBridge scheduling, business account available |
| Vector Database | Pinecone | Serverless, easy setup, free tier sufficient |
| LLM Provider | OpenAI GPT-4/mini | Best balance of cost/quality, function calling support |
| Batch Processing | EventBridge | Hourly scheduling, reliable triggers, AWS native |
| Message Storage | Firestore | Already integrated, real-time sync |

---

## Technology Stack

### Frontend (Mobile App)
- **Framework:** React Native + Expo SDK 54
- **Language:** TypeScript
- **State:** React Context + Hooks
- **AI Service:** Custom AIService class

### Backend - Firebase
- **Platform:** Firebase Cloud Functions
- **Runtime:** Node.js 18
- **Language:** TypeScript
- **Triggers:** HTTPS Callable functions
- **Features:** Summarize, Extract Actions, Detect Priority, Track Decisions

### Backend - AWS
- **Platform:** AWS Lambda
- **Runtime:** Node.js 18.x
- **Language:** TypeScript
- **Triggers:** API Gateway (on-demand), EventBridge (scheduled)
- **Features:** Smart Search, Knowledge Builder, AI Assistant, Message Filter

### AI & ML
- **LLM:** OpenAI GPT-4, GPT-4-mini
- **Embeddings:** text-embedding-ada-002 (1536 dimensions)
- **Vector DB:** Pinecone (serverless)
- **Framework:** Direct OpenAI SDK (no LangChain for MVP simplicity)

### Infrastructure
- **Scheduling:** AWS EventBridge (hourly batch)
- **API Gateway:** AWS API Gateway (REST)
- **IAM:** AWS IAM roles and policies
- **Monitoring:** CloudWatch Logs, Firebase Console

---

## Phase-by-Phase Implementation

### Phase 1: Core AI Infrastructure (4-6 hours)

**Goal:** Set up all foundational code and infrastructure

#### 1.1 Firebase Cloud Functions Setup (2 hours)

**Step 1.1.1: Install Dependencies**
```bash
cd /Applications/Gauntlet/chat_iq/functions
npm install openai
npm install --save-dev @types/node
```

**Step 1.1.2: Update package.json**
Add to `functions/package.json`:
```json
{
  "dependencies": {
    "openai": "^4.20.0"
  }
}
```

**Step 1.1.3: Configure Firebase Config**
```bash
firebase functions:config:set openai.api_key="your_openai_api_key_here"
```

For local development, create `functions/.env`:
```
OPENAI_API_KEY=your_openai_api_key_here
```

**Step 1.1.4: Create AI Functions** (Already Created ✅)
- ✅ `functions/src/ai/types.ts`
- ✅ `functions/src/ai/openai.ts`
- ✅ `functions/src/ai/prompts.ts`
- ⏳ `functions/src/ai/detectPriority.ts` (Next)
- ⏳ `functions/src/ai/summarize.ts`
- ⏳ `functions/src/ai/extractActions.ts`
- ⏳ `functions/src/ai/trackDecisions.ts`

**Step 1.1.5: Update functions/src/index.ts**
Export all AI functions (will do after creating them)

#### 1.2 Mobile App AI Service (1 hour)

**Already Created ✅:**
- ✅ `services/ai/types.ts`
- ✅ `services/ai/AIService.ts`

**To Create:**
- ⏳ `hooks/useAI.ts` - React hook for easy access

**Step 1.2.1: Create useAI Hook**
```typescript
// hooks/useAI.ts
import { useState } from 'react';
import aiService from '../services/ai/AIService';
import type { SummaryResult, ActionItem, Decision } from '../services/ai/types';

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summarizeThread = async (chatId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiService.summarizeThread(chatId);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ... similar for other features

  return {
    loading,
    error,
    summarizeThread,
    extractActionItems,
    detectPriority,
    trackDecisions,
    searchMessages,
  };
}
```

#### 1.3 AWS Lambda Infrastructure (2-3 hours)

**Step 1.3.1: Create Project Structure**
```bash
mkdir -p /Applications/Gauntlet/chat_iq/aws/lambda/src/shared
cd /Applications/Gauntlet/chat_iq/aws/lambda
```

**Step 1.3.2: Initialize Node.js Project**
```bash
npm init -y
npm install openai @pinecone-database/pinecone firebase-admin
npm install --save-dev @types/node typescript
```

**Step 1.3.3: Create TypeScript Config**
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

**Step 1.3.4: Create Package Scripts**
```json
// package.json scripts
{
  "scripts": {
    "build": "tsc",
    "package": "zip -r function.zip dist node_modules"
  }
}
```

**Step 1.3.5: Create IAM Role**
Follow steps in `ai-infrastructure-setup.md` Section 2, Step 2

**Step 1.3.6: Create Lambda Functions**
- ⏳ `src/searchMessages.ts`
- ⏳ `src/knowledgeBuilder.ts`
- ⏳ `src/aiAssistant.ts`
- ⏳ `src/messageFilter.ts`
- ⏳ `src/shared/pinecone.ts`
- ⏳ `src/shared/openai.ts`
- ⏳ `src/shared/firestore.ts`

**Step 1.3.7: Set Up EventBridge**
Follow `ai-infrastructure-setup.md` Section 2, Step 4

**Step 1.3.8: Set Up API Gateway**
Follow `ai-infrastructure-setup.md` Section 2, Step 5

#### 1.4 Pinecone Setup (30 minutes)

**Step 1.4.1: Create Account**
- Go to https://www.pinecone.io/ (Already done ✅)

**Step 1.4.2: Create Indexes**
```python
# setup_pinecone.py
from pinecone import Pinecone

pc = Pinecone(api_key='YOUR_API_KEY')

# Create chat-messages index
pc.create_index(
    name='chat-messages',
    dimension=1536,
    metric='cosine',
    spec={
        'serverless': {
            'cloud': 'aws',
            'region': 'us-west-2'
        }
    }
)

# Create user-knowledge index
pc.create_index(
    name='user-knowledge',
    dimension=1536,
    metric='cosine',
    spec={
        'serverless': {
            'cloud': 'aws',
            'region': 'us-west-2'
        }
    }
)
```

**Step 1.4.3: Test Connection**
```python
# test_pinecone.py
pc = Pinecone(api_key='YOUR_API_KEY')
print(pc.list_indexes())
```

---

### Phase 2: Required AI Features (18-24 hours)

**Implementation Order:** Easiest → Hardest

#### Feature 1: Priority Message Detection (3-4 hours)

**Points:** 3/15  
**Difficulty:** ⭐ Easy  
**Dependencies:** Firebase Functions, OpenAI  

**Implementation Steps:**

**Step 2.1.1: Create Firebase Function**
```typescript
// functions/src/ai/detectPriority.ts
import * as functions from 'firebase-functions';
import { callChatCompletion } from './openai';
import { PROMPTS } from './prompts';
import type { DetectPriorityRequest, DetectPriorityResponse } from './types';

export const detectPriority = functions.https.onCall(
  async (data: DetectPriorityRequest, context): Promise<DetectPriorityResponse> => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { content } = data;

    // Call OpenAI with priority detection prompt
    const messages = PROMPTS.detectPriority(content);
    const response = await callChatCompletion(messages, {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 200,
    });

    const result = response.choices[0].message.content;
    const parsed = JSON.parse(result || '{}');

    return {
      isPriority: parsed.isPriority || false,
      score: parsed.score || 0,
      urgencyLevel: parsed.urgencyLevel || 'low',
      reason: parsed.reason || '',
    };
  }
);
```

**Step 2.1.2: Export in index.ts**
```typescript
// functions/src/index.ts
export { detectPriority } from './ai/detectPriority';
```

**Step 2.1.3: Deploy Function**
```bash
cd functions
npm run build
firebase deploy --only functions:detectPriority
```

**Step 2.1.4: Create UI Component**
```typescript
// components/ai/PriorityBadge.tsx
import { View, Text, StyleSheet } from 'react-native';

interface PriorityBadgeProps {
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number;
}

export function PriorityBadge({ urgencyLevel, score }: PriorityBadgeProps) {
  if (urgencyLevel === 'low') return null;

  const colors = {
    medium: '#FFA500',
    high: '#FF6B6B',
    critical: '#FF0000',
  };

  return (
    <View style={[styles.badge, { backgroundColor: colors[urgencyLevel] }]}>
      <Text style={styles.text}>
        {urgencyLevel === 'critical' ? '🚨' : '⚠️'} {urgencyLevel.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
```

**Step 2.1.5: Integrate into Chat List**
Update `components/chat/ChatListItem.tsx` to show priority badge for high-priority chats.

**Step 2.1.6: Test Feature**
- [ ] Test with 10 messages (3 urgent, 4 medium, 3 low priority)
- [ ] Measure response time (target: <2s)
- [ ] Measure accuracy (target: >90%)

**Testing Scenarios:**
```
1. "URGENT: Server is down!" → Should be critical
2. "Can you review the PR by EOD?" → Should be high
3. "When you have time, check this out" → Should be low
4. "Meeting in 5 minutes!" → Should be high
5. "Hey, how's it going?" → Should be low
6. "ASAP: Need approval for deployment" → Should be critical
7. "Deadline is tomorrow morning" → Should be high
8. "FYI: Updated the docs" → Should be low
9. "BLOCKER: Can't merge until this is fixed" → Should be critical
10. "Let's discuss next week" → Should be low
```

#### Feature 2: Thread Summarization (4-5 hours)

**Points:** 3/15  
**Difficulty:** ⭐⭐ Medium  
**Dependencies:** Firebase Functions, Firestore access  

**Implementation Steps:**

**Step 2.2.1: Create Firebase Function**
```typescript
// functions/src/ai/summarize.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { callChatCompletion } from './openai';
import { PROMPTS } from './prompts';
import type { SummarizeThreadRequest, SummarizeThreadResponse } from './types';

export const summarizeThread = functions.https.onCall(
  async (data: SummarizeThreadRequest, context): Promise<SummarizeThreadResponse> => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { chatId, messageLimit = 50 } = data;
    const firestore = admin.firestore();

    // Fetch messages
    const messagesSnap = await firestore
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(messageLimit)
      .get();

    if (messagesSnap.empty) {
      throw new functions.https.HttpsError('not-found', 'No messages found');
    }

    // Fetch sender names
    const messages = await Promise.all(
      messagesSnap.docs.map(async (doc) => {
        const data = doc.data();
        const userDoc = await firestore.collection('users').doc(data.senderId).get();
        const userName = userDoc.data()?.displayName || 'Unknown';

        return {
          sender: userName,
          content: data.content,
          timestamp: data.timestamp,
        };
      })
    );

    // Reverse to chronological order
    messages.reverse();

    // Get participants
    const participants = Array.from(new Set(messages.map((m) => m.sender)));
    const timeRange = {
      start: messages[0].timestamp,
      end: messages[messages.length - 1].timestamp,
    };

    // Call OpenAI
    const promptMessages = PROMPTS.summarizeThread(messages);
    const response = await callChatCompletion(promptMessages, {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 500,
    });

    const summary = response.choices[0].message.content || 'Unable to generate summary';

    return {
      summary,
      messageCount: messages.length,
      timeRange,
      participants,
    };
  }
);
```

**Step 2.2.2: Create UI Component**
```typescript
// components/ai/SummaryModal.tsx
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import type { SummaryResult } from '../../services/ai/types';

interface SummaryModalProps {
  visible: boolean;
  summary: SummaryResult | null;
  onClose: () => void;
}

export function SummaryModal({ visible, summary, onClose }: SummaryModalProps) {
  if (!summary) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.modal}>
          <Text style={styles.title}>Thread Summary</Text>
          
          <View style={styles.metadata}>
            <Text style={styles.metaText}>{summary.messageCount} messages</Text>
            <Text style={styles.metaText}>{summary.participants.length} participants</Text>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.summary}>{summary.summary}</Text>
            
            <Text style={styles.subtitle}>Participants:</Text>
            <Text style={styles.participants}>
              {summary.participants.join(', ')}
            </Text>
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  metadata: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaText: {
    color: '#666',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  summary: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  participants: {
    color: '#666',
    fontSize: 14,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  closeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

**Step 2.2.3: Add Long-Press Action**
Update chat screen to add long-press handler:
```typescript
// In chat screen component
const handleLongPress = () => {
  Alert.alert('Thread Actions', '', [
    { text: 'Summarize Thread', onPress: () => handleSummarize() },
    { text: 'Cancel', style: 'cancel' },
  ]);
};

const handleSummarize = async () => {
  setLoading(true);
  try {
    const result = await aiService.summarizeThread(chatId);
    setSummary(result);
    setShowSummary(true);
  } catch (error) {
    Alert.alert('Error', 'Failed to generate summary');
  } finally {
    setLoading(false);
  }
};
```

**Step 2.2.4: Test Feature**
- [ ] Test with 3-5 different conversation types
- [ ] Response time (target: <2s for 50 messages)
- [ ] Quality check (summary captures key points)

#### Feature 3: Action Item Extraction (4-5 hours)

**Points:** 3/15  
**Difficulty:** ⭐⭐⭐ Medium-Hard  
**Dependencies:** Firebase Functions, GPT-4 function calling  

**Implementation:** Similar to summarization but with structured output for action items.

**Key Differences:**
- Use GPT-4 function calling for structured extraction
- Store action items in Firestore for persistence
- Add checkbox UI for marking complete

#### Feature 4: Decision Tracking (3-4 hours)

**Points:** 3/15  
**Difficulty:** ⭐⭐ Medium  
**Dependencies:** Firebase Functions  

**Implementation:** Extract decisions from conversation history and display in timeline view.

**UI:** New tab showing all decisions across all chats.

#### Feature 5: Smart Search (5-7 hours)

**Points:** 3/15  
**Difficulty:** ⭐⭐⭐⭐ Hard  
**Dependencies:** AWS Lambda, Pinecone, embeddings  

**Implementation:**
1. Background job generates embeddings for all messages
2. Store embeddings in Pinecone with metadata
3. On search query, generate query embedding
4. Vector similarity search in Pinecone
5. Re-rank results with GPT-4
6. Return relevant messages

---

### Phase 3: Advanced AI Assistant (10-12 hours)

**Points:** 10/30  
**Type:** Multi-Step Agent with Knowledge Base  

**Goal:** AI that reads all user chats, builds knowledge base, answers questions on user's behalf

#### 3.1 Knowledge Base Builder (4-5 hours)

**AWS Lambda:** `knowledgeBuilder.ts`

**Triggered by:** EventBridge every hour

**Process:**
1. Fetch new messages since last run from Firestore
2. Filter messages sent by current user
3. Extract factual knowledge using GPT-4
4. Generate embeddings for knowledge items
5. Store in Pinecone `user-knowledge` index
6. Update last-run timestamp

**Knowledge Categories:**
- Project status and updates
- Availability and schedule
- Technical expertise shared
- Commitments and agreements
- Preferences and opinions

#### 3.2 AI Assistant (3-4 hours)

**AWS Lambda:** `aiAssistant.ts`

**Triggered by:** API Gateway (on-demand)

**Process:**
1. Receive question from another user
2. Query user's knowledge base in Pinecone
3. If relevant knowledge found:
   - Generate response in user's style
   - Return AI-generated answer
4. If no knowledge found:
   - Add to "Questions for User" queue
   - Return "User will respond shortly"
5. If critical/urgent:
   - Send notification to user

#### 3.3 Message Filter (2-3 hours)

**AWS Lambda:** `messageFilter.ts`

**Triggered by:** EventBridge hourly + on-demand

**Process:**
1. Fetch all unread messages
2. Categorize each message:
   - AI can answer (based on knowledge base)
   - Urgent (needs immediate attention)
   - Normal (can be batched)
   - Low priority (FYI only)
3. For AI-answerable messages:
   - Generate and send response automatically
   - Mark as handled
4. For others:
   - Add to user's digest
   - Prioritize by urgency

#### 3.4 Daily Digest UI (1-2 hours)

**Component:** `components/ai/DigestView.tsx`

**Shows:**
- Number of messages AI answered automatically
- Priority messages needing attention
- Pending questions without answers
- Summary of key updates

---

### Phase 4: Testing & Validation (4-6 hours)

#### 4.1 Feature Testing (2-3 hours)

**For Each Feature:**
- [ ] Functionality test (10 scenarios)
- [ ] Accuracy measurement (target: >90%)
- [ ] Response time measurement
- [ ] UI integration test
- [ ] Error handling test

#### 4.2 Advanced AI Testing (1-2 hours)

**Test Scenarios:**
- [ ] Build knowledge base from 50+ messages
- [ ] Answer 10 questions based on knowledge
- [ ] Handle 5 questions with missing knowledge
- [ ] Generate daily digest
- [ ] Filter and prioritize 20+ messages

#### 4.3 Rubric Validation (1 hour)

**Section 3.1: Required AI Features (15 pts)**
- [ ] All 5 features work excellently
- [ ] >90% accuracy achieved
- [ ] <2s response time
- [ ] Clean UI integration

**Section 3.2: Persona Fit (5 pts)**
- [ ] Clear mapping to Remote Team Professional
- [ ] Daily usefulness demonstrated
- [ ] Purpose-built feel

**Section 3.3: Advanced AI (10 pts)**
- [ ] Fully implemented
- [ ] Meets <15s response time
- [ ] Impressive capability
- [ ] Seamless integration

---

## File Structure & Organization

```
chat_iq/
├── functions/
│   └── src/
│       └── ai/
│           ├── types.ts ✅
│           ├── openai.ts ✅
│           ├── prompts.ts ✅
│           ├── detectPriority.ts ⏳
│           ├── summarize.ts ⏳
│           ├── extractActions.ts ⏳
│           └── trackDecisions.ts ⏳
│
├── aws/
│   └── lambda/
│       ├── src/
│       │   ├── searchMessages.ts ⏳
│       │   ├── knowledgeBuilder.ts ⏳
│       │   ├── aiAssistant.ts ⏳
│       │   ├── messageFilter.ts ⏳
│       │   └── shared/
│       │       ├── pinecone.ts ⏳
│       │       ├── openai.ts ⏳
│       │       └── firestore.ts ⏳
│       ├── package.json ⏳
│       └── tsconfig.json ⏳
│
├── services/
│   └── ai/
│       ├── types.ts ✅
│       └── AIService.ts ✅
│
├── hooks/
│   └── useAI.ts ⏳
│
├── components/
│   └── ai/
│       ├── PriorityBadge.tsx ⏳
│       ├── SummaryModal.tsx ⏳
│       ├── ActionItemsList.tsx ⏳
│       ├── DecisionTimeline.tsx ⏳
│       ├── ImportantUpdates.tsx ⏳
│       ├── DigestView.tsx ⏳
│       ├── AIButton.tsx ⏳
│       └── LoadingIndicator.tsx ⏳
│
└── app/
    └── (tabs)/
        └── decisions.tsx ⏳
```

---

## Deployment Strategy

### Firebase Functions Deployment

```bash
# Deploy all functions
cd functions
npm run build
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:detectPriority

# View logs
firebase functions:log --only detectPriority
```

### AWS Lambda Deployment

```bash
# Build and package
cd aws/lambda
npm run build
npm run package

# Deploy/update function
aws lambda update-function-code \
  --function-name MessageAI-KnowledgeBuilder \
  --zip-file fileb://function.zip

# View logs
aws logs tail /aws/lambda/MessageAI-KnowledgeBuilder --follow
```

### Environment Variables

**Firebase Functions:**
```bash
firebase functions:config:set openai.api_key="sk-proj-..."
```

**AWS Lambda:**
```bash
aws lambda update-function-configuration \
  --function-name MessageAI-KnowledgeBuilder \
  --environment Variables="{
    OPENAI_API_KEY=sk-proj-...,
    PINECONE_API_KEY=pcsk-...,
    PINECONE_ENVIRONMENT=us-west1-gcp,
    FIREBASE_PROJECT_ID=your-project-id
  }"
```

---

## Testing & Validation

### Unit Testing

**Firebase Functions:**
```bash
cd functions
npm test -- src/ai/detectPriority.test.ts
```

**Test Template:**
```typescript
describe('detectPriority', () => {
  it('should detect urgent messages', async () => {
    const result = await detectPriority({
      content: 'URGENT: Server is down!',
      messageId: 'test',
      chatId: 'test',
      senderId: 'test',
    });

    expect(result.urgencyLevel).toBe('critical');
    expect(result.isPriority).toBe(true);
  });
});
```

### Integration Testing

**End-to-End Test:**
1. Send test message
2. Trigger AI feature
3. Verify response
4. Measure timing
5. Check accuracy

### Performance Testing

**Metrics to Track:**
- Response time for each feature
- Accuracy rate (% correct)
- Token usage (cost)
- Error rate
- User satisfaction

---

## Cost Management

### Development Phase (Testing)

**OpenAI API:**
- GPT-4-mini: $0.150 / 1M input tokens, $0.600 / 1M output tokens
- Estimated: 100 API calls/day
- Average: 500 input + 300 output tokens
- Daily cost: ~$0.08
- **Total for 4 days testing: ~$0.32**

**Pinecone:**
- Free tier: 1 index, 100K vectors
- Sufficient for MVP
- **Cost: $0**

**AWS Lambda:**
- Free tier: 1M requests/month
- Hourly batch: 24 × 4 = 96 invocations
- **Cost: $0**

**Firebase Functions:**
- Free tier: 2M invocations/month
- Estimated: 50 invocations for testing
- **Cost: $0**

**Total MVP Development Cost: <$1**

### Production Estimates (100 active users)

**OpenAI API:**
- 100 users × 5 AI requests/day × $0.002/request
- **Monthly: ~$30**

**Pinecone:**
- 100K vectors (free tier)
- Upgrade: $70/month for 1M vectors
- **Monthly: $0-70**

**AWS Lambda:**
- 100 users × 24 hourly batches × 30 days = 72K invocations
- **Monthly: $0 (free tier)**

**Firebase Functions:**
- 100 users × 50 invocations/month = 5K invocations
- **Monthly: $0 (free tier)**

**Total Production (100 users): $30-100/month**

---

## Troubleshooting Guide

### Common Issues

**Issue: Firebase Function timeout**
```
Error: Function execution took longer than 60s
```
**Solution:**
```typescript
// Increase timeout in firebase.json
{
  "functions": {
    "timeout": 120,
    "memory": 512
  }
}
```

**Issue: OpenAI rate limit**
```
Error: Rate limit exceeded
```
**Solution:**
- Implement exponential backoff
- Add retry logic
- Monitor usage in OpenAI dashboard

**Issue: Pinecone connection fails**
```
Error: Failed to connect to index
```
**Solution:**
- Verify API key
- Check index name (case-sensitive)
- Ensure index is active (wait 60s after creation)

**Issue: Lambda "Module not found"**
```
Error: Cannot find module 'openai'
```
**Solution:**
```bash
# Ensure node_modules is in zip
cd aws/lambda
npm install
zip -r function.zip dist node_modules
```

**Issue: EventBridge not triggering**
```
Lambda function not running on schedule
```
**Solution:**
```bash
# Check rule status
aws events describe-rule --name MessageAI-HourlyBatch

# Verify target
aws events list-targets-by-rule --rule MessageAI-HourlyBatch

# Check Lambda permissions
aws lambda get-policy --function-name MessageAI-MessageProcessor
```

---

## Next Steps After Completion

### 1. Performance Optimization
- Implement response caching
- Batch API calls
- Optimize prompts for token reduction

### 2. Enhanced Features
- Multi-language support
- Voice message transcription + AI
- Image analysis in messages
- Sentiment analysis

### 3. Production Hardening
- Add error tracking (Sentry)
- Implement rate limiting
- Add usage analytics
- Set up monitoring dashboards

### 4. User Feedback Loop
- A/B test prompts
- Measure accuracy in production
- Iterate based on user feedback
- Add user preferences for AI behavior

---

## Success Criteria

### Phase Completion

**Phase 1: Infrastructure** ✓ when:
- [ ] All Firebase Functions deployed
- [ ] AWS Lambda functions deployed
- [ ] Pinecone indexes created
- [ ] API Gateway configured
- [ ] EventBridge scheduled
- [ ] All services communicating

**Phase 2: Features** ✓ when:
- [ ] All 5 features functional
- [ ] Accuracy >90% on test cases
- [ ] Response time <2s for simple features
- [ ] UI integration complete
- [ ] Error handling present

**Phase 3: Advanced AI** ✓ when:
- [ ] Knowledge base building
- [ ] AI answers questions accurately
- [ ] Message filtering works
- [ ] Daily digest generates
- [ ] Response time <15s

**Phase 4: Validation** ✓ when:
- [ ] All rubric criteria met
- [ ] Demo video recorded
- [ ] Documentation complete
- [ ] Ready for submission

---

## Timeline Summary

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Infrastructure | 4-6 hours | 40% ✅ |
| Phase 2: Features (5x) | 18-24 hours | Not started |
| Phase 3: Advanced AI | 10-12 hours | Not started |
| Phase 4: Testing | 4-6 hours | Not started |
| **TOTAL** | **36-48 hours** | **3-4 days** |

---

## Quick Reference

### Deploy Commands
```bash
# Firebase
cd functions && npm run build && firebase deploy --only functions

# AWS
cd aws/lambda && npm run build && npm run package
aws lambda update-function-code --function-name XXX --zip-file fileb://function.zip

# View Logs
firebase functions:log --only detectPriority
aws logs tail /aws/lambda/MessageAI-XXX --follow
```

### Test API Endpoints
```bash
# Firebase (requires Firebase Auth token)
curl -X POST https://REGION-PROJECT.cloudfunctions.net/detectPriority \
  -H "Authorization: Bearer TOKEN" \
  -d '{"content": "URGENT: Test"}'

# AWS
curl -X POST https://API_ID.execute-api.us-east-1.amazonaws.com/prod/search \
  -d '{"query": "test"}'
```

---

**Document Status:** Complete and Comprehensive  
**Ready For:** Implementation  
**Last Updated:** October 22, 2025

---

## Appendix: Persona Mapping

### Remote Team Professional Pain Points → AI Features

| Pain Point | AI Feature | How It Helps |
|-----------|-----------|--------------|
| Drowning in message threads | Thread Summarization | Get quick overview of long conversations |
| Missing important messages | Priority Detection | Urgent messages flagged automatically |
| Losing track of action items | Action Item Extraction | All tasks extracted and tracked |
| Forgetting decisions | Decision Tracking | Timeline of all team decisions |
| Hard to find past conversations | Smart Search | Semantic search finds messages by meaning |
| Answering same questions repeatedly | AI Assistant | AI answers based on knowledge base |
| Information overload | Message Filtering | AI prioritizes what needs attention |

**Persona Fit Score Target:** 5/5 (Perfect alignment)


