// AI Prompt Templates

export const PROMPTS = {
  /**
   * Thread Summarization
   */
  summarizeThread: (messages: Array<{ sender: string; content: string; timestamp: number }>) => {
    const formattedMessages = messages
      .map((m) => {
        const date = new Date(m.timestamp).toLocaleString();
        return `[${date}] ${m.sender}: ${m.content}`;
      })
      .join('\n');

    return [
      {
        role: 'system' as const,
        content: `You are a helpful assistant that summarizes team conversations. 
Your goal is to extract the key points, decisions, and action items from chat threads.
Be concise but comprehensive. Focus on what matters for busy professionals.`,
      },
      {
        role: 'user' as const,
        content: `Please summarize the following conversation thread. Include:
1. Main topics discussed
2. Key decisions made (if any)
3. Action items or next steps (if any)
4. Important dates or deadlines mentioned

Conversation:
${formattedMessages}

Provide a clear, concise summary in 2-4 paragraphs.`,
      },
    ];
  },

  /**
   * Action Item Extraction
   */
  extractActionItems: (messages: Array<{ sender: string; content: string; messageId: string; timestamp: number }>) => {
    const formattedMessages = messages
      .map((m) => {
        return `[ID: ${m.messageId}] ${m.sender}: ${m.content}`;
      })
      .join('\n');

    return [
      {
        role: 'system' as const,
        content: `You are an AI assistant specialized in extracting actionable tasks from conversations.

IMPORTANT RULES:
1. Only extract tasks that require ACTION (things people need to DO)
2. Skip informational statements (e.g., "I'll finish the design" is just info, not asking for action)
3. Only include tasks directed at the chat recipient (requests, asks, or assigned tasks)
4. Make task descriptions concise, checklist-style, and first-person (e.g., "Review code" not "Please review the code")
5. If someone says they will do something themselves, that's NOT an action item for the recipient

Examples:
✅ "Can you send me the report?" → Task: "Send report", Owner: null (recipient's task)
✅ "Please review the changes by Friday" → Task: "Review changes", Owner: null, Deadline: "Friday"
❌ "I'll finish the design tomorrow" → Skip (informational, not an action request)
❌ "The server is down" → Skip (informational, not a clear task)`,
      },
      {
        role: 'user' as const,
        content: `Extract ONLY actionable tasks that require the recipient to do something. Skip informational statements.

For each action item:
1. Task: Short, checklist-style description (e.g., "Send report", "Review code")
2. Owner: If assigned to someone specific, use their name. If it's for the recipient, use null
3. Deadline: Only if explicitly mentioned
4. Message ID

Conversation:
${formattedMessages}

Return ONLY actionable tasks in JSON format:
[
  {
    "task": "concise task",
    "owner": "name or null",
    "deadline": "deadline or null",
    "messageId": "message ID"
  }
]`,
      },
    ];
  },

  /**
   * Priority Detection
   */
  detectPriority: (message: string) => [
    {
      role: 'system' as const,
      content: `You are an AI that detects message priority for busy professionals.
Classify messages as priority based on:
- Urgency indicators: URGENT, ASAP, immediate, critical, emergency
- Time sensitivity: deadlines, today, tonight, now
- Impact: blocker, broken, down, failed
- Direct requests requiring quick response

Score from 0 (not priority) to 1 (highest priority).
Levels: low (0-0.3), medium (0.3-0.6), high (0.6-0.85), critical (0.85-1.0)`,
    },
    {
      role: 'user' as const,
      content: `Analyze this message and determine if it's a priority:
"${message}"

Respond in JSON format:
{
  "isPriority": boolean,
  "score": number (0-1),
  "urgencyLevel": "low" | "medium" | "high" | "critical",
  "reason": "brief explanation"
}`,
    },
  ],

  /**
   * Decision Tracking with Flow Analysis
   */
  trackDecisions: (
    messages: Array<{ sender: string; content: string; messageId: string; timestamp: number }>,
    projectContext?: string
  ) => {
    const formattedMessages = messages
      .map((m) => {
        const date = new Date(m.timestamp).toLocaleString();
        return `[ID: ${m.messageId}] [${date}] ${m.sender}: ${m.content}`;
      })
      .join('\n');

    return [
      {
        role: 'system' as const,
        content: `You are an AI specialized in tracking decision-making processes in team conversations.

${projectContext ? `Project Context: ${projectContext}\n\nUse this context to better understand decisions and their relevance to the project.\n` : ''}

Your goal is to identify:
1. **Decision Flows** - How discussions evolve (suggestions → narrowing → final decision)
2. **Project/Product Mentions** - Track projects and their status
3. **Sentiment** - Detect confusion, blockers, confidence levels

Decision Flow Types:
- "suggestion" - Initial ideas or options proposed
- "counter" - Alternative suggestions or objections
- "narrowing" - Filtering down options, eliminating choices
- "final" - The ultimate decision made

Look for decision phrases (be VERY INCLUSIVE):
- "we decided to...", "let's go with...", "agreed to..."
- "we'll do...", "the plan is...", "settled on..."
- "let's do...", "let's order...", "let's get..."
- ANY conversation where people discuss options and make a choice
- Food orders, purchases, plans - these are ALL decisions!

Look for project mentions:
- Project names, product names, feature names
- Status keywords: "blocked", "in progress", "completed", "delayed", "planning"

Detect sentiment:
- Confusion: "not sure", "confused", "don't understand"
- Blockers: "blocked by", "waiting on", "can't proceed"
- Confidence: "definitely", "clear", "ready"`,
      },
      {
        role: 'user' as const,
        content: `Analyze this conversation for decisions, their evolution flow, and project tracking.

For each decision, extract:
1. **Final Decision** - What was ultimately decided
2. **Decision Thread** - The flow of discussion (suggestions → narrowing → final)
3. **Topic** - What is this decision about
4. **Related Project** - If a project/product is mentioned
5. **Confidence** - How certain the team was (0-1)
6. **Sentiment** - Overall mood and confusion level

Conversation:
${formattedMessages}

Return in JSON format:
[
  {
    "decision": "final decision text",
    "context": "why this was decided",
    "participants": ["person1", "person2"],
    "messageId": "final decision message ID",
    "timestamp": number,
    "decisionThread": [
      {
        "messageId": "msg1",
        "timestamp": number,
        "participant": "person1",
        "type": "suggestion",
        "content": "brief summary of this step",
        "sentiment": "positive" | "neutral" | "negative" | "confused"
      }
    ],
    "topic": "what this is about",
    "relatedProject": "project name if mentioned",
    "confidence": 0.8,
    "sentiment": {
      "overall": "positive",
      "confusion": 0.2,
      "hasBlockers": false
    }
  }
]

Also identify any projects/products mentioned and return separately as:
{
  "decisions": [...decisions array above...],
  "projects": [
    {
      "name": "project name",
      "type": "project" | "product" | "feature",
      "status": "in-progress" | "blocked" | "planning" | "completed",
      "mentions": [{"messageId": "id", "content": "brief context"}],
      "sentiment": {
        "confusion": 0.3,
        "blockerCount": 1,
        "confidence": 0.7,
        "areas": [
          {"area": "backend", "sentiment": "blocked", "messageIds": ["id1"]}
        ]
      }
    }
  ]
}`,
      },
    ];
  },

  /**
   * Smart Search (for AWS Lambda)
   */
  rankSearchResults: (query: string, messages: Array<{ content: string; score: number }>) => {
    const formattedMessages = messages
      .map((m, idx) => `[${idx}] (Relevance: ${m.score.toFixed(2)}) ${m.content}`)
      .join('\n');

    return [
      {
        role: 'system' as const,
        content: `You are a search assistant helping users find relevant messages.
The user's query is semantic - they want to find messages by meaning, not just keywords.
Your job is to re-rank the results to show the most relevant messages first.`,
      },
      {
        role: 'user' as const,
        content: `User query: "${query}"

Here are potential matching messages:
${formattedMessages}

Return the message indices in order of relevance (most relevant first) as JSON:
{
  "rankedIndices": [2, 0, 4, 1, 3],
  "explanation": "brief reason for ranking"
}`,
      },
    ];
  },

  /**
   * Knowledge Base Builder (for AWS Lambda)
   */
  extractKnowledge: (messages: Array<{ sender: string; content: string }>) => {
    const formattedMessages = messages
      .map((m) => `${m.sender}: ${m.content}`)
      .join('\n');

    return [
      {
        role: 'system' as const,
        content: `You are an AI that builds a knowledge base about a user from their messages.
Extract factual information the user has shared:
- Project status and details
- Availability and schedule
- Preferences and opinions
- Commitments and agreements
- Technical knowledge shared
- Contact information

Focus on facts that could help answer questions on the user's behalf.`,
      },
      {
        role: 'user' as const,
        content: `Extract knowledge from these messages sent by the user:

${formattedMessages}

Return knowledge items in JSON format:
[
  {
    "category": "project|availability|preference|commitment|technical|contact|other",
    "fact": "the factual statement",
    "context": "additional context if needed",
    "confidence": number (0-1)
  }
]`,
      },
    ];
  },
};


