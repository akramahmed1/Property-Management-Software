export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  location: string;
  address: string;
  city: string;
  state: string;
  country: string;
  description?: string;
  features?: string[];
  amenities?: string[];
  images?: string[];
  videos?: string[];
  documents?: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  VILLA = 'VILLA',
  HOUSE = 'HOUSE',
  PLOT = 'PLOT',
  COMMERCIAL = 'COMMERCIAL',
  OFFICE = 'OFFICE',
  SHOP = 'SHOP',
  WAREHOUSE = 'WAREHOUSE',
}

export enum PropertyStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  RENTED = 'RENTED',
  MAINTENANCE = 'MAINTENANCE',
  DRAFT = 'DRAFT',
}

export interface PropertyFilter {
  type?: PropertyType;
  status?: PropertyStatus;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
  state?: string;
  country?: string;
  features?: string[];
  amenities?: string[];
}

export interface PropertySearchParams {
  query?: string;
  filters?: PropertyFilter;
  sortBy?: 'price' | 'area' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PropertyAnalytics {
  totalProperties: number;
  availableProperties: number;
  soldProperties: number;
  rentedProperties: number;
  maintenanceProperties: number;
  totalValue: number;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  typeDistribution: Record<PropertyType, number>;
  statusDistribution: Record<PropertyStatus, number>;
  monthlyTrends: {
    month: string;
    properties: number;
    value: number;
  }[];
  topPerformingProperties: {
    id: string;
    name: string;
    views: number;
    inquiries: number;
    bookings: number;
  }[];
}
