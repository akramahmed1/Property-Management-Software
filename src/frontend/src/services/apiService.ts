import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://your-production-api.com/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

class ApiService {
  private static instance: ApiService;
  private baseURL: string;
  private token: string | null = null;

  private constructor() {
    this.baseURL = API_BASE_URL;
    this.initializeToken();
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async initializeToken(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      this.token = token;
    } catch (error) {
      console.error('Error initializing token:', error);
    }
  }

  public setToken(token: string): void {
    this.token = token;
    AsyncStorage.setItem('authToken', token);
  }

  public clearToken(): void {
    this.token = null;
    AsyncStorage.removeItem('authToken');
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || 'Request failed',
          response.status,
          data.code
        );
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      logger.error('API request failed:', { endpoint, error });
      
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        error.message || 'Network error',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  // Authentication endpoints
  public async login(email: string, password: string): Promise<ApiResponse> {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  public async register(userData: any): Promise<ApiResponse> {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  public async logout(): Promise<ApiResponse> {
    const response = await this.makeRequest('/auth/logout', {
      method: 'POST',
    });
    this.clearToken();
    return response;
  }

  public async refreshToken(): Promise<ApiResponse> {
    return this.makeRequest('/auth/refresh', {
      method: 'POST',
    });
  }

  // Property endpoints
  public async getProperties(params?: any): Promise<ApiResponse> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest(`/properties${queryString}`);
  }

  public async getProperty(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/properties/${id}`);
  }

  public async createProperty(propertyData: any): Promise<ApiResponse> {
    return this.makeRequest('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  }

  public async updateProperty(id: string, propertyData: any): Promise<ApiResponse> {
    return this.makeRequest(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });
  }

  public async deleteProperty(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/properties/${id}`, {
      method: 'DELETE',
    });
  }

  public async searchProperties(query: string, filters?: any): Promise<ApiResponse> {
    return this.makeRequest('/properties/search', {
      method: 'POST',
      body: JSON.stringify({ query, filters }),
    });
  }

  // Customer endpoints
  public async getCustomers(params?: any): Promise<ApiResponse> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest(`/customers${queryString}`);
  }

  public async getCustomer(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/customers/${id}`);
  }

  public async createCustomer(customerData: any): Promise<ApiResponse> {
    return this.makeRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  public async updateCustomer(id: string, customerData: any): Promise<ApiResponse> {
    return this.makeRequest(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  }

  public async deleteCustomer(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Lead endpoints
  public async getLeads(params?: any): Promise<ApiResponse> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest(`/leads${queryString}`);
  }

  public async getLead(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/leads/${id}`);
  }

  public async createLead(leadData: any): Promise<ApiResponse> {
    return this.makeRequest('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  }

  public async updateLead(id: string, leadData: any): Promise<ApiResponse> {
    return this.makeRequest(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leadData),
    });
  }

  public async deleteLead(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/leads/${id}`, {
      method: 'DELETE',
    });
  }

  // Booking endpoints
  public async getBookings(params?: any): Promise<ApiResponse> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest(`/bookings${queryString}`);
  }

  public async getBooking(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/bookings/${id}`);
  }

  public async createBooking(bookingData: any): Promise<ApiResponse> {
    return this.makeRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  public async updateBooking(id: string, bookingData: any): Promise<ApiResponse> {
    return this.makeRequest(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookingData),
    });
  }

  public async deleteBooking(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/bookings/${id}`, {
      method: 'DELETE',
    });
  }

  public async confirmBooking(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/bookings/${id}/confirm`, {
      method: 'POST',
    });
  }

  public async cancelBooking(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/bookings/${id}/cancel`, {
      method: 'POST',
    });
  }

  // Payment endpoints
  public async getPayments(params?: any): Promise<ApiResponse> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest(`/payments${queryString}`);
  }

  public async getPayment(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/payments/${id}`);
  }

  public async createPayment(paymentData: any): Promise<ApiResponse> {
    return this.makeRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  public async updatePayment(id: string, paymentData: any): Promise<ApiResponse> {
    return this.makeRequest(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
  }

  public async deletePayment(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/payments/${id}`, {
      method: 'DELETE',
    });
  }

  public async processPayment(id: string, paymentData: any): Promise<ApiResponse> {
    return this.makeRequest(`/payments/${id}/process`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // Analytics endpoints
  public async getDashboardAnalytics(): Promise<ApiResponse> {
    return this.makeRequest('/analytics/dashboard');
  }

  public async getPropertyAnalytics(propertyId: string): Promise<ApiResponse> {
    return this.makeRequest(`/analytics/properties/${propertyId}`);
  }

  public async getSalesAnalytics(params?: any): Promise<ApiResponse> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest(`/analytics/sales${queryString}`);
  }

  // File upload
  public async uploadFile(file: any, entityType: string, entityId: string): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    return this.makeRequest('/files/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Notifications
  public async getNotifications(params?: any): Promise<ApiResponse> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest(`/notifications${queryString}`);
  }

  public async markNotificationAsRead(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  public async markAllNotificationsAsRead(): Promise<ApiResponse> {
    return this.makeRequest('/notifications/read-all', {
      method: 'POST',
    });
  }
}

export class ApiError extends Error {
  public status: number;
  public code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export default ApiService;
