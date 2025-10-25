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
  cached?: boolean; // True if returned from cache instead of regenerating
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

// Decision Thread Step - Individual suggestion or narrowing point
export interface DecisionStep {
  messageId: string;
  timestamp: number;
  participant: string;
  type: 'suggestion' | 'counter' | 'narrowing' | 'final';
  content: string;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'confused';
}

// Enhanced Decision with full thread/flow
export interface Decision {
  id: string;
  decision: string;
  context: string;
  participants: string[];
  timestamp: number;
  extractedFrom: {
    messageId: string;
  };
  // NEW: Decision flow tracking
  decisionThread?: DecisionStep[];
  topic?: string;
  relatedProject?: string;
  confidence?: number; // 0-1, how certain was the final decision
  sentiment?: {
    overall: 'positive' | 'neutral' | 'negative';
    confusion: number; // 0-1, level of confusion during discussion
    hasBlockers: boolean;
  };
}

// Project/Product tracking
export interface Project {
  id: string;
  name: string;
  type: 'project' | 'product' | 'feature';
  firstMentioned: number;
  lastUpdated: number;
  mentions: Array<{
    messageId: string;
    chatId: string;
    timestamp: number;
    content: string;
  }>;
  status: {
    current: 'planning' | 'in-progress' | 'blocked' | 'completed' | 'cancelled' | 'unknown';
    timeline: Array<{
      status: string;
      timestamp: number;
      messageId: string;
    }>;
  };
  sentiment: {
    confusion: number; // 0-1, how much confusion exists
    blockerCount: number; // number of blockers mentioned
    confidence: number; // 0-1, team confidence level
    areas: Array<{
      area: string; // e.g., "backend", "UI", "deployment"
      sentiment: 'confused' | 'confident' | 'blocked' | 'progressing';
      messageIds: string[];
    }>;
  };
  relatedDecisions: string[]; // Decision IDs
  participants: string[];
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
  relevanceScore: number;
  context?: {
    before: Array<{ sender: string; content: string }>;
    after: Array<{ sender: string; content: string }>;
  };
  chatName?: string;
  isPriority?: boolean;
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

// Blocker detection for project tracking
export interface Blocker {
  id: string;
  blocker: string;
  context: string;
  severity: 'low' | 'medium' | 'high';
  relatedProject?: string;
  timestamp: number;
  extractedFrom: { messageId: string };
}

// Response types with caching support
export interface DecisionsResponse {
  decisions: Decision[];
  projects?: Project[];
  chatId: string;
  extractedAt: number;
  messageCount: number;
  cached?: boolean; // True if returned from cache
}

export interface BlockersResponse {
  blockers: Blocker[];
  chatId: string;
  extractedAt: number;
  messageCount: number;
  cached?: boolean; // True if returned from cache
}

// Visualization data types
export interface TreeDiagramData {
  mermaidCode: string;
  nodeCount: number;
}

export interface ProgressData {
  progress: number; // 0-100
  decisionsCount: number;
  blockersCount: number;
  status: 'planning' | 'in-progress' | 'blocked' | 'completed';
}


