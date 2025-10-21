# MessageAI MVP - Quick Reference Card

## 🎯 Your Primary Guide

**📖 MAIN DOCUMENT**: `memory-bank/task-list-prs.md`

**Follow this PR by PR. It has everything: subtasks, files, tests, validation.**

---

## 🗺️ PR Dependency Flow

```
PR #1: Setup & Auth (4h) ✅ STARTER CODE PROVIDED
   ↓
PR #2: Core Messaging (6h) 🔥 CRITICAL
   ↓
   ├─→ PR #3: Offline Support (5h) 🔥 CRITICAL
   │       ↓
   ├─→ PR #4: Delivery States (3h) 🔥 CRITICAL
   │       ↓
   └─→ PR #5: Presence & Typing (3h) ⚠️ HIGH
           ↓
PR #6: Group Chat (6h) 🔥 CRITICAL (needs PR #2, #4)
   ↓
PR #7: Notifications (6h) ⚠️ HIGH (needs PR #2, #6)
   ↓
   ├─→ PR #8: Images (5h) ⚠️ MEDIUM (needs PR #2)
   │
   └─→ PR #9: Group Management (6h) ⚠️ MEDIUM (needs PR #6)
           ↓
PR #10: Validation (4h) ⚠️ HIGH (needs all above)
```

**Critical Path**: #1 → #2 → #3 → #4 → #6 = 24-30 hours

---

## ⏱️ 24-Hour Breakdown

| Hour | PR | Focus | Output |
|------|-----|-------|--------|
| 1-4 | #1 | Auth ✅ | Can sign up/in/out |
| 5-10 | #2 | Messaging | Two users can chat |
| 11-15 | #3 | Offline | Offline mode works |
| 16-17 | #4 | Status | Delivery states work |
| 18-21 | #6 | Groups | 3+ users can chat |
| 22-23 | #7 | Notifications | Push notifications work |
| 24 | #10 | Test | MVP validated |

**Skip if tight on time**: PR #5 (typing), #8 (images), #9 (group extras)

---

## 📋 User Stories by PR

| PR | User Stories | Priority | Hours |
|----|--------------|----------|-------|
| #1 | US-1, 2, 3, 4 | 🔥 Critical | 4 |
| #2 | US-5, 6, 7, 9 | 🔥 Critical | 6-8 |
| #3 | US-13, 14, 15, 16, 17 | 🔥 Critical | 5-6 |
| #4 | US-8, 10, 21 | 🔥 Critical | 3-4 |
| #5 | US-11, 12 | ⚠️ High | 3-4 |
| #6 | US-18, 19, 20, 22 | 🔥 Critical | 6-8 |
| #7 | US-23, 24, 25 | ⚠️ High | 6-8 |
| #8 | US-31, 32 | ⚠️ Medium | 5-6 |
| #9 | US-33, 34, 35, 36, 37 | ⚠️ Medium | 6-8 |
| #10 | US-26, 27, 28, 29, 30 | ⚠️ High | 4-5 |

**Total**: 37 user stories across 10 PRs

---

## 🧪 Testing Checklist

### Unit Tests (13 files) - Run: `npm test`
- [x] Auth service
- [x] SQLite operations
- [x] Message service
- [x] Message queue
- [x] Network monitor
- [x] Read receipts
- [x] Presence service
- [x] Group service
- [x] Notifications
- [x] Storage
- [x] Formatters
- [x] Typing hook
- [x] Admin operations

### E2E Tests (6 files) - Run: `detox test`
- [x] Auth flow (sign up, persist)
- [x] Messaging (real-time, persist)
- [x] Offline (queue, sync, crash)
- [x] Groups (create, attribution)
- [x] Reliability (network, rapid, lifecycle)
- [x] MVP Validation (all 7 scenarios)

---

## 🔥 The Golden Rules

**Rule #1**: SQLite Before Firebase
```typescript
await db.insertMessage(msg);  // ← Must complete first
await firebase.send(msg);      // ← Can fail, will retry
```

**Rule #2**: Client-Generated IDs
```typescript
const id = uuid.v4();  // ← Client decides
```

**Rule #3**: Cleanup Listeners
```typescript
useEffect(() => {
  const unsub = onSnapshot(...);
  return () => unsub();  // ← Always cleanup
}, []);
```

**Rule #4**: Test on Real Devices
- Use iPhone/iPad with Expo Go
- Test force quit, offline, background
- Notifications need physical device

**Rule #5**: Build Vertically
- Complete one-on-one fully
- Then groups
- Then extras

---

## 📱 Testing Commands

```bash
# Run app
npx expo start

# Unit tests
npm test
npm test -- --watch
npm test -- --coverage

# E2E tests
detox build --configuration ios
detox test --configuration ios

# Firebase Emulator
firebase emulators:start

# Clear cache
npx expo start -c
```

---

## 📍 File Locations

**Your main guide**: `memory-bank/task-list-prs.md`

**Documentation**:
- Requirements: `memory-bank/product-requirements.md`
- Implementation: `memory-bank/implementation-guide.md`
- Architecture: `memory-bank/code-architecture.md`

**Code**:
- Starter: `starter-code/` (18 files)
- Project: `app/`, `components/`, `services/`, `hooks/`

**Tests**:
- Unit: `services/**/__tests__/*.test.ts`
- E2E: `e2e/*.e2e.ts`

---

## ⚡ Emergency Scope Cuts

**If running out of time, cut in this order**:

1. **First to cut**: PR #9 (Group management extras)
2. **Second**: PR #8 (Images)
3. **Third**: PR #5 (Typing indicators)
4. **Last resort**: PR #7 (Background notifications, keep foreground)

**Never cut**:
- PR #1: Auth (foundation)
- PR #2: Core messaging (heart of app)
- PR #3: Offline (reliability)
- PR #4: Delivery states (required)
- PR #6: Basic groups (required)

---

## 🎯 Validation Checklist (Hour 24)

Run through these on two devices:

- [ ] Sign up on both devices (different accounts)
- [ ] Exchange 10+ messages in real-time
- [ ] Force quit, reopen (messages persist)
- [ ] Airplane mode on device 1, send 5 messages
- [ ] Reconnect device 1 (messages sync)
- [ ] Create group with 3 users
- [ ] Send messages in group
- [ ] Read receipts update
- [ ] Foreground notification fires
- [ ] Tap notification opens chat
- [ ] Send 20+ messages rapidly (no loss)

**If all pass**: ✅ MVP COMPLETE

---

## 📖 Documentation Roadmap

```
START-HERE.md (5 min)
    ↓
product-requirements.md (20 min)
    ↓
task-list-prs.md (15 min) ← YOUR PRIMARY GUIDE
    ↓
    ├─ implementation-guide.md (reference as needed)
    ├─ code-architecture.md (reference as needed)
    └─ SETUP.md (for setup phase)
```

**Time to read everything**: ~40 minutes
**Worth it?**: Absolutely (saves hours of confusion)

---

## 💡 Pro Tips

1. **Read task-list-prs.md first** - It's your roadmap
2. **Copy test code** - Tests are included per PR
3. **Use implementation-guide.md** - Has code for every user story
4. **Check architecture doc** - For patterns (MessageQueue, etc.)
5. **Test on two iPhones** - Borrow second device if needed
6. **Build in order** - PRs have dependencies
7. **Commit frequently** - After each subtask
8. **Run tests early** - Don't save for end

---

## 🚀 START HERE

1. **Read**: `START-HERE.md` (5 min)
2. **Setup**: Follow `SETUP.md` (70 min)
3. **Build**: Follow `task-list-prs.md` (22h)
4. **Test**: PR #10 validation (90 min)
5. **Ship**: Working MVP! 🎉

**First concrete action**: Create Firebase project

**Questions?**: Check the relevant document above

**Ready?**: Open `task-list-prs.md` and start PR #2!

---

## 📞 Document Index

All docs in `/Applications/Gauntlet/chat_iq/`:

```
📁 memory-bank/
   📄 MessageAI.md                          # Original brief
   📄 product-requirements.md               # PRD v1.1 ⭐
   📄 implementation-guide.md               # All 37 stories ⭐
   📄 code-architecture.md                  # Patterns ⭐
   📄 task-list-prs.md                      # PRIMARY GUIDE ⭐⭐⭐
   📄 user-stories-implementation-summary.md # Summary
   📄 DEVELOPMENT-ROADMAP.md                # Journey overview

📁 starter-code/                            # 18 files ⭐
   📁 app/, services/, types/, etc.
   📄 README-SETUP.md

📄 SETUP.md                                 # Setup guide ⭐
📄 START-HERE.md                            # Start here ⭐
📄 QUICK-REFERENCE.md                       # This file
📄 COMPLETE-PACKAGE-SUMMARY.md              # Package overview
```

⭐ = Important to read
⭐⭐⭐ = Your primary working document

---

**You have everything. Now go build!** 🚀

