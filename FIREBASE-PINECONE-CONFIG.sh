#!/bin/bash

# Firebase Functions Pinecone Configuration Script
# Run this after getting your Pinecone API key

echo "🔧 ChatIQ - Firebase Functions Pinecone Configuration"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -d "functions" ]; then
    echo "❌ Error: Please run this script from the ChatIQ root directory"
    echo "   cd /Applications/Gauntlet/chat_iq"
    exit 1
fi

echo "📝 Please provide your Pinecone credentials:"
echo ""

# Prompt for Pinecone API key
read -p "Pinecone API Key (starts with pcsk_): " PINECONE_API_KEY
if [ -z "$PINECONE_API_KEY" ]; then
    echo "❌ Error: Pinecone API key cannot be empty"
    exit 1
fi

# Prompt for environment (with default)
read -p "Pinecone Environment [us-east-1-aws]: " PINECONE_ENV
PINECONE_ENV=${PINECONE_ENV:-us-east-1-aws}

# Prompt for index name (with default)
read -p "Pinecone Index Name [chatiq-messages]: " PINECONE_INDEX
PINECONE_INDEX=${PINECONE_INDEX:-chatiq-messages}

echo ""
echo "🔍 Configuration Summary:"
echo "========================"
echo "API Key: ${PINECONE_API_KEY:0:20}..."
echo "Environment: $PINECONE_ENV"
echo "Index: $PINECONE_INDEX"
echo ""

read -p "Is this correct? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "❌ Configuration cancelled"
    exit 1
fi

echo ""
echo "🚀 Setting Firebase Functions config..."
echo ""

# Set Firebase Functions config
firebase functions:config:set \
  pinecone.api_key="$PINECONE_API_KEY" \
  pinecone.environment="$PINECONE_ENV" \
  pinecone.index="$PINECONE_INDEX"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Firebase Functions config set successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Verify config: firebase functions:config:get"
    echo "2. Update .env.local with the same credentials"
    echo "3. Deploy functions: cd functions && firebase deploy --only functions"
    echo ""
    echo "📄 .env.local should have:"
    echo "EXPO_PUBLIC_PINECONE_API_KEY=$PINECONE_API_KEY"
    echo "EXPO_PUBLIC_PINECONE_ENVIRONMENT=$PINECONE_ENV"
    echo "EXPO_PUBLIC_PINECONE_INDEX=$PINECONE_INDEX"
else
    echo ""
    echo "❌ Error: Failed to set Firebase Functions config"
    echo "   Please check your Firebase CLI authentication"
    exit 1
fi

