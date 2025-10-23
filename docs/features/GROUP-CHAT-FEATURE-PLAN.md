# 🎯 Group Chat Creation Feature - Implementation Plan

## Feature Requirements

**User Story**: As a user, I want to create group chats by selecting multiple participants from my contacts, so I can message multiple people at once.

**Acceptance Criteria**:
1. ✅ User taps "New Group" from Chats screen
2. ✅ Screen shows list of all available users to select
3. ✅ User can select multiple participants (checkboxes/multi-select)
4. ✅ User enters group name
5. ✅ User taps "Create" button
6. ✅ Group chat is created in Firestore
7. ✅ User is navigated to the new group chat screen
8. ✅ All participants can see the group in their chats list

---

## Architecture

### User Data Source

**Firestore Collection**: `users/{userId}`

```typescript
{
  uid: string;
  email: string;
  displayName: string;
  profilePicture?: string;
  online: boolean;
  lastSeen: Timestamp;
  createdAt: Timestamp;
}
```

**Important**: The user selection screen fetches **all registered users** from this collection. Only users who have successfully signed up will appear in the list.

### Data Model (Already Defined in PRD)

**Chat Document** (`chats/{chatId}`):
```typescript
{
  id: string;
  type: 'group'; // 'direct' | 'group'
  name: string; // Group name
  groupPicture?: string;
  participants: string[]; // Array of user IDs
  participantDetails: {
    [userId: string]: {
      displayName: string;
      profilePicture?: string;
    };
  };
  admins: string[]; // User IDs who can edit group
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    timestamp: Timestamp;
  };
}
```

### Firestore Security Rules (Already in Place)

```javascript
// Can create group if user is in participants list
allow create: if isSignedIn() 
              && request.auth.uid in request.resource.data.participants;

// Can update if user is participant (admin-only ops enforced in client)
allow update: if isParticipant(resource.data.participants);
```

---

## Implementation Steps

### Step 1: Create User Selection Screen

**File**: `app/groups/create.tsx`

**UI Components**:
- Header with "Cancel" and "Next" buttons
- Search bar to filter users
- List of all users from database (except current user)
- Checkbox for each user
- Selected count indicator (e.g., "3 selected")

**Data Source**: Fetch from `users/{userId}` collection in Firestore

**Logic**:
```typescript
// Fetch all registered users from Firestore
const fetchUsers = async () => {
  const firestore = await getFirebaseFirestore();
  const usersRef = collection(firestore, 'users');
  const snapshot = await getDocs(usersRef);
  
  const allUsers = snapshot.docs
    .map(doc => ({
      uid: doc.id,
      displayName: doc.data().displayName || 'Unknown',
      email: doc.data().email || '',
      profilePicture: doc.data().profilePicture || null,
      online: doc.data().online || false,
    }))
    .filter(user => user.uid !== currentUserId); // Exclude self
  
  setAvailableUsers(allUsers);
};

// Track selected user IDs in state
- Enable "Next" button when at least 2 users selected
- Navigate to group name screen with selected IDs
```

**Note**: Only users who have signed up and exist in the Firestore `users` collection will appear in the list. This ensures you're only selecting real, registered users.

---

### Step 2: Create Group Name Screen

**File**: `app/groups/name.tsx`

**UI Components**:
- Header with "Back" and "Create" buttons
- Group name input field
- Optional: Group photo picker
- List of selected participants (avatars)
- Character count (max 50 characters)

**Logic**:
```typescript
- Receive selected user IDs from previous screen
- Validate group name (min 1 char, max 50 chars)
- Enable "Create" button when name is valid
- Call createGroupChat() on Create button press
- Navigate to new group chat screen
```

---

### Step 3: Create Group Chat Service

**File**: `services/firebase/firestore.ts`

**New Function**: `createGroupChat`

```typescript
/**
 * Create a group chat with multiple participants
 */
export async function createGroupChat(
  groupName: string,
  participantIds: string[],
  groupPicture?: string
): Promise<string> {
  const auth = await getFirebaseAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('User must be authenticated to create a group');
  }
  
  // Ensure current user is in participants
  if (!participantIds.includes(currentUser.uid)) {
    participantIds.push(currentUser.uid);
  }
  
  // Must have at least 3 participants (including creator) for a group
  if (participantIds.length < 3) {
    throw new Error('Group chat requires at least 3 participants');
  }
  
  // Generate group ID
  const chatId = generateUUID();
  const chatRef = doc(getFirestore(), 'chats', chatId);
  
  // Fetch participant details
  const participantDetails: { [userId: string]: any } = {};
  await Promise.all(
    participantIds.map(async (uid) => {
      try {
        const userRef = doc(getFirestore(), 'users', uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        participantDetails[uid] = {
          displayName: (userData.displayName as string) || 'Unknown',
          profilePicture: (userData.profilePicture as string | null) || null,
        };
      } catch (error) {
        console.error('Error fetching user details for', uid, error);
        participantDetails[uid] = {
          displayName: 'Unknown',
          profilePicture: null,
        };
      }
    })
  );
  
  // Create group chat document
  const chatData = {
    id: chatId,
    type: 'group',
    name: groupName,
    groupPicture: groupPicture || null,
    participants: participantIds,
    participantDetails,
    admins: [currentUser.uid], // Creator is admin
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: null,
  };
  
  await setDoc(chatRef, chatData);
  console.log('✅ Group chat created:', chatId);
  
  return chatId;
}
```

---

### Step 4: Update Navigation

**File**: `app/(tabs)/chats.tsx`

Update the "New Chat" button handler:

```typescript
const handleNewChat = () => {
  Alert.alert(
    'New Chat',
    'Choose chat type',
    [
      {
        text: 'New Group',
        onPress: () => router.push('/groups/create'), // ← Navigate to group creation
      },
      {
        text: 'New Direct Chat',
        onPress: () => router.push('/(tabs)/chats/search'),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]
  );
};
```

---

### Step 5: Update Routes Configuration

**File**: `app/(tabs)/_layout.tsx`

Add group routes:

```typescript
<Tabs.Screen
  name="groups/create"
  options={{
    href: null, // Hide from tabs
    tabBarStyle: { display: 'none' }, // Hide tab bar
  }}
/>
<Tabs.Screen
  name="groups/name"
  options={{
    href: null,
    tabBarStyle: { display: 'none' },
  }}
/>
```

---

## UI Design

### User Selection Screen

```
┌─────────────────────────┐
│ Cancel    New Group  ✓  │
├─────────────────────────┤
│ 🔍 Search users...      │
├─────────────────────────┤
│                         │
│ ☐ 👤 Kevin              │
│    kevin@example.com    │
├─────────────────────────┤
│ ☑ 👤 John               │
│    john@example.com     │
├─────────────────────────┤
│ ☑ 👤 Sarah              │
│    sarah@example.com    │
├─────────────────────────┤
│ ☐ 👤 Mike               │
│    mike@example.com     │
├─────────────────────────┤
│                         │
│        2 selected       │
│      [Next  →]          │
└─────────────────────────┘
```

**Note**: This list shows **real users from your Firestore `users` collection**. Names and emails are fetched from the database, not hardcoded.

### Group Name Screen

```
┌─────────────────────────┐
│ ← Back      Create      │
├─────────────────────────┤
│                         │
│ Group Name              │
│ ┌─────────────────────┐ │
│ │ My Group            │ │
│ └─────────────────────┘ │
│ 8/50                    │
│                         │
│ Participants (3)        │
│ ┌───────────────────┐   │
│ │ 👤 You            │   │
│ │ 👤 User 2         │   │
│ │ 👤 User 3         │   │
│ └───────────────────┘   │
│                         │
│    [Create Group]       │
└─────────────────────────┘
```

---

## Testing Checklist

- [ ] Can navigate to group creation from main chats screen
- [ ] User selection screen displays all users except self
- [ ] Can select and deselect users
- [ ] "Next" button is disabled when < 2 users selected
- [ ] Search filters users correctly
- [ ] Group name screen shows selected participants
- [ ] Can enter group name (1-50 characters)
- [ ] "Create" button is disabled when name is empty
- [ ] Group chat is created in Firestore with correct data
- [ ] All participants can see the group in their chats list
- [ ] Current user is navigated to new group chat screen
- [ ] Can send messages in the new group
- [ ] All participants receive messages in real-time

---

## Files to Create/Modify

### New Files:
1. `app/groups/create.tsx` - User selection screen
2. `app/groups/name.tsx` - Group name entry screen
3. `components/groups/UserSelectItem.tsx` - Checkbox user item
4. `components/groups/SelectedUserChip.tsx` - Selected user badge

### Modified Files:
1. `services/firebase/firestore.ts` - Add `createGroupChat` function
2. `app/(tabs)/chats.tsx` - Update "New Chat" button handler
3. `app/(tabs)/_layout.tsx` - Add group routes
4. `types/chat.ts` - Already has group chat types ✅

---

## Estimated Effort

- **User Selection Screen**: 2 hours
- **Group Name Screen**: 1 hour
- **Backend Service**: 1 hour
- **Navigation & Routes**: 30 minutes
- **Testing**: 1 hour

**Total**: ~5.5 hours

---

## Future Enhancements (Not in MVP)

- [ ] Group photo upload
- [ ] Edit group name/participants (admin only)
- [ ] Remove participants (admin only)
- [ ] Leave group
- [ ] Group admin controls
- [ ] @mention participants
- [ ] Group description

---

**Status**: Ready to implement after BC #43 fixes are confirmed working ✅

