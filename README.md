# MessageAI MVP

A production-quality WhatsApp-like messaging app built with React Native, Expo, and Firebase.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Expo Go app on iPhone/iPad
- Firebase project set up
- `.env` file configured with Firebase credentials

### Run the App

**Option 1: Use the script** (Recommended)
```bash
./START.sh
```

**Option 2: Manual commands**
```bash
ulimit -n 10240
npx expo start --clear
```

**Then**: Scan QR code with Expo Go on your iPhone/iPad.

**First Launch**: Takes 60-90 seconds to compile TypeScript.

---

## 📁 Project Structure

```
chat_iq/
├── app/                      # Expo Router screens
│   ├── (auth)/              # Authentication screens
│   ├── (tabs)/              # Main app tabs (chats, profile)
│   └── groups/              # Group management screens
├── components/              # Reusable React components
├── contexts/                # React Context (Auth, etc.)
├── hooks/                   # Custom React hooks
├── services/                # Business logic
│   ├── database/           # SQLite service
│   ├── firebase/           # Firebase operations
│   ├── messages/           # Message queue & sync
│   └── network/            # Network monitoring
├── types/                   # TypeScript type definitions
├── utils/                   # Utility functions
├── documentation/           # Project documentation
│   ├── setup-guides/       # Setup and configuration guides
│   ├── error-fixes/        # Troubleshooting guides
│   └── reference-cards/    # Quick reference docs
├── memory-bank/             # Full project documentation
│   ├── product-requirements.md
│   ├── task-list-prs.md    # Your primary development guide
│   ├── implementation-guide.md
│   ├── code-architecture.md
│   └── ...
└── firebase/                # Cloud Functions (PR #7)
```

---

## 📖 Documentation

### 🎯 Primary Development Guide
**`memory-bank/task-list-prs.md`** - Follow this PR by PR

### 📚 Reference Documentation
- **Full PRD**: `memory-bank/product-requirements.md`
- **Implementation Details**: `memory-bank/implementation-guide.md`
- **Code Architecture**: `memory-bank/code-architecture.md`
- **Quick Reference**: `documentation/reference-cards/QUICK-REFERENCE.md`
- **Setup Guide**: `documentation/setup-guides/SETUP.md`

### 🔧 Troubleshooting
- **Error Fixes**: `documentation/error-fixes/`
- **Setup Issues**: `documentation/setup-guides/`

---

## 🧪 Testing

### Run Unit Tests
```bash
npm test
```

### Run E2E Tests
```bash
detox test --configuration ios
```

### Firebase Emulator
```bash
firebase emulators:start
```

---

## 📊 MVP Progress

Track progress through 10 PRs covering 37 user stories:
- [x] PR #1: Setup & Authentication (US-1 to US-4)
- [ ] PR #2: Core Messaging (US-5, 6, 7, 9)
- [ ] PR #3: Offline Support (US-13-17)
- [ ] PR #4: Delivery States (US-8, 10, 21)
- [ ] PR #5: Presence & Typing (US-11, 12)
- [ ] PR #6: Group Chat (US-18-20, 22)
- [ ] PR #7: Push Notifications (US-23-25)
- [ ] PR #8: Images (US-31, 32)
- [ ] PR #9: Group Management (US-33-37)
- [ ] PR #10: Validation (US-26-30)

See `memory-bank/task-list-prs.md` for detailed task breakdown.

---

## 🔑 Environment Configuration

Copy `.env.example` to `.env` and fill in your Firebase configuration:

```bash
cp .env.example .env
# Edit .env with your Firebase config
```

Required variables:
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

---

## 🛠️ Common Commands

```bash
# Start development server
npx expo start

# Clear cache and restart
npx expo start -c

# Open iOS simulator
npx expo start --ios

# Run tests
npm test

# Install dependencies
npm install

# Fix Expo dependencies
npx expo install --fix
```

---

## 🎯 MVP Features

- ✅ Real-time messaging (one-on-one and groups)
- ✅ Offline support with message queue
- ✅ Message persistence (survives force quit)
- ✅ Delivery states and read receipts
- ✅ Online/offline indicators
- ✅ Push notifications (foreground)
- ✅ User authentication
- ✅ Group chat with admin controls
- ✅ Image sharing

---

## 📝 Tech Stack

- **Frontend**: React Native + Expo Router
- **Database**: Expo SQLite (offline-first)
- **Backend**: Firebase (Firestore, Auth, Storage, Functions)
- **Notifications**: Expo Notifications + FCM
- **Language**: TypeScript

---

## 🔗 Links

- **Firebase Console**: https://console.firebase.google.com/
- **Expo Dashboard**: https://expo.dev/
- **Documentation**: `memory-bank/` and `documentation/`

---

## 📄 License

Gauntlet AI Project - MessageAI MVP

---

## 🎓 Project Context

This is a 24-hour MVP sprint to build a production-quality messaging app with:
- WhatsApp-like core features
- Offline-first architecture
- Real-time sync via Firebase
- Foundation for future AI features

**Primary Guide**: `memory-bank/task-list-prs.md`

