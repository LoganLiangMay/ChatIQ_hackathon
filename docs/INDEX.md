# ChatIQ Documentation Index

**Last Updated:** October 21, 2025

This document provides a comprehensive overview of all documentation in the ChatIQ project. All documentation has been organized back into the project folder for easy access and version control.

---

## 📁 Documentation Structure

### 1. Memory Bank (`/memory-bank/`)

The Memory Bank contains core project knowledge and serves as the AI's persistent memory across sessions.

#### Core Files
- **`MessageAI.md`** - Complete product requirements document (PRD)
- **`product-requirements.md`** - Detailed product requirements and specifications
- **`code-architecture.md`** - System architecture and technical design
- **`implementation-guide.md`** - Step-by-step implementation guidelines
- **`DEVELOPMENT-ROADMAP.md`** - Development timeline and milestones
- **`task-list-prs.md`** - Pull request tracking and task management
- **`user-stories-implementation-summary.md`** - User stories and implementation status

---

### 2. Documentation (`/docs/`)

All project documentation organized by category.

#### 2.1 Setup & Configuration (`/docs/setup-guides/`)
- **`SETUP.md`** - Main setup instructions
- **`FIREBASE-CONFIG-GUIDE.md`** - Firebase configuration guide
- **`FIRESTORE-SETUP.md`** - Firestore database setup
- **`GET-FIREBASE-CONFIG.md`** - How to get Firebase credentials
- **`ENV-TEMPLATE.txt`** - Environment variables template
- **`START-APP.md`** - How to start the application
- **`SETUP-STATUS.md`** - Setup progress tracker
- **`STEP-1-2-COMPLETE.md`** - Initial setup completion notes
- **`NEXT-STEPS.md`** - Next steps after setup
- **`SETUP-COMPLETE-SUMMARY.md`** - Setup completion summary

#### 2.2 Quick Reference (`/docs/reference-cards/`)
- **`INDEX.md`** - Reference cards index
- **`START-HERE.md`** - Quick start guide
- **`QUICK-REFERENCE.md`** - Quick reference for common tasks
- **`READY-TO-RUN.md`** - Pre-flight checklist
- **`COMPLETE-PACKAGE-SUMMARY.md`** - Complete package overview

#### 2.3 Pull Request Summaries (`/docs/pr-summaries/`)
- **`PR3-README.md`** - PR3 overview
- **`PR3-COMPLETE.md`** - PR3 completion notes
- **`PR4-COMPLETE.md`** - PR4 completion notes
- **`PR5-COMPLETE.md`** - PR5 completion notes
- **`PR6-COMPLETE.md`** - PR6 completion notes
- **`PR7-COMPLETE.md`** - PR7 completion notes
- **`PR8-COMPLETE.md`** - PR8 completion notes
- **`PR9-COMPLETE.md`** - PR9 completion notes
- **`PR10-COMPLETE.md`** - PR10 completion notes
- **`PR2-README.md`** - PR2 overview
- **`PR2-COMPLETE.md`** - PR2 completion notes
- **`PR2-IMPLEMENTATION-SUMMARY.md`** - PR2 implementation details

#### 2.4 Deployment (`/docs/deployment/`)
- **`DEPLOY-FIRESTORE.md`** - Firestore deployment guide
- **`PRODUCTION-CHECKLIST.md`** - Pre-production checklist

#### 2.5 Testing (`/docs/testing/`)
- **`BROWSER-TESTING-NOW.md`** - Browser testing instructions
- **`TEST-SEARCH.md`** - Search functionality testing

#### 2.6 Troubleshooting (`/docs/troubleshooting/`)
- **`FINAL-SOLUTION.md`** - Final solutions to common issues
- **`WATCHMAN-WORKAROUND.md`** - Watchman issues and fixes
- **`RUN-THESE-2-COMMANDS.md`** - Quick fix commands

#### 2.7 Error Fixes (`/docs/error-fixes/`)
Complete collection of error fixes and solutions:
- **`EMFILE-SOLUTIONS-ALL-OPTIONS.md`** - EMFILE error solutions
- **`FINAL-FIX-EMFILE.md`** - Final EMFILE fix
- **`FIX-TOO-MANY-FILES.md`** - Too many files error fix
- **`INCREASE-MACOS-LIMITS.sh`** - Script to increase macOS limits
- **`PERMANENT-FIX.md`** - Permanent fix for common issues
- **`WATCHMAN-INSTALLING.md`** - Watchman installation guide
- **`RESTART-EXPO.md`** - How to restart Expo
- **`RESTART-EXPO-NOW.md`** - Quick Expo restart guide
- **`START-EXPO.md`** - Starting Expo properly
- **`START-EXPO-NOW.md`** - Quick Expo start guide
- **`TEST-EXPO-NOW.md`** - Testing Expo setup
- **`DO-THIS-NOW.md`** - Immediate action items
- **`DO-THIS-NOW-COMMANDS.md`** - Command-line quick fixes
- **`FIX-NOW.txt`** - Quick fix reference
- **`FIX-APPLIED.md`** - Applied fixes log
- **`RUN-IN-YOUR-TERMINAL.md`** - Terminal commands reference
- **`RUN-THESE-COMMANDS.md`** - Essential commands
- **`NUCLEAR-FIX.md`** - Last resort fixes

#### 2.8 Other Documentation
- **`ORGANIZATION-SUMMARY.md`** - Previous organization summary
- **`DOCS-ORGANIZED.md`** - Documentation organization notes
- **`MVP_review_feedback`** - MVP review feedback

---

## 🗂️ Root Directory Files

The following files remain in the project root for easy access:

- **`README.md`** - Main project README
- **`firestore.rules`** - Firestore security rules
- **`storage.rules`** - Firebase Storage security rules
- **`START.sh`** - Quick start script

---

## 📋 Quick Access Guide

### Getting Started
1. Read [`/memory-bank/MessageAI.md`](../memory-bank/MessageAI.md) for project overview
2. Follow [`/docs/setup-guides/SETUP.md`](setup-guides/SETUP.md) for setup
3. Use [`/docs/reference-cards/QUICK-REFERENCE.md`](reference-cards/QUICK-REFERENCE.md) for daily tasks

### When Things Go Wrong
1. Check [`/docs/troubleshooting/`](troubleshooting/) for common issues
2. Browse [`/docs/error-fixes/`](error-fixes/) for specific errors
3. Run commands in [`/docs/troubleshooting/RUN-THESE-2-COMMANDS.md`](troubleshooting/RUN-THESE-2-COMMANDS.md)

### Understanding the Codebase
1. Review [`/memory-bank/code-architecture.md`](../memory-bank/code-architecture.md)
2. Check [`/memory-bank/implementation-guide.md`](../memory-bank/implementation-guide.md)
3. See PR summaries in [`/docs/pr-summaries/`](pr-summaries/)

### Deployment
1. Review [`/docs/deployment/PRODUCTION-CHECKLIST.md`](deployment/PRODUCTION-CHECKLIST.md)
2. Follow [`/docs/deployment/DEPLOY-FIRESTORE.md`](deployment/DEPLOY-FIRESTORE.md)

---

## 🔄 What Was Moved

All documentation and folders that were previously outside the project folder have been brought back and organized:

### From `/Applications/Gauntlet/chat_iq_memory/` → `/memory-bank/`
All memory bank files moved into the project

### From `/Applications/Gauntlet/chat_iq_docs/` → `/docs/`
All documentation files moved and organized by category

### From Project Root → `/docs/*`
Scattered .md files organized into appropriate subfolders

---

## 📝 Notes

- All documentation is now version-controlled within the project
- The Memory Bank follows the structure defined in `.cursor/rules/`
- Documentation is organized for easy navigation and discovery
- External directories (`chat_iq_memory`, `chat_iq_docs`) can be safely deleted

---

**Need help?** Start with the [Quick Reference](reference-cards/QUICK-REFERENCE.md) or [Setup Guide](setup-guides/SETUP.md).

