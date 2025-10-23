# 📱 Test on Expo Go (iPad)

**Date:** October 21, 2025  
**Status:** Ready to test with Expo Go!

---

## ✅ Watchman Fixed the EMFILE Error!

With Watchman now installed, the Metro bundler should stay running long enough for you to scan the QR code.

---

## 🚀 Command to Test on Expo Go

**I just ran this command for you:**
```bash
npx expo start --clear
```

---

## 📱 How to Connect Your iPad

### Step 1: Check Your Terminal
Look at your terminal window. You should see:
- A **QR code** (ASCII art)
- Local network URL (e.g., `exp://192.168.X.X:8081`)
- Instructions showing keyboard shortcuts

### Step 2: Open Expo Go on iPad
1. Open the **Expo Go** app on your iPad
2. Make sure your iPad is on the **same WiFi** as your Mac

### Step 3: Scan the QR Code
- **Tap "Scan QR Code"** in Expo Go
- Point your camera at the QR code in the terminal
- The app should start loading immediately

### Step 4: Wait for Bundle
- Metro will compile the JavaScript bundle
- You should see progress in both:
  - Your terminal (build progress)
  - Expo Go app (loading screen)

---

## 🎯 What Should Happen

✅ **Success looks like:**
- QR code appears in terminal within 10 seconds
- Expo Go connects successfully
- You see the Sign In/Sign Up authentication screens
- No "Could not connect to server" errors
- No certificate errors

❌ **If you see errors:**
- Screenshot the error message
- Check that iPad and Mac are on same WiFi
- Try refreshing in Expo Go (shake device, tap "Reload")

---

## 🔧 Alternative: Direct URL Entry

If QR code scanning doesn't work:

1. **Look for the URL in terminal** (format: `exp://192.168.X.X:8081`)
2. **In Expo Go:** Tap "Enter URL manually"
3. **Type or paste** the URL shown in terminal

---

## 🚨 If Metro Crashes Again

With Watchman installed, this shouldn't happen, but just in case:

```bash
# Restart Expo
npx expo start --clear
```

Then scan the QR code **immediately** (within 5-10 seconds).

---

## 📊 Troubleshooting

| Issue | Solution |
|-------|----------|
| No QR code appears | Check terminal - Metro might still be starting |
| "Could not connect" | Verify same WiFi network |
| Metro crashes | Restart: `npx expo start --clear` |
| Certificate error | Don't use `--tunnel` flag |

---

## 🎯 What to Test Once Connected

Once the app loads on your iPad:

1. ✅ **Sign Up Flow**
   - Try creating a new account
   - Check if validation works
   - See if Firebase auth is working

2. ✅ **Sign In Flow**
   - Try signing in with test credentials
   - Check error messages

3. ✅ **Navigation**
   - Verify app doesn't crash
   - Check if screens render properly

4. ✅ **Report Back**
   - Let me know what works and what doesn't!

---

**Check your terminal now - the QR code should be ready!** 📱

