# ⚡ RUN THESE EXACT COMMANDS

## Copy-Paste into Your Terminal

```bash
# Stop Expo if running (Ctrl+C first)

# Increase file limit permanently
echo "ulimit -n 10240" >> ~/.zshrc

# Apply to current session
ulimit -n 10240

# Verify it worked
ulimit -n
# Should show: 10240

# Go to project directory
cd /Applications/Gauntlet/chat_iq

# Start Expo with completely clean cache
npx expo start --clear
```

---

## ⏱️ What Happens

**First 60 seconds**:
```
Starting Metro Bundler
Clearing cache...
warning: Bundler cache is empty, rebuilding (this may take a minute)

[Metro compiles all TypeScript files - BE PATIENT]
```

**After ~60 seconds**:
```
████ ████ ██ ████ ████
████ ████ ██ ████ ████    <-- QR CODE APPEARS
████ ████ ██ ████ ████

› Metro waiting on exp://192.168.1.132:8081

[SHOULD STAY RUNNING WITHOUT CRASHING] ✅
```

---

## ✅ Success = No Crash

If Expo **stays running** after showing the QR code = **FIXED!** ✅

Then:
1. **Scan QR code** on iPhone
2. **App launches** 
3. **Sign In screen** appears
4. **Test authentication**

---

## 🚨 Still Crashing?

Run the **nuclear option**:

```bash
# Stop Expo (Ctrl+C)

# Move ALL docs temporarily
mkdir ~/Desktop/messageai-docs
mv memory-bank ~/Desktop/messageai-docs/
mv documentation ~/Desktop/messageai-docs/
mv *.md ~/Desktop/messageai-docs/ 2>/dev/null || true
mv *.txt ~/Desktop/messageai-docs/ 2>/dev/null || true
mv .cursor ~/Desktop/messageai-docs/ 2>/dev/null || true

# Keep only source code
ls -la
# Should see: app/ components/ contexts/ services/ types/ utils/ node_modules/

# Restart
npx expo start --clear
```

**This WILL work** because there are very few files left to watch.

---

## 📝 Summary

**Problem**: macOS file limit too low (default 256-1024)
**Fix 1**: ✅ metro.config.js (I created)
**Fix 2**: ✅ .watchmanconfig (I created)
**Fix 3**: ⏭️ YOU: Increase limit with `ulimit -n 10240`
**Fix 4**: ⏭️ YOU: Restart Expo

**Copy commands from top of this file and run!** 🚀

