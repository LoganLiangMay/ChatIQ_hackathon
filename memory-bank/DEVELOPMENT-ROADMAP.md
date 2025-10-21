# MessageAI MVP - Complete Development Roadmap

## 🎯 What You Have Now

A complete development package for building MessageAI MVP in 24 hours:

### 📚 Documentation (8 Files)
1. ✅ **Product Requirements Document** - `product-requirements.md` (v1.1, updated)
2. ✅ **Implementation Guide** - `implementation-guide.md` (All 37 user stories detailed)
3. ✅ **Code Architecture** - `code-architecture.md` (Patterns and structure)
4. ✅ **User Stories Summary** - `user-stories-implementation-summary.md`
5. ✅ **Task List & PRs** - `task-list-prs.md` (10 PRs with testing)
6. ✅ **Setup Guide** - `../SETUP.md`
7. ✅ **Start Here** - `../START-HERE.md`
8. ✅ **This Roadmap** - `DEVELOPMENT-ROADMAP.md`

### 💻 Starter Code (18 Files)
Complete code for **PR #1: Setup & Authentication** in `starter-code/`

### 🧪 Testing Strategy
- **13 Unit Test Suites** (Jest)
- **6 E2E Test Suites** (Detox)
- **Firebase Emulator** setup
- **Multi-device** testing guide

---

## 🗺️ The Complete Journey

### Step 1: Review & Understand (30 minutes)
Read these in order:
1. `START-HERE.md` - Quick overview
2. `product-requirements.md` - Full PRD with all requirements
3. `task-list-prs.md` - Your development roadmap (this is your guide)

### Step 2: Setup Firebase & Expo (70 minutes)
Follow `SETUP.md`:
1. Create Firebase project (15 min)
2. Initialize Expo project (10 min)
3. Install dependencies (10 min)
4. Copy starter code (5 min)
5. Configure .env (5 min)
6. Test authentication (25 min)

**Deliverable**: Working auth flow on iPhone

### Step 3: Build MVP Features (22 hours)
Follow `task-list-prs.md` PR by PR:

**Critical Path** (18 hours):
- PR #2: Core Messaging (6h)
- PR #3: Offline Support (5h)
- PR #4: Delivery States (3h)
- PR #6: Group Chat (6h)

**High Priority** (4 hours):
- PR #5: Status & Typing (3h)  
- PR #7: Notifications (6h) - Parallel with groups

**Time Permitting**:
- PR #8: Images (5h)
- PR #9: Group Management (6h)

### Step 4: Test & Validate (2 hours)
Run PR #10:
- All 7 MVP test scenarios
- Unit test suite
- E2E test suite
- Final validation

**Deliverable**: Working MVP ready for demo

---

## 📊 10 PRs at a Glance

### 🔥 Critical Path PRs (Must Complete - 24-30h)

**PR #1**: Setup & Authentication (4h) ✅ **STARTER CODE PROVIDED**
- US-1, US-2, US-3, US-4
- Files: 18 starter files
- Tests: 2 Jest suites + 1 Detox suite

**PR #2**: Core One-on-One Messaging (6-8h) 🔥
- US-5, US-6, US-7, US-9
- Files: 12 new files (MessageService, MessageBubble, ChatScreen, etc.)
- Tests: 2 Jest suites + 1 Detox suite
- **Critical**: This is the heart of the app

**PR #3**: Offline Support & Queue (5-6h) 🔥
- US-13, US-14, US-15, US-16, US-17
- Files: 4 new (MessageQueue, NetworkMonitor)
- Tests: 2 Jest suites + 1 Detox suite (offline scenarios)
- **Critical**: Satisfies reliability requirement

**PR #4**: Delivery States & Read Receipts (3-4h) 🔥
- US-8, US-10, US-21
- Files: 2 new (MessageStatus component)
- Tests: 1 Jest suite (read receipts)
- **Critical**: Required MVP feature

**PR #6**: Basic Group Chat (6-8h) 🔥
- US-18, US-19, US-20, US-22
- Files: 7 new (Group creation, GroupService)
- Tests: 1 Jest suite + 1 Detox suite
- **Critical**: Required MVP feature

### ⚠️ High Priority PRs (Should Complete - 12-16h)

**PR #5**: Presence & Typing (3-4h)
- US-11, US-12
- Files: 6 new (PresenceService, indicators)
- Tests: 2 Jest suites

**PR #7**: Push Notifications (6-8h)
- US-23, US-24, US-25
- Files: 5 new + Cloud Function
- Tests: 2 Jest suites (including Cloud Function tests)
- **Note**: Foreground minimum, physical device required

**PR #10**: Reliability Testing (4-5h)
- US-26, US-27, US-28, US-29, US-30
- Files: 3 new (ErrorBoundary, test helpers)
- Tests: 2 Detox suites (reliability + MVP validation)
- **Critical**: Final validation

### 💎 Nice-to-Have PRs (Stretch Goals - 11-16h)

**PR #8**: Image Support (5-6h)
- US-31, US-32
- Files: 4 new (ImagePicker, ImageMessage)
- Tests: 1 Jest suite

**PR #9**: Advanced Group Management (6-8h)
- US-33, US-34, US-35, US-36, US-37
- Files: 4 new (Member management, admin controls)
- Tests: 1 Jest suite

---

## 🧪 Testing Matrix

### Unit Tests (13 suites, ~60 test cases)

| PR | Test File | Purpose | Critical? |
|----|-----------|---------|-----------|
| #1 | `auth.test.ts` | Sign up/in/out logic | ✅ Yes |
| #1 | `sqlite.test.ts` | Database operations | ✅ Yes |
| #2 | `MessageService.test.ts` | Message sending | ✅ Yes |
| #2 | `formatters.test.ts` | Timestamp display | No |
| #3 | `MessageQueue.test.ts` | Offline queue | ✅ Yes |
| #3 | `NetworkMonitor.test.ts` | Network detection | ✅ Yes |
| #4 | `ReadReceipts.test.ts` | Read status | ✅ Yes |
| #5 | `PresenceService.test.ts` | Online status | No |
| #5 | `useTypingIndicator.test.ts` | Typing debounce | No |
| #6 | `GroupService.test.ts` | Group creation | ✅ Yes |
| #7 | `NotificationService.test.ts` | FCM token | No |
| #7 | `notifications.test.ts` (Cloud) | Notification sending | ✅ Yes |
| #8 | `storage.test.ts` | Image upload | No |
| #9 | `AdminOperations.test.ts` | Admin permissions | No |

### E2E Tests (6 suites, ~20 test cases)

| PR | Test File | Purpose | Critical? |
|----|-----------|---------|-----------|
| #1 | `auth.e2e.ts` | Auth flow, persistence | ✅ Yes |
| #2 | `messaging.e2e.ts` | Real-time messaging | ✅ Yes |
| #3 | `offline.e2e.ts` | Offline scenarios | ✅ Yes |
| #6 | `groupChat.e2e.ts` | Group functionality | ✅ Yes |
| #10 | `reliability.e2e.ts` | All reliability tests | ✅ Yes |
| #10 | `mvp-validation.e2e.ts` | 7 MVP scenarios | ✅ Yes |

**Testing Coverage**: 
- ✅ All critical services have unit tests
- ✅ All critical user flows have E2E tests
- ✅ 7 MVP scenarios covered
- ✅ Firebase Emulator for local testing
- ✅ Physical device testing required

---

## 🚀 Quick Start Guide

### 1. Initial Setup (1 hour)
```bash
# From /Applications/Gauntlet directory
cd chat_iq

# If project doesn't exist, initialize
npx create-expo-app@latest chat_iq --template expo-template-blank-typescript
cd chat_iq

# Install dependencies
npm install

# Copy all starter code
cp -r starter-code/* .

# Create .env from template
cp .env.example .env
# Fill in Firebase config

# Update app.json (see SETUP.md)

# Start development
npx expo start
```

### 2. Test Authentication (30 min)
- Launch on iPhone via Expo Go
- Test sign up
- Test sign in
- Test sign out
- Test force quit persistence
- Verify in Firebase Console

### 3. Begin PR #2 (6-8 hours)
Follow task list in `task-list-prs.md`:
- Build chat list screen
- Build chat screen
- Implement MessageService
- Add Firebase listeners
- Test on two devices

### 4. Continue Through PRs
- Check off subtasks as completed
- Write tests as you go
- Validate before moving to next PR
- Commit frequently

---

## 📁 Complete File Structure

```
chat_iq/
├── memory-bank/                                 # All documentation
│   ├── MessageAI.md                            # Original project brief
│   ├── product-requirements.md                 # Full PRD (v1.1)
│   ├── implementation-guide.md                 # All 37 user stories detailed
│   ├── code-architecture.md                    # Patterns and structure
│   ├── user-stories-implementation-summary.md  # Summary with effort
│   ├── task-list-prs.md                        # 10 PRs with testing (YOUR GUIDE)
│   └── DEVELOPMENT-ROADMAP.md                  # This file
├── starter-code/                                # PR #1 complete code
│   ├── app/                                    # Expo Router screens
│   ├── contexts/                               # React contexts
│   ├── services/                               # Business logic
│   ├── types/                                  # TypeScript types
│   ├── utils/                                  # Utilities
│   ├── package.json                            # Dependencies
│   ├── tsconfig.json                           # TypeScript config
│   └── README-SETUP.md                         # Setup instructions
├── SETUP.md                                     # Firebase setup guide
├── START-HERE.md                                # Quick start overview
└── .cursor/rules/                               # Cursor AI rules
    ├── expo-mobile-typescript.mdc
    ├── firebase-mobile-sync.mdc
    └── testing-mobile-mvp.mdc

Future (as you build):
├── app/                                         # Expo Router app
│   ├── (auth)/                                 # Auth screens ✅
│   ├── (tabs)/                                 # Main app tabs
│   │   └── chats/[chatId].tsx                  # Chat screen (PR #2)
│   └── groups/                                  # Group screens (PR #6, #9)
├── components/                                  # React components
│   ├── messages/                               # Message components (PR #2-4, #8)
│   ├── chat/                                    # Chat UI (PR #2, #5)
│   ├── groups/                                  # Group UI (PR #6, #9)
│   ├── notifications/                           # Notification handling (PR #7)
│   └── ui/                                      # Reusable UI
├── services/                                    # Business logic
│   ├── messages/                               # Message queue, sync (PR #2, #3)
│   ├── groups/                                  # Group operations (PR #6, #9)
│   ├── notifications/                           # Push notifications (PR #7)
│   ├── presence/                                # Online status (PR #5)
│   ├── network/                                 # Network monitoring (PR #3)
│   ├── firebase/                                # Firebase services ✅
│   └── database/                                # SQLite service ✅
├── hooks/                                       # Custom hooks (PR #2-5, #7, #8)
├── firebase/functions/                          # Cloud Functions (PR #7)
├── __tests__/                                   # Unit tests (Jest)
│   └── services/                                # Service tests
├── e2e/                                         # E2E tests (Detox)
│   ├── auth.e2e.ts                             # Auth tests
│   ├── messaging.e2e.ts                         # Messaging tests
│   ├── offline.e2e.ts                           # Offline tests
│   ├── groupChat.e2e.ts                         # Group tests
│   ├── reliability.e2e.ts                       # Reliability tests
│   └── mvp-validation.e2e.ts                    # Final validation
├── jest.config.js                               # Jest configuration
├── .detoxrc.json                                # Detox configuration
└── .env                                         # Environment variables (gitignored)
```

**Total Files**: ~88 files when complete

---

## 🎓 Key Learnings Per PR

### PR #1: Firebase + SQLite Foundation
- Firebase initialization and configuration
- SQLite schema design with proper indexes
- Auth state management with React Context
- Expo Router navigation patterns

### PR #2: Real-Time Architecture
- Optimistic UI updates (show before confirm)
- Firebase listeners with cleanup
- SQLite as single source of truth
- Message ordering with timestamps

### PR #3: Offline-First Patterns
- Write to SQLite before network operations
- Message queue with retry logic
- Network state monitoring
- Exponential backoff for failed syncs

### PR #4: Delivery Tracking
- Array fields for read/delivered tracking
- Batch Firestore updates
- Real-time status updates
- Group vs direct message handling

### PR #5: Presence Systems
- AppState monitoring for online/offline
- Debounced Firestore updates (typing)
- Real-time listeners for other users
- Efficient data structures

### PR #6: Group Chat Complexity
- Subcollections for messages
- Array fields for participants/admins
- Group message attribution
- Real-time for multiple participants

### PR #7: Push Notifications
- Expo Notifications API
- Firebase Cloud Functions
- FCM token management
- Multi-platform notification handling

### PR #8: Media Handling
- Firebase Storage for images
- Expo ImagePicker API
- Upload with progress
- Display with loading states

### PR #9: Permission Systems
- Admin-only operations
- Firestore security rules
- Edge case handling (last admin)
- System messages for events

### PR #10: Production Readiness
- Comprehensive error handling
- All reliability scenarios tested
- MVP validation complete
- Ready for demo

---

## 🧪 Testing Commands

### Run Unit Tests
```bash
# All unit tests
npm test

# Specific test file
npm test -- auth.test.ts

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Run E2E Tests (Detox)
```bash
# Build for testing
detox build --configuration ios

# Run all E2E tests
detox test --configuration ios

# Run specific suite
detox test --configuration ios e2e/offline.e2e.ts

# Run with logs
detox test --configuration ios --loglevel verbose
```

### Firebase Emulator
```bash
# Install emulators
firebase init emulators

# Start emulators (in separate terminal)
firebase emulators:start

# Your tests will connect to localhost:8080 (Firestore), localhost:9099 (Auth)
```

---

## 🎯 Critical Path to MVP

The absolute minimum to pass MVP (if 24 hours is tight):

### Must Have (18 hours)
1. **PR #1**: Auth (4h) ✅ DONE
2. **PR #2**: Core messaging (6h)
3. **PR #3**: Offline support (4h)
4. **PR #4**: Delivery states (2h)
5. **PR #6**: Basic groups (4h)

**Result**: Can chat 1-on-1 and in groups, works offline, messages persist

### Should Have (4 hours)
6. **PR #5**: Online status + read receipts (2h)
7. **PR #7**: Foreground notifications (2h)

**Result**: Full MVP as specified

### Nice to Have (2 hours)
8. Testing & validation (2h)

**Result**: Tested and validated MVP

### Cut if Needed
- Typing indicators
- Images  
- Group management extras
- Background notifications

---

## 📝 Development Best Practices

### Git Workflow
```bash
# For each PR
git checkout -b feature/pr-name
# ... build features ...
git add .
git commit -m "feat: PR #X - Feature name"
git push origin feature/pr-name
# Create PR on GitHub
# Merge after validation
git checkout main
git merge feature/pr-name
```

### Testing Workflow
```bash
# Test as you build (TDD)
npm test -- --watch

# Run E2E before merging PR
detox test --configuration ios

# Full validation before final merge
npm test && detox test
```

### Code Quality
- Use TypeScript strictly (no `any`)
- Test critical services (Firebase, SQLite, MessageQueue)
- Clean up listeners (avoid memory leaks)
- Handle errors gracefully
- Log for debugging (`console.log` → Sentry later)

---

## 🚨 Critical Reminders

### The Golden Rules

1. **SQLite Before Firebase**
   ```typescript
   // ✅ CORRECT
   await db.insertMessage(message);  // Persist first
   await firebase.send(message);      // Sync second
   
   // ❌ WRONG
   await firebase.send(message);      // If this fails, message lost
   await db.insertMessage(message);
   ```

2. **Client-Generated IDs**
   ```typescript
   // ✅ CORRECT
   const id = uuid.v4();  // Client decides ID
   
   // ❌ WRONG
   const id = await firebase.add(message);  // Server decides (async issues)
   ```

3. **Listener Cleanup**
   ```typescript
   // ✅ CORRECT
   useEffect(() => {
     const unsubscribe = onSnapshot(...);
     return () => unsubscribe();  // Clean up
   }, [deps]);
   
   // ❌ WRONG
   useEffect(() => {
     onSnapshot(...);  // Memory leak
   }, [deps]);
   ```

4. **Test on Real Devices**
   - Use iPhone/iPad with Expo Go
   - Notifications don't work on simulators
   - Real network conditions differ

5. **Build Vertically**
   - Complete one-on-one before groups
   - Test each feature before moving on
   - Don't have 10 half-working features

---

## 📊 Progress Tracking

Use this checklist to track your progress:

### Setup Phase
- [ ] Firebase project created
- [ ] Expo project initialized
- [ ] Dependencies installed
- [ ] Starter code copied
- [ ] .env configured
- [ ] App runs on iPhone
- [ ] Authentication works
- [ ] Tests run successfully

### PR Completion
- [ ] PR #1: Setup & Auth ✅ (Starter code provided)
- [ ] PR #2: Core Messaging
- [ ] PR #3: Offline Support
- [ ] PR #4: Delivery States
- [ ] PR #5: Presence & Typing
- [ ] PR #6: Group Chat
- [ ] PR #7: Push Notifications
- [ ] PR #8: Images (if time)
- [ ] PR #9: Group Management (if time)
- [ ] PR #10: Reliability Testing

### MVP Validation
- [ ] Two devices exchange messages in real-time (< 2s)
- [ ] Messages persist after force quit
- [ ] Offline send → reconnect works
- [ ] Group chat with 3+ users works
- [ ] Read receipts update
- [ ] Foreground notifications work
- [ ] All 7 test scenarios pass
- [ ] Ready for demo

---

## 🎬 Final Deliverables

After completing MVP:

1. **GitHub Repository**
   - All PRs merged to main
   - README with setup instructions
   - .env.example for configuration

2. **Working App**
   - Deployed via Expo Go
   - Tested on iPhone/iPad
   - All core features functional

3. **Test Results**
   - Unit test suite passes
   - E2E test suite passes
   - Manual validation complete

4. **Documentation**
   - This development package
   - Code comments
   - Setup instructions

---

## 🎯 Success Definition

**Your MVP is successful when**:

✅ A reviewer can:
1. Clone your repo
2. Follow setup instructions
3. Run on two devices
4. Exchange messages in real-time
5. Test offline → online reconnect
6. Create and use a group chat
7. Receive push notifications
8. Force quit without message loss

**Without any help or debugging needed.**

That's the standard. Build to that standard.

---

## 📖 How to Use This Roadmap

1. **Start** with `START-HERE.md` for overview
2. **Reference** `product-requirements.md` for what to build
3. **Follow** `task-list-prs.md` for how to build it
4. **Check** `implementation-guide.md` for detailed code examples
5. **Use** `code-architecture.md` for patterns and structure
6. **Track** progress with this roadmap

**Primary Guide**: `task-list-prs.md` - This is your step-by-step playbook.

---

## 💪 You're Ready!

You have:
- ✅ Complete product requirements
- ✅ 37 user stories fully detailed
- ✅ 10 PRs with subtasks
- ✅ Comprehensive testing strategy
- ✅ Working starter code (4 hours done)
- ✅ All architecture patterns
- ✅ All pitfalls documented
- ✅ Clear success criteria

**Next**: Follow `task-list-prs.md` and build your MVP!

Good luck! 🚀

