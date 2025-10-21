# 🔧 Fix: EMFILE - Too Many Open Files

## The Error

```
Error: EMFILE: too many open files, watch
```

**What this means**: Metro bundler is trying to watch too many files and hit macOS's system limit for file watchers.

**Why it happened**: Your project has many documentation files (.md) that Metro was watching unnecessarily.

---

## ✅ Fixes Applied

### 1. Created `metro.config.js`
I've created a Metro bundler configuration that tells it to **ignore**:
- All `.md` files (documentation)
- `memory-bank/` directory
- `documentation/` directory
- `starter-code-backup/` (if it existed)

This dramatically reduces the number of files Metro needs to watch.

### 2. Increased File Descriptor Limit (for Cursor's shell)
Set `ulimit -n 10240` to allow more file watchers.

---

## 🚀 What YOU Need to Do in YOUR Terminal

### Step 1: Stop Expo (if running)
```
Press Ctrl+C in your terminal
```

### Step 2: Increase File Limit in YOUR Terminal Session
```bash
ulimit -n 10240
```

This increases the maximum number of files your terminal can watch from the default (usually 256 or 1024) to 10,240.

### Step 3: Restart Expo
```bash
npx expo start -c
```

---

## ✅ Expected Result

After these steps, you should see:

```
Starting Metro Bundler
Clearing Metro bundler cache...

[No "too many open files" error]
[No "Haste module naming collision" error]

████ ████ ██ ████ ████
████ ████ ██ ████ ████    <-- QR CODE
████ ████ ██ ████ ████

› Metro waiting on exp://192.168.x.x:8081
```

**Clean start with no errors!** ✅

---

## 📱 Then: Scan and Test

1. **Scan QR code** on iPhone with Expo Go
2. **App launches** (loading screen)
3. **Sign In screen appears**
4. **Test authentication**

---

## 🎯 Complete Command Sequence

**Copy-paste these into your terminal**:

```bash
# Stop Expo (Ctrl+C first if running)

# Navigate to project
cd /Applications/Gauntlet/chat_iq

# Increase file limit
ulimit -n 10240

# Restart Expo with clean cache
npx expo start -c
```

**Wait for QR code** → **Scan on iPhone** → **Success!** 🎉

---

## ⚠️ Alternative Solution (If Above Doesn't Work)

If you still see "too many open files":

### Permanently Increase Limit (macOS)

```bash
# Create/edit limit config
sudo launchctl limit maxfiles 65536 200000

# Verify
ulimit -n
# Should show 10240 or higher
```

Then restart your terminal and run Expo again.

---

## 📊 What Changed

**Files Being Watched**:

**Before**:
- All .md files (~20+ documentation files)
- memory-bank/ directory (8 files)
- documentation/ directory
- starter-code-backup/ (if existed)
- Source code
- node_modules (filtered)
- **Total**: Too many files → EMFILE error

**After** (with metro.config.js):
- Source code only (app/, services/, components/, etc.)
- node_modules (filtered)
- **Ignoring**: All .md files, memory-bank/, documentation/
- **Total**: Manageable → No error ✅

---

## ✅ Summary

**Problem**: Metro watching too many files (documentation)
**Fix 1**: ✅ Created metro.config.js (ignores docs)
**Fix 2**: ⏭️ YOU run `ulimit -n 10240` in your terminal
**Then**: Restart Expo
**Result**: Should work! 🚀

---

## 🎯 DO THIS NOW

**In your terminal**:
```bash
Ctrl+C                    # Stop Expo
ulimit -n 10240          # Increase file limit
npx expo start -c        # Restart with clean cache
```

**Wait for QR code** (should appear with no errors)

**Scan and test!** 📱

