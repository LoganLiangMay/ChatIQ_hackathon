// AI Feature Types

export interface SummarizeThreadRequest {
  chatId: string;
  userId: string;
  messageLimit?: number; // Default: 50
}

export interface SummarizeThreadResponse {
  summary: string;
  messageCount: number;
  timeRange: {
    start: number;
    end: number;
  };
  participants: string[];
}

export interface ExtractActionsRequest {
  chatId: string;
  userId: string;
  messageLimit?: number; // Default: 50
}

export interface ActionItem {
  id: string;
  task: string;
  owner?: string;
  deadline?: string;
  status: 'pending' | 'completed';
  extractedFrom: {
    messageId: string;
    timestamp: number;
  };
}

export interface ExtractActionsResponse {
  actionItems: ActionItem[];
  messageCount: number;
}

export interface DetectPriorityRequest {
  messageId: string;
  content: string;
  senderId: string;
  chatId: string;
}

export interface DetectPriorityResponse {
  isPriority: boolean;
  score: number; // 0-1
  reason: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface TrackDecisionsRequest {
  chatId: string;
  userId: string;
  messageLimit?: number; // Default: 100
}

export interface Decision {
  id: string;
  decision: string;
  context: string;
  participants: string[];
  timestamp: number;
  extractedFrom: {
    messageId: string;
  };
}

export interface TrackDecisionsResponse {
  decisions: Decision[];
  messageCount: number;
}

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
}

export interface OpenAIError {
  message: string;
  type: string;
  code?: string;
}


