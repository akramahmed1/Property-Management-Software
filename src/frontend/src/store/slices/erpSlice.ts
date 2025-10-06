import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'REFUND';
  category: string;
  amount: number;
  currency: string;
  description?: string;
  reference?: string;
  date: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  bookingId?: string;
  transactionId?: string;
  amount: number;
  currency: string;
  method: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  gateway?: string;
  gatewayId?: string;
  gatewayData?: any;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ErpState {
  transactions: Transaction[];
  payments: Payment[];
  currentTransaction: Transaction | null;
  currentPayment: Payment | null;
  isLoading: boolean;
  error: string | null;
  summary: {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    pendingPayments: number;
  };
}

const initialState: ErpState = {
  transactions: [],
  payments: [],
  currentTransaction: null,
  currentPayment: null,
  isLoading: false,
  error: null,
  summary: {
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    pendingPayments: 0,
  },
};

const erpSlice = createSlice({
  name: 'erp',
  initialState,
  reducers: {
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
      // Calculate summary
      const income = action.payload
        .filter(t => t.type === 'INCOME' && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = action.payload
        .filter(t => t.type === 'EXPENSE' && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + t.amount, 0);
      
      state.summary = {
        totalIncome: income,
        totalExpense: expense,
        netProfit: income - expense,
        pendingPayments: action.payload.filter(t => t.status === 'PENDING').length,
      };
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
    },
    updateTransaction: (state, action: PayloadAction<Transaction>) => {
      const index = state.transactions.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.transactions[index] = action.payload;
      }
    },
    removeTransaction: (state, action: PayloadAction<string>) => {
      state.transactions = state.transactions.filter(t => t.id !== action.payload);
    },
    setCurrentTransaction: (state, action: PayloadAction<Transaction | null>) => {
      state.currentTransaction = action.payload;
    },
    setPayments: (state, action: PayloadAction<Payment[]>) => {
      state.payments = action.payload;
    },
    addPayment: (state, action: PayloadAction<Payment>) => {
      state.payments.unshift(action.payload);
    },
    updatePayment: (state, action: PayloadAction<Payment>) => {
      const index = state.payments.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.payments[index] = action.payload;
      }
    },
    removePayment: (state, action: PayloadAction<string>) => {
      state.payments = state.payments.filter(p => p.id !== action.payload);
    },
    setCurrentPayment: (state, action: PayloadAction<Payment | null>) => {
      state.currentPayment = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setTransactions,
  addTransaction,
  updateTransaction,
  removeTransaction,
  setCurrentTransaction,
  setPayments,
  addPayment,
  updatePayment,
  removePayment,
  setCurrentPayment,
  setLoading,
  setError,
  clearError,
} = erpSlice.actions;

export default erpSlice.reducer;
