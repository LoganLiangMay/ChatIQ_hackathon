# Firebase Configuration Guide

## What You Provided

You gave me the **Web Push certificate key pair**:
```
BO748GDEPinIIEHX84x0zu8_F_Iu1B6PFIa5hqV52LXUeG9NlJvHFlpTbRP39xXnFWM404B6tWUkItdyJLxWoQU
```

**This is for**: Firebase Cloud Messaging (push notifications) - we'll use this later in PR #7.

**What you still need**: The main Firebase web app configuration.

---

## How to Get Firebase Web App Configuration

### Step-by-Step in Firebase Console:

1. **Go to your Firebase project**:
   - https://console.firebase.google.com/
   - Select your "MessageAI-MVP" project (or whatever you named it)

2. **Open Project Settings**:
   - Click the **gear icon** (⚙️) next to "Project Overview" in top left
   - Click "Project settings"

3. **Scroll to "Your apps" section**:
   - You'll see sections for iOS, Android, Web apps
   - Look for the "Web apps" section

4. **Add Web App** (if you haven't already):
   - Click the **web icon** `</>` (it looks like opening HTML tag)
   - A modal will appear

5. **Register your app**:
   - App nickname: `MessageAI Web` (or any name)
   - **Don't check** "Also set up Firebase Hosting" (not needed)
   - Click "Register app"

6. **Copy the configuration**:
   - You'll see a code snippet like this:

```javascript
// Your Firebase configuration object will look like this:
const firebaseConfig = {
  apiKey: "AIzaSyD...",                    // ← You need this
  authDomain: "messageai-mvp-xxxxx.firebaseapp.com",  // ← And this
  projectId: "messageai-mvp-xxxxx",        // ← And this
  storageBucket: "messageai-mvp-xxxxx.appspot.com",   // ← And this
  messagingSenderId: "123456789012",       // ← And this
  appId: "1:123456789012:web:abcdef..."    // ← And this
};
```

7. **Copy these 6 values** - you'll paste them into .env

---

## Alternative Way to Find Config

If you already registered a web app:

1. Go to Project Settings → Your apps
2. Look under "SDK setup and configuration"
3. Select "Config" radio button (not "CDN")
4. Copy the firebaseConfig object

---

## What Each Value Means

- `apiKey`: Your Firebase API key (identifies your app)
- `authDomain`: Domain for Firebase Authentication
- `projectId`: Your Firebase project ID
- `storageBucket`: Where images will be stored
- `messagingSenderId`: For Cloud Messaging (same as sender ID)
- `appId`: Unique identifier for your web app

**All 6 are required for the app to work.**

---

## Once You Have the Config

Tell me the 6 values and I'll create the .env file for you, or you can create it yourself:

```bash
cd /Applications/Gauntlet/chat_iq

nano .env
```

Paste:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_apiKey_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_authDomain_here
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_projectId_here
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storageBucket_here
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messagingSenderId_here
EXPO_PUBLIC_FIREBASE_APP_ID=your_appId_here
```

Save: `Ctrl+X`, then `Y`, then `Enter`

---

## Visual Guide

```
Firebase Console
    ↓
Project Settings (gear icon)
    ↓
Your apps section
    ↓
Web apps (click </> icon if no web app exists)
    ↓
Register app → "MessageAI Web"
    ↓
Copy firebaseConfig object
    ↓
Paste into .env file
```

---

## What to Do Now

**Option 1**: Share the 6 configuration values with me and I'll create the .env file

**Option 2**: Follow the guide above to create .env yourself

**The Web Push key** you already provided will be used later when we implement notifications (PR #7).

