export type MessageType = 'text' | 'image' | 'system';

export type SyncStatus = 'pending' | 'synced' | 'failed';

export type DeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content?: string;
  type: MessageType;
  imageUrl?: string;
  timestamp: number;
  syncStatus: SyncStatus;
  deliveryStatus: DeliveryStatus;
  readBy?: string[];
  deliveredTo?: string[];
  createdAt?: number;
}

export interface FirestoreMessage {
  senderId: string;
  senderName: string;
  content?: string;
  type: MessageType;
  imageUrl?: string;
  timestamp: any; // Firestore timestamp or number
  readBy: string[];
  deliveredTo: string[];
}

