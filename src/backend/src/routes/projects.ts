import { Router } from 'express';
import { Request, Response } from 'express';
import { db } from '../config/drizzle';
import { projects, properties, inventoryItems } from '../schema/drizzle';
import { eq, and, or, like, gte, lte, desc, asc, count, sql } from 'drizzle-orm';
import { createSuccessResponse, createErrorResponse } from '../../../shared/utils';
import { logger } from '../utils/logger';
import { PaginationParams, FilterParams } from '../../../shared/types';

const router = Router();

/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     summary: Get projects with filters and metadata
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for project name or description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [UPCOMING, ONGOING, COMPLETED, CANCELLED]
 *         description: Filter by project status
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
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, price, createdAt, views, inquiries, bookings]
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of projects with metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                       location:
 *                         type: string
 *                       city:
 *                         type: string
 *                       totalUnits:
 *                         type: integer
 *                       availableUnits:
 *                         type: integer
 *                       soldUnits:
 *                         type: integer
 *                       priceRange:
 *                         type: object
 *                       views:
 *                         type: integer
 *                       inquiries:
 *                         type: integer
 *                       bookings:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      search,
      status,
      city,
      minPrice,
      maxPrice,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query as PaginationParams & FilterParams;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 10, 100);
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    const whereConditions = [eq(projects.isActive, true)];

    if (search) {
      whereConditions.push(
        or(
          like(projects.name, `%${search}%`),
          like(projects.description, `%${search}%`)
        )!
      );
    }

    if (status) {
      whereConditions.push(eq(projects.status, status as any));
    }

    if (city) {
      whereConditions.push(like(projects.city, `%${city}%`));
    }

    if (minPrice) {
      whereConditions.push(gte(projects.priceRange, minPrice));
    }

    if (maxPrice) {
      whereConditions.push(lte(projects.priceRange, maxPrice));
    }

    // Build order by
    let orderBy;
    const sortField = sort as keyof typeof projects;
    if (order === 'desc') {
      orderBy = desc(projects[sortField]);
    } else {
      orderBy = asc(projects[sortField]);
    }

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(projects)
      .where(and(...whereConditions));

    const total = totalResult[0].count;

    // Get projects with pagination
    const projectsList = await db
      .select()
      .from(projects)
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .limit(limitNum)
      .offset(offset);

    // Calculate metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    const meta = {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNext,
      hasPrev
    };

    logger.info(`Projects retrieved: ${projectsList.length} out of ${total} total`);

    res.status(200).json(createSuccessResponse(projectsList, 'Projects retrieved successfully', meta));

  } catch (error) {
    logger.error('Error retrieving projects:', error);
    res.status(500).json(createErrorResponse('Failed to retrieve projects', error));
  }
});

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   get:
 *     summary: Get project by ID with detailed information
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
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
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     status:
 *                       type: string
 *                     location:
 *                       type: string
 *                     address:
 *                       type: string
 *                     city:
 *                       type: string
 *                     state:
 *                       type: string
 *                     country:
 *                       type: string
 *                     totalUnits:
 *                       type: integer
 *                     availableUnits:
 *                       type: integer
 *                     soldUnits:
 *                       type: integer
 *                     priceRange:
 *                       type: object
 *                     amenities:
 *                       type: array
 *                       items:
 *                         type: string
 *                     features:
 *                       type: array
 *                       items:
 *                         type: string
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *                     videos:
 *                       type: array
 *                       items:
 *                         type: string
 *                     documents:
 *                       type: array
 *                       items:
 *                         type: string
 *                     floorPlan:
 *                       type: string
 *                     layout3D:
 *                       type: string
 *                     gmapIframe:
 *                       type: string
 *                     coordinates:
 *                       type: object
 *                     views:
 *                       type: integer
 *                     inquiries:
 *                       type: integer
 *                     bookings:
 *                       type: integer
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     meta:
 *                       type: object
 *                       properties:
 *                         totalUnits:
 *                           type: integer
 *                         availableUnits:
 *                           type: integer
 *                         soldUnits:
 *                           type: integer
 *                         occupancyRate:
 *                           type: number
 *                         totalValue:
 *                           type: number
 *                         averagePrice:
 *                           type: number
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.isActive, true)))
      .limit(1);

    if (project.length === 0) {
      return res.status(404).json(createErrorResponse('Project not found'));
    }

    const projectData = project[0];

    // Calculate metadata
    const occupancyRate = projectData.totalUnits > 0 
      ? ((projectData.totalUnits - projectData.availableUnits) / projectData.totalUnits) * 100 
      : 0;

    const averagePrice = projectData.priceRange 
      ? (projectData.priceRange as any).min + (projectData.priceRange as any).max / 2 
      : 0;

    const totalValue = averagePrice * projectData.totalUnits;

    const meta = {
      totalUnits: projectData.totalUnits,
      availableUnits: projectData.availableUnits,
      soldUnits: projectData.soldUnits,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
      averagePrice: Math.round(averagePrice * 100) / 100
    };

    logger.info(`Project details retrieved for ID: ${id}`);

    res.status(200).json(createSuccessResponse({
      ...projectData,
      meta
    }, 'Project details retrieved successfully'));

  } catch (error) {
    logger.error('Error retrieving project details:', error);
    res.status(500).json(createErrorResponse('Failed to retrieve project details', error));
  }
});

/**
 * @swagger
 * /api/v1/projects/{id}/plots:
 *   get:
 *     summary: Get plots/inventory for a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, SOLD, RENTED, MAINTENANCE, DRAFT]
 *         description: Filter by plot status
 *       - in: query
 *         name: floor
 *         schema:
 *           type: integer
 *         description: Filter by floor number
 *       - in: query
 *         name: block
 *         schema:
 *           type: string
 *         description: Filter by block
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
 *     responses:
 *       200:
 *         description: List of plots for the project
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       unitNumber:
 *                         type: string
 *                       floor:
 *                         type: integer
 *                       block:
 *                         type: string
 *                       status:
 *                         type: string
 *                       price:
 *                         type: number
 *                       area:
 *                         type: number
 *                       bedrooms:
 *                         type: integer
 *                       bathrooms:
 *                         type: integer
 *                       facing:
 *                         type: string
 *                       vastu:
 *                         type: string
 *                       amenities:
 *                         type: array
 *                         items:
 *                           type: string
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 *                       floorPlan:
 *                         type: string
 */
router.get('/:id/plots', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, floor, block, minPrice, maxPrice } = req.query as FilterParams;

    // Verify project exists
    const project = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.isActive, true)))
      .limit(1);

    if (project.length === 0) {
      return res.status(404).json(createErrorResponse('Project not found'));
    }

    // Build where conditions for plots
    const whereConditions = [eq(inventoryItems.propertyId, id)];

    if (status) {
      whereConditions.push(eq(inventoryItems.status, status as any));
    }

    if (floor) {
      whereConditions.push(eq(inventoryItems.floor, parseInt(floor as string)));
    }

    if (block) {
      whereConditions.push(like(inventoryItems.block, `%${block}%`));
    }

    if (minPrice) {
      whereConditions.push(gte(inventoryItems.price, minPrice));
    }

    if (maxPrice) {
      whereConditions.push(lte(inventoryItems.price, maxPrice));
    }

    // Get plots
    const plots = await db
      .select()
      .from(inventoryItems)
      .where(and(...whereConditions))
      .orderBy(asc(inventoryItems.floor), asc(inventoryItems.unitNumber));

    logger.info(`Plots retrieved for project ${id}: ${plots.length} plots`);

    res.status(200).json(createSuccessResponse(plots, 'Plots retrieved successfully'));

  } catch (error) {
    logger.error('Error retrieving plots:', error);
    res.status(500).json(createErrorResponse('Failed to retrieve plots', error));
  }
});

/**
 * @swagger
 * /api/v1/projects/{id}/stats:
 *   get:
 *     summary: Get project statistics
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project statistics
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
 *                     totalUnits:
 *                       type: integer
 *                     availableUnits:
 *                       type: integer
 *                     soldUnits:
 *                       type: integer
 *                     occupancyRate:
 *                       type: number
 *                     totalValue:
 *                       type: number
 *                     averagePrice:
 *                       type: number
 *                     views:
 *                       type: integer
 *                     inquiries:
 *                       type: integer
 *                     bookings:
 *                       type: integer
 *                     conversionRate:
 *                       type: number
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get project
    const project = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.isActive, true)))
      .limit(1);

    if (project.length === 0) {
      return res.status(404).json(createErrorResponse('Project not found'));
    }

    const projectData = project[0];

    // Get plot statistics
    const plotStats = await db
      .select({
        total: count(),
        available: sql<number>`count(case when status = 'AVAILABLE' then 1 end)`,
        sold: sql<number>`count(case when status = 'SOLD' then 1 end)`,
        rented: sql<number>`count(case when status = 'RENTED' then 1 end)`,
        maintenance: sql<number>`count(case when status = 'MAINTENANCE' then 1 end)`,
        averagePrice: sql<number>`avg(price)`,
        totalValue: sql<number>`sum(price)`
      })
      .from(inventoryItems)
      .where(eq(inventoryItems.propertyId, id));

    const stats = plotStats[0];

    // Calculate rates
    const occupancyRate = stats.total > 0 
      ? ((stats.total - stats.available) / stats.total) * 100 
      : 0;

    const conversionRate = projectData.views > 0 
      ? (projectData.bookings / projectData.views) * 100 
      : 0;

    const result = {
      totalUnits: stats.total,
      availableUnits: stats.available,
      soldUnits: stats.sold,
      rentedUnits: stats.rented,
      maintenanceUnits: stats.maintenance,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      totalValue: Math.round(stats.totalValue * 100) / 100,
      averagePrice: Math.round(stats.averagePrice * 100) / 100,
      views: projectData.views,
      inquiries: projectData.inquiries,
      bookings: projectData.bookings,
      conversionRate: Math.round(conversionRate * 100) / 100
    };

    logger.info(`Project statistics retrieved for ID: ${id}`);

    res.status(200).json(createSuccessResponse(result, 'Project statistics retrieved successfully'));

  } catch (error) {
    logger.error('Error retrieving project statistics:', error);
    res.status(500).json(createErrorResponse('Failed to retrieve project statistics', error));
  }
});

export default router;
