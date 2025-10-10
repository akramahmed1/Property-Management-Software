// Shared utilities for Property Management Software
import { Region, Currency, RegionConfig, Language } from '../types';

// Region configurations
export const REGION_CONFIGS: Record<Region, RegionConfig> = {
  INDIA: {
    region: 'INDIA',
    currency: 'INR',
    taxRate: 0.05, // 5% GST
    taxName: 'GST',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'en-IN'
  },
  UAE: {
    region: 'UAE',
    currency: 'AED',
    taxRate: 0.05, // 5% VAT
    taxName: 'VAT',
    timezone: 'Asia/Dubai',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'en-AE'
  },
  SAUDI: {
    region: 'SAUDI',
    currency: 'SAR',
    taxRate: 0.15, // 15% VAT
    taxName: 'VAT',
    timezone: 'Asia/Riyadh',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'ar-SA'
  },
  QATAR: {
    region: 'QATAR',
    currency: 'QAR',
    taxRate: 0.05, // 5% VAT
    taxName: 'VAT',
    timezone: 'Asia/Qatar',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'en-QA'
  }
};

// Get region configuration
export function getRegionConfig(region: Region): RegionConfig {
  return REGION_CONFIGS[region];
}

// Calculate tax based on region
export function calculateTax(amount: number, region: Region): number {
  const config = getRegionConfig(region);
  return amount * config.taxRate;
}

// Format currency based on region
export function formatCurrency(amount: number, region: Region): string {
  const config = getRegionConfig(region);
  return new Intl.NumberFormat(config.numberFormat, {
    style: 'currency',
    currency: config.currency
  }).format(amount);
}

// Format date based on region
export function formatDate(date: Date, region: Region): string {
  const config = getRegionConfig(region);
  return new Intl.DateTimeFormat(config.numberFormat, {
    timeZone: config.timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

// Get current region from environment
export function getCurrentRegion(): Region {
  return (process.env.REGION as Region) || 'INDIA';
}

// Validate region
export function isValidRegion(region: string): region is Region {
  return Object.keys(REGION_CONFIGS).includes(region);
}

// Language utilities
export function getLanguageDirection(language: Language): 'ltr' | 'rtl' {
  return language === 'ar' ? 'rtl' : 'ltr';
}

export function getDefaultLanguage(): Language {
  return (process.env.DEFAULT_LANGUAGE as Language) || 'en';
}

// API response helpers
export function createSuccessResponse<T>(data: T, message?: string, meta?: any) {
  return {
    success: true,
    data,
    message,
    meta
  };
}

export function createErrorResponse(message: string, error?: any) {
  return {
    success: false,
    message,
    error
  };
}

// Validation helpers
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Pagination helpers
export function calculatePagination(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    offset: (page - 1) * limit
  };
}

// String utilities
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Date utilities
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  return date >= startDate && date <= endDate;
}

// File utilities
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isValidImageType(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  return imageExtensions.includes(getFileExtension(filename));
}

export function isValidDocumentType(filename: string): boolean {
  const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
  return documentExtensions.includes(getFileExtension(filename));
}

// Generate unique IDs
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

// Deep clone utility
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const clonedObj = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}
