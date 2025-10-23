export type ChatType = 'direct' | 'group';

export interface Chat {
  id: string;
  type: ChatType;
  name?: string; // For groups
  groupPicture?: string;
  participants: string[];
  participantDetails?: {
    [userId: string]: {
      displayName: string;
      profilePicture?: string | null;
    };
  };
  admins?: string[]; // For groups
  lastMessage?: {
    content: string;
    timestamp: number;
    senderId: string;
    senderName: string;
    priority?: {
      isPriority: boolean;
      urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
      score: number;
    };
  };
  createdAt: number;
  updatedAt: number;
}

export interface ChatListItem extends Chat {
  otherUser?: {
    uid: string;
    displayName: string;
    profilePicture?: string;
    online: boolean;
  };
  unreadCount: number;
}

