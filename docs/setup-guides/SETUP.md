# MessageAI MVP - Setup Instructions

## Phase 1: Setup & Authentication (Hours 1-4)

### Step 1: Create Expo Project

```bash
# Navigate to parent directory
cd /Applications/Gauntlet

# Create new Expo app with TypeScript
npx create-expo-app@latest chat_iq --template expo-template-blank-typescript

cd chat_iq

# Install Expo Router and required dependencies
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar

# Install other dependencies
npx expo install expo-sqlite expo-notifications expo-image-picker
npm install firebase@10.3.0 uuid @types/uuid @react-native-community/netinfo

# Update app.json for Expo Router
# See app.json configuration below
```

### Step 2: Configure app.json

```json
{
  "expo": {
    "name": "MessageAI",
    "slug": "messageai",
    "version": "1.0.0",
    "scheme": "messageai",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.gauntlet.messageai"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.gauntlet.messageai"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ],
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### Step 3: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Create new project: "MessageAI-MVP"
3. Enable services:
   - Authentication (Email/Password provider)
   - Firestore Database (Start in test mode for now)
   - Storage (Start in test mode)
   - Cloud Messaging
4. Add Web App to get configuration
5. Copy config to `.env` file

### Step 4: Create Environment File

Create `.env` in project root:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Add to `.gitignore`:
```
.env
```

### Step 5: Run Development Server

```bash
# Start Expo development server
npx expo start

# Scan QR code with Expo Go app on iPhone/iPad
# Or press 'i' for iOS simulator
```

### Step 6: Test Firebase Connection

Once basic files are created, test Firebase:
1. Run app on device
2. Try signing up (should create user in Firebase Console)
3. Check Firestore for user document
4. Verify authentication works

---

## Folder Structure After Setup

```
chat_iq/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── chats.tsx
│   │   └── profile.tsx
│   └── _layout.tsx
├── components/
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       └── LoadingSpinner.tsx
├── contexts/
│   └── AuthContext.tsx
├── services/
│   ├── database/
│   │   └── sqlite.ts
│   └── firebase/
│       ├── config.ts
│       └── auth.ts
├── types/
│   ├── user.ts
│   ├── chat.ts
│   └── message.ts
├── utils/
│   └── validation.ts
├── .env
├── .gitignore
├── app.json
├── package.json
└── tsconfig.json
```

---

## Firebase Console Setup

### Firestore Database
1. Go to Firestore Database
2. Create database (Start in test mode)
3. Location: us-central1 (or nearest)
4. Create indexes:
   - Collection: `chats/{chatId}/messages`
   - Fields: `timestamp` (Descending), `__name__` (Descending)

### Authentication
1. Go to Authentication
2. Enable Email/Password sign-in method
3. No additional configuration needed for MVP

### Storage
1. Go to Storage
2. Get Started (default rules for now)
3. Note: Will store chat images and profile pictures

### Cloud Messaging
1. Go to Cloud Messaging
2. Note the Sender ID (already in config)
3. No additional setup for Expo (handled by Expo Push Service)

---

## Testing Setup

### Physical Device Setup (iPhone/iPad)
1. Install "Expo Go" from App Store
2. Sign in with same Expo account
3. Ensure on same WiFi network as development machine
4. Scan QR code from `npx expo start`

### Testing Two Devices
- Use iPhone + iPad
- Or iPhone + iOS Simulator
- Both logged into different accounts
- Test real-time messaging between devices

---

## Common Setup Issues

### Issue: "Module not found: firebase"
**Solution**: Make sure firebase is installed: `npm install firebase@10.3.0`

### Issue: "Expo Router not working"
**Solution**: Ensure app.json has expo-router plugin and scheme configured

### Issue: "SQLite errors on iOS"
**Solution**: expo-sqlite works differently on iOS - test on physical device

### Issue: ".env variables not loading"
**Solution**: Use EXPO_PUBLIC_ prefix for all variables in Expo

### Issue: "Firebase initialization fails"
**Solution**: Check .env file is in root and variables are correct

---

## Next Steps

After setup is complete:
1. Verify app runs on device via Expo Go
2. Test sign up/sign in flow
3. Check Firebase Console for created users
4. Proceed to Hours 5-12: One-on-One Messaging implementation

---

## Troubleshooting

### Clear Expo Cache
```bash
npx expo start -c
```

### Reinstall Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### Check Expo Doctor
```bash
npx expo-doctor
```

### View Logs
```bash
# In separate terminal
npx expo start
# Then press 'j' to open debugger
```

