import { PrismaClient, Property, PropertyType, PropertyStatus, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { Redis } from 'ioredis';
import { createClient } from 'redis';

const prisma = new PrismaClient();

// Redis client for caching
let redis: Redis;
try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
} catch (error) {
  logger.warn('Redis connection failed, caching disabled:', error);
}

export interface PropertyFilters {
  page?: number;
  limit?: number;
  type?: PropertyType;
  status?: PropertyStatus;
  city?: string;
  state?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PropertyAnalytics {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  conversionRate: number;
  occupancyRate: number;
  monthlyData: Array<{
    month: string;
    bookings: number;
    revenue: number;
  }>;
  leadSources: Record<string, number>;
}

export class PropertyService {
  private static instance: PropertyService;
  private cachePrefix = 'property:';
  private cacheTTL = 300; // 5 minutes

  private constructor() {}

  public static getInstance(): PropertyService {
    if (!PropertyService.instance) {
      PropertyService.instance = new PropertyService();
    }
    return PropertyService.instance;
  }

  /**
   * Get properties with advanced filtering, pagination, and caching
   */
  async getProperties(filters: PropertyFilters = {}) {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      city,
      state,
      country,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      bedrooms,
      bathrooms,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    // Create cache key
    const cacheKey = `${this.cachePrefix}list:${JSON.stringify(filters)}`;

    try {
      // Try to get from cache first
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.debug('Returning cached properties data');
          return JSON.parse(cached);
        }
      }

      // Build where clause
      const where: Prisma.PropertyWhereInput = {
        isActive: true
      };

      // Basic filters
      if (type) where.type = type;
      if (status) where.status = status;
      if (city) where.city = { contains: city, mode: 'insensitive' };
      if (state) where.state = { contains: state, mode: 'insensitive' };
      if (country) where.country = { contains: country, mode: 'insensitive' };

      // Price range filter
      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = minPrice;
        if (maxPrice) where.price.lte = maxPrice;
      }

      // Area range filter
      if (minArea || maxArea) {
        where.area = {};
        if (minArea) where.area.gte = minArea;
        if (maxArea) where.area.lte = maxArea;
      }

      // Bedroom filter
      if (bedrooms) where.bedrooms = bedrooms;

      // Bathroom filter
      if (bathrooms) where.bathrooms = bathrooms;

      // Search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Sorting
      const orderBy: Prisma.PropertyOrderByWithRelationInput = {};
      orderBy[sortBy as keyof Property] = sortOrder;

      // Execute query with pagination
      const [properties, total] = await Promise.all([
        prisma.property.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy,
          include: {
            createdBy: {
              select: { id: true, name: true, email: true, phone: true, role: true }
            },
            bookings: {
              select: { 
                id: true, 
                status: true, 
                amount: true, 
                bookingDate: true,
                customer: {
                  select: { name: true, email: true }
                }
              }
            },
            inventory: {
              select: { id: true, unitNumber: true, status: true, price: true }
            },
            files: {
              select: { id: true, originalName: true, url: true, thumbnailUrl: true }
            },
            _count: {
              select: {
                bookings: true,
                inventory: true
              }
            }
          }
        }),
        prisma.property.count({ where })
      ]);

      // Calculate additional metrics
      const propertiesWithMetrics = properties.map(property => {
        const totalBookings = property.bookings.length;
        const confirmedBookings = property.bookings.filter(b => b.status === 'CONFIRMED').length;
        const totalRevenue = property.bookings.reduce((sum, b) => sum + Number(b.amount), 0);
        const occupancyRate = property.inventory.length > 0 ? 
          (confirmedBookings / property.inventory.length) * 100 : 0;

        return {
          ...property,
          metrics: {
            totalBookings,
            confirmedBookings,
            totalRevenue,
            occupancyRate: Math.round(occupancyRate * 100) / 100
          }
        };
      });

      const result = {
        properties: propertiesWithMetrics,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        filters: {
          type,
          status,
          minPrice,
          maxPrice,
          city,
          state,
          country,
          minArea,
          maxArea,
          bedrooms,
          bathrooms,
          search
        }
      };

      // Cache the result
      if (redis) {
        await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(result));
      }

      return result;
    } catch (error) {
      logger.error('Error fetching properties:', error);
      throw new Error('Failed to fetch properties');
    }
  }

  /**
   * Get property by ID with detailed information and caching
   */
  async getPropertyById(id: string) {
    const cacheKey = `${this.cachePrefix}detail:${id}`;

    try {
      // Try to get from cache first
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.debug('Returning cached property detail');
          return JSON.parse(cached);
        }
      }

      const property = await prisma.property.findUnique({
        where: { id, isActive: true },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, phone: true, role: true }
          },
          bookings: {
            include: {
              customer: {
                select: { id: true, name: true, email: true, phone: true }
              },
              agent: {
                select: { id: true, name: true, email: true, phone: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          inventory: {
            orderBy: { unitNumber: 'asc' }
          },
          files: {
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              bookings: true,
              inventory: true
            }
          }
        }
      });

      if (!property) {
        throw new Error('Property not found');
      }

      // Calculate property analytics
      const totalBookings = property.bookings.length;
      const confirmedBookings = property.bookings.filter(b => b.status === 'CONFIRMED').length;
      const totalRevenue = property.bookings.reduce((sum, b) => sum + Number(b.amount), 0);
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      const occupancyRate = property.inventory.length > 0 ? 
        (confirmedBookings / property.inventory.length) * 100 : 0;

      // Recent activity
      const recentActivity = property.bookings.slice(0, 5).map(booking => ({
        type: 'booking',
        id: booking.id,
        status: booking.status,
        amount: booking.amount,
        customer: booking.customer.name,
        date: booking.createdAt
      }));

      const propertyWithAnalytics = {
        ...property,
        analytics: {
          totalBookings,
          confirmedBookings,
          totalRevenue,
          averageBookingValue: Math.round(averageBookingValue),
          occupancyRate: Math.round(occupancyRate * 100) / 100,
          recentActivity
        }
      };

      // Cache the result
      if (redis) {
        await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(propertyWithAnalytics));
      }

      return propertyWithAnalytics;
    } catch (error) {
      logger.error('Error fetching property by ID:', error);
      throw error;
    }
  }

  /**
   * Create property with validation and business logic
   */
  async createProperty(data: Prisma.PropertyCreateInput, userId: string) {
    try {
      // Validate required fields
      if (!data.name || !data.type || !data.location || !data.address || !data.city || !data.state || !data.country || !data.price || !data.area) {
        throw new Error('Required fields missing: name, type, location, address, city, state, country, price, area');
      }

      // Validate property type
      const validTypes = Object.values(PropertyType);
      if (!validTypes.includes(data.type as PropertyType)) {
        throw new Error(`Invalid property type. Must be one of: ${validTypes.join(', ')}`);
      }

      // Validate property status
      const validStatuses = Object.values(PropertyStatus);
      if (data.status && !validStatuses.includes(data.status as PropertyStatus)) {
        throw new Error(`Invalid property status. Must be one of: ${validStatuses.join(', ')}`);
      }

      // Validate price and area
      if (Number(data.price) <= 0 || Number(data.area) <= 0) {
        throw new Error('Price and area must be greater than 0');
      }

      // Check for duplicate property
      const existingProperty = await prisma.property.findFirst({
        where: {
          name: { equals: data.name as string, mode: 'insensitive' },
          address: { equals: data.address as string, mode: 'insensitive' },
          city: { equals: data.city as string, mode: 'insensitive' },
          isActive: true
        }
      });

      if (existingProperty) {
        throw new Error('Property with same name and address already exists');
      }

      // Create property
      const property = await prisma.property.create({
        data: {
          ...data,
          createdById: userId
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      });

      // Clear related caches
      await this.clearPropertyCaches();

      // Log property creation
      logger.info(`Property created: ${property.name} by user ${userId}`);

      return property;
    } catch (error) {
      logger.error('Error creating property:', error);
      throw error;
    }
  }

  /**
   * Update property with validation and business logic
   */
  async updateProperty(id: string, data: Prisma.PropertyUpdateInput, userId: string) {
    try {
      // Check if property exists
      const existingProperty = await prisma.property.findUnique({
        where: { id, isActive: true }
      });

      if (!existingProperty) {
        throw new Error('Property not found');
      }

      // Validate property type if provided
      if (data.type) {
        const validTypes = Object.values(PropertyType);
        if (!validTypes.includes(data.type as PropertyType)) {
          throw new Error(`Invalid property type. Must be one of: ${validTypes.join(', ')}`);
        }
      }

      // Validate property status if provided
      if (data.status) {
        const validStatuses = Object.values(PropertyStatus);
        if (!validStatuses.includes(data.status as PropertyStatus)) {
          throw new Error(`Invalid property status. Must be one of: ${validStatuses.join(', ')}`);
        }
      }

      // Validate price if provided
      if (data.price && Number(data.price) <= 0) {
        throw new Error('Price must be greater than 0');
      }

      // Validate area if provided
      if (data.area && Number(data.area) <= 0) {
        throw new Error('Area must be greater than 0');
      }

      // Update property
      const updatedProperty = await prisma.property.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      });

      // Clear related caches
      await this.clearPropertyCaches();

      // Log property update
      logger.info(`Property updated: ${updatedProperty.name} by user ${userId}`);

      return updatedProperty;
    } catch (error) {
      logger.error('Error updating property:', error);
      throw error;
    }
  }

  /**
   * Delete property (soft delete) with business logic
   */
  async deleteProperty(id: string, userId: string) {
    try {
      // Check if property exists
      const existingProperty = await prisma.property.findUnique({
        where: { id, isActive: true },
        include: {
          bookings: {
            where: { status: { in: ['PENDING', 'CONFIRMED'] } }
          }
        }
      });

      if (!existingProperty) {
        throw new Error('Property not found');
      }

      // Check if property has active bookings
      if (existingProperty.bookings.length > 0) {
        throw new Error('Cannot delete property with active bookings');
      }

      // Soft delete property
      const deletedProperty = await prisma.property.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      // Clear related caches
      await this.clearPropertyCaches();

      // Log property deletion
      logger.info(`Property deleted: ${deletedProperty.name} by user ${userId}`);

      return deletedProperty;
    } catch (error) {
      logger.error('Error deleting property:', error);
      throw error;
    }
  }

  /**
   * Get property analytics with caching
   */
  async getPropertyAnalytics(id: string, period: string = '30d') {
    const cacheKey = `${this.cachePrefix}analytics:${id}:${period}`;

    try {
      // Try to get from cache first
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.debug('Returning cached property analytics');
          return JSON.parse(cached);
        }
      }

      // Check if property exists
      const property = await prisma.property.findUnique({
        where: { id, isActive: true }
      });

      if (!property) {
        throw new Error('Property not found');
      }

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Get bookings in period
      const bookings = await prisma.booking.findMany({
        where: {
          propertyId: id,
          createdAt: {
            gte: startDate,
            lte: now
          }
        },
        include: {
          customer: {
            select: { name: true, email: true }
          }
        }
      });

      // Calculate analytics
      const totalBookings = bookings.length;
      const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED').length;
      const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length;
      const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.amount), 0);
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      const conversionRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;

      // Monthly breakdown
      const monthlyData = [];
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push(date.toISOString().slice(0, 7));
      }

      for (const month of months) {
        const monthBookings = bookings.filter(b => 
          b.createdAt.toISOString().slice(0, 7) === month
        );
        
        monthlyData.push({
          month,
          bookings: monthBookings.length,
          revenue: monthBookings.reduce((sum, b) => sum + Number(b.amount), 0)
        });
      }

      // Lead sources for this property
      const leadSources = await prisma.lead.findMany({
        where: {
          interest: { contains: property.location, mode: 'insensitive' },
          createdAt: { gte: startDate, lte: now }
        },
        select: { source: true }
      });

      const sourceBreakdown = leadSources.reduce((acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const analytics = {
        period,
        summary: {
          totalBookings,
          confirmedBookings,
          cancelledBookings,
          totalRevenue,
          averageBookingValue: Math.round(averageBookingValue),
          conversionRate: Math.round(conversionRate * 100) / 100
        },
        monthlyData,
        leadSources: sourceBreakdown,
        property: {
          id: property.id,
          name: property.name,
          type: property.type,
          location: property.location,
          price: property.price
        }
      };

      // Cache the result
      if (redis) {
        await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(analytics));
      }

      return analytics;
    } catch (error) {
      logger.error('Error fetching property analytics:', error);
      throw error;
    }
  }

  /**
   * Search properties with advanced filters
   */
  async searchProperties(query: string, filters: any = {}) {
    try {
      const where: Prisma.PropertyWhereInput = {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { state: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      };

      // Apply additional filters
      if (filters.type) where.type = filters.type;
      if (filters.status) where.status = filters.status;
      if (filters.minPrice) where.price = { ...where.price, gte: filters.minPrice };
      if (filters.maxPrice) where.price = { ...where.price, lte: filters.maxPrice };
      if (filters.bedrooms) where.bedrooms = filters.bedrooms;
      if (filters.bathrooms) where.bathrooms = filters.bathrooms;

      const properties = await prisma.property.findMany({
        where,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: {
              bookings: true,
              inventory: true
            }
          }
        }
      });

      return {
        properties,
        query,
        filters,
        total: properties.length
      };
    } catch (error) {
      logger.error('Error searching properties:', error);
      throw error;
    }
  }

  /**
   * Get property statistics for dashboard
   */
  async getPropertyStats() {
    try {
      const [
        totalProperties,
        availableProperties,
        bookedProperties,
        soldProperties,
        totalRevenue,
        averagePrice
      ] = await Promise.all([
        prisma.property.count({ where: { isActive: true } }),
        prisma.property.count({ where: { isActive: true, status: 'AVAILABLE' } }),
        prisma.property.count({ where: { isActive: true, status: 'BOOKED' } }),
        prisma.property.count({ where: { isActive: true, status: 'SOLD' } }),
        prisma.booking.aggregate({
          where: { status: 'CONFIRMED' },
          _sum: { amount: true }
        }),
        prisma.property.aggregate({
          where: { isActive: true },
          _avg: { price: true }
        })
      ]);

      return {
        totalProperties,
        availableProperties,
        bookedProperties,
        soldProperties,
        totalRevenue: totalRevenue._sum.amount || 0,
        averagePrice: averagePrice._avg.price || 0
      };
    } catch (error) {
      logger.error('Error fetching property stats:', error);
      throw error;
    }
  }

  /**
   * Clear property-related caches
   */
  private async clearPropertyCaches() {
    if (!redis) return;

    try {
      const keys = await redis.keys(`${this.cachePrefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug(`Cleared ${keys.length} property cache keys`);
      }
    } catch (error) {
      logger.error('Error clearing property caches:', error);
    }
  }

  /**
   * Bulk import properties from CSV
   */
  async bulkImportProperties(properties: any[], userId: string) {
    try {
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const propertyData of properties) {
        try {
          await this.createProperty(propertyData, userId);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`${propertyData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      logger.info(`Bulk import completed: ${results.success} success, ${results.failed} failed`);
      return results;
    } catch (error) {
      logger.error('Error in bulk import:', error);
      throw error;
    }
  }

  /**
   * Export properties to CSV
   */
  async exportProperties(filters: PropertyFilters = {}) {
    try {
      const { properties } = await this.getProperties({ ...filters, limit: 10000 });
      
      const csvData = properties.map(property => ({
        id: property.id,
        name: property.name,
        type: property.type,
        status: property.status,
        location: property.location,
        address: property.address,
        city: property.city,
        state: property.state,
        country: property.country,
        price: property.price,
        area: property.area,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        createdAt: property.createdAt
      }));

      return csvData;
    } catch (error) {
      logger.error('Error exporting properties:', error);
      throw error;
    }
  }
}

export default PropertyService;
