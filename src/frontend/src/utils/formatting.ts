import { I18nService } from '../services/i18nService';

const i18nService = I18nService.getInstance();

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return i18nService.formatCurrency(amount, currency);
};

export const formatNumber = (number: number): string => {
  return i18nService.formatNumber(number);
};

export const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  return i18nService.formatDate(date, options);
};

export const formatTime = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  return i18nService.formatTime(date, options);
};

export const formatDateTime = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  return i18nService.formatDateTime(date, options);
};

export const formatRelativeTime = (date: Date): string => {
  return i18nService.getRelativeTime(date);
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length > 11) {
    return `+${cleaned}`;
  }
  
  return phone;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};

export const formatAddress = (address: {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}): string => {
  const parts = [];
  
  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.postalCode) parts.push(address.postalCode);
  if (address.country) parts.push(address.country);
  
  return parts.join(', ');
};

export const formatPropertyType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'APARTMENT': 'Apartment',
    'VILLA': 'Villa',
    'HOUSE': 'House',
    'PLOT': 'Plot',
    'COMMERCIAL': 'Commercial',
    'OFFICE': 'Office',
    'SHOP': 'Shop',
    'WAREHOUSE': 'Warehouse',
  };
  
  return typeMap[type] || type;
};

export const formatPropertyStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'AVAILABLE': 'Available',
    'SOLD': 'Sold',
    'RENTED': 'Rented',
    'MAINTENANCE': 'Maintenance',
    'DRAFT': 'Draft',
  };
  
  return statusMap[status] || status;
};

export const formatBookingStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'PENDING': 'Pending',
    'CONFIRMED': 'Confirmed',
    'CANCELLED': 'Cancelled',
    'COMPLETED': 'Completed',
  };
  
  return statusMap[status] || status;
};

export const formatPaymentStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'PENDING': 'Pending',
    'PROCESSING': 'Processing',
    'COMPLETED': 'Completed',
    'FAILED': 'Failed',
    'CANCELLED': 'Cancelled',
    'REFUNDED': 'Refunded',
  };
  
  return statusMap[status] || status;
};

export const formatLeadStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'NEW': 'New',
    'CONTACTED': 'Contacted',
    'QUALIFIED': 'Qualified',
    'PROPOSAL': 'Proposal',
    'NEGOTIATION': 'Negotiation',
    'CLOSED': 'Closed',
    'LOST': 'Lost',
  };
  
  return statusMap[status] || status;
};

export const formatLeadSource = (source: string): string => {
  const sourceMap: Record<string, string> = {
    'WEBSITE': 'Website',
    'REFERRAL': 'Referral',
    'WALK_IN': 'Walk-in',
    'PHONE': 'Phone',
    'EMAIL': 'Email',
    'SOCIAL': 'Social Media',
    'ADVERTISEMENT': 'Advertisement',
    'OTHER': 'Other',
  };
  
  return sourceMap[source] || source;
};

export const formatPaymentMethod = (method: string): string => {
  const methodMap: Record<string, string> = {
    'CASH': 'Cash',
    'CHEQUE': 'Cheque',
    'BANK_TRANSFER': 'Bank Transfer',
    'UPI': 'UPI',
    'CARD': 'Card',
    'ONLINE': 'Online',
  };
  
  return methodMap[method] || method;
};

export const formatUserRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    'SUPER_ADMIN': 'Super Admin',
    'ADMIN': 'Admin',
    'MANAGER': 'Manager',
    'AGENT': 'Agent',
    'CUSTOMER': 'Customer',
  };
  
  return roleMap[role] || role;
};

export const formatNotificationType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'BOOKING_CREATED': 'Booking Created',
    'BOOKING_CONFIRMED': 'Booking Confirmed',
    'BOOKING_CANCELLED': 'Booking Cancelled',
    'PAYMENT_RECEIVED': 'Payment Received',
    'LEAD_ASSIGNED': 'Lead Assigned',
    'PROPERTY_ADDED': 'Property Added',
    'PROPERTY_UPDATED': 'Property Updated',
    'CUSTOMER_ADDED': 'Customer Added',
    'SYSTEM_ALERT': 'System Alert',
  };
  
  return typeMap[type] || type;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const capitalizeWords = (text: string): string => {
  return text.split(' ').map(word => capitalizeFirst(word)).join(' ');
};

export const formatInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

export const formatSearchQuery = (query: string): string => {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
};

export const formatSortBy = (sortBy: string): string => {
  const sortMap: Record<string, string> = {
    'price': 'Price',
    'area': 'Area',
    'createdAt': 'Created Date',
    'updatedAt': 'Updated Date',
    'name': 'Name',
    'location': 'Location',
  };
  
  return sortMap[sortBy] || sortBy;
};

export const formatSortOrder = (order: string): string => {
  return order === 'asc' ? 'Ascending' : 'Descending';
};
