import NetInfo from '@react-native-community/netinfo';
import { store } from '../store';
import { setOnlineStatus } from '../store/slices/offlineSlice';

class NetworkUtils {
  private isOnline: boolean = true;
  private listeners: ((isOnline: boolean) => void)[] = [];

  constructor() {
    this.setupNetworkListener();
  }

  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      // Update Redux store
      store.dispatch(setOnlineStatus(this.isOnline));
      
      // Notify listeners
      if (wasOnline !== this.isOnline) {
        this.listeners.forEach(listener => listener(this.isOnline));
      }
    });
  }

  // Get current network status
  isConnected(): boolean {
    return this.isOnline;
  }

  // Add network status listener
  addListener(callback: (isOnline: boolean) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Check if device is online
  async checkConnection(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
    store.dispatch(setOnlineStatus(this.isOnline));
    return this.isOnline;
  }

  // Get network type
  async getNetworkType(): Promise<string> {
    const state = await NetInfo.fetch();
    return state.type || 'unknown';
  }

  // Check if connection is expensive (mobile data)
  async isConnectionExpensive(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnectionExpensive ?? false;
  }

  // Wait for connection
  async waitForConnection(timeout: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isOnline) {
        resolve(true);
        return;
      }

      const unsubscribe = this.addListener((isOnline) => {
        if (isOnline) {
          unsubscribe();
          resolve(true);
        }
      });

      // Timeout after specified time
      setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeout);
    });
  }

  // Retry with exponential backoff
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retrying
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // Make request with offline handling
  async makeRequest<T>(
    request: () => Promise<T>,
    fallback?: () => T
  ): Promise<T> {
    try {
      if (!this.isOnline) {
        throw new Error('No internet connection');
      }
      
      return await request();
    } catch (error) {
      if (fallback) {
        return fallback();
      }
      throw error;
    }
  }

  // Queue request for when online
  queueRequest(request: () => Promise<void>): void {
    if (this.isOnline) {
      request();
    } else {
      // Store in offline queue
      this.addToOfflineQueue(request);
    }
  }

  private addToOfflineQueue(request: () => Promise<void>): void {
    // This would typically store in IndexedDB or AsyncStorage
    // For now, we'll just log it
    console.log('Queuing request for when online:', request);
  }

  // Process offline queue when online
  async processOfflineQueue(): Promise<void> {
    if (!this.isOnline) {
      return;
    }

    // This would process queued requests
    console.log('Processing offline queue...');
  }
}

export default new NetworkUtils();
