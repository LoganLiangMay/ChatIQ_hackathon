/**
 * AttachmentService
 * Handles extraction and tracking of attachments from messages:
 * - Photos/Images
 * - Links/URLs
 * - Documents
 * - Locations (future)
 */

import { db } from '@/services/database/sqlite';
import { Message } from '@/types/message';

export type AttachmentType = 'photo' | 'link' | 'document' | 'location';

export interface Attachment {
  id: string;
  messageId: string;
  chatId: string;
  type: AttachmentType;
  url?: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    thumbnail?: string;
    title?: string;
    description?: string;
    domain?: string;
    latitude?: number;
    longitude?: number;
  };
  timestamp: number;
}

class AttachmentService {
  /**
   * URL regex pattern for extracting links
   */
  private urlRegex = /(https?:\/\/[^\s]+)/g;

  /**
   * Image URL regex pattern
   */
  private imageUrlRegex = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;

  /**
   * Document URL regex pattern
   */
  private documentUrlRegex = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv)(\?.*)?$/i;

  /**
   * Extract all attachments from a message
   */
  async extractAttachments(message: Message): Promise<Attachment[]> {
    const attachments: Attachment[] = [];

    // Extract photo from imageUrl field
    if (message.imageUrl && message.type === 'image') {
      attachments.push({
        id: `${message.id}-photo-0`,
        messageId: message.id,
        chatId: message.chatId,
        type: 'photo',
        url: message.imageUrl,
        metadata: {
          mimeType: this.getMimeTypeFromUrl(message.imageUrl),
        },
        timestamp: message.timestamp,
      });
    }

    // Extract links from content
    if (message.content) {
      const links = this.extractLinks(message.content);
      links.forEach((link, index) => {
        const type = this.classifyUrl(link);
        attachments.push({
          id: `${message.id}-${type}-${index}`,
          messageId: message.id,
          chatId: message.chatId,
          type,
          url: link,
          metadata: {
            domain: this.extractDomain(link),
            title: this.extractTitle(link),
          },
          timestamp: message.timestamp,
        });
      });
    }

    return attachments;
  }

  /**
   * Extract links from text
   */
  private extractLinks(text: string): string[] {
    const matches = text.match(this.urlRegex);
    return matches ? [...new Set(matches)] : []; // Remove duplicates
  }

  /**
   * Classify URL type (photo, link, or document)
   */
  private classifyUrl(url: string): AttachmentType {
    if (this.imageUrlRegex.test(url)) {
      return 'photo';
    }
    if (this.documentUrlRegex.test(url)) {
      return 'document';
    }
    return 'link';
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }

  /**
   * Extract title from URL (simple heuristic)
   */
  private extractTitle(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const lastSegment = pathname.split('/').filter(Boolean).pop() || '';
      return decodeURIComponent(lastSegment.replace(/[-_]/g, ' '));
    } catch {
      return url;
    }
  }

  /**
   * Get MIME type from URL
   */
  private getMimeTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  /**
   * Process a message and save its attachments to SQLite
   */
  async processMessage(message: Message): Promise<void> {
    try {
      const attachments = await this.extractAttachments(message);

      // Save each attachment to SQLite
      for (const attachment of attachments) {
        await db.insertAttachment(attachment);
      }

      console.log(`✅ Processed ${attachments.length} attachments for message ${message.id}`);
    } catch (error) {
      console.error('Failed to process message attachments:', error);
    }
  }

  /**
   * Process multiple messages in batch
   */
  async processBatch(messages: Message[]): Promise<void> {
    for (const message of messages) {
      await this.processMessage(message);
    }
  }

  /**
   * Get all attachments for a chat
   */
  async getAttachmentsByChat(chatId: string, type?: AttachmentType): Promise<Attachment[]> {
    if (type) {
      return db.getAttachmentsByType(type, chatId);
    }

    // Get all types
    const [photos, links, documents] = await Promise.all([
      db.getAttachmentsByType('photo', chatId),
      db.getAttachmentsByType('link', chatId),
      db.getAttachmentsByType('document', chatId),
    ]);

    return [...photos, ...links, ...documents].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get all attachments (global)
   */
  async getAllAttachments(type?: AttachmentType): Promise<Attachment[]> {
    if (type) {
      return db.getAttachmentsByType(type);
    }

    // Get all types
    const [photos, links, documents] = await Promise.all([
      db.getAttachmentsByType('photo'),
      db.getAttachmentsByType('link'),
      db.getAttachmentsByType('document'),
    ]);

    return [...photos, ...links, ...documents].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Search attachments
   */
  async searchAttachments(query: string, type?: AttachmentType): Promise<Attachment[]> {
    return db.searchAttachments(query, type);
  }

  /**
   * Get attachment counts by type for a chat
   */
  async getAttachmentCounts(chatId?: string): Promise<{
    photos: number;
    links: number;
    documents: number;
    total: number;
  }> {
    const [photos, links, documents] = await Promise.all([
      db.getAttachmentsByType('photo', chatId),
      db.getAttachmentsByType('link', chatId),
      db.getAttachmentsByType('document', chatId),
    ]);

    return {
      photos: photos.length,
      links: links.length,
      documents: documents.length,
      total: photos.length + links.length + documents.length,
    };
  }

  /**
   * Delete all attachments for a message
   */
  async deleteMessageAttachments(messageId: string): Promise<void> {
    await db.deleteAttachmentsByMessage(messageId);
  }
}

export const attachmentService = new AttachmentService();
