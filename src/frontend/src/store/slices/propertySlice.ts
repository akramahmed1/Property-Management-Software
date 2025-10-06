import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Property {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode?: string;
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  facing?: string;
  vastu?: string;
  amenities: string[];
  description?: string;
  images: string[];
  floorPlan?: string;
  layout3D?: string;
  coordinates?: any;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    bookings: number;
    inventory: number;
  };
}

export interface PropertyState {
  properties: Property[];
  currentProperty: Property | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    status?: string;
    type?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  };
}

const initialState: PropertyState = {
  properties: [],
  currentProperty: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  filters: {},
};

// Async thunks
export const fetchProperties = createAsyncThunk(
  'property/fetchProperties',
  async (params: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.type) queryParams.append('type', params.type);
      if (params.city) queryParams.append('city', params.city);
      if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
      if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
      if (params.search) queryParams.append('search', params.search);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/properties?${queryParams.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to fetch properties');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue('Network error');
    }
  }
);

export const fetchPropertyById = createAsyncThunk(
  'property/fetchPropertyById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/properties/${id}`);

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to fetch property');
      }

      return data.data.property;
    } catch (error) {
      return rejectWithValue('Network error');
    }
  }
);

export const createProperty = createAsyncThunk(
  'property/createProperty',
  async (propertyData: Partial<Property>, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: { token: string } };
      
      if (!auth.token) {
        return rejectWithValue('No token available');
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify(propertyData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to create property');
      }

      return data.data.property;
    } catch (error) {
      return rejectWithValue('Network error');
    }
  }
);

export const updateProperty = createAsyncThunk(
  'property/updateProperty',
  async ({ id, data: propertyData }: { id: string; data: Partial<Property> }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: { token: string } };
      
      if (!auth.token) {
        return rejectWithValue('No token available');
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/properties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify(propertyData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to update property');
      }

      return data.data.property;
    } catch (error) {
      return rejectWithValue('Network error');
    }
  }
);

const propertySlice = createSlice({
  name: 'property',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<PropertyState['filters']>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentProperty: (state) => {
      state.currentProperty = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Properties
      .addCase(fetchProperties.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.isLoading = false;
        state.properties = action.payload.properties;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Property by ID
      .addCase(fetchPropertyById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPropertyById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProperty = action.payload;
        state.error = null;
      })
      .addCase(fetchPropertyById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Property
      .addCase(createProperty.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProperty.fulfilled, (state, action) => {
        state.isLoading = false;
        state.properties.unshift(action.payload);
        state.error = null;
      })
      .addCase(createProperty.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Property
      .addCase(updateProperty.fulfilled, (state, action) => {
        const index = state.properties.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.properties[index] = action.payload;
        }
        if (state.currentProperty?.id === action.payload.id) {
          state.currentProperty = action.payload;
        }
      });
  },
});

export const { setFilters, clearFilters, clearError, clearCurrentProperty } = propertySlice.actions;
export default propertySlice.reducer;
