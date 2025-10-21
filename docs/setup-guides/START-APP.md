# 🚀 START YOUR APP - Simple Instructions

## ✅ What I Fixed

- ✅ Created `metro.config.js` (ignores documentation files)
- ✅ Created `.watchmanconfig` (tells Watchman what to ignore)
- ✅ Removed duplicate package.json files

**These files prevent the EMFILE error by reducing what Metro watches.**

---

## 📋 YOUR CHECKLIST (Do in Order)

### 1. Open Terminal.app (or iTerm)
   - ⌘+Space → type "Terminal" → Enter
   - Or use VSCode integrated terminal (Ctrl+`)

### 2. Run These Commands
```bash
ulimit -n 10240
cd /Applications/Gauntlet/chat_iq
npx expo start --clear
```

### 3. Wait Patiently
- First compile takes **60-90 seconds**
- Don't worry if it says "rebuilding cache"
- **Wait for the QR code to appear**

### 4. Scan QR Code
- Open **Expo Go** on iPhone/iPad
- Scan the QR code from terminal
- Wait for app to download (~20-30 seconds)

### 5. You'll See
**Loading screen** → **Sign In screen** ✅

### 6. Test Sign Up
```
Display Name: Test User
Email: test@example.com
Password: password123
Confirm: password123
[Sign Up]
```

Should go to **Chats screen** ✅

---

## ✅ Validation

**PR #1 Complete When**:
- [ ] Expo server runs without crashing
- [ ] QR code scans successfully
- [ ] App launches on iPhone
- [ ] Sign up works
- [ ] User in Firebase Console
- [ ] User document in Firestore
- [ ] Sign out works
- [ ] Sign in works
- [ ] Force quit → reopen → still signed in

---

## 🚨 If Expo STILL Crashes

**Last resort** - Move docs temporarily:

```bash
Ctrl+C
mkdir ~/Desktop/temp-docs
mv memory-bank ~/Desktop/temp-docs/
mv *.md ~/Desktop/temp-docs/ 2>/dev/null || true
npx expo start --clear
```

**This WILL work** (nothing to watch except code).

Move docs back after app runs:
```bash
mv ~/Desktop/temp-docs/* /Applications/Gauntlet/chat_iq/
```

---

## 🎯 Bottom Line

**Run these 3 commands**:
```bash
ulimit -n 10240
cd /Applications/Gauntlet/chat_iq
npx expo start --clear
```

**Be patient** (first compile takes time)

**Scan QR code** when it appears

**Test authentication**

**You're 3 commands away from a working app!** 🚀

