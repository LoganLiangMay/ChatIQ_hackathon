# Deploy Firestore Rules - Quick Guide

## 🚀 Option 1: Firebase Console (No CLI needed)

1. Go to: https://console.firebase.google.com
2. Select your project
3. Click **Firestore Database** → **Rules** tab
4. Copy contents of `firestore.rules` file
5. Paste into editor
6. Click **Publish**
7. ✅ Done!

---

## 💻 Option 2: Firebase CLI (Faster for repeated deploys)

### First Time Setup:
```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login
firebase login

# Initialize (in your project directory)
cd /Applications/Gauntlet/chat_iq
firebase init firestore
# Select your project when prompted
# Accept default filenames
```

### Deploy Rules:
```bash
# From project directory
cd /Applications/Gauntlet/chat_iq

# Deploy
firebase deploy --only firestore:rules
```

---

## ✅ Verify Deployment

After deploying, verify rules are active:

1. **Via Console:**
   - Open Firebase Console → Firestore → Rules
   - Check that your rules are showing
   - Look for "Published" timestamp

2. **Via App:**
   - Try creating a chat
   - Try sending a message
   - Check console for any permission errors
   - If you see "Missing or insufficient permissions" → rules not deployed correctly

---

## 🔍 Test Rules

Test your rules in Firebase Console:

1. Go to Firestore → Rules
2. Click **"Rules Playground"** tab
3. Simulate requests to test permissions

Example test:
```
Location: /chats/test-chat-123
Operation: get
Authenticated: Yes
UID: your-test-uid
```

---

## 🐛 Troubleshooting

### "Permission denied" errors in app?
**Fix:** Deploy the rules file

### "firebase: command not found"?
**Fix:** Install Firebase CLI
```bash
npm install -g firebase-tools
```

### "No project active"?
**Fix:** Initialize Firebase
```bash
firebase init
```

### Rules not updating?
**Fix:** 
1. Check "Published" timestamp in console
2. Wait 30 seconds for propagation
3. Try redeploying

---

## 📋 Your Current Rules File

Your project has: `firestore.rules`

Key points:
- ✅ Users can only edit their own profile
- ✅ Only chat participants can read messages
- ✅ Only participants can send messages
- ✅ Sender must match auth.uid
- ✅ Everyone can read user profiles (for names/avatars)

---

## 🎯 Quick Deploy Checklist

- [ ] Rules file exists (`firestore.rules`)
- [ ] Logged into Firebase (`firebase login`)
- [ ] Project initialized (`firebase init`)
- [ ] Deploy command run (`firebase deploy --only firestore:rules`)
- [ ] Verify in Firebase Console
- [ ] Test in app (create chat, send message)

---

**Need help?** Check Firebase Console → Firestore → Rules for current active rules.




