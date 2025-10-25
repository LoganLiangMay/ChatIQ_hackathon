# LangSmith Setup Instructions

## Environment Variables

Add these to your `.env.local` file (create if it doesn't exist):

```bash
# LangSmith Configuration for AI SDK Tracing
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=your_langsmith_api_key_here
LANGSMITH_PROJECT=pr-notable-girlfriend-31

# OpenAI API Key (already configured)
OPENAI_API_KEY=your_openai_api_key

# Expo Public Variables (accessible in client)
EXPO_PUBLIC_LANGSMITH_ENABLED=true
```

## For Firebase Functions

```bash
cd functions
firebase functions:config:set \
  langsmith.tracing="true" \
  langsmith.endpoint="https://api.smith.langchain.com" \
  langsmith.api_key="your_langsmith_api_key_here" \
  langsmith.project="pr-notable-girlfriend-31"
```

## Terminal Export (for local testing)

```bash
export LANGSMITH_TRACING=true
export LANGSMITH_ENDPOINT=https://api.smith.langchain.com
export LANGSMITH_API_KEY=your_langsmith_api_key_here
export LANGSMITH_PROJECT=pr-notable-girlfriend-31
export OPENAI_API_KEY=your_openai_api_key
```

## Benefits

- **Trace all AI SDK calls** - See every step of agent reasoning
- **Debug tool calls** - Inspect tool inputs/outputs
- **Monitor performance** - Track latency and token usage
- **Cost analysis** - Understand spending per conversation
- **Production observability** - Catch issues in real-time

## Access Dashboard

View traces at: https://smith.langchain.com/projects/pr-notable-girlfriend-31

