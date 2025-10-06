import OfflineDatabase from './offlineDatabase';
import ApiService from './apiService';
import { logger } from '../utils/logger';
import NetInfo from '@react-native-community/netinfo';

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  current: string;
  isRunning: boolean;
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  failedItems: number;
  errors: string[];
  duration: number;
}

class SyncManager {
  private static instance: SyncManager;
  private offlineDb: OfflineDatabase;
  private apiService: ApiService;
  private isOnline: boolean = false;
  private isSyncing: boolean = false;
  private syncListeners: Array<(progress: SyncProgress) => void> = [];
  private resultListeners: Array<(result: SyncResult) => void> = [];

  private constructor() {
    this.offlineDb = OfflineDatabase.getInstance();
    this.apiService = ApiService.getInstance();
    this.initializeNetworkListener();
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  private async initializeNetworkListener(): Promise<void> {
    try {
      // Check initial network state
      const netInfo = await NetInfo.fetch();
      this.isOnline = netInfo.isConnected ?? false;

      // Listen for network changes
      NetInfo.addEventListener(state => {
        const wasOnline = this.isOnline;
        this.isOnline = state.isConnected ?? false;

        if (!wasOnline && this.isOnline) {
          // Just came online, start syncing
          this.syncData();
        }

        logger.info('Network state changed', { 
          isOnline: this.isOnline, 
          wasOnline 
        });
      });
    } catch (error) {
      logger.error('Failed to initialize network listener:', error);
    }
  }

  public async initialize(): Promise<void> {
    try {
      await this.offlineDb.initialize();
      logger.info('Sync manager initialized');
    } catch (error) {
      logger.error('Failed to initialize sync manager:', error);
      throw error;
    }
  }

  public async syncData(): Promise<SyncResult> {
    if (this.isSyncing) {
      logger.warn('Sync already in progress');
      return {
        success: false,
        syncedItems: 0,
        failedItems: 0,
        errors: ['Sync already in progress'],
        duration: 0,
      };
    }

    if (!this.isOnline) {
      logger.warn('Cannot sync: device is offline');
      return {
        success: false,
        syncedItems: 0,
        failedItems: 0,
        errors: ['Device is offline'],
        duration: 0,
      };
    }

    this.isSyncing = true;
    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      failedItems: 0,
      errors: [],
      duration: 0,
    };

    try {
      logger.info('Starting data synchronization');

      // Update sync status
      await this.offlineDb.updateSyncStatus({ isSyncing: true });

      // Get sync queue
      const syncQueue = await this.offlineDb.getSyncQueue();
      const totalItems = syncQueue.length;

      if (totalItems === 0) {
        logger.info('No items to sync');
        result.success = true;
        result.duration = Date.now() - startTime;
        return result;
      }

      logger.info(`Syncing ${totalItems} items`);

      // Process sync queue
      for (let i = 0; i < syncQueue.length; i++) {
        const item = syncQueue[i];
        
        try {
          // Update progress
          this.notifyProgressListeners({
            total: totalItems,
            completed: i,
            failed: result.failedItems,
            current: `${item.action} ${item.entityType}`,
            isRunning: true,
          });

          // Process the sync item
          await this.processSyncItem(item);
          
          // Remove from queue on success
          await this.offlineDb.removeFromSyncQueue(item.id);
          result.syncedItems++;

          logger.debug('Sync item processed successfully', { 
            id: item.id, 
            entityType: item.entityType,
            action: item.action 
          });

        } catch (error) {
          result.failedItems++;
          result.errors.push(`Failed to sync ${item.entityType} ${item.entityId}: ${error.message}`);
          
          // Update retry count
          const newRetryCount = item.retryCount + 1;
          if (newRetryCount >= item.maxRetries) {
            // Max retries reached, remove from queue
            await this.offlineDb.removeFromSyncQueue(item.id);
            logger.error('Max retries reached for sync item', { 
              id: item.id, 
              retryCount: newRetryCount 
            });
          } else {
            // Update retry count and last attempt time
            await this.offlineDb.updateSyncQueueItem(item.id, {
              retryCount: newRetryCount,
              lastAttempt: Date.now(),
              error: error.message,
            });
            logger.warn('Sync item failed, will retry', { 
              id: item.id, 
              retryCount: newRetryCount 
            });
          }
        }
      }

      // Update final progress
      this.notifyProgressListeners({
        total: totalItems,
        completed: result.syncedItems,
        failed: result.failedItems,
        current: 'Sync completed',
        isRunning: false,
      });

      result.success = result.failedItems === 0;
      result.duration = Date.now() - startTime;

      // Update sync status
      await this.offlineDb.updateSyncStatus({
        lastSyncTime: Date.now(),
        pendingCount: 0,
        failedCount: result.failedItems,
        isSyncing: false,
      });

      logger.info('Data synchronization completed', result);

    } catch (error) {
      result.success = false;
      result.errors.push(`Sync failed: ${error.message}`);
      result.duration = Date.now() - startTime;
      
      logger.error('Data synchronization failed:', error);
    } finally {
      this.isSyncing = false;
      this.notifyResultListeners(result);
    }

    return result;
  }

  private async processSyncItem(item: any): Promise<void> {
    const { entityType, entityId, action, data } = item;

    switch (entityType) {
      case 'property':
        await this.syncProperty(entityId, action, data);
        break;
      case 'customer':
        await this.syncCustomer(entityId, action, data);
        break;
      case 'lead':
        await this.syncLead(entityId, action, data);
        break;
      case 'booking':
        await this.syncBooking(entityId, action, data);
        break;
      case 'payment':
        await this.syncPayment(entityId, action, data);
        break;
      case 'transaction':
        await this.syncTransaction(entityId, action, data);
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  private async syncProperty(entityId: string, action: string, data: any): Promise<void> {
    switch (action) {
      case 'create':
        await this.apiService.createProperty(data);
        break;
      case 'update':
        await this.apiService.updateProperty(entityId, data);
        break;
      case 'delete':
        await this.apiService.deleteProperty(entityId);
        break;
    }
  }

  private async syncCustomer(entityId: string, action: string, data: any): Promise<void> {
    switch (action) {
      case 'create':
        await this.apiService.createCustomer(data);
        break;
      case 'update':
        await this.apiService.updateCustomer(entityId, data);
        break;
      case 'delete':
        await this.apiService.deleteCustomer(entityId);
        break;
    }
  }

  private async syncLead(entityId: string, action: string, data: any): Promise<void> {
    switch (action) {
      case 'create':
        await this.apiService.createLead(data);
        break;
      case 'update':
        await this.apiService.updateLead(entityId, data);
        break;
      case 'delete':
        await this.apiService.deleteLead(entityId);
        break;
    }
  }

  private async syncBooking(entityId: string, action: string, data: any): Promise<void> {
    switch (action) {
      case 'create':
        await this.apiService.createBooking(data);
        break;
      case 'update':
        await this.apiService.updateBooking(entityId, data);
        break;
      case 'delete':
        await this.apiService.deleteBooking(entityId);
        break;
    }
  }

  private async syncPayment(entityId: string, action: string, data: any): Promise<void> {
    switch (action) {
      case 'create':
        await this.apiService.createPayment(data);
        break;
      case 'update':
        await this.apiService.updatePayment(entityId, data);
        break;
      case 'delete':
        await this.apiService.deletePayment(entityId);
        break;
    }
  }

  private async syncTransaction(entityId: string, action: string, data: any): Promise<void> {
    // Transactions are typically read-only in the frontend
    // This would be implemented based on specific requirements
    logger.warn('Transaction sync not implemented', { entityId, action });
  }

  public async saveOfflineEntity(
    type: string,
    data: any,
    action: 'create' | 'update' | 'delete' = 'create'
  ): Promise<string> {
    try {
      const id = action === 'create' ? `offline_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : data.id;
      
      // Save to offline database
      await this.offlineDb.saveEntity({
        id,
        type,
        data,
        syncStatus: 'pending',
        lastModified: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Add to sync queue
      await this.offlineDb.addToSyncQueue({
        entityType: type,
        entityId: id,
        action,
        data,
        retryCount: 0,
        maxRetries: 3,
        createdAt: Date.now(),
        lastAttempt: 0,
      });

      logger.debug('Entity saved offline and queued for sync', { id, type, action });

      // Try to sync immediately if online
      if (this.isOnline && !this.isSyncing) {
        this.syncData();
      }

      return id;
    } catch (error) {
      logger.error('Failed to save offline entity:', error);
      throw error;
    }
  }

  public async getOfflineEntities(type: string): Promise<any[]> {
    try {
      const entities = await this.offlineDb.getEntitiesByType(type);
      return entities.map(entity => ({
        ...entity.data,
        id: entity.id,
        _offline: true,
        _syncStatus: entity.syncStatus,
        _lastModified: entity.lastModified,
      }));
    } catch (error) {
      logger.error('Failed to get offline entities:', error);
      throw error;
    }
  }

  public async getOfflineEntity(id: string): Promise<any | null> {
    try {
      const entity = await this.offlineDb.getEntity(id);
      if (!entity) {
        return null;
      }

      return {
        ...entity.data,
        id: entity.id,
        _offline: true,
        _syncStatus: entity.syncStatus,
        _lastModified: entity.lastModified,
      };
    } catch (error) {
      logger.error('Failed to get offline entity:', error);
      throw error;
    }
  }

  public async updateOfflineEntity(id: string, data: any): Promise<void> {
    try {
      // Update in offline database
      await this.offlineDb.updateEntity(id, data);

      // Add to sync queue
      await this.offlineDb.addToSyncQueue({
        entityType: data.type || 'unknown',
        entityId: id,
        action: 'update',
        data,
        retryCount: 0,
        maxRetries: 3,
        createdAt: Date.now(),
        lastAttempt: 0,
      });

      logger.debug('Offline entity updated and queued for sync', { id });

      // Try to sync immediately if online
      if (this.isOnline && !this.isSyncing) {
        this.syncData();
      }
    } catch (error) {
      logger.error('Failed to update offline entity:', error);
      throw error;
    }
  }

  public async deleteOfflineEntity(id: string, type: string): Promise<void> {
    try {
      // Add to sync queue for deletion
      await this.offlineDb.addToSyncQueue({
        entityType: type,
        entityId: id,
        action: 'delete',
        data: { id },
        retryCount: 0,
        maxRetries: 3,
        createdAt: Date.now(),
        lastAttempt: 0,
      });

      // Remove from offline database
      await this.offlineDb.deleteEntity(id);

      logger.debug('Offline entity deleted and queued for sync', { id, type });

      // Try to sync immediately if online
      if (this.isOnline && !this.isSyncing) {
        this.syncData();
      }
    } catch (error) {
      logger.error('Failed to delete offline entity:', error);
      throw error;
    }
  }

  public async getSyncStatus(): Promise<{
    isOnline: boolean;
    isSyncing: boolean;
    lastSyncTime: number | null;
    pendingCount: number;
    failedCount: number;
  }> {
    try {
      const status = await this.offlineDb.getSyncStatus();
      return {
        isOnline: this.isOnline,
        isSyncing: this.isSyncing,
        lastSyncTime: status.lastSyncTime,
        pendingCount: status.pendingCount,
        failedCount: status.failedCount,
      };
    } catch (error) {
      logger.error('Failed to get sync status:', error);
      return {
        isOnline: this.isOnline,
        isSyncing: false,
        lastSyncTime: null,
        pendingCount: 0,
        failedCount: 0,
      };
    }
  }

  public addProgressListener(listener: (progress: SyncProgress) => void): void {
    this.syncListeners.push(listener);
  }

  public removeProgressListener(listener: (progress: SyncProgress) => void): void {
    const index = this.syncListeners.indexOf(listener);
    if (index > -1) {
      this.syncListeners.splice(index, 1);
    }
  }

  public addResultListener(listener: (result: SyncResult) => void): void {
    this.resultListeners.push(listener);
  }

  public removeResultListener(listener: (result: SyncResult) => void): void {
    const index = this.resultListeners.indexOf(listener);
    if (index > -1) {
      this.resultListeners.splice(index, 1);
    }
  }

  private notifyProgressListeners(progress: SyncProgress): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(progress);
      } catch (error) {
        logger.error('Error in progress listener:', error);
      }
    });
  }

  private notifyResultListeners(result: SyncResult): void {
    this.resultListeners.forEach(listener => {
      try {
        listener(result);
      } catch (error) {
        logger.error('Error in result listener:', error);
      }
    });
  }

  public async forceSync(): Promise<SyncResult> {
    logger.info('Force sync requested');
    return this.syncData();
  }

  public async clearOfflineData(): Promise<void> {
    try {
      await this.offlineDb.clearAllData();
      logger.info('Offline data cleared');
    } catch (error) {
      logger.error('Failed to clear offline data:', error);
      throw error;
    }
  }

  public async getOfflineDataSize(): Promise<number> {
    try {
      return await this.offlineDb.getDatabaseSize();
    } catch (error) {
      logger.error('Failed to get offline data size:', error);
      return 0;
    }
  }
}

export default SyncManager;
