import SQLite from 'react-native-sqlite-storage';
import { logger } from '../utils/logger';

// Enable promise-based API
SQLite.enablePromise(true);

export interface OfflineEntity {
  id: string;
  type: 'property' | 'customer' | 'lead' | 'booking' | 'payment' | 'transaction';
  data: any;
  syncStatus: 'pending' | 'synced' | 'failed';
  lastModified: number;
  createdAt: number;
  updatedAt: number;
}

export interface SyncQueue {
  id: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  retryCount: number;
  maxRetries: number;
  createdAt: number;
  lastAttempt: number;
  error?: string;
}

class OfflineDatabase {
  private static instance: OfflineDatabase;
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): OfflineDatabase {
    if (!OfflineDatabase.instance) {
      OfflineDatabase.instance = new OfflineDatabase();
    }
    return OfflineDatabase.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.db = await SQLite.openDatabase({
        name: 'PropertyManagementOffline.db',
        location: 'default',
      });

      await this.createTables();
      this.isInitialized = true;
      
      logger.info('Offline database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize offline database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tables = [
      // Offline entities table
      `CREATE TABLE IF NOT EXISTS offline_entities (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        last_modified INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      
      // Sync queue table
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        data TEXT NOT NULL,
        retry_count INTEGER NOT NULL DEFAULT 0,
        max_retries INTEGER NOT NULL DEFAULT 3,
        created_at INTEGER NOT NULL,
        last_attempt INTEGER NOT NULL DEFAULT 0,
        error TEXT
      )`,
      
      // Sync status table
      `CREATE TABLE IF NOT EXISTS sync_status (
        id TEXT PRIMARY KEY,
        last_sync_time INTEGER,
        pending_count INTEGER NOT NULL DEFAULT 0,
        failed_count INTEGER NOT NULL DEFAULT 0,
        is_syncing INTEGER NOT NULL DEFAULT 0
      )`,
      
      // Offline settings table
      `CREATE TABLE IF NOT EXISTS offline_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
    ];

    for (const table of tables) {
      await this.db.executeSql(table);
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_offline_entities_type ON offline_entities(type)',
      'CREATE INDEX IF NOT EXISTS idx_offline_entities_sync_status ON offline_entities(sync_status)',
      'CREATE INDEX IF NOT EXISTS idx_offline_entities_last_modified ON offline_entities(last_modified)',
      'CREATE INDEX IF NOT EXISTS idx_sync_queue_entity_type ON sync_queue(entity_type)',
      'CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at ON sync_queue(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_sync_queue_retry_count ON sync_queue(retry_count)',
    ];

    for (const index of indexes) {
      await this.db.executeSql(index);
    }
  }

  public async saveEntity(entity: OfflineEntity): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const query = `
        INSERT OR REPLACE INTO offline_entities 
        (id, type, data, sync_status, last_modified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await this.db.executeSql(query, [
        entity.id,
        entity.type,
        JSON.stringify(entity.data),
        entity.syncStatus,
        entity.lastModified,
        entity.createdAt,
        entity.updatedAt,
      ]);

      logger.debug('Entity saved to offline database', { id: entity.id, type: entity.type });
    } catch (error) {
      logger.error('Failed to save entity to offline database:', error);
      throw error;
    }
  }

  public async getEntity(id: string): Promise<OfflineEntity | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const query = 'SELECT * FROM offline_entities WHERE id = ?';
      const [results] = await this.db.executeSql(query, [id]);

      if (results.rows.length === 0) {
        return null;
      }

      const row = results.rows.item(0);
      return {
        id: row.id,
        type: row.type,
        data: JSON.parse(row.data),
        syncStatus: row.sync_status,
        lastModified: row.last_modified,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      logger.error('Failed to get entity from offline database:', error);
      throw error;
    }
  }

  public async getEntitiesByType(type: string): Promise<OfflineEntity[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const query = 'SELECT * FROM offline_entities WHERE type = ? ORDER BY last_modified DESC';
      const [results] = await this.db.executeSql(query, [type]);

      const entities: OfflineEntity[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        entities.push({
          id: row.id,
          type: row.type,
          data: JSON.parse(row.data),
          syncStatus: row.sync_status,
          lastModified: row.last_modified,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      }

      return entities;
    } catch (error) {
      logger.error('Failed to get entities by type from offline database:', error);
      throw error;
    }
  }

  public async updateEntity(id: string, data: any): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const query = `
        UPDATE offline_entities 
        SET data = ?, sync_status = 'pending', last_modified = ?, updated_at = ?
        WHERE id = ?
      `;

      await this.db.executeSql(query, [
        JSON.stringify(data),
        Date.now(),
        Date.now(),
        id,
      ]);

      logger.debug('Entity updated in offline database', { id });
    } catch (error) {
      logger.error('Failed to update entity in offline database:', error);
      throw error;
    }
  }

  public async deleteEntity(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const query = 'DELETE FROM offline_entities WHERE id = ?';
      await this.db.executeSql(query, [id]);

      logger.debug('Entity deleted from offline database', { id });
    } catch (error) {
      logger.error('Failed to delete entity from offline database:', error);
      throw error;
    }
  }

  public async addToSyncQueue(queueItem: Omit<SyncQueue, 'id'>): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const query = `
        INSERT INTO sync_queue 
        (id, entity_type, entity_id, action, data, retry_count, max_retries, created_at, last_attempt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await this.db.executeSql(query, [
        id,
        queueItem.entityType,
        queueItem.entityId,
        queueItem.action,
        JSON.stringify(queueItem.data),
        queueItem.retryCount,
        queueItem.maxRetries,
        queueItem.createdAt,
        queueItem.lastAttempt,
      ]);

      logger.debug('Item added to sync queue', { id, entityType: queueItem.entityType });
    } catch (error) {
      logger.error('Failed to add item to sync queue:', error);
      throw error;
    }
  }

  public async getSyncQueue(): Promise<SyncQueue[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const query = 'SELECT * FROM sync_queue ORDER BY created_at ASC';
      const [results] = await this.db.executeSql(query);

      const queueItems: SyncQueue[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        queueItems.push({
          id: row.id,
          entityType: row.entity_type,
          entityId: row.entity_id,
          action: row.action,
          data: JSON.parse(row.data),
          retryCount: row.retry_count,
          maxRetries: row.max_retries,
          createdAt: row.created_at,
          lastAttempt: row.last_attempt,
          error: row.error,
        });
      }

      return queueItems;
    } catch (error) {
      logger.error('Failed to get sync queue from offline database:', error);
      throw error;
    }
  }

  public async updateSyncQueueItem(id: string, updates: Partial<SyncQueue>): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const setClause = Object.keys(updates)
        .filter(key => key !== 'id')
        .map(key => `${key} = ?`)
        .join(', ');

      const values = Object.values(updates).filter(value => value !== undefined);
      values.push(id);

      const query = `UPDATE sync_queue SET ${setClause} WHERE id = ?`;
      await this.db.executeSql(query, values);

      logger.debug('Sync queue item updated', { id });
    } catch (error) {
      logger.error('Failed to update sync queue item:', error);
      throw error;
    }
  }

  public async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const query = 'DELETE FROM sync_queue WHERE id = ?';
      await this.db.executeSql(query, [id]);

      logger.debug('Item removed from sync queue', { id });
    } catch (error) {
      logger.error('Failed to remove item from sync queue:', error);
      throw error;
    }
  }

  public async updateSyncStatus(status: {
    lastSyncTime?: number;
    pendingCount?: number;
    failedCount?: number;
    isSyncing?: boolean;
  }): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const query = `
        INSERT OR REPLACE INTO sync_status 
        (id, last_sync_time, pending_count, failed_count, is_syncing)
        VALUES ('main', ?, ?, ?, ?)
      `;

      await this.db.executeSql(query, [
        status.lastSyncTime || null,
        status.pendingCount || 0,
        status.failedCount || 0,
        status.isSyncing ? 1 : 0,
      ]);

      logger.debug('Sync status updated', status);
    } catch (error) {
      logger.error('Failed to update sync status:', error);
      throw error;
    }
  }

  public async getSyncStatus(): Promise<{
    lastSyncTime: number | null;
    pendingCount: number;
    failedCount: number;
    isSyncing: boolean;
  }> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const query = 'SELECT * FROM sync_status WHERE id = "main"';
      const [results] = await this.db.executeSql(query);

      if (results.rows.length === 0) {
        return {
          lastSyncTime: null,
          pendingCount: 0,
          failedCount: 0,
          isSyncing: false,
        };
      }

      const row = results.rows.item(0);
      return {
        lastSyncTime: row.last_sync_time,
        pendingCount: row.pending_count,
        failedCount: row.failed_count,
        isSyncing: row.is_syncing === 1,
      };
    } catch (error) {
      logger.error('Failed to get sync status:', error);
      throw error;
    }
  }

  public async setOfflineSetting(key: string, value: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const query = `
        INSERT OR REPLACE INTO offline_settings 
        (key, value, updated_at)
        VALUES (?, ?, ?)
      `;

      await this.db.executeSql(query, [key, value, Date.now()]);

      logger.debug('Offline setting saved', { key, value });
    } catch (error) {
      logger.error('Failed to save offline setting:', error);
      throw error;
    }
  }

  public async getOfflineSetting(key: string): Promise<string | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const query = 'SELECT value FROM offline_settings WHERE key = ?';
      const [results] = await this.db.executeSql(query, [key]);

      if (results.rows.length === 0) {
        return null;
      }

      return results.rows.item(0).value;
    } catch (error) {
      logger.error('Failed to get offline setting:', error);
      throw error;
    }
  }

  public async clearAllData(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const tables = ['offline_entities', 'sync_queue', 'sync_status', 'offline_settings'];
      
      for (const table of tables) {
        await this.db.executeSql(`DELETE FROM ${table}`);
      }

      logger.info('All offline data cleared');
    } catch (error) {
      logger.error('Failed to clear offline data:', error);
      throw error;
    }
  }

  public async getDatabaseSize(): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const query = `
        SELECT 
          (SELECT COUNT(*) FROM offline_entities) as entities_count,
          (SELECT COUNT(*) FROM sync_queue) as queue_count,
          (SELECT COUNT(*) FROM offline_settings) as settings_count
      `;
      
      const [results] = await this.db.executeSql(query);
      const row = results.rows.item(0);
      
      return row.entities_count + row.queue_count + row.settings_count;
    } catch (error) {
      logger.error('Failed to get database size:', error);
      return 0;
    }
  }

  public async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
      logger.info('Offline database closed');
    }
  }
}

export default OfflineDatabase;
