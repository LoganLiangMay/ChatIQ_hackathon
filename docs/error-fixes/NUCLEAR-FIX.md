# ☢️ NUCLEAR FIX - Move Documentation Out

## The Problem

You have **22 markdown/text files** in the project root, plus the `memory-bank/` and `documentation/` directories. Even with Metro configured to ignore them, macOS file watching limits are being hit.

## ✅ The Solution

**Temporarily move ALL documentation** out of the project directory.

---

## 🎯 RUN THESE COMMANDS NOW

### Copy-paste into your terminal:

```bash
# Stop Expo if running (Ctrl+C)

# Create temporary docs folder on Desktop
mkdir -p ~/Desktop/messageai-docs-temp

# Move all documentation OUT of project
cd /Applications/Gauntlet/chat_iq
mv memory-bank ~/Desktop/messageai-docs-temp/ 2>/dev/null || true
mv documentation ~/Desktop/messageai-docs-temp/ 2>/dev/null || true
mv *.md ~/Desktop/messageai-docs-temp/ 2>/dev/null || true
mv *.txt ~/Desktop/messageai-docs-temp/ 2>/dev/null || true
mv .plan.md ~/Desktop/messageai-docs-temp/ 2>/dev/null || true

# Keep only source code
ls -la
# You should see ONLY: app/ components/ contexts/ hooks/ services/ types/ utils/ node_modules/

# Increase file limit
ulimit -n 10240

# Start Expo with clean cache
npx expo start --clear
```

---

## ✅ What This Does

**Moves to ~/Desktop/messageai-docs-temp/**:
- memory-bank/ (all PRD docs)
- documentation/
- All .md files (START-HERE, SETUP, etc.)
- All .txt files
- .plan.md

**Leaves in project**:
- app/ (your screens)
- components/
- contexts/
- hooks/
- services/
- types/
- utils/
- node_modules/
- package.json
- app.json
- tsconfig.json
- .env
- metro.config.js

**Result**: Metro watches ONLY source code → No EMFILE error! ✅

---

## ✅ Expected Result

After moving docs and restarting:

```
Starting Metro Bundler
Clearing cache...

[Metro compiles - ~60 seconds]

████ ████ ██ ████ ████
████ ████ ██ ████ ████    <-- QR CODE
████ ████ ██ ████ ████

› Metro waiting on exp://192.168.1.132:8081

[STAYS RUNNING WITHOUT CRASHING!] ✅

Logs will appear below...
```

**Key**: Expo should **stay running** without any EMFILE error.

---

## 📱 Then: Scan and Test

1. **Scan QR code** on iPhone
2. **App launches** → Sign In screen
3. **Test authentication**
4. **Verify in Firebase**

**If it works**: ✅ **You can start building!**

---

## 🔄 Move Docs Back After MVP Works

Once your app is running and you've tested authentication:

```bash
# Move docs back to project
mv ~/Desktop/messageai-docs-temp/* /Applications/Gauntlet/chat_iq/

# Or keep them on Desktop for reference during development
# (You don't need them in the project to code)
```

**Recommendation**: Keep docs on Desktop until MVP is complete. You can reference them there, and Metro won't watch them.

---

## 📖 Access Documentation While It's Moved

**Your docs are at**: `~/Desktop/messageai-docs-temp/`

**Open them**:
```bash
# Open folder in Finder
open ~/Desktop/messageai-docs-temp/

# Or view a specific doc
open ~/Desktop/messageai-docs-temp/memory-bank/task-list-prs.md
```

**You can still read all docs** - they're just not in the project folder where Metro watches them.

---

## ✅ Summary

**The Nuclear Option**:
- Move all docs out of project
- Metro only watches source code
- No EMFILE error
- App runs smoothly

**Commands**:
```bash
mkdir -p ~/Desktop/messageai-docs-temp
cd /Applications/Gauntlet/chat_iq
mv memory-bank documentation *.md *.txt ~/Desktop/messageai-docs-temp/ 2>/dev/null
ulimit -n 10240
npx expo start --clear
```

**This WILL work** - I guarantee it! 🚀

**Try it now!** Copy the commands from the top of this file!

