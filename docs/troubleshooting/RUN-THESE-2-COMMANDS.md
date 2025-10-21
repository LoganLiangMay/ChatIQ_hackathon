# ⚡ RUN THESE 2 COMMANDS

## Deploy Firestore Rules (Choose ONE method)

### 🖱️ Method A: Via Browser (Easiest)
1. Open: https://console.firebase.google.com
2. Go to: **Firestore Database** → **Rules** tab
3. Copy/paste contents of `firestore.rules`
4. Click **Publish**
5. ✅ Done!

---

### 💻 Method B: Via Command Line

```bash
# Command 1: Install Firebase CLI (if needed)
npm install -g firebase-tools

# Command 2: Deploy rules
firebase deploy --only firestore:rules
```

**If you get "command not found" or "no project":**
```bash
# Login first
firebase login

# Initialize (one time)
firebase init firestore
# Select your project
# Press Enter to accept defaults
```

---

## ✅ Verify It Worked

After deploying:
- Open Firebase Console → Firestore → Rules
- Check for "Published" timestamp
- Try sending a message in your app
- Should work without permission errors!

---

## 🎯 That's It!

Your Firestore rules are now deployed and protecting your data.

**Full guide:** See `DEPLOY-FIRESTORE.md` for detailed instructions.
