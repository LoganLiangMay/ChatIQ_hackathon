#!/bin/bash
# Check Firebase Function logs for priority detection
cd /Applications/Gauntlet/chat_iq
firebase functions:log --only detectPriority | tail -50

