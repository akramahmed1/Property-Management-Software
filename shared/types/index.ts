// Shared types for Property Management Software
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  type?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  dateFrom?: string;
  dateTo?: string;
}

// Multi-region support
export type Region = 'INDIA' | 'UAE' | 'SAUDI' | 'QATAR';
export type Currency = 'INR' | 'AED' | 'SAR' | 'QAR';
export type Language = 'en' | 'ar';

export interface RegionConfig {
  region: Region;
  currency: Currency;
  taxRate: number;
  taxName: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
}

// Lead stages as per BlinderSøe API
export enum LeadStage {
  ENQUIRY_RECEIVED = 5,
  SITE_VISIT = 15,
  PROPOSAL_SENT = 25,
  NEGOTIATION = 35,
  BOOKING = 45,
  SOLD = 50,
  LOST = 0
}

// Lead sources as per BlinderSøe API
export enum LeadSource {
  WEBSITE = 5,
  WHATSAPP = 10,
  PHONE = 15,
  EMAIL = 20,
  REFERRAL = 25,
  WALK_IN = 30,
  SOCIAL_MEDIA = 35,
  ADVERTISEMENT = 40,
  OTHER = 45
}

// Booking stages as per BlinderSøe API
export enum BookingStage {
  SOLD = 1,
  TENTATIVELY_BOOKED = 5,
  CONFIRMED = 10,
  CANCELLED = 0
}

// Project status as per BlinderSøe API
export enum ProjectStatus {
  UPCOMING = 1,
  ONGOING = 2,
  COMPLETED = 3,
  CANCELLED = 0
}

export interface CompanyInfo {
  gst?: string;
  vat?: string;
  region: Region;
  currency: Currency;
  taxRate: number;
  taxName: string;
}

export interface PropertyMeta {
  total: number;
  available: number;
  sold: number;
  booked: number;
  maintenance: number;
}

export interface LeadMeta {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  proposal: number;
  negotiation: number;
  closed: number;
  lost: number;
}

export interface BookingMeta {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
}

// AI Layout types
export interface PlotLayout {
  id: string;
  name: string;
  floors: number;
  blocks: Block[];
  totalPlots: number;
  availablePlots: number;
  soldPlots: number;
}

export interface Block {
  id: string;
  name: string;
  floors: Floor[];
  totalPlots: number;
  availablePlots: number;
}

export interface Floor {
  id: string;
  number: number;
  plots: Plot[];
}

export interface Plot {
  id: string;
  number: string;
  status: 'available' | 'sold' | 'booked' | 'maintenance';
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  facing?: string;
  vastu?: string;
  amenities: string[];
  coordinates?: {
    x: number;
    y: number;
    z: number;
  };
}

// Multi-language support
export interface Translation {
  [key: string]: string | Translation;
}

export interface I18nConfig {
  defaultLanguage: Language;
  supportedLanguages: Language[];
  fallbackLanguage: Language;
  resources: Record<Language, Translation>;
}
