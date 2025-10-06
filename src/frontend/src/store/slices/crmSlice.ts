import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Lead {
  id: string;
  customerId?: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  score: number;
  interest?: string;
  budget?: number;
  notes?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  dateOfBirth?: string;
  occupation?: string;
  income?: number;
  documents: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmState {
  leads: Lead[];
  customers: Customer[];
  currentLead: Lead | null;
  currentCustomer: Customer | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CrmState = {
  leads: [],
  customers: [],
  currentLead: null,
  currentCustomer: null,
  isLoading: false,
  error: null,
};

const crmSlice = createSlice({
  name: 'crm',
  initialState,
  reducers: {
    setLeads: (state, action: PayloadAction<Lead[]>) => {
      state.leads = action.payload;
    },
    addLead: (state, action: PayloadAction<Lead>) => {
      state.leads.unshift(action.payload);
    },
    updateLead: (state, action: PayloadAction<Lead>) => {
      const index = state.leads.findIndex(lead => lead.id === action.payload.id);
      if (index !== -1) {
        state.leads[index] = action.payload;
      }
    },
    removeLead: (state, action: PayloadAction<string>) => {
      state.leads = state.leads.filter(lead => lead.id !== action.payload);
    },
    setCurrentLead: (state, action: PayloadAction<Lead | null>) => {
      state.currentLead = action.payload;
    },
    setCustomers: (state, action: PayloadAction<Customer[]>) => {
      state.customers = action.payload;
    },
    addCustomer: (state, action: PayloadAction<Customer>) => {
      state.customers.unshift(action.payload);
    },
    updateCustomer: (state, action: PayloadAction<Customer>) => {
      const index = state.customers.findIndex(customer => customer.id === action.payload.id);
      if (index !== -1) {
        state.customers[index] = action.payload;
      }
    },
    removeCustomer: (state, action: PayloadAction<string>) => {
      state.customers = state.customers.filter(customer => customer.id !== action.payload);
    },
    setCurrentCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.currentCustomer = action.payload;
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
  setLeads,
  addLead,
  updateLead,
  removeLead,
  setCurrentLead,
  setCustomers,
  addCustomer,
  updateCustomer,
  removeCustomer,
  setCurrentCustomer,
  setLoading,
  setError,
  clearError,
} = crmSlice.actions;

export default crmSlice.reducer;
