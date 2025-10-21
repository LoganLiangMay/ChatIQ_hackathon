# 🔧 Permanent Fix for EMFILE Error

## Updated metro.config.js ✅

I've created a more aggressive Metro configuration that:
- ✅ Blocks all `.md` files
- ✅ Blocks `memory-bank/` directory
- ✅ Blocks `documentation/` directory  
- ✅ Only watches essential source code directories

---

## 🎯 DO THIS IN YOUR TERMINAL NOW

### Option 1: Restart with Increased Limit (Quick Fix)

**In your terminal** (where Expo is running):

```bash
# 1. Stop Expo
Ctrl+C

# 2. Increase file limit for this session
ulimit -n 10240

# 3. Restart Expo
npx expo start -c
```

**This works for this terminal session.**

---

### Option 2: Permanent System-Wide Fix (Recommended)

If you want to fix this permanently for all terminals:

**Run these commands**:

```bash
# Stop Expo first (Ctrl+C)

# Set system-wide file limits
echo kern.maxfiles=65536 | sudo tee -a /etc/sysctl.conf
echo kern.maxfilesperproc=65536 | sudo tee -a /etc/sysctl.conf

# Apply immediately
sudo sysctl -w kern.maxfiles=65536
sudo sysctl -w kern.maxfilesperproc=65536

# Set limit for your user
echo "ulimit -n 10240" >> ~/.zshrc
source ~/.zshrc

# Verify
ulimit -n
# Should show 10240
```

**Enter your password when prompted for `sudo`**

**Then restart Expo**:
```bash
cd /Applications/Gauntlet/chat_iq
npx expo start -c
```

---

## 🎯 Simplest Solution (Do This Right Now)

**Don't want to mess with system settings?**

Just run these **3 commands** in your terminal:

```bash
ulimit -n 10240
cd /Applications/Gauntlet/chat_iq
npx expo start -c
```

**This should work!** The updated `metro.config.js` + increased limit should fix it.

---

## ✅ What Should Happen

After restart with `metro.config.js` + `ulimit`:

```
Starting Metro Bundler
Clearing cache...

[Compiling... may take 1-2 minutes first time]

████ ████ ██ ████ ████
████ ████ ██ ████ ████    <-- QR CODE
████ ████ ██ ████ ████

› Metro waiting on exp://192.168.1.132:8081

[NO EMFILE ERROR!] ✅

Logs will appear here...
```

**Stays running** without crashing = Success! ✅

---

## 📱 After It Works

1. **Scan QR code** on iPhone/iPad
2. **App downloads** (20-30 seconds first time)
3. **App launches** → MessageAI Sign In screen
4. **Test authentication**

---

## 🚨 If STILL Getting EMFILE Error

Try this nuclear option:

```bash
# Stop Expo (Ctrl+C)

# Move ALL documentation to a different location temporarily
mkdir ~/Desktop/messageai-docs-temp
mv memory-bank ~/Desktop/messageai-docs-temp/
mv documentation ~/Desktop/messageai-docs-temp/
mv *.md ~/Desktop/messageai-docs-temp/
mv *.txt ~/Desktop/messageai-docs-temp/

# Restart Expo
npx expo start -c
```

**This removes ALL non-code files** from the watch path.

**After MVP works**, you can move them back.

---

## 🎯 Summary

**Updated**: ✅ metro.config.js (more aggressive blocking)
**Your Action**: 
1. `Ctrl+C` (stop Expo)
2. `ulimit -n 10240`
3. `npx expo start -c`

**Expected**: QR code appears, stays running, no crash

**Try it now!** 🚀

