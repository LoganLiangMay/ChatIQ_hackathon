# 🔑 OpenAI API Key Setup for Firebase Functions

**Issue:** Firebase Functions need the OpenAI API key to generate summaries.

**Status:** ❌ OpenAI API key is NOT configured in Firebase Functions

---

## ⚡ Quick Fix (Do This Now)

### Option A: Using Firebase CLI (Recommended)

Run this command with **your actual OpenAI API key**:

```bash
cd /Applications/Gauntlet/chat_iq/functions
firebase functions:config:set openai.api_key="sk-proj-YOUR-KEY-HERE"
```

**Replace `sk-proj-YOUR-KEY-HERE` with your actual OpenAI API key!**

Then redeploy the functions:

```bash
firebase deploy --only functions:summarizeThread,functions:detectPriority
```

**⏱️ Time: 2-3 minutes**

---

### Option B: Using Firebase Console

1. Go to: https://console.firebase.google.com
2. Select project: `messageai-mvp-e0b2b`
3. Navigate to: **Functions** → **Configuration**
4. Click **Add variable**
5. Set:
   - Name: `openai.api_key`
   - Value: Your OpenAI API key (starts with `sk-proj-...`)
6. Click **Save**
7. Redeploy functions (see command above)

---

## 🆕 Modern Approach (Better Long-Term)

Firebase recommends using `.env` files instead of `functions.config()`. Let's set that up:

### Step 1: Create .env file in functions directory

```bash
cd /Applications/Gauntlet/chat_iq/functions
cat > .env << 'EOF'
OPENAI_API_KEY=sk-proj-YOUR-KEY-HERE
EOF
```

**Again, replace with your actual key!**

### Step 2: Update functions code to use .env

The code already supports environment variables, so once the `.env` file exists, it will work.

### Step 3: Deploy

```bash
firebase deploy --only functions
```

---

## 🔍 Where to Get Your OpenAI API Key

**If you don't have one:**

1. Go to: https://platform.openai.com/api-keys
2. Sign in with your OpenAI account
3. Click **"Create new secret key"**
4. Name it: `MessageAI-Firebase-Functions`
5. Copy the key (starts with `sk-proj-...`)
6. **IMPORTANT:** Save it somewhere safe! You can only see it once.

**If you already have one:**

- Check your password manager
- Check previous projects
- Or create a new one (recommended for this project)

---

## ✅ Verify Setup

After setting the key and redeploying:

```bash
# Check config is set
firebase functions:config:get

# Should show:
# {
#   "openai": {
#     "api_key": "sk-proj-..."
#   }
# }

# Test on iPad
# 1. Open Expo Go
# 2. Navigate to chat
# 3. Tap ✨ sparkles button
# 4. Should see summary within 3 seconds!
```

---

## 🐛 Troubleshooting

**Error: "OpenAI API key not configured"**
- ✅ You're here! Follow steps above.

**Error: "Invalid API key"**
- Check you copied the full key (starts with `sk-proj-`)
- Make sure no extra spaces or quotes
- Try generating a new key

**Error: "Insufficient quota"**
- Your OpenAI account needs billing set up
- Go to: https://platform.openai.com/account/billing
- Add payment method
- Set usage limits

**Functions still not working after deploy:**
- Wait 1-2 minutes for deployment to complete
- Check logs: `firebase functions:log --only summarizeThread`
- Make sure you redeployed AFTER setting the key

---

## 💰 OpenAI API Costs

**For Testing:**
- Each summary: ~$0.0004 (less than 1 cent)
- 100 tests: ~$0.04
- **Very affordable for development!**

**Set Usage Limits:**
1. Go to: https://platform.openai.com/account/limits
2. Set monthly limit: $5-10 for testing
3. This prevents unexpected charges

---

## 📝 Summary of Steps

1. ✅ Get your OpenAI API key
2. ✅ Set it in Firebase Functions: `firebase functions:config:set openai.api_key="YOUR-KEY"`
3. ✅ Redeploy functions: `firebase deploy --only functions`
4. ✅ Test on iPad - tap ✨ button
5. ✅ See beautiful AI summaries! 🎉

---

**Status:** Waiting for you to set the OpenAI API key  
**Next Step:** Run the command above with your actual key

