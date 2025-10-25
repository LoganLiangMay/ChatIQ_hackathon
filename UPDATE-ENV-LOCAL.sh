#!/bin/bash

# Update .env.local with Pinecone credentials
# Run this script to add Pinecone configuration

echo "📝 Adding Pinecone configuration to .env.local..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    cat > .env.local << 'EOF'
# ChatIQ Environment Variables

# OpenAI API Key (Required)
OPENAI_API_KEY=your_openai_api_key_here

# LangSmith Configuration (Optional - for AI tracing)
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=your_langsmith_api_key_here
LANGSMITH_PROJECT=pr-notable-girlfriend-31

EOF
fi

# Add Pinecone configuration if not already present
if grep -q "EXPO_PUBLIC_PINECONE_API_KEY" .env.local; then
    echo "⚠️  Pinecone configuration already exists in .env.local"
    echo "Please update it manually if needed."
else
    echo "" >> .env.local
    echo "# Pinecone Configuration (Phase 6 - RAG)" >> .env.local
    echo "EXPO_PUBLIC_PINECONE_API_KEY=your_pinecone_api_key_here" >> .env.local
    echo "EXPO_PUBLIC_PINECONE_ENVIRONMENT=us-east-1-aws" >> .env.local
    echo "EXPO_PUBLIC_PINECONE_INDEX=chatiq-messages" >> .env.local
    echo "✅ Pinecone configuration added to .env.local"
fi

echo ""
echo "📋 Your .env.local now contains:"
echo "   EXPO_PUBLIC_PINECONE_API_KEY=your_pinecone_api_key_here...UB53G"
echo "   EXPO_PUBLIC_PINECONE_ENVIRONMENT=us-east-1-aws"
echo "   EXPO_PUBLIC_PINECONE_INDEX=chatiq-messages"
echo ""
echo "✅ Configuration complete!"

