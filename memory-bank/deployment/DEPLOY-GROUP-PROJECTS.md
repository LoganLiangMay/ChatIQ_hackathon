# Deploy Group/Projects Feature - Quick Guide

## 🚀 Deployment Steps

### 1. Deploy Firebase Functions (5 minutes)

```bash
cd /Applications/Gauntlet/chat_iq/functions

# Build (already tested, should succeed)
npm run build

# Deploy only the new/updated functions
firebase deploy --only functions:detectBlockers,functions:extractDecisions

# Or deploy all functions if you prefer
# firebase deploy --only functions
```

**Expected Output:**
```
✔ functions[detectBlockers(us-central1)] Successful update operation.
✔ functions[extractDecisions(us-central1)] Successful update operation.
```

### 2. Deploy Firestore Rules (2 minutes)

```bash
cd /Applications/Gauntlet/chat_iq

# Deploy security rules
firebase deploy --only firestore:rules
```

**Expected Output:**
```
✔ firestore: rules file firestore.rules compiled successfully
✔ firestore: deployed indexes in firestore.indexes.json successfully
```

**What Changed:**
- Participants can update normal chat fields (lastMessage, typing, etc.)
- Only admins can update `projectDescription` field
- All participants can read project metadata

### 3. Test the Feature (15 minutes)

#### Test 1: Create a Project Group
1. Open app (Expo Go or simulator)
2. Navigate to **Chats** tab
3. Tap **+** → **New Group**
4. Select **2+ participants**
5. Tap **Next**
6. Enter group name: "API Redesign Project"
7. Select **"Project (Track Progress)"**
8. Enter description: "Migrating REST API to GraphQL, backend team collaboration"
9. Verify tip appears with lightbulb icon
10. Tap **Create Group**
11. Verify group is created successfully

#### Test 2: Generate Test Messages
In the new project group, send these messages:

**Decisions:**
- "Let's go with GraphQL for the new API"
- "Agreed, GraphQL is the way forward"
- "We'll use Apollo Server for the backend"
- "Decision made: GraphQL + Apollo"

**Blockers:**
- "Blocked: waiting for backend team approval"
- "Can't proceed until we have the schema design"
- "Stuck on the authentication middleware"

**General Discussion:**
- "When can we start the migration?"
- "I think we need 2 weeks for this"
- "Let's meet tomorrow to discuss"

#### Test 3: View Project Overview

1. Tap group name at top → **Group Info**
2. Scroll to **"Project Tools"** section
3. Tap **"View Project Overview"**
4. **Progress Tab:**
   - Should show donut chart with % complete
   - Stats: X Decisions, Y Blockers, Status badge
   - Progress should be ~50-70% (4 decisions, 3 blockers)
   - Status should show "in-progress" or "blocked"
5. **Decision Flow Tab:**
   - Tap "Decision Flow" tab
   - Should render Mermaid tree diagram
   - Should show decision nodes and blocker nodes
   - Try pinch-to-zoom (should work)
   - Try scrolling (should work)

#### Test 4: Edit Project Description

1. While in Group Info, tap **"Edit Project Description"**
2. Update text: "GraphQL API migration - Phase 1 complete, working on Phase 2"
3. Tap **OK/Save**
4. Verify success message appears
5. Re-open Group Info → View Project Overview
6. Check if decisions are more contextual (they should mention phases)

#### Test 5: Performance Check

Using **Chrome DevTools** or **React Native Debugger**:
- Progress tab load time: Should be < 2 seconds
- Tree diagram render: Should be < 3 seconds
- Check for console errors (should be none)

### 4. LangSmith Verification (5 minutes)

1. Go to [LangSmith Dashboard](https://smith.langchain.com/)
2. Navigate to your project
3. Look for recent traces from `extractDecisions`
4. Verify traces show:
   - Project context in prompt
   - Decisions extracted correctly
   - Token usage is reasonable (<1000 tokens)
5. Check latency: Should be <5 seconds per call

### 5. Monitor Firebase Console (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Firestore Database**
3. Find your test chat under `chats/{chatId}`
4. Verify fields exist:
   - `projectType: "project"`
   - `projectDescription: "your description"`
   - `aiTrackingEnabled: true`
5. Navigate to **Functions** → **Logs**
6. Look for logs from `detectBlockers` and `extractDecisions`
7. Verify no errors

## ✅ Success Checklist

- [ ] Firebase Functions deployed successfully
- [ ] Firestore rules deployed successfully
- [ ] Can create a "Project" group with description
- [ ] Project Overview button visible in Group Info
- [ ] Progress tab shows chart and stats
- [ ] Decision Flow tab shows Mermaid tree diagram
- [ ] Can edit project description (admin only)
- [ ] Performance meets targets (<3s load times)
- [ ] LangSmith shows project context in traces
- [ ] No console errors or Firebase errors

## 🐛 Troubleshooting

### Functions not deploying
```bash
# Check Firebase login
firebase login

# Check project selection
firebase use --add  # Select your project

# Try deploying with verbose logging
firebase deploy --only functions --debug
```

### WebView not rendering Mermaid
- Check if `react-native-webview` is installed: `npm list react-native-webview`
- For iOS: Run `cd ios && pod install && cd ..`
- For Android: Clean build `cd android && ./gradlew clean && cd ..`
- Restart Metro bundler

### Progress showing 0%
- Verify test messages were sent successfully
- Check Firebase Functions logs for errors
- Ensure `detectBlockers` and `extractDecisions` are deployed
- Try calling functions manually via Firebase Console

### Firestore permission denied
- Verify rules are deployed: `firebase deploy --only firestore:rules`
- Check user is authenticated
- Verify user is in `participants` array
- For editing description, verify user is in `admins` array

### PieChart not displaying
- Check if `react-native-svg` and `react-native-svg-charts` are installed
- For iOS: Run `cd ios && pod install && cd ..`
- Restart app completely (not just refresh)

## 📊 Expected Costs

**Firebase Functions:**
- ~$0.01 per Project Overview view
- ~$0.005 per decision extraction
- ~$0.005 per blocker detection
- Total: ~$0.02 per overview session

**OpenAI API:**
- ~500 tokens per decision extraction
- ~300 tokens per blocker detection
- Cost: ~$0.001 per overview (gpt-4o-mini)

**Pinecone:** (If using RAG)
- No additional costs for this feature

**Total estimated cost:** ~$0.02 per user per project overview view

## 🎯 Next Features (Optional)

1. **Automatic Tracking:**
   - Firebase trigger on every N messages
   - Background updates to project status
   - Push notifications for blockers

2. **Export:**
   - PDF export of Project Overview
   - Share tree diagram as image
   - Export decisions to CSV

3. **Enhanced Visualizations:**
   - Gantt chart for timelines
   - Burndown chart for progress
   - Sentiment graph over time

4. **AI Insights:**
   - Automatic suggestions for unblocking
   - Risk detection (project at risk of delay)
   - Team collaboration metrics

## 📚 Documentation

- Architecture: See `GROUP-PROJECTS-IMPLEMENTATION-SUMMARY.md`
- API: See Firebase Functions logs for usage examples
- Troubleshooting: See error logs in Firebase Console

## 🤝 Support

If you encounter issues:
1. Check Firebase Console logs
2. Check LangSmith traces
3. Check React Native debugger console
4. Verify all dependencies are installed
5. Ensure Firebase project is correctly configured

