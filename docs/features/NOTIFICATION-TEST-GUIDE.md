# 📱 Notification System - Quick Test Guide

## 🎯 Quick Test (5 minutes)

### Test 1: In-App Banner (Foreground)

**On iPad**:
1. Open MessageAI app
2. Navigate to Chats screen
3. **Keep app in foreground** (don't switch away)

**On Browser** (as Kevin):
4. Send a message to Logan

**Expected Result**:
- ✅ Blue banner slides down from top within 1-2 seconds
- ✅ Shows "Kevin" and message text
- ✅ Banner auto-dismisses after 4 seconds
- ✅ Tapping banner opens chat

---

### Test 2: System Notification (Background)

**On iPad**:
1. Open MessageAI app
2. Press **Home button** to go to home screen
3. Wait 2-3 seconds

**On Browser** (as Kevin):
4. Send another message to Logan

**Expected Result**:
- ✅ System notification appears at top of screen
- ✅ Shows "Kevin" and message text
- ✅ Notification sound plays
- ✅ Tapping notification opens app and navigates to chat

---

## ⚠️ If It Doesn't Work

### Banner Doesn't Appear (Foreground)

**Check Console Logs** - Should see:
```
🔵 [NotificationManager] Handling notification, app state: active
📱 [NotificationManager] Showing in-app banner
📱 [RootLayout] Showing in-app banner: Kevin
```

**If missing**: The notification trigger might not be firing. Check `useMessages.ts` is calling `notificationManager.handleIncomingMessage()`.

---

### System Notification Doesn't Appear (Background)

**Check Console Logs** - Should see:
```
🔵 [NotificationManager] App state changed: active → background
🔵 [NotificationManager] Handling notification, app state: background
🔔 [NotificationManager] Scheduling local notification
✅ [NotificationManager] Local notification scheduled
```

**If missing**: App state might not be updating correctly, or permissions might be denied.

**Check Permissions**:
```
🔵 [NotificationManager] Current permission status: granted
✅ [NotificationManager] Notification permissions granted
```

---

## 🔍 Detailed Console Output

When working correctly, here's the full log sequence:

### App Startup:
```
✅ [NotificationManager] Initialized
✅ [NotificationManager] In-app banner callback registered
🔵 [NotificationManager] Current permission status: granted
✅ [NotificationManager] Notification permissions granted
```

### New Message in Foreground:
```
🔵 [useMessages] Setting up Firestore listener for chat: abc123
✅ Message added to UI: msg_xyz from: Kevin
🔵 [NotificationManager] Handling notification, app state: active
📱 [NotificationManager] Showing in-app banner
✅ [NotificationManager] In-app banner triggered
📱 [RootLayout] Showing in-app banner: Kevin
```

### New Message in Background:
```
🔵 [NotificationManager] App state changed: active → background
🔵 [NotificationManager] Handling notification, app state: background
🔔 [NotificationManager] Scheduling local notification
✅ [NotificationManager] Local notification scheduled
```

---

## 🐛 Common Issues

### Issue: Banner appears but doesn't dismiss
**Cause**: Animation state issue  
**Fix**: Already handled in code (auto-dismiss timer)

### Issue: Multiple banners stack on top of each other
**Cause**: Previous banner not dismissed before new one  
**Fix**: Already handled - new banner replaces old one

### Issue: Tapping banner doesn't navigate
**Cause**: Router not passed correctly  
**Fix**: Check `app/_layout.tsx` - router should be passed to notification manager

### Issue: No notifications at all
**Cause**: `notificationManager.handleIncomingMessage()` not being called  
**Fix**: Check `hooks/useMessages.ts` - should be called when `senderId !== currentUserId`

---

## ✅ Success Criteria

Mark these off as you test:

- [ ] **Foreground banner appears** when message received while using app
- [ ] **Banner shows correct sender name** (Kevin)
- [ ] **Banner shows message preview** (actual message text)
- [ ] **Banner auto-dismisses** after 4 seconds
- [ ] **Tapping banner opens chat** with Kevin
- [ ] **System notification appears** when message received while app backgrounded
- [ ] **Notification sound plays** (system sound)
- [ ] **Tapping notification opens app** and navigates to chat
- [ ] **Multiple messages each trigger notification**
- [ ] **No crashes or errors** during testing

---

## 📊 What to Report Back

After testing, report:

1. ✅ **Foreground test passed?** (Yes/No)
   - If no, what didn't work?

2. ✅ **Background test passed?** (Yes/No)
   - If no, what didn't work?

3. 📝 **Console logs**: Any errors or warnings?

4. 💡 **Suggestions**: Any UX improvements?

---

## 🚀 Next Steps After Testing

Once testing is successful:

1. ✅ Mark notification feature as complete
2. ✅ Test group chat creation (if not already tested)
3. ✅ Test sign out fix (should work now)
4. 📱 Continue building out other MessageAI features

---

## 🔮 Future Enhancements (Optional)

After basic testing works:

- **Add notification settings screen** (mute chats, custom sounds)
- **Add quick reply** from notification
- **Add notification grouping** (multiple messages from same person)
- **Add real push notifications** for production (FCM/APNs)

---

**Ready to test! Let me know how it goes!** 🎉


