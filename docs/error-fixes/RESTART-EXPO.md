# 🔧 Fix: Restart Expo Server

## The Problem

Metro bundler is failing due to duplicate `package.json` files:
```
metro-file-map: Haste module naming collision: messageai
  * <rootDir>/package.json
  * <rootDir>/starter-code-backup/package.json
```

This prevents your app from building, so Expo Go shows "Start a local development server..."

## ✅ The Fix Applied

I've **deleted the `starter-code-backup/` directory** completely. We don't need it anymore since all the code is already copied into your main project.

---

## 🚀 What You Need to Do RIGHT NOW

### In Your Terminal (where Expo is running):

**1. Stop the current Expo server**:
```
Press Ctrl+C
```

**2. Wait for it to stop** (takes 2-3 seconds)

**3. Restart Expo with cache cleared**:
```bash
npx expo start -c
```

The `-c` flag clears the Metro bundler cache, ensuring it doesn't remember the old file structure.

---

## ✅ What You Should See After Restart

```
Starting Metro Bundler
Clearing Metro bundler cache...
Starting project at /Applications/Gauntlet/chat_iq
env: load .env

████ ████ ██ ████ ████
████ ████ ██ ████ ████    <-- QR CODE
████ ████ ██ ████ ████

› Metro waiting on exp://192.168.x.x:8081

› Press i │ open iOS simulator
› Press a │ open Android
```

**Key difference**: No error about "Haste module naming collision"

---

## 📱 Then: Scan QR Code Again

1. **Open Expo Go** on iPhone/iPad
2. **Scan the new QR code** from terminal
3. **App should build and launch**
4. **You'll see**: MessageAI loading screen → Sign In screen ✅

---

## 🎯 Quick Steps

```bash
# In your terminal:
Ctrl+C                    # Stop Expo
npx expo start -c         # Restart with clean cache
```

**Wait for QR code** → **Scan on iPhone** → **App launches!**

---

## ✅ What Changed

**Before**:
- `starter-code-backup/` existed with duplicate package.json
- Metro bundler found both package.json files
- Build failed with "Haste module naming collision"
- Expo Go showed "Start a local development server..."

**After**:
- `starter-code-backup/` deleted (we don't need it)
- Only one package.json exists (in project root)
- Metro bundler builds successfully
- App launches on device ✅

---

## 🎉 Expected Result

**After restart**, your app should:
1. ✅ Build successfully
2. ✅ Launch on iPhone/iPad
3. ✅ Show MessageAI Sign In screen
4. ✅ Authentication works (sign up/in)
5. ✅ Navigate to Chats screen
6. ✅ Profile shows user info
7. ✅ Can sign out

**If all works**: PR #1 Complete! 🚀

---

## 🚨 If Still Having Issues

**Clear everything and restart**:
```bash
# Stop Expo (Ctrl+C)
rm -rf node_modules
npm install
npx expo start -c
```

**Check for other duplicate files**:
```bash
find . -name "package.json" -not -path "./node_modules/*"
```

Should only show: `./package.json` (one file)

---

## 📝 Action Required

**In your terminal RIGHT NOW**:

1. Press `Ctrl+C` to stop Expo
2. Run: `npx expo start -c`
3. Wait for QR code (no errors this time!)
4. Scan QR code on iPhone
5. Test authentication

**This should work!** 🎯

