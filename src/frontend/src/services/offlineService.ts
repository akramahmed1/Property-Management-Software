import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface OfflineData {
  id: string;
  type: 'property' | 'customer' | 'lead' | 'booking' | 'payment';
  data: any;
  timestamp: number;
  synced: boolean;
  action: 'create' | 'update' | 'delete';
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingItems: number;
}

class OfflineService {
  private static instance: OfflineService;
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private lastSyncTime: number | null = null;
  private syncListeners: Array<(status: SyncStatus) => void> = [];
  private offlineData: Map<string, OfflineData> = new Map();

  private constructor() {
    this.initializeOfflineService();
  }

  public static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  private async initializeOfflineService(): Promise<void> {
    try {
      await this.loadOfflineData();
      
      NetInfo.addEventListener(state => {
        this.isOnline = state.isConnected ?? false;
        this.notifySyncListeners();
        
        if (this.isOnline && this.hasPendingData()) {
          this.syncData();
        }
      });

      const netInfo = await NetInfo.fetch();
      this.isOnline = netInfo.isConnected ?? false;
    } catch (error) {
      console.error('Error initializing offline service:', error);
    }
  }

  private async loadOfflineData(): Promise<void> {
    try {
      const storedData = await AsyncStorage.getItem('offlineData');
      if (storedData) {
        const data = JSON.parse(storedData);
        this.offlineData = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }

  private async saveOfflineData(): Promise<void> {
    try {
      const data = Object.fromEntries(this.offlineData);
      await AsyncStorage.setItem('offlineData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  public async saveOfflineItem(
    type: OfflineData['type'],
    data: any,
    action: OfflineData['action'] = 'create'
  ): Promise<string> {
    try {
      const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const offlineItem: OfflineData = {
        id,
        type,
        data,
        timestamp: Date.now(),
        synced: false,
        action,
      };

      this.offlineData.set(id, offlineItem);
      await this.saveOfflineData();
      
      if (this.isOnline) {
        this.syncData();
      }

      return id;
    } catch (error) {
      console.error('Error saving offline item:', error);
      throw error;
    }
  }

  public async getOfflineItems(type?: OfflineData['type']): Promise<OfflineData[]> {
    try {
      const items = Array.from(this.offlineData.values());
      return type ? items.filter(item => item.type === type) : items;
    } catch (error) {
      console.error('Error getting offline items:', error);
      return [];
    }
  }

  public async syncData(): Promise<void> {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;
    this.notifySyncListeners();

    try {
      const pendingItems = Array.from(this.offlineData.values()).filter(item => !item.synced);
      
      if (pendingItems.length === 0) {
        this.isSyncing = false;
        this.notifySyncListeners();
        return;
      }

      for (const item of pendingItems) {
        try {
          await this.syncItem(item);
          item.synced = true;
          this.offlineData.set(item.id, item);
        } catch (error) {
          console.error('Error syncing item:', { id: item.id, error });
        }
      }

      await this.saveOfflineData();
      this.lastSyncTime = Date.now();
    } catch (error) {
      console.error('Error during data sync:', error);
    } finally {
      this.isSyncing = false;
      this.notifySyncListeners();
    }
  }

  private async syncItem(item: OfflineData): Promise<void> {
    // This would integrate with your API service
    // For now, we'll simulate the sync process
    console.log('Syncing item:', item);
  }

  public hasPendingData(): boolean {
    return Array.from(this.offlineData.values()).some(item => !item.synced);
  }

  public getSyncStatus(): SyncStatus {
    const pendingItems = Array.from(this.offlineData.values()).filter(item => !item.synced);

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      pendingItems: pendingItems.length,
    };
  }

  public addSyncListener(listener: (status: SyncStatus) => void): void {
    this.syncListeners.push(listener);
  }

  public removeSyncListener(listener: (status: SyncStatus) => void): void {
    const index = this.syncListeners.indexOf(listener);
    if (index > -1) {
      this.syncListeners.splice(index, 1);
    }
  }

  private notifySyncListeners(): void {
    const status = this.getSyncStatus();
    this.syncListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }
}

export default OfflineService;