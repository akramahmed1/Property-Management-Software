import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { Property, PropertyType, PropertyStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

/**
 * @swagger
 * components:
 *   schemas:
 *     Property:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - location
 *         - price
 *         - area
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the property
 *         name:
 *           type: string
 *           description: The property name
 *         type:
 *           type: string
 *           enum: [APARTMENT, VILLA, PLOT, COMMERCIAL, OFFICE, RETAIL, WAREHOUSE]
 *           description: The property type
 *         status:
 *           type: string
 *           enum: [AVAILABLE, BOOKED, HOLD, SOLD, RENTED, MAINTENANCE]
 *           description: The property status
 *         location:
 *           type: string
 *           description: The property location
 *         price:
 *           type: number
 *           format: decimal
 *           description: The property price
 *         area:
 *           type: number
 *           format: decimal
 *           description: The property area in sq ft
 *         bedrooms:
 *           type: integer
 *           description: Number of bedrooms
 *         bathrooms:
 *           type: integer
 *           description: Number of bathrooms
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the property was created
 */

/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Get all properties with advanced filtering
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of properties per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, BOOKED, HOLD, SOLD, RENTED, MAINTENANCE]
 *         description: Filter by property status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [APARTMENT, VILLA, PLOT, COMMERCIAL, OFFICE, RETAIL, WAREHOUSE]
 *         description: Filter by property type
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, location, address, description
 *     responses:
 *       200:
 *         description: Properties retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     properties:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Property'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       500:
 *         description: Internal server error
 */

// Get all properties with advanced filtering and search
export const getProperties = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
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
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const where: any = {
      isActive: true
    };
    
    // Basic filters
    if (type) where.type = type;
    if (status) where.status = status;
    if (city) where.city = { contains: city as string, mode: 'insensitive' };
    if (state) where.state = { contains: state as string, mode: 'insensitive' };
    if (country) where.country = { contains: country as string, mode: 'insensitive' };
    
    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    // Area range filter
    if (minArea || maxArea) {
      where.area = {};
      if (minArea) where.area.gte = parseFloat(minArea as string);
      if (maxArea) where.area.lte = parseFloat(maxArea as string);
    }

    // Bedroom filter
    if (bedrooms) {
      where.bedrooms = parseInt(bedrooms as string);
    }

    // Bathroom filter
    if (bathrooms) {
      where.bathrooms = parseInt(bathrooms as string);
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { location: { contains: search as string, mode: 'insensitive' } },
        { address: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Sorting
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    const properties = await prisma.property.findMany({
      where,
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
      orderBy,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, phone: true }
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
    });

    const total = await prisma.property.count({ where });

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

    res.json({
      success: true,
      data: {
        properties: propertiesWithMetrics,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
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
      }
    });
  } catch (error) {
    logger.error('Error fetching properties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     summary: Get property by ID
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property retrieved successfully
 *       404:
 *         description: Property not found
 *       500:
 *         description: Internal server error
 */

// Get property by ID with detailed information
export const getPropertyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

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
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
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

    res.json({
      success: true,
      data: propertyWithAnalytics
    });
  } catch (error) {
    logger.error('Error fetching property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * @swagger
 * /api/properties:
 *   post:
 *     summary: Create a new property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Property'
 *     responses:
 *       201:
 *         description: Property created successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */

// Create property with validation and business logic
export const createProperty = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const {
      name,
      type,
      status = 'AVAILABLE',
      location,
      address,
      city,
      state,
      country,
      pincode,
      price,
      area,
      bedrooms,
      bathrooms,
      floors,
      facing,
      vastu,
      amenities = [],
      description,
      images = [],
      documents = [],
      floorPlan,
      layout3D,
      coordinates
    } = req.body;

    // Validation
    if (!name || !type || !location || !address || !city || !state || !country || !price || !area) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing: name, type, location, address, city, state, country, price, area'
      });
    }

    // Validate property type
    const validTypes = Object.values(PropertyType);
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid property type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate property status
    const validStatuses = Object.values(PropertyStatus);
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid property status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Validate price and area
    if (price <= 0 || area <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price and area must be greater than 0'
      });
    }

    // Check for duplicate property
    const existingProperty = await prisma.property.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        address: { equals: address, mode: 'insensitive' },
        city: { equals: city, mode: 'insensitive' },
        isActive: true
      }
    });

    if (existingProperty) {
      return res.status(400).json({
        success: false,
        message: 'Property with same name and address already exists'
      });
    }

    // Create property
    const property = await prisma.property.create({
      data: {
        name,
        type,
        status,
        location,
        address,
        city,
        state,
        country,
        pincode,
        price: parseFloat(price),
        area: parseFloat(area),
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        floors: floors ? parseInt(floors) : null,
        facing,
        vastu,
        amenities,
        description,
        images,
        documents,
        floorPlan,
        layout3D,
        coordinates,
        createdById: userId
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    // Log property creation
    logger.info(`Property created: ${property.name} by user ${userId}`);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_PROPERTY',
        entity: 'Property',
        entityId: property.id,
        newData: {
          name: property.name,
          type: property.type,
          price: property.price,
          location: property.location
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.status(201).json({
      success: true,
      data: property,
      message: 'Property created successfully'
    });
  } catch (error) {
    logger.error('Error creating property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create property',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * @swagger
 * /api/properties/{id}:
 *   put:
 *     summary: Update property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Property'
 *     responses:
 *       200:
 *         description: Property updated successfully
 *       404:
 *         description: Property not found
 *       500:
 *         description: Internal server error
 */

// Update property with validation and business logic
export const updateProperty = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id, isActive: true }
    });

    if (!existingProperty) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Get old data for audit log
    const oldData = {
      name: existingProperty.name,
      type: existingProperty.type,
      status: existingProperty.status,
      price: existingProperty.price,
      location: existingProperty.location
    };

    const updateData = req.body;

    // Validate property type if provided
    if (updateData.type) {
      const validTypes = Object.values(PropertyType);
      if (!validTypes.includes(updateData.type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid property type. Must be one of: ${validTypes.join(', ')}`
        });
      }
    }

    // Validate property status if provided
    if (updateData.status) {
      const validStatuses = Object.values(PropertyStatus);
      if (!validStatuses.includes(updateData.status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid property status. Must be one of: ${validStatuses.join(', ')}`
        });
      }
    }

    // Validate price if provided
    if (updateData.price && updateData.price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
      });
    }

    // Validate area if provided
    if (updateData.area && updateData.area <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Area must be greater than 0'
      });
    }

    // Update property
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    // Log property update
    logger.info(`Property updated: ${updatedProperty.name} by user ${userId}`);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_PROPERTY',
        entity: 'Property',
        entityId: updatedProperty.id,
        oldData,
        newData: {
          name: updatedProperty.name,
          type: updatedProperty.type,
          status: updatedProperty.status,
          price: updatedProperty.price,
          location: updatedProperty.location
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      success: true,
      data: updatedProperty,
      message: 'Property updated successfully'
    });
  } catch (error) {
    logger.error('Error updating property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update property',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * @swagger
 * /api/properties/{id}:
 *   delete:
 *     summary: Delete property (soft delete)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property deleted successfully
 *       404:
 *         description: Property not found
 *       500:
 *         description: Internal server error
 */

// Delete property (soft delete) with business logic
export const deleteProperty = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

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
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check if property has active bookings
    if (existingProperty.bookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete property with active bookings'
      });
    }

    // Soft delete property
    const deletedProperty = await prisma.property.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    // Log property deletion
    logger.info(`Property deleted: ${deletedProperty.name} by user ${userId}`);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_PROPERTY',
        entity: 'Property',
        entityId: deletedProperty.id,
        oldData: {
          name: existingProperty.name,
          type: existingProperty.type,
          status: existingProperty.status,
          price: existingProperty.price,
          location: existingProperty.location
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete property',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * @swagger
 * /api/properties/{id}/analytics:
 *   get:
 *     summary: Get property analytics
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property analytics retrieved successfully
 *       404:
 *         description: Property not found
 *       500:
 *         description: Internal server error
 */

// Get property analytics
export const getPropertyAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { period = '30d' } = req.query;

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id, isActive: true }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
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
        preferredLocation: { contains: property.location, mode: 'insensitive' },
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

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error fetching property analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * @swagger
 * /api/properties/search:
 *   get:
 *     summary: Search properties with advanced filters
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: filters
 *         schema:
 *           type: object
 *         description: Additional filters
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       500:
 *         description: Internal server error
 */

// Search properties with advanced filters
export const searchProperties = async (req: Request, res: Response) => {
  try {
    const { q, filters = {} } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchQuery = q as string;
    const parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;

    const where: any = {
      isActive: true,
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { location: { contains: searchQuery, mode: 'insensitive' } },
        { address: { contains: searchQuery, mode: 'insensitive' } },
        { city: { contains: searchQuery, mode: 'insensitive' } },
        { state: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } }
      ]
    };

    // Apply additional filters
    if (parsedFilters.type) where.type = parsedFilters.type;
    if (parsedFilters.status) where.status = parsedFilters.status;
    if (parsedFilters.minPrice) where.price = { ...where.price, gte: parsedFilters.minPrice };
    if (parsedFilters.maxPrice) where.price = { ...where.price, lte: parsedFilters.maxPrice };
    if (parsedFilters.bedrooms) where.bedrooms = parsedFilters.bedrooms;
    if (parsedFilters.bathrooms) where.bathrooms = parsedFilters.bathrooms;

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

    res.json({
      success: true,
      data: {
        properties,
        query: searchQuery,
        filters: parsedFilters,
        total: properties.length
      }
    });
  } catch (error) {
    logger.error('Error searching properties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search properties',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};