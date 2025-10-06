import OfflineService from './offlineService';
import ApiService from './apiService';
import { logger } from '../utils/logger';

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  failedItems: number;
  errors: string[];
}

class SyncService {
  private static instance: SyncService;
  private offlineService: OfflineService;
  private apiService: ApiService;
  private isSyncing: boolean = false;
  private syncListeners: Array<(result: SyncResult) => void> = [];

  private constructor() {
    this.offlineService = OfflineService.getInstance();
    this.apiService = ApiService.getInstance();
    this.setupSyncListeners();
  }

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  private setupSyncListeners(): void {
    this.offlineService.addSyncListener((status) => {
      if (status.isOnline && status.pendingItems > 0 && !status.isSyncing) {
        this.syncData();
      }
    });
  }

  public async syncData(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        syncedItems: 0,
        failedItems: 0,
        errors: ['Sync already in progress'],
      };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      failedItems: 0,
      errors: [],
    };

    try {
      logger.info('Starting data sync');
      
      const offlineItems = await this.offlineService.getOfflineItems();
      const pendingItems = offlineItems.filter(item => !item.synced);

      if (pendingItems.length === 0) {
        logger.info('No pending items to sync');
        return result;
      }

      logger.info(`Syncing ${pendingItems.length} pending items`);

      for (const item of pendingItems) {
        try {
          await this.syncItem(item);
          result.syncedItems++;
          logger.debug('Item synced successfully', { id: item.id, type: item.type });
        } catch (error) {
          result.failedItems++;
          result.errors.push(`Failed to sync ${item.type} ${item.id}: ${error.message}`);
          logger.error('Failed to sync item', { id: item.id, type: item.type, error });
        }
      }

      result.success = result.failedItems === 0;
      logger.info('Data sync completed', result);

      // Notify listeners
      this.notifySyncListeners(result);

    } catch (error) {
      result.success = false;
      result.errors.push(`Sync failed: ${error.message}`);
      logger.error('Data sync failed', error);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  private async syncItem(item: any): Promise<void> {
    const { type, data, action } = item;

    switch (type) {
      case 'property':
        await this.syncProperty(data, action);
        break;
      case 'customer':
        await this.syncCustomer(data, action);
        break;
      case 'lead':
        await this.syncLead(data, action);
        break;
      case 'booking':
        await this.syncBooking(data, action);
        break;
      case 'payment':
        await this.syncPayment(data, action);
        break;
      default:
        throw new Error(`Unknown item type: ${type}`);
    }
  }

  private async syncProperty(data: any, action: string): Promise<void> {
    switch (action) {
      case 'create':
        await this.apiService.createProperty(data);
        break;
      case 'update':
        await this.apiService.updateProperty(data.id, data);
        break;
      case 'delete':
        await this.apiService.deleteProperty(data.id);
        break;
    }
  }

  private async syncCustomer(data: any, action: string): Promise<void> {
    switch (action) {
      case 'create':
        await this.apiService.createCustomer(data);
        break;
      case 'update':
        await this.apiService.updateCustomer(data.id, data);
        break;
      case 'delete':
        await this.apiService.deleteCustomer(data.id);
        break;
    }
  }

  private async syncLead(data: any, action: string): Promise<void> {
    switch (action) {
      case 'create':
        await this.apiService.createLead(data);
        break;
      case 'update':
        await this.apiService.updateLead(data.id, data);
        break;
      case 'delete':
        await this.apiService.deleteLead(data.id);
        break;
    }
  }

  private async syncBooking(data: any, action: string): Promise<void> {
    switch (action) {
      case 'create':
        await this.apiService.createBooking(data);
        break;
      case 'update':
        await this.apiService.updateBooking(data.id, data);
        break;
      case 'delete':
        await this.apiService.deleteBooking(data.id);
        break;
    }
  }

  private async syncPayment(data: any, action: string): Promise<void> {
    switch (action) {
      case 'create':
        await this.apiService.createPayment(data);
        break;
      case 'update':
        await this.apiService.updatePayment(data.id, data);
        break;
      case 'delete':
        await this.apiService.deletePayment(data.id);
        break;
    }
  }

  public addSyncListener(listener: (result: SyncResult) => void): void {
    this.syncListeners.push(listener);
  }

  public removeSyncListener(listener: (result: SyncResult) => void): void {
    const index = this.syncListeners.indexOf(listener);
    if (index > -1) {
      this.syncListeners.splice(index, 1);
    }
  }

  private notifySyncListeners(result: SyncResult): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(result);
      } catch (error) {
        logger.error('Error in sync listener', error);
      }
    });
  }

  public isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  public async forceSync(): Promise<SyncResult> {
    logger.info('Force sync requested');
    return this.syncData();
  }

  public async clearSyncData(): Promise<void> {
    try {
      await this.offlineService.clearOfflineData();
      logger.info('Sync data cleared');
    } catch (error) {
      logger.error('Error clearing sync data', error);
      throw error;
    }
  }
}

export default SyncService;