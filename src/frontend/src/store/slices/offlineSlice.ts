import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OfflineData {
  properties: any[];
  leads: any[];
  customers: any[];
  transactions: any[];
  lastSync: string | null;
  isOnline: boolean;
  pendingActions: PendingAction[];
}

export interface PendingAction {
  id: string;
  type: string;
  payload: any;
  timestamp: string;
  retryCount: number;
}

export interface OfflineState {
  isOnline: boolean;
  lastSync: string | null;
  pendingActions: PendingAction[];
  cachedData: {
    properties: any[];
    leads: any[];
    customers: any[];
    transactions: any[];
  };
  isDraftMode: boolean;
}

const initialState: OfflineState = {
  isOnline: true,
  lastSync: null,
  pendingActions: [],
  cachedData: {
    properties: [],
    leads: [],
    customers: [],
    transactions: [],
  },
  isDraftMode: false,
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      state.isDraftMode = !action.payload;
    },
    setLastSync: (state, action: PayloadAction<string>) => {
      state.lastSync = action.payload;
    },
    addPendingAction: (state, action: PayloadAction<Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>>) => {
      const pendingAction: PendingAction = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };
      state.pendingActions.push(pendingAction);
    },
    removePendingAction: (state, action: PayloadAction<string>) => {
      state.pendingActions = state.pendingActions.filter(action => action.id !== action.payload);
    },
    updatePendingAction: (state, action: PayloadAction<{ id: string; retryCount: number }>) => {
      const index = state.pendingActions.findIndex(action => action.id === action.payload.id);
      if (index !== -1) {
        state.pendingActions[index].retryCount = action.payload.retryCount;
      }
    },
    clearPendingActions: (state) => {
      state.pendingActions = [];
    },
    cacheData: (state, action: PayloadAction<{ type: keyof OfflineState['cachedData']; data: any[] }>) => {
      state.cachedData[action.payload.type] = action.payload.data;
    },
    clearCachedData: (state) => {
      state.cachedData = {
        properties: [],
        leads: [],
        customers: [],
        transactions: [],
      };
    },
    setDraftMode: (state, action: PayloadAction<boolean>) => {
      state.isDraftMode = action.payload;
    },
  },
});

export const {
  setOnlineStatus,
  setLastSync,
  addPendingAction,
  removePendingAction,
  updatePendingAction,
  clearPendingActions,
  cacheData,
  clearCachedData,
  setDraftMode,
} = offlineSlice.actions;

export default offlineSlice.reducer;
