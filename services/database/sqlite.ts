import * as SQLite from 'expo-sqlite';
import { Message } from '@/types/message';
import { Chat } from '@/types/chat';

class DatabaseService {
  private db: SQLite.WebSQLDatabase | null = null;
  private initialized: boolean = false;
  
  // Helper to check if database is available
  private isAvailable(): boolean {
    return this.db !== null;
  }
  
  async init() {
    if (this.initialized) {
      console.log('Database already initialized');
      return;
    }
    
    try {
      // Check if SQLite is available (not available in Expo Go SDK 53+)
      if (!SQLite.openDatabase) {
        console.warn('⚠️  SQLite not available (Expo Go limitation). App will work without offline storage.');
        this.initialized = true; // Mark as initialized to prevent repeated attempts
        return;
      }
      
      this.db = SQLite.openDatabase('messageai.db');
      await this.createTables();
      this.initialized = true;
      console.log('✅ SQLite database initialized successfully');
    } catch (error) {
      console.warn('⚠️  SQLite initialization failed. App will work without offline storage.', error);
      this.initialized = true; // Mark as initialized to prevent repeated attempts
      // Don't throw - allow app to continue without SQLite
    }
  }
  
  private async createTables() {
    return new Promise<void>((resolve, reject) => {
      this.db!.transaction(
        (tx) => {
          // Chats table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS chats (
              id TEXT PRIMARY KEY,
              type TEXT NOT NULL,
              name TEXT,
              groupPicture TEXT,
              participants TEXT NOT NULL,
              participantDetails TEXT,
              admins TEXT,
              lastMessage TEXT,
              updatedAt INTEGER,
              createdAt INTEGER
            )
          `);

          // Messages table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS messages (
              id TEXT PRIMARY KEY,
              chatId TEXT NOT NULL,
              senderId TEXT NOT NULL,
              senderName TEXT NOT NULL,
              content TEXT,
              type TEXT NOT NULL,
              imageUrl TEXT,
              timestamp INTEGER NOT NULL,
              syncStatus TEXT DEFAULT 'pending',
              deliveryStatus TEXT DEFAULT 'sending',
              readBy TEXT,
              deliveredTo TEXT,
              createdAt INTEGER DEFAULT (strftime('%s', 'now')),
              priority TEXT
            )
          `);

          // Attachments table for media, links, documents tracking
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS attachments (
              id TEXT PRIMARY KEY,
              messageId TEXT NOT NULL,
              chatId TEXT NOT NULL,
              type TEXT NOT NULL,
              url TEXT,
              metadata TEXT,
              timestamp INTEGER NOT NULL,
              FOREIGN KEY (messageId) REFERENCES messages(id) ON DELETE CASCADE
            )
          `);

          // FTS5 virtual table for full-text search
          // Note: FTS5 might not be available in all SQLite versions
          // We'll try to create it and catch errors gracefully
          tx.executeSql(`
            CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
              content,
              senderName,
              chatName,
              content='messages',
              content_rowid='rowid'
            )
          `, [],
          () => {
            console.log('✅ FTS5 table created successfully');

            // Create triggers to keep FTS5 in sync with messages table
            // Trigger for INSERT
            tx.executeSql(`
              CREATE TRIGGER IF NOT EXISTS messages_fts_insert AFTER INSERT ON messages BEGIN
                INSERT INTO messages_fts(rowid, content, senderName, chatName)
                VALUES (new.rowid, new.content, new.senderName, '');
              END;
            `);

            // Trigger for UPDATE
            tx.executeSql(`
              CREATE TRIGGER IF NOT EXISTS messages_fts_update AFTER UPDATE ON messages BEGIN
                UPDATE messages_fts SET content = new.content, senderName = new.senderName
                WHERE rowid = new.rowid;
              END;
            `);

            // Trigger for DELETE
            tx.executeSql(`
              CREATE TRIGGER IF NOT EXISTS messages_fts_delete AFTER DELETE ON messages BEGIN
                DELETE FROM messages_fts WHERE rowid = old.rowid;
              END;
            `);
          },
          (_, error) => {
            console.warn('⚠️  FTS5 not available, will use basic LIKE search', error);
            return false; // Continue transaction even if FTS5 fails
          });

          // Indexes for performance
          tx.executeSql('CREATE INDEX IF NOT EXISTS idx_messages_chatId ON messages(chatId)');
          tx.executeSql('CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)');
          tx.executeSql('CREATE INDEX IF NOT EXISTS idx_messages_syncStatus ON messages(syncStatus)');
          tx.executeSql('CREATE INDEX IF NOT EXISTS idx_chats_updatedAt ON chats(updatedAt)');
          tx.executeSql('CREATE INDEX IF NOT EXISTS idx_attachments_messageId ON attachments(messageId)');
          tx.executeSql('CREATE INDEX IF NOT EXISTS idx_attachments_chatId ON attachments(chatId)');
          tx.executeSql('CREATE INDEX IF NOT EXISTS idx_attachments_type ON attachments(type)');
        },
        (error) => {
          console.error('SQL error:', error);
          reject(error);
        },
        () => {
          console.log('Database tables created successfully');
          resolve();
        }
      );
    });
  }
  
  // === MESSAGE OPERATIONS ===
  
  async insertMessage(message: Message): Promise<void> {
    if (!this.isAvailable()) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          `INSERT INTO messages (
            id, chatId, senderId, senderName, content, type, imageUrl, 
            timestamp, syncStatus, deliveryStatus, readBy, deliveredTo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            message.id,
            message.chatId,
            message.senderId,
            message.senderName,
            message.content || '',
            message.type,
            message.imageUrl || '',
            message.timestamp,
            message.syncStatus || 'pending',
            message.deliveryStatus || 'sending',
            JSON.stringify(message.readBy || [message.senderId]),
            JSON.stringify(message.deliveredTo || [message.senderId])
          ],
          (_, result) => {
            console.log('Message inserted:', message.id);
            resolve();
          },
          (_, error) => {
            console.error('Insert message error:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  async insertOrUpdateMessage(message: any): Promise<void> {
    if (!this.isAvailable()) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          `INSERT OR REPLACE INTO messages (
            id, chatId, senderId, senderName, content, type, imageUrl,
            timestamp, syncStatus, deliveryStatus, readBy, deliveredTo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            message.id,
            message.chatId,
            message.senderId,
            message.senderName || 'Unknown',
            message.content || '',
            message.type,
            message.imageUrl || '',
            message.timestamp,
            message.syncStatus || 'synced',
            message.deliveryStatus || 'delivered',
            JSON.stringify(message.readBy || []),
            JSON.stringify(message.deliveredTo || [])
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  async getMessages(chatId: string, limitCount: number = 50): Promise<Message[]> {
    if (!this.isAvailable()) return Promise.resolve([]);
    
    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp DESC LIMIT ?',
          [chatId, limitCount],
          (_, { rows }) => {
            const messages = rows._array.map((row: any) => ({
              ...row,
              readBy: JSON.parse(row.readBy || '[]'),
              deliveredTo: JSON.parse(row.deliveredTo || '[]')
            }));
            resolve(messages as Message[]);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  async getMessage(messageId: string): Promise<Message | null> {
    if (!this.isAvailable()) return Promise.resolve(null);
    
    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM messages WHERE id = ?',
          [messageId],
          (_, { rows }) => {
            if (rows.length > 0) {
              const row = rows._array[0];
              resolve({
                ...row,
                readBy: JSON.parse(row.readBy || '[]'),
                deliveredTo: JSON.parse(row.deliveredTo || '[]')
              } as Message);
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  async getPendingMessages(): Promise<Message[]> {
    if (!this.isAvailable()) return Promise.resolve([]);
    
    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          "SELECT * FROM messages WHERE syncStatus IN ('pending', 'failed') ORDER BY timestamp ASC",
          [],
          (_, { rows }) => {
            const messages = rows._array.map((row: any) => ({
              ...row,
              readBy: JSON.parse(row.readBy || '[]'),
              deliveredTo: JSON.parse(row.deliveredTo || '[]')
            }));
            resolve(messages as Message[]);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  async updateMessageStatus(
    messageId: string,
    syncStatus: string,
    deliveryStatus: string | null = null
  ): Promise<void> {
    if (!this.isAvailable()) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          'UPDATE messages SET syncStatus = ?, deliveryStatus = ? WHERE id = ?',
          [syncStatus, deliveryStatus, messageId],
          () => {
            console.log('Message status updated:', messageId, syncStatus, deliveryStatus);
            resolve();
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  async getUnreadMessages(chatId: string, userId: string): Promise<Message[]> {
    if (!this.isAvailable()) return Promise.resolve([]);
    
    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM messages WHERE chatId = ? AND senderId != ?',
          [chatId, userId],
          (_, { rows }) => {
            const messages = rows._array
              .map((row: any) => ({
                ...row,
                readBy: JSON.parse(row.readBy || '[]'),
                deliveredTo: JSON.parse(row.deliveredTo || '[]')
              }))
              .filter((msg: Message) => !msg.readBy?.includes(userId));
            
            resolve(messages as Message[]);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  /**
   * Mark a message as delivered for a specific user
   */
  async markMessageAsDelivered(messageId: string, userId: string): Promise<void> {
    if (!this.isAvailable()) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        // First, get the current deliveredTo array
        tx.executeSql(
          'SELECT deliveredTo FROM messages WHERE id = ?',
          [messageId],
          (_, { rows }) => {
            if (rows.length === 0) {
              reject(new Error('Message not found'));
              return;
            }
            
            const deliveredTo = JSON.parse(rows.item(0).deliveredTo || '[]');
            
            // Add userId if not already in the array
            if (!deliveredTo.includes(userId)) {
              deliveredTo.push(userId);
            }
            
            // Update the message
            tx.executeSql(
              'UPDATE messages SET deliveredTo = ?, deliveryStatus = ? WHERE id = ?',
              [JSON.stringify(deliveredTo), 'delivered', messageId],
              () => {
                console.log('Message marked as delivered:', messageId, userId);
                resolve();
              },
              (_, error) => {
                reject(error);
                return false;
              }
            );
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  /**
   * Mark a message as read for a specific user
   */
  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    if (!this.isAvailable()) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        // First, get the current readBy and deliveredTo arrays
        tx.executeSql(
          'SELECT readBy, deliveredTo FROM messages WHERE id = ?',
          [messageId],
          (_, { rows }) => {
            if (rows.length === 0) {
              reject(new Error('Message not found'));
              return;
            }
            
            const readBy = JSON.parse(rows.item(0).readBy || '[]');
            const deliveredTo = JSON.parse(rows.item(0).deliveredTo || '[]');
            
            // Add userId to readBy if not already there
            if (!readBy.includes(userId)) {
              readBy.push(userId);
            }
            
            // Add userId to deliveredTo if not already there (reading implies delivery)
            if (!deliveredTo.includes(userId)) {
              deliveredTo.push(userId);
            }
            
            // Update the message
            tx.executeSql(
              'UPDATE messages SET readBy = ?, deliveredTo = ?, deliveryStatus = ? WHERE id = ?',
              [JSON.stringify(readBy), JSON.stringify(deliveredTo), 'read', messageId],
              () => {
                console.log('Message marked as read:', messageId, userId);
                resolve();
              },
              (_, error) => {
                reject(error);
                return false;
              }
            );
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  /**
   * Mark all unread messages in a chat as read (batch operation)
   */
  async markAllMessagesAsRead(chatId: string, userId: string): Promise<string[]> {
    if (!this.isAvailable()) return Promise.resolve([]);
    
    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        // First, get all unread messages
        tx.executeSql(
          'SELECT id, readBy, deliveredTo FROM messages WHERE chatId = ? AND senderId != ?',
          [chatId, userId],
          (_, { rows }) => {
            const messagesToUpdate: string[] = [];
            
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);
              const readBy = JSON.parse(row.readBy || '[]');
              
              // Only update if user hasn't read it yet
              if (!readBy.includes(userId)) {
                messagesToUpdate.push(row.id);
              }
            }
            
            if (messagesToUpdate.length === 0) {
              resolve([]);
              return;
            }
            
            // Update each message
            let completed = 0;
            messagesToUpdate.forEach((messageId) => {
              tx.executeSql(
                'SELECT readBy, deliveredTo FROM messages WHERE id = ?',
                [messageId],
                (_, { rows }) => {
                  const readBy = JSON.parse(rows.item(0).readBy || '[]');
                  const deliveredTo = JSON.parse(rows.item(0).deliveredTo || '[]');
                  
                  if (!readBy.includes(userId)) {
                    readBy.push(userId);
                  }
                  if (!deliveredTo.includes(userId)) {
                    deliveredTo.push(userId);
                  }
                  
                  tx.executeSql(
                    'UPDATE messages SET readBy = ?, deliveredTo = ?, deliveryStatus = ? WHERE id = ?',
                    [JSON.stringify(readBy), JSON.stringify(deliveredTo), 'read', messageId],
                    () => {
                      completed++;
                      if (completed === messagesToUpdate.length) {
                        console.log(`Marked ${completed} messages as read in chat ${chatId}`);
                        resolve(messagesToUpdate);
                      }
                    }
                  );
                }
              );
            });
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  // === SEARCH OPERATIONS ===
  
  /**
   * Search messages by content (BASIC - uses LIKE)
   */
  async searchMessages(searchQuery: string, limitCount: number = 20): Promise<Message[]> {
    if (!this.isAvailable()) return Promise.resolve([]);

    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM messages
           WHERE content LIKE ?
           ORDER BY timestamp DESC
           LIMIT ?`,
          [`%${searchQuery}%`, limitCount],
          (_, { rows }) => {
            const messages = rows._array.map((row: any) => ({
              ...row,
              readBy: JSON.parse(row.readBy || '[]'),
              deliveredTo: JSON.parse(row.deliveredTo || '[]'),
              priority: row.priority ? JSON.parse(row.priority) : undefined
            }));
            resolve(messages as Message[]);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Search messages with FTS5 (ADVANCED - faster and supports fuzzy matching)
   */
  async searchMessagesFTS(searchQuery: string, limitCount: number = 50): Promise<Message[]> {
    if (!this.isAvailable()) return Promise.resolve([]);

    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        // Try FTS5 search first
        tx.executeSql(
          `SELECT m.*, bm25(messages_fts) as rank
           FROM messages m
           JOIN messages_fts ON m.rowid = messages_fts.rowid
           WHERE messages_fts MATCH ?
           ORDER BY rank, m.timestamp DESC
           LIMIT ?`,
          [searchQuery, limitCount],
          (_, { rows }) => {
            const messages = rows._array.map((row: any) => ({
              ...row,
              readBy: JSON.parse(row.readBy || '[]'),
              deliveredTo: JSON.parse(row.deliveredTo || '[]'),
              priority: row.priority ? JSON.parse(row.priority) : undefined,
              relevanceScore: Math.abs(row.rank) // BM25 score (negative, so we abs it)
            }));
            resolve(messages as Message[]);
          },
          (_, error) => {
            // Fallback to basic LIKE search if FTS5 fails
            console.warn('FTS5 search failed, falling back to LIKE search', error);
            this.searchMessages(searchQuery, limitCount).then(resolve).catch(reject);
            return false;
          }
        );
      });
    });
  }

  /**
   * Search messages with smart ranking (recency + exact match + frequency)
   */
  async searchMessagesWithRanking(
    searchQuery: string,
    currentUserId: string,
    limitCount: number = 50
  ): Promise<(Message & { relevanceScore: number })[]> {
    if (!this.isAvailable()) return Promise.resolve([]);

    const query = searchQuery.toLowerCase().trim();

    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        // Get frequent contacts (top 10 by message count)
        tx.executeSql(
          `SELECT senderId, COUNT(*) as count
           FROM messages
           WHERE senderId != ?
           GROUP BY senderId
           ORDER BY count DESC
           LIMIT 10`,
          [currentUserId],
          (_, { rows }) => {
            const frequentContacts = new Set(rows._array.map(r => r.senderId));

            // Try FTS5 search with ranking
            tx.executeSql(
              `SELECT m.*,
                      bm25(messages_fts) as fts_rank,
                      (CASE
                        WHEN m.timestamp > ? THEN 0.3
                        ELSE 0
                      END) as recency_score,
                      (CASE
                        WHEN LOWER(m.content) = ? THEN 0.5
                        WHEN LOWER(m.content) LIKE ? THEN 0.3
                        ELSE 0
                      END) as exact_match_score
               FROM messages m
               JOIN messages_fts ON m.rowid = messages_fts.rowid
               WHERE messages_fts MATCH ?
               ORDER BY (ABS(bm25(messages_fts)) + recency_score + exact_match_score) DESC, m.timestamp DESC
               LIMIT ?`,
              [
                Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
                query,
                `%${query}%`,
                searchQuery,
                limitCount
              ],
              (_, { rows }) => {
                const messages = rows._array.map((row: any) => {
                  const frequencyScore = frequentContacts.has(row.senderId) ? 0.2 : 0;
                  const totalScore = Math.abs(row.fts_rank || 0) +
                                   (row.recency_score || 0) +
                                   (row.exact_match_score || 0) +
                                   frequencyScore;

                  return {
                    ...row,
                    readBy: JSON.parse(row.readBy || '[]'),
                    deliveredTo: JSON.parse(row.deliveredTo || '[]'),
                    priority: row.priority ? JSON.parse(row.priority) : undefined,
                    relevanceScore: totalScore
                  };
                });
                resolve(messages as (Message & { relevanceScore: number })[]);
              },
              (_, error) => {
                // Fallback to basic search
                console.warn('FTS5 ranked search failed, falling back', error);
                this.searchMessages(searchQuery, limitCount)
                  .then((msgs) => resolve(msgs.map(m => ({ ...m, relevanceScore: 0.5 }))))
                  .catch(reject);
                return false;
              }
            );
          }
        );
      });
    });
  }
  
  /**
   * Search chats by name
   */
  async searchChats(searchQuery: string, currentUserId: string): Promise<Chat[]> {
    if (!this.isAvailable()) return Promise.resolve([]);
    
    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM chats 
           WHERE name LIKE ? 
           AND participants LIKE ?
           ORDER BY updatedAt DESC`,
          [`%${searchQuery}%`, `%${currentUserId}%`],
          (_, { rows }) => {
            const chats = rows._array.map((row: any) => ({
              ...row,
              participants: JSON.parse(row.participants || '[]'),
              admins: JSON.parse(row.admins || '[]'),
              lastMessage: row.lastMessage ? JSON.parse(row.lastMessage) : undefined
            }));
            resolve(chats as Chat[]);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  // === CHAT OPERATIONS ===
  
  async insertChat(chat: Chat): Promise<void> {
    if (!this.isAvailable()) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          `INSERT OR REPLACE INTO chats (
            id, type, name, groupPicture, participants, participantDetails, admins, 
            lastMessage, updatedAt, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            chat.id,
            chat.type,
            chat.name || '',
            chat.groupPicture || '',
            JSON.stringify(chat.participants),
            JSON.stringify(chat.participantDetails || {}),
            JSON.stringify(chat.admins || []),
            JSON.stringify(chat.lastMessage || null),
            chat.updatedAt || Date.now(),
            chat.createdAt || Date.now()
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  async getChats(userId: string): Promise<Chat[]> {
    if (!this.isAvailable()) return Promise.resolve([]);
    
    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM chats WHERE participants LIKE ? ORDER BY updatedAt DESC`,
          [`%"${userId}"%`], // Match userId in JSON array
          (_, { rows }) => {
            const chats = rows._array.map((row: any) => ({
              ...row,
              participants: JSON.parse(row.participants),
              participantDetails: row.participantDetails ? JSON.parse(row.participantDetails) : {},
              admins: JSON.parse(row.admins || '[]'),
              lastMessage: row.lastMessage ? JSON.parse(row.lastMessage) : null
            }));
            resolve(chats as Chat[]);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  async getChat(chatId: string): Promise<Chat | null> {
    if (!this.isAvailable()) return Promise.resolve(null);
    
    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM chats WHERE id = ?',
          [chatId],
          (_, { rows }) => {
            if (rows.length > 0) {
              const row = rows._array[0];
              resolve({
                ...row,
                participants: JSON.parse(row.participants),
                participantDetails: row.participantDetails ? JSON.parse(row.participantDetails) : {},
                admins: JSON.parse(row.admins || '[]'),
                lastMessage: row.lastMessage ? JSON.parse(row.lastMessage) : null
              } as Chat);
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  async updateChat(chatId: string, updates: Partial<Chat>): Promise<void> {
    if (!this.isAvailable()) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        const setClauses: string[] = [];
        const values: any[] = [];
        
        if (updates.name !== undefined) {
          setClauses.push('name = ?');
          values.push(updates.name);
        }
        if (updates.groupPicture !== undefined) {
          setClauses.push('groupPicture = ?');
          values.push(updates.groupPicture);
        }
        if (updates.participants !== undefined) {
          setClauses.push('participants = ?');
          values.push(JSON.stringify(updates.participants));
        }
        if (updates.participantDetails !== undefined) {
          setClauses.push('participantDetails = ?');
          values.push(JSON.stringify(updates.participantDetails));
        }
        if (updates.admins !== undefined) {
          setClauses.push('admins = ?');
          values.push(JSON.stringify(updates.admins));
        }
        if (updates.lastMessage !== undefined) {
          setClauses.push('lastMessage = ?');
          values.push(JSON.stringify(updates.lastMessage));
        }
        
        setClauses.push('updatedAt = ?');
        values.push(Date.now());
        
        values.push(chatId);
        
        tx.executeSql(
          `UPDATE chats SET ${setClauses.join(', ')} WHERE id = ?`,
          values,
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  async deleteChat(chatId: string): Promise<void> {
    if (!this.isAvailable()) return Promise.resolve();

    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        // Delete attachments first
        tx.executeSql('DELETE FROM attachments WHERE chatId = ?', [chatId]);

        // Delete messages
        tx.executeSql('DELETE FROM messages WHERE chatId = ?', [chatId]);

        // Delete chat
        tx.executeSql(
          'DELETE FROM chats WHERE id = ?',
          [chatId],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // === ATTACHMENT OPERATIONS ===

  /**
   * Insert an attachment
   */
  async insertAttachment(attachment: {
    id: string;
    messageId: string;
    chatId: string;
    type: 'photo' | 'link' | 'document' | 'location';
    url?: string;
    metadata?: any;
    timestamp: number;
  }): Promise<void> {
    if (!this.isAvailable()) return Promise.resolve();

    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          `INSERT OR REPLACE INTO attachments (id, messageId, chatId, type, url, metadata, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            attachment.id,
            attachment.messageId,
            attachment.chatId,
            attachment.type,
            attachment.url || '',
            JSON.stringify(attachment.metadata || {}),
            attachment.timestamp
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Get attachments for a message
   */
  async getAttachmentsByMessage(messageId: string): Promise<any[]> {
    if (!this.isAvailable()) return Promise.resolve([]);

    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM attachments WHERE messageId = ?',
          [messageId],
          (_, { rows }) => {
            const attachments = rows._array.map((row: any) => ({
              ...row,
              metadata: JSON.parse(row.metadata || '{}')
            }));
            resolve(attachments);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Get attachments by type (photos, links, documents)
   */
  async getAttachmentsByType(
    type: 'photo' | 'link' | 'document' | 'location',
    chatId?: string,
    limitCount: number = 50
  ): Promise<any[]> {
    if (!this.isAvailable()) return Promise.resolve([]);

    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        const query = chatId
          ? 'SELECT * FROM attachments WHERE type = ? AND chatId = ? ORDER BY timestamp DESC LIMIT ?'
          : 'SELECT * FROM attachments WHERE type = ? ORDER BY timestamp DESC LIMIT ?';
        const params = chatId ? [type, chatId, limitCount] : [type, limitCount];

        tx.executeSql(
          query,
          params,
          (_, { rows }) => {
            const attachments = rows._array.map((row: any) => ({
              ...row,
              metadata: JSON.parse(row.metadata || '{}')
            }));
            resolve(attachments);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Search attachments
   */
  async searchAttachments(
    searchQuery: string,
    type?: 'photo' | 'link' | 'document' | 'location',
    limitCount: number = 50
  ): Promise<any[]> {
    if (!this.isAvailable()) return Promise.resolve([]);

    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        const query = type
          ? `SELECT * FROM attachments WHERE type = ? AND (url LIKE ? OR metadata LIKE ?) ORDER BY timestamp DESC LIMIT ?`
          : `SELECT * FROM attachments WHERE (url LIKE ? OR metadata LIKE ?) ORDER BY timestamp DESC LIMIT ?`;
        const params = type
          ? [type, `%${searchQuery}%`, `%${searchQuery}%`, limitCount]
          : [`%${searchQuery}%`, `%${searchQuery}%`, limitCount];

        tx.executeSql(
          query,
          params,
          (_, { rows }) => {
            const attachments = rows._array.map((row: any) => ({
              ...row,
              metadata: JSON.parse(row.metadata || '{}')
            }));
            resolve(attachments);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Delete attachments for a message
   */
  async deleteAttachmentsByMessage(messageId: string): Promise<void> {
    if (!this.isAvailable()) return Promise.resolve();

    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          'DELETE FROM attachments WHERE messageId = ?',
          [messageId],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
}

export const db = new DatabaseService();

export const initializeDatabase = async () => {
  await db.init();
};

