// Mobile App AI Service Types

export interface AIFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface SummaryResult {
  summary: string;
  messageCount: number;
  timeRange: {
    start: number;
    end: number;
  };
  participants: string[];
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

export interface PriorityDetection {
  isPriority: boolean;
  score: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}

export interface SearchResult {
  messageId: string;
  chatId: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  score: number;
}

export interface AIError {
  code: string;
  message: string;
  details?: any;
}

export type AIFeatureType = 
  | 'summarize'
  | 'actions'
  | 'priority'
  | 'decisions'
  | 'search'
  | 'assistant';


