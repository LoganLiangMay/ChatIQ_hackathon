import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { agentTools } from './tools';
import { AGENT_SYSTEM_PROMPT } from './system-prompts';

/**
 * AI Agent Service
 * Handles conversational AI with multi-step reasoning
 * Note: LangSmith tracing removed due to React Native compatibility issues
 */

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
      maxSteps: 5, // Allow up to 5 reasoning steps
      temperature: 0.7,
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

