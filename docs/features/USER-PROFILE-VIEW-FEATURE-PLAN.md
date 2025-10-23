# 👤 User Profile View Feature - Implementation Plan

## Feature Requirements

**User Story**: As a user, when I'm in a chat, I want to view the other user's profile, so I can see their information and have quick access to user-specific actions.

**Acceptance Criteria**:
1. ✅ User taps the "ⓘ" (info) icon in chat header
2. ✅ Modal/screen displays other user's profile information
3. ✅ Shows: Avatar, Name, Email, Status (Online/Offline), Last Seen
4. ✅ Quick actions: Block User, Clear Chat, Report (future)
5. ✅ For group chats: Shows group info and all participants

---

## Architecture

### Data Sources

**User Profile Data** (`users/{userId}`):
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

**Chat Data** (`chats/{chatId}`):
```typescript
{
  // Already has participantDetails
  participantDetails: {
    [userId: string]: {
      displayName: string;
      profilePicture?: string;
    };
  };
}
```

---

## Implementation Steps

### Step 1: Create Chat Info Screen

**File**: `app/(tabs)/chats/[chatId]/info.tsx`

**For Direct Chats**:
- Show other user's profile
- Display online/offline status
- Show last seen timestamp
- Quick actions (mute, block, clear chat)

**For Group Chats**:
- Show group name and picture
- List all participants
- Show group admins (with badge)
- Options: Leave Group, Add Participants (admin)

---

### Step 2: Update Chat Header

**File**: `components/chat/ChatHeader.tsx`

Add navigation to info screen:

```typescript
<TouchableOpacity 
  style={styles.infoButton}
  onPress={() => router.push(`/(tabs)/chats/${chatId}/info`)}
>
  <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
</TouchableOpacity>
```

---

### Step 3: Create User Profile Service

**File**: `services/firebase/firestore.ts`

**New Function**: `getUserProfile`

```typescript
/**
 * Get full user profile information
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const firestore = await getFirebaseFirestore();
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return null;
    }
    
    const data = userSnap.data();
    return {
      uid: userId,
      email: data.email || '',
      displayName: data.displayName || 'Unknown User',
      profilePicture: data.profilePicture || null,
      online: data.online || false,
      lastSeen: data.lastSeen?.toMillis?.() || Date.now(),
      createdAt: data.createdAt?.toMillis?.() || Date.now(),
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}
```

---

### Step 4: Create User Profile Hook

**File**: `hooks/useUserProfile.ts`

```typescript
import { useState, useEffect } from 'react';
import { getUserProfile } from '@/services/firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  profilePicture?: string | null;
  online: boolean;
  lastSeen: number;
  createdAt: number;
}

export function useUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    const loadProfile = async () => {
      try {
        const userProfile = await getUserProfile(userId);
        setProfile(userProfile);
      } catch (error) {
        console.error('Failed to load user profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [userId]);
  
  return { profile, loading };
}
```

---

## UI Design

### Direct Chat Info Screen

```
┌─────────────────────────┐
│ ← Chat Info             │
├─────────────────────────┤
│                         │
│         👤              │
│      Kevin Smith        │
│    kevin@example.com    │
│                         │
│   🟢 Online             │
│                         │
├─────────────────────────┤
│ 📧 Email                │
│    kevin@example.com    │
├─────────────────────────┤
│ 📱 Phone                │
│    Not provided         │
├─────────────────────────┤
│ 🕐 Joined               │
│    October 15, 2025     │
├─────────────────────────┤
│                         │
│  [🔇 Mute Notifications]│
│  [🚫 Block User]        │
│  [🗑️  Clear Chat]       │
│                         │
└─────────────────────────┘
```

### Group Chat Info Screen

```
┌─────────────────────────┐
│ ← Group Info        ✏️  │
├─────────────────────────┤
│                         │
│    👥 Weekend Squad     │
│    3 participants       │
│                         │
├─────────────────────────┤
│ Participants            │
│                         │
│ 👤 You (Admin)          │
│    Online               │
│                         │
│ 👤 Kevin Smith          │
│    Last seen 5m ago     │
│                         │
│ 👤 Sarah Williams       │
│    Last seen 1h ago     │
│                         │
├─────────────────────────┤
│                         │
│  [➕ Add Participants]  │
│  [🔇 Mute Group]        │
│  [🚪 Leave Group]       │
│                         │
└─────────────────────────┘
```

---

## Components to Create

### 1. DirectChatInfo Component

**File**: `components/chat/DirectChatInfo.tsx`

```typescript
interface DirectChatInfoProps {
  chatId: string;
  otherUserId: string;
}

export function DirectChatInfo({ chatId, otherUserId }: DirectChatInfoProps) {
  const { profile, loading } = useUserProfile(otherUserId);
  const { online, lastSeen } = usePresence(otherUserId);
  
  // Show profile, status, actions
}
```

### 2. GroupChatInfo Component

**File**: `components/chat/GroupChatInfo.tsx`

```typescript
interface GroupChatInfoProps {
  chatId: string;
  groupName: string;
  participants: string[];
  admins: string[];
}

export function GroupChatInfo({ chatId, groupName, participants, admins }: GroupChatInfoProps) {
  // Show group details, participants list, actions
}
```

### 3. ProfileActionButton Component

**File**: `components/profile/ProfileActionButton.tsx`

```typescript
interface ProfileActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

export function ProfileActionButton({ icon, label, onPress, destructive }: ProfileActionButtonProps) {
  // Styled button with icon and label
}
```

---

## Testing Checklist

### Direct Chat Info:
- [ ] Can navigate to info screen from chat header
- [ ] Displays user's avatar and name
- [ ] Shows correct online/offline status
- [ ] Shows last seen timestamp (formatted)
- [ ] Shows user email
- [ ] Action buttons are functional
- [ ] Can navigate back to chat

### Group Chat Info:
- [ ] Shows group name and participant count
- [ ] Lists all participants with avatars
- [ ] Shows admin badge for group admins
- [ ] Shows online status for each participant
- [ ] Can add participants (if admin)
- [ ] Can leave group
- [ ] Can mute group notifications

---

## Files to Create/Modify

### New Files:
1. `app/(tabs)/chats/[chatId]/info.tsx` - Chat/profile info screen
2. `components/chat/DirectChatInfo.tsx` - Direct chat info component
3. `components/chat/GroupChatInfo.tsx` - Group chat info component
4. `components/profile/ProfileActionButton.tsx` - Action button component
5. `hooks/useUserProfile.ts` - User profile hook

### Modified Files:
1. `components/chat/ChatHeader.tsx` - Add info button
2. `services/firebase/firestore.ts` - Add `getUserProfile` function
3. `app/(tabs)/_layout.tsx` - Add info route
4. `types/user.ts` - Add UserProfile type (if not exists)

---

## Estimated Effort

- **Chat Info Screen**: 2 hours
- **Direct Chat Info Component**: 1.5 hours
- **Group Chat Info Component**: 1.5 hours
- **Backend Services**: 1 hour
- **Testing**: 1 hour

**Total**: ~7 hours

---

## Future Enhancements (Not in MVP)

- [ ] Edit own profile
- [ ] Upload profile picture
- [ ] Custom status messages
- [ ] Privacy settings
- [ ] Block/unblock functionality
- [ ] Report user functionality
- [ ] Shared media view
- [ ] Export chat history

---

## Status

**Dependencies**: 
- ✅ BC #43 fixes confirmed working
- ✅ Chat header already has info icon (just needs onPress handler)
- ✅ User data structure already exists in Firestore

**Ready to implement**: Yes, can start after Group Chat feature (or in parallel)

---

## Priority

**Recommendation**: Implement **after** Group Chat feature, because:
1. Group Chat is more core to messaging functionality
2. Profile view complements both direct and group chats
3. Can leverage participant data from Group Chat implementation


