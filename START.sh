#!/bin/bash

# MessageAI MVP - Expo Start Script
# This script starts Expo with proper file limits

echo "🚀 Starting MessageAI MVP..."
echo ""

# Increase file descriptor limit
ulimit -n 10240

# Navigate to project directory
cd "$(dirname "$0")"

# Start Expo with clean cache
echo "Starting Expo development server..."
echo "This may take 60-90 seconds on first compile..."
echo ""

npx expo start --clear




