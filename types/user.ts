export interface User {
  uid: string;
  email: string;
  displayName: string;
  profilePicture?: string;
  online: boolean;
  lastSeen: number;
  fcmToken?: string;
  typing?: {
    chatId: string;
    isTyping: boolean;
    updatedAt: number;
  };
  createdAt: number;
}

export interface AuthFormData {
  email: string;
  password: string;
  displayName?: string;
}

