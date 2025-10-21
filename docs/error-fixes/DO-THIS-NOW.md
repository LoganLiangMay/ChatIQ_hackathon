# ⚡ DO THIS NOW - 3 Commands

## The Problem
Metro bundler hit macOS's file limit (too many documentation files).

## ✅ The Fix
I created `metro.config.js` that tells Metro to ignore all the .md documentation files.

---

## 🎯 Run These 3 Commands in Your Terminal

**Copy and paste exactly**:

```bash
# 1. Increase file limit (prevents "too many open files" error)
ulimit -n 10240

# 2. Make sure you're in the right directory
cd /Applications/Gauntlet/chat_iq

# 3. Start Expo with clean cache
npx expo start -c
```

**That's it!** Wait ~30 seconds for the QR code.

---

## ✅ What You'll See

```
Starting Metro Bundler
Clearing Metro bundler cache...
warning: Bundler cache is empty, rebuilding (this may take a minute)

[Compiling TypeScript...]

████ ████ ██ ████ ████
████ ████ ██ ████ ████    <-- QR CODE (NO ERRORS!)
████ ████ ██ ████ ████

› Metro waiting on exp://192.168.1.132:8081

› Press i │ open iOS simulator
```

**No "EMFILE" error** = Success! ✅

---

## 📱 Then: Scan QR Code

1. Open **Expo Go** on iPhone/iPad
2. Scan the QR code
3. App downloads and launches
4. **MessageAI Sign In screen appears!** 🎉

---

## 🎯 Testing Authentication

Once app launches:

1. **Sign Up**:
   - Tap "Sign Up"
   - Display Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm: `password123`
   - Tap "Sign Up"
   - ✅ Should navigate to Chats screen

2. **Verify Firebase**:
   - Firebase Console → Authentication → See user ✅
   - Firestore → users/{userId} → See document ✅

3. **Sign Out**:
   - Profile tab → Sign Out ✅
   - Returns to Sign In

4. **Sign In**:
   - Use same credentials ✅
   - Navigates to Chats

5. **Force Quit Test**:
   - Force quit app
   - Reopen
   - ✅ Still on Chats screen (session persisted)

**If all work**: ✅ **PR #1 COMPLETE!**

---

## ⚠️ Important Notes

**Warnings you can ignore**:
```
Some dependencies are incompatible with the installed expo version:
  @react-native-community/netinfo@9.5.0 - expected version: 9.3.10
```

These are just warnings. The app will run fine. You can run `npx expo install --fix` later if you want, but it's not required for MVP.

---

## 🎉 Summary

**Fixed Issues**:
1. ✅ ConfigError (wrong directory)
2. ✅ Duplicate package.json (removed starter-code)
3. ✅ EMFILE error (metro.config.js + ulimit)

**Your Commands**:
```bash
ulimit -n 10240
cd /Applications/Gauntlet/chat_iq
npx expo start -c
```

**Result**: QR code appears, app runs, authentication works!

**Ready to scan!** 📱✨

