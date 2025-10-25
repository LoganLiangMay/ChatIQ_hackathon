# 🚀 AI SDK Hybrid Implementation Plan

**Date:** October 24, 2025  
**Goal:** Implement Vercel AI SDK for Advanced AI Capability (10/10 points)  
**Approach:** Hybrid - Keep existing features, add AI SDK agent layer  
**Timeline:** 2-3 hours implementation + 1 hour RAG enhancement

---

## 📋 Overview

### Current State (20/30 points)
```
✅ 5 AI Features Working (15 points)
   - Priority Detection
   - Thread Summarization
   - Action Items
   - Decisions
   - Semantic Search

✅ Persona Fit (5 points)
   - Remote Team Professional

❌ Advanced AI Capability (0/10 points)
   - No conversational AI
   - No multi-step reasoning
   - No agentic behavior
```

### Target State (30/30 points)
```
✅ All 5 Features (Keep as-is)
✅ Persona Fit (Keep)
✅ Advanced AI Capability (NEW - 10 points)
   ✅ Multi-step agent with tool calling
   ✅ Conversational AI interface
   ✅ RAG pipeline for conversation history
   ✅ Memory/context management
```

---

## 🎯 Implementation Phases

### **Phase 1: Setup & Infrastructure** (30 minutes)
Install AI SDK, configure providers, set up project structure

### **Phase 2: Define Tools** (30 minutes)
Wrap existing 5 AI features as tools for the agent

### **Phase 3: Build Agent Service** (1 hour)
Create AI agent with multi-step reasoning and tool orchestration

### **Phase 4: Create UI** (30 minutes)
Build conversational AI chat screen with streaming

### **Phase 5: Deploy & Test** (30 minutes)
Firebase function deployment and end-to-end testing

### **Phase 6: RAG Enhancement** (1 hour)
Add vector embeddings for better context retrieval

---

## 📝 Detailed Step-by-Step Plan

## **PHASE 1: Setup & Infrastructure** (30 min)

### Step 1.1: Install AI SDK Packages (5 min)
```bash
# Core AI SDK
npm install ai

# OpenAI provider
npm install @ai-sdk/openai

# React Native hooks
npm install @ai-sdk/react

# Zod for schema validation (if not installed)
npm install zod

# Type definitions
npm install --save-dev @types/node
```

### Step 1.2: Configure Environment Variables (5 min)
```bash
# Add to .env (if not already there)
OPENAI_API_KEY=your_openai_api_key

# For Firebase Functions
cd functions
firebase functions:config:set openai.api_key="YOUR_OPENAI_API_KEY"
```

### Step 1.3: Create Project Structure (10 min)
```bash
# Frontend structure
mkdir -p services/ai/agent
mkdir -p app/(tabs)/ai-assistant
mkdir -p components/ai/agent

# Backend structure
cd functions/src/ai
mkdir -p agent
touch agent/index.ts
touch agent/tools.ts
touch agent/system-prompts.ts
```

### Step 1.4: Update TypeScript Config (10 min)
```json
// tsconfig.json - Ensure these are set
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node"
  }
}
```

---

## **PHASE 2: Define Tools** (30 min)

### Step 2.1: Create Tool Definitions (20 min)

**File: `services/ai/agent/tools.ts`**

```typescript
import { tool } from 'ai';
import { z } from 'zod';
import { aiService } from '@/services/ai/AIService';

/**
 * Tool 1: Summarize Thread
 * Summarizes a conversation thread
 */
export const summarizeTool = tool({
  description: `Summarize a conversation thread. 
  Use this when the user asks to summarize a chat, get key points, or understand what was discussed.
  Returns: Summary with key points, decisions, action items, and participants.`,
  parameters: z.object({
    chatId: z.string().describe('The chat ID to summarize'),
    messageLimit: z.number().optional().default(50).describe('Number of recent messages to include'),
  }),
  execute: async ({ chatId, messageLimit }) => {
    try {
      const result = await aiService.summarizeThread(chatId, messageLimit);
      return {
        summary: result.summary,
        messageCount: result.messageCount,
        participants: result.participants,
        timeRange: result.timeRange,
      };
    } catch (error: any) {
      return { error: error.message || 'Failed to summarize thread' };
    }
  },
});

/**
 * Tool 2: Extract Action Items
 * Extracts actionable tasks from conversations
 */
export const extractActionsTool = tool({
  description: `Extract action items and tasks from a conversation.
  Use this when the user wants to know what tasks need to be done, who is responsible for what, or what deadlines exist.
  Returns: List of action items with owners, deadlines, and status.`,
  parameters: z.object({
    chatId: z.string().describe('The chat ID to extract actions from'),
    messageLimit: z.number().optional().default(50),
  }),
  execute: async ({ chatId, messageLimit }) => {
    try {
      const actions = await aiService.extractActionItems(chatId, messageLimit);
      return {
        actionItems: actions.map(a => ({
          task: a.task,
          owner: a.owner,
          deadline: a.deadline,
          status: a.status,
        })),
        count: actions.length,
      };
    } catch (error: any) {
      return { error: error.message || 'Failed to extract action items' };
    }
  },
});

/**
 * Tool 3: Track Decisions
 * Finds decisions made in conversations
 */
export const trackDecisionsTool = tool({
  description: `Track decisions made in conversations.
  Use this when the user asks what was decided, what choices were made, or what agreements were reached.
  Returns: List of decisions with context, participants, and timestamps.`,
  parameters: z.object({
    chatId: z.string().describe('The chat ID to track decisions in'),
    messageLimit: z.number().optional().default(100),
  }),
  execute: async ({ chatId, messageLimit }) => {
    try {
      const decisions = await aiService.trackDecisions(chatId, messageLimit);
      return {
        decisions: decisions.map(d => ({
          decision: d.decision,
          context: d.context,
          participants: d.participants,
          timestamp: d.timestamp,
        })),
        count: decisions.length,
      };
    } catch (error: any) {
      return { error: error.message || 'Failed to track decisions' };
    }
  },
});

/**
 * Tool 4: Semantic Search
 * Searches messages by meaning
 */
export const searchMessagesTool = tool({
  description: `Search messages semantically across all conversations.
  Use this when the user wants to find specific information, recall past conversations, or search by meaning.
  Returns: Relevant messages with context, ranked by relevance.`,
  parameters: z.object({
    query: z.string().describe('The search query (natural language)'),
    filters: z.object({
      chatId: z.string().optional(),
      senderId: z.string().optional(),
      dateFrom: z.number().optional(),
      dateTo: z.number().optional(),
      priorityOnly: z.boolean().optional(),
    }).optional(),
    limit: z.number().optional().default(10),
  }),
  execute: async ({ query, filters, limit }) => {
    try {
      const results = await aiService.searchMessages(query, filters, limit);
      return {
        results: results.map(r => ({
          content: r.content,
          sender: r.senderName,
          chat: r.chatName,
          timestamp: r.timestamp,
          relevance: r.relevanceScore,
          context: r.context,
        })),
        count: results.length,
      };
    } catch (error: any) {
      return { error: error.message || 'Failed to search messages' };
    }
  },
});

/**
 * Tool 5: Get Priority Messages
 * Retrieves urgent/priority messages
 */
export const getPriorityMessagesTool = tool({
  description: `Get all priority/urgent messages.
  Use this when the user asks about urgent matters, what's important, or what needs immediate attention.
  Returns: List of priority messages with urgency levels.`,
  parameters: z.object({
    limit: z.number().optional().default(10),
  }),
  execute: async ({ limit }) => {
    try {
      // This would need to be implemented in AIService
      // For now, return a placeholder
      return {
        priorityMessages: [],
        count: 0,
        message: 'Priority messages feature coming soon',
      };
    } catch (error: any) {
      return { error: error.message || 'Failed to get priority messages' };
    }
  },
});

/**
 * Export all tools
 */
export const agentTools = {
  summarizeThread: summarizeTool,
  extractActions: extractActionsTool,
  trackDecisions: trackDecisionsTool,
  searchMessages: searchMessagesTool,
  getPriorityMessages: getPriorityMessagesTool,
};
```

### Step 2.2: Create System Prompts (10 min)

**File: `services/ai/agent/system-prompts.ts`**

```typescript
/**
 * System prompts for the AI agent
 */

export const AGENT_SYSTEM_PROMPT = `You are an intelligent AI assistant for ChatIQ, a team messaging app.

Your capabilities:
1. **Summarize conversations** - Provide concise summaries of chat threads
2. **Extract action items** - Identify tasks, owners, and deadlines
3. **Track decisions** - Find and explain decisions made in conversations
4. **Search messages** - Find relevant information across all chats
5. **Identify priorities** - Highlight urgent and important messages

Your personality:
- Professional but friendly
- Concise and to-the-point
- Proactive in suggesting helpful actions
- Context-aware about remote team workflows

Guidelines:
- Always use tools to access real data (don't make up information)
- When asked about specific chats, use the appropriate tool
- If multiple tools are needed, use them in sequence
- Provide context and explain your findings
- Suggest follow-up actions when relevant

User context:
- This is a remote team professional using the app
- They value quick, actionable insights
- They're often overwhelmed with messages
- Time zones and async communication are important`;

export const AGENT_INSTRUCTIONS = {
  summarize: 'Provide a clear, structured summary with key points, decisions, and action items.',
  actions: 'List action items in order of priority, highlight deadlines, and identify owners clearly.',
  decisions: 'Explain each decision with context about why it was made and who was involved.',
  search: 'Return the most relevant results with context to help the user understand the conversation flow.',
  proactive: 'When you detect related information, proactively suggest it without being asked.',
};
```

---

## **PHASE 3: Build Agent Service** (1 hour)

### Step 3.1: Create Agent Service (30 min)

**File: `services/ai/agent/AIAgent.ts`**

```typescript
import { generateText, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { agentTools } from './tools';
import { AGENT_SYSTEM_PROMPT } from './system-prompts';

/**
 * AI Agent Service
 * Handles conversational AI with multi-step reasoning
 */

// Initialize OpenAI provider
const openai = createOpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
});

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentResponse {
  text: string;
  toolCalls?: any[];
  steps?: any[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Generate a response from the agent (non-streaming)
 */
export async function generateAgentResponse(
  userMessage: string,
  conversationHistory: AgentMessage[] = []
): Promise<AgentResponse> {
  try {
    const messages = [
      { role: 'system' as const, content: AGENT_SYSTEM_PROMPT },
      ...conversationHistory.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    const result = await generateText({
      model: openai('gpt-4o-mini'), // Using mini for cost efficiency
      messages,
      tools: agentTools,
      maxSteps: 5, // Allow up to 5 reasoning steps
      temperature: 0.7,
      maxTokens: 1000,
    });

    return {
      text: result.text,
      toolCalls: result.toolCalls,
      steps: result.steps,
      usage: result.usage,
    };
  } catch (error: any) {
    console.error('Agent generation error:', error);
    throw new Error(error.message || 'Failed to generate agent response');
  }
}

/**
 * Stream a response from the agent
 */
export async function streamAgentResponse(
  userMessage: string,
  conversationHistory: AgentMessage[] = []
) {
  try {
    const messages = [
      { role: 'system' as const, content: AGENT_SYSTEM_PROMPT },
      ...conversationHistory.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages,
      tools: agentTools,
      maxSteps: 5,
      temperature: 0.7,
      maxTokens: 1000,
      onStepFinish: ({ text, toolCalls, toolResults, finishReason }) => {
        console.log('Step finished:', {
          textLength: text.length,
          toolCallsCount: toolCalls.length,
          finishReason,
        });
      },
    });

    return result;
  } catch (error: any) {
    console.error('Agent streaming error:', error);
    throw new Error(error.message || 'Failed to stream agent response');
  }
}

/**
 * Export for use in components
 */
export const aiAgent = {
  generateResponse: generateAgentResponse,
  streamResponse: streamAgentResponse,
};
```

### Step 3.2: Create Firebase Function Endpoint (30 min)

**File: `functions/src/ai/agent/index.ts`**

```typescript
import * as functions from 'firebase-functions';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

// Initialize OpenAI
const openai = createOpenAI({
  apiKey: functions.config().openai?.api_key || process.env.OPENAI_API_KEY,
});

// Import existing AI functions for tool use
import { callChatCompletion } from '../openai';

/**
 * AI Agent Firebase Function
 * Handles conversational AI with tool calling
 */
export const aiAgent = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '512MB',
  })
  .https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { message, conversationHistory = [] } = data;

    if (!message || typeof message !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Message is required'
      );
    }

    try {
      const result = await generateText({
        model: openai('gpt-4o-mini'),
        system: `You are an intelligent AI assistant for ChatIQ.
        You have access to tools to summarize chats, extract action items,
        track decisions, and search messages. Use these tools to help users.`,
        messages: [
          ...conversationHistory,
          { role: 'user', content: message },
        ],
        tools: {
          // Tools will be defined here
          // For now, placeholder
        },
        maxSteps: 5,
      });

      return {
        text: result.text,
        toolCalls: result.toolCalls,
        usage: result.usage,
      };
    } catch (error: any) {
      console.error('AI Agent error:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to process agent request'
      );
    }
  });
```

---

## **PHASE 4: Create UI** (30 min)

### Step 4.1: Create AI Chat Screen (20 min)

**File: `app/(tabs)/ai-assistant.tsx`**

```typescript
import { View, Text, StyleSheet, SafeAreaView, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { aiAgent, AgentMessage } from '@/services/ai/agent/AIAgent';

export default function AIAssistantScreen() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: AgentMessage = {
      role: 'user',
      content: input.trim(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Get agent response
      const response = await aiAgent.generateResponse(
        userMessage.content,
        messages
      );

      // Add assistant message
      const assistantMessage: AgentMessage = {
        role: 'assistant',
        content: response.text,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Agent error:', error);
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: AgentMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isUser ? styles.userText : styles.assistantText,
          ]}
        >
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="sparkles" size={28} color="#007AFF" />
            <Text style={styles.headerTitle}>AI Assistant</Text>
          </View>
        </View>

        {/* Messages */}
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Ask me anything!</Text>
            <Text style={styles.emptySubtext}>
              I can summarize chats, find decisions, extract action items, and more.
            </Text>
            
            {/* Quick suggestions */}
            <View style={styles.suggestionsContainer}>
              <TouchableOpacity
                style={styles.suggestionButton}
                onPress={() => setInput('What decisions were made recently?')}
              >
                <Text style={styles.suggestionText}>Recent decisions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.suggestionButton}
                onPress={() => setInput('What action items do I have?')}
              >
                <Text style={styles.suggestionText}>My action items</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.suggestionButton}
                onPress={() => setInput('Search for API discussions')}
              >
                <Text style={styles.suggestionText}>Search messages</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => `msg-${index}`}
            contentContainerStyle={styles.messagesList}
            inverted={false}
          />
        )}

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask me anything..."
              multiline
              maxLength={500}
              editable={!loading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!input.trim() || loading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!input.trim() || loading}
            >
              {loading ? (
                <Ionicons name="hourglass-outline" size={24} color="#FFF" />
              ) : (
                <Ionicons name="send" size={24} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  suggestionsContainer: {
    gap: 12,
    width: '100%',
  },
  suggestionButton: {
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  suggestionText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFF',
  },
  assistantText: {
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFF',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
```

### Step 4.2: Add to Navigation (10 min)

**File: `app/(tabs)/_layout.tsx`**

Add new tab for AI Assistant:

```typescript
<Tabs.Screen
  name="ai-assistant"
  options={{
    title: 'AI Assistant',
    tabBarIcon: ({ color, focused }) => (
      <Ionicons 
        name={focused ? 'sparkles' : 'sparkles-outline'} 
        size={28} 
        color={color} 
      />
    ),
  }}
/>
```

---

## **PHASE 5: Deploy & Test** (30 min)

### Step 5.1: Build & Deploy Functions (15 min)

```bash
# Build TypeScript
cd /Applications/Gauntlet/chat_iq/functions
npm run build

# Deploy AI agent function
firebase deploy --only functions:aiAgent

# Verify deployment
firebase functions:list | grep aiAgent
```

### Step 5.2: Test on Device (15 min)

**Test Scenarios:**

1. **Basic Conversation**
   ```
   User: "Hi, what can you do?"
   Expected: Agent explains capabilities
   ```

2. **Search Query**
   ```
   User: "Search for messages about API design"
   Expected: Uses searchMessages tool, returns results
   ```

3. **Multi-Step Query**
   ```
   User: "What did we decide about the API and who has action items?"
   Expected: 
   - Uses trackDecisions tool
   - Uses extractActions tool
   - Synthesizes comprehensive answer
   ```

4. **Summarization**
   ```
   User: "Summarize my last conversation"
   Expected: Uses summarizeThread tool, provides summary
   ```

---

## **PHASE 6: RAG Enhancement** (1 hour)

### Step 6.1: Add Vector Embeddings (30 min)

**File: `services/ai/agent/embeddings.ts`**

```typescript
import { generateEmbedding, generateEmbeddingsBatch } from '@/functions/src/ai/openai';

/**
 * RAG Pipeline for Conversation History
 */

export interface MessageEmbedding {
  messageId: string;
  chatId: string;
  content: string;
  embedding: number[];
  timestamp: number;
  metadata: {
    sender: string;
    isPriority?: boolean;
    hasActionItems?: boolean;
    hasDecision?: boolean;
  };
}

/**
 * Generate embedding for a single message
 */
export async function embedMessage(
  messageId: string,
  chatId: string,
  content: string,
  metadata: any
): Promise<MessageEmbedding> {
  const embedding = await generateEmbedding(content);
  
  return {
    messageId,
    chatId,
    content,
    embedding,
    timestamp: Date.now(),
    metadata,
  };
}

/**
 * Generate embeddings for multiple messages
 */
export async function embedMessages(
  messages: Array<{
    messageId: string;
    chatId: string;
    content: string;
    metadata: any;
  }>
): Promise<MessageEmbedding[]> {
  const contents = messages.map(m => m.content);
  const embeddings = await generateEmbeddingsBatch(contents);
  
  return messages.map((msg, idx) => ({
    ...msg,
    embedding: embeddings[idx],
    timestamp: Date.now(),
  }));
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Find most similar messages using embeddings
 */
export function findSimilarMessages(
  queryEmbedding: number[],
  messageEmbeddings: MessageEmbedding[],
  topK: number = 10
): MessageEmbedding[] {
  const scored = messageEmbeddings.map(msg => ({
    ...msg,
    similarity: cosineSimilarity(queryEmbedding, msg.embedding),
  }));
  
  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}
```

### Step 6.2: Create RAG Tool (30 min)

**Add to `services/ai/agent/tools.ts`:**

```typescript
/**
 * Tool: RAG Search
 * Semantic search using vector embeddings
 */
export const ragSearchTool = tool({
  description: `Advanced semantic search using RAG (Retrieval Augmented Generation).
  Use this for complex queries that require understanding context and meaning beyond simple keyword matching.
  Returns: Most relevant messages with semantic similarity scores.`,
  parameters: z.object({
    query: z.string().describe('The search query'),
    topK: z.number().optional().default(10).describe('Number of results'),
    chatId: z.string().optional().describe('Limit to specific chat'),
  }),
  execute: async ({ query, topK, chatId }) => {
    try {
      // 1. Generate embedding for query
      const queryEmbedding = await embedMessage('query', '', query, {});
      
      // 2. Fetch stored message embeddings (from Firestore/SQLite)
      // This would be implemented with your storage layer
      const storedEmbeddings: MessageEmbedding[] = []; // Placeholder
      
      // 3. Find most similar messages
      const similarMessages = findSimilarMessages(
        queryEmbedding.embedding,
        storedEmbeddings,
        topK
      );
      
      // 4. Return results
      return {
        results: similarMessages.map(msg => ({
          content: msg.content,
          similarity: cosineSimilarity(queryEmbedding.embedding, msg.embedding),
          messageId: msg.messageId,
          chatId: msg.chatId,
          metadata: msg.metadata,
        })),
        count: similarMessages.length,
      };
    } catch (error: any) {
      return { error: error.message || 'RAG search failed' };
    }
  },
});

// Add to agentTools export
export const agentTools = {
  // ... existing tools
  ragSearch: ragSearchTool,
};
```

---

## 📊 Success Metrics

### Implementation Complete When:
- ✅ AI SDK installed and configured
- ✅ All 5 existing features wrapped as tools
- ✅ AI Agent service created with multi-step reasoning
- ✅ Conversational UI screen built
- ✅ Firebase function deployed
- ✅ End-to-end conversation working
- ✅ RAG pipeline with embeddings functional

### Advanced AI Capability Score (10/10 points):
- ✅ **Multi-Step Agent** (4 pts) - Agent can reason across multiple steps
- ✅ **Tool Calling** (2 pts) - Uses existing features as tools
- ✅ **Conversational Interface** (2 pts) - Natural language chat UI
- ✅ **RAG Pipeline** (2 pts) - Vector embeddings for context retrieval

---

## 🎯 Testing Checklist

### Basic Functionality:
- [ ] Agent responds to simple queries
- [ ] Tool calls work (each of 5 tools)
- [ ] Multi-step reasoning works
- [ ] Conversation history maintained
- [ ] Error handling graceful

### Advanced Features:
- [ ] RAG search finds relevant context
- [ ] Agent synthesizes information from multiple tools
- [ ] Streaming responses work (if implemented)
- [ ] Cost per query < $0.01
- [ ] Response time < 5 seconds

### User Experience:
- [ ] UI is intuitive and responsive
- [ ] Loading states clear
- [ ] Error messages helpful
- [ ] Suggestions useful
- [ ] Navigation seamless

---

## 💰 Cost Analysis

### Per Conversation Estimate:
```
GPT-4o-mini:
- Input: ~500 tokens (system + history + user)
- Output: ~200 tokens (agent response)
- Tool calls: 1-3 per conversation
- Cost: ~$0.002 per conversation

Embeddings (RAG):
- Query embedding: ~$0.0001
- Total: ~$0.0021 per conversation

Monthly (100 users, 10 conversations/day):
- 30,000 conversations/month
- Cost: ~$63/month
```

---

## 📚 Resources

### Documentation:
- AI SDK Docs: https://sdk.vercel.ai/docs
- OpenAI API: https://platform.openai.com/docs
- Firebase Functions: https://firebase.google.com/docs/functions

### Code Examples:
- Tool Calling: See Phase 2 above
- Agent Loops: See Phase 3 above
- React Native UI: See Phase 4 above
- RAG Pipeline: See Phase 6 above

---

## 🚀 Ready to Start!

**This plan will take you from 20/30 → 30/30 points in ~3-4 hours.**

**When you're ready, I'll begin implementing Phase 1!** 🎯

Let me know if you want me to:
1. Start implementing now
2. Adjust any part of the plan
3. Add/remove features
4. Explain any section in more detail


