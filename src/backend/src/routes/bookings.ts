import { Router } from 'express';
import { Request, Response } from 'express';
import { db } from '../config/drizzle';
import { bookings, properties, customers, users, inventoryItems } from '../schema/drizzle';
import { eq, and, or, like, gte, lte, desc, asc, count, sql } from 'drizzle-orm';
import { createSuccessResponse, createErrorResponse } from '../../../shared/utils';
import { logger } from '../utils/logger';
import { PaginationParams, FilterParams, BookingStage } from '../../../shared/types';

const router = Router();

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     summary: Get bookings with BlinderSøe stages and filters
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for customer name, property name, or booking ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *         description: Filter by booking status
 *       - in: query
 *         name: stage
 *         schema:
 *           type: string
 *           enum: [SOLD, TENTATIVELY_BOOKED, CONFIRMED, CANCELLED]
 *         description: Filter by BlinderSøe booking stage
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *         description: Filter by property ID
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *         description: Filter by agent ID
 *       - in: query
 *         name: bookingDateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by booking date from
 *       - in: query
 *         name: bookingDateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by booking date to
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Minimum booking amount
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Maximum booking amount
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [bookingDate, amount, createdAt, customerName, propertyName]
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
 *         description: List of bookings with metadata
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
 *                       propertyId:
 *                         type: string
 *                       inventoryId:
 *                         type: string
 *                       customerId:
 *                         type: string
 *                       agentId:
 *                         type: string
 *                       status:
 *                         type: string
 *                       stage:
 *                         type: string
 *                       bookingDate:
 *                         type: string
 *                         format: date-time
 *                       moveInDate:
 *                         type: string
 *                         format: date-time
 *                       moveOutDate:
 *                         type: string
 *                         format: date-time
 *                       amount:
 *                         type: number
 *                       advanceAmount:
 *                         type: number
 *                       paymentMethod:
 *                         type: string
 *                       paymentStatus:
 *                         type: string
 *                       tokenDates:
 *                         type: array
 *                         items:
 *                           type: string
 *                       notes:
 *                         type: string
 *                       pricingBreakdown:
 *                         type: object
 *                       documents:
 *                         type: array
 *                         items:
 *                           type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       property:
 *                         type: object
 *                       customer:
 *                         type: object
 *                       agent:
 *                         type: object
 *                       inventory:
 *                         type: object
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
 *                     stageStats:
 *                       type: object
 *                       properties:
 *                         sold:
 *                           type: integer
 *                         tentativelyBooked:
 *                           type: integer
 *                         confirmed:
 *                           type: integer
 *                         cancelled:
 *                           type: integer
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      search,
      status,
      stage,
      propertyId,
      customerId,
      agentId,
      bookingDateFrom,
      bookingDateTo,
      minAmount,
      maxAmount,
      sort = 'bookingDate',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query as PaginationParams & FilterParams & {
      stage?: string;
      propertyId?: string;
      customerId?: string;
      agentId?: string;
      bookingDateFrom?: string;
      bookingDateTo?: string;
      minAmount?: string;
      maxAmount?: string;
    };

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 10, 100);
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    const whereConditions = [eq(bookings.isActive, true)];

    if (search) {
      whereConditions.push(
        or(
          like(bookings.id, `%${search}%`),
          like(properties.name, `%${search}%`),
          like(customers.name, `%${search}%`)
        )!
      );
    }

    if (status) {
      whereConditions.push(eq(bookings.status, status as any));
    }

    if (stage) {
      whereConditions.push(eq(bookings.stage, stage as any));
    }

    if (propertyId) {
      whereConditions.push(eq(bookings.propertyId, propertyId));
    }

    if (customerId) {
      whereConditions.push(eq(bookings.customerId, customerId));
    }

    if (agentId) {
      whereConditions.push(eq(bookings.agentId, agentId));
    }

    if (bookingDateFrom) {
      whereConditions.push(gte(bookings.bookingDate, new Date(bookingDateFrom)));
    }

    if (bookingDateTo) {
      whereConditions.push(lte(bookings.bookingDate, new Date(bookingDateTo)));
    }

    if (minAmount) {
      whereConditions.push(gte(bookings.amount, parseFloat(minAmount)));
    }

    if (maxAmount) {
      whereConditions.push(lte(bookings.amount, parseFloat(maxAmount)));
    }

    // Build order by
    let orderBy;
    if (sort === 'customerName') {
      orderBy = order === 'desc' ? desc(customers.name) : asc(customers.name);
    } else if (sort === 'propertyName') {
      orderBy = order === 'desc' ? desc(properties.name) : asc(properties.name);
    } else {
      const sortField = sort as keyof typeof bookings;
      orderBy = order === 'desc' ? desc(bookings[sortField]) : asc(bookings[sortField]);
    }

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(bookings)
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .leftJoin(customers, eq(bookings.customerId, customers.id))
      .where(and(...whereConditions));

    const total = totalResult[0].count;

    // Get bookings with pagination and relations
    const bookingsList = await db
      .select({
        id: bookings.id,
        propertyId: bookings.propertyId,
        inventoryId: bookings.inventoryId,
        customerId: bookings.customerId,
        agentId: bookings.agentId,
        status: bookings.status,
        stage: bookings.stage,
        bookingDate: bookings.bookingDate,
        moveInDate: bookings.moveInDate,
        moveOutDate: bookings.moveOutDate,
        amount: bookings.amount,
        advanceAmount: bookings.advanceAmount,
        paymentMethod: bookings.paymentMethod,
        paymentStatus: bookings.paymentStatus,
        tokenDates: bookings.tokenDates,
        notes: bookings.notes,
        pricingBreakdown: bookings.pricingBreakdown,
        documents: bookings.documents,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        property: {
          id: properties.id,
          name: properties.name,
          type: properties.type,
          location: properties.location,
          city: properties.city,
          price: properties.price
        },
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone
        },
        agent: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone
        },
        inventory: {
          id: inventoryItems.id,
          unitNumber: inventoryItems.unitNumber,
          floor: inventoryItems.floor,
          block: inventoryItems.block,
          price: inventoryItems.price,
          area: inventoryItems.area
        }
      })
      .from(bookings)
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .leftJoin(customers, eq(bookings.customerId, customers.id))
      .leftJoin(users, eq(bookings.agentId, users.id))
      .leftJoin(inventoryItems, eq(bookings.inventoryId, inventoryItems.id))
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .limit(limitNum)
      .offset(offset);

    // Get stage statistics
    const stageStats = await db
      .select({
        stage: bookings.stage,
        count: count()
      })
      .from(bookings)
      .where(and(...whereConditions))
      .groupBy(bookings.stage);

    const stageStatsObj = stageStats.reduce((acc, stat) => {
      acc[stat.stage.toLowerCase()] = stat.count;
      return acc;
    }, {} as Record<string, number>);

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
      hasPrev,
      stageStats: {
        sold: stageStatsObj.sold || 0,
        tentativelyBooked: stageStatsObj.tentatively_booked || 0,
        confirmed: stageStatsObj.confirmed || 0,
        cancelled: stageStatsObj.cancelled || 0
      }
    };

    logger.info(`Bookings retrieved: ${bookingsList.length} out of ${total} total`);

    res.status(200).json(createSuccessResponse(bookingsList, 'Bookings retrieved successfully', meta));

  } catch (error) {
    logger.error('Error retrieving bookings:', error);
    res.status(500).json(createErrorResponse('Failed to retrieve bookings', error));
  }
});

/**
 * @swagger
 * /api/v1/bookings:
 *   post:
 *     summary: Create a new booking with BlinderSøe stage
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *               - customerId
 *               - agentId
 *               - amount
 *             properties:
 *               propertyId:
 *                 type: string
 *               inventoryId:
 *                 type: string
 *               customerId:
 *                 type: string
 *               agentId:
 *                 type: string
 *               stage:
 *                 type: string
 *                 enum: [SOLD, TENTATIVELY_BOOKED, CONFIRMED, CANCELLED]
 *                 default: TENTATIVELY_BOOKED
 *               bookingDate:
 *                 type: string
 *                 format: date-time
 *               moveInDate:
 *                 type: string
 *                 format: date-time
 *               moveOutDate:
 *                 type: string
 *                 format: date-time
 *               amount:
 *                 type: number
 *               advanceAmount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [UPI, CARD, NET_BANKING, WALLET, CASH, CHEQUE, BANK_TRANSFER, ONLINE]
 *               notes:
 *                 type: string
 *               tokenDates:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: date
 *               pricingBreakdown:
 *                 type: object
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
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
 *                     propertyId:
 *                       type: string
 *                     customerId:
 *                       type: string
 *                     agentId:
 *                       type: string
 *                     stage:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     bookingDate:
 *                       type: string
 *                       format: date-time
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      propertyId,
      inventoryId,
      customerId,
      agentId,
      stage = 'TENTATIVELY_BOOKED',
      bookingDate = new Date(),
      moveInDate,
      moveOutDate,
      amount,
      advanceAmount,
      paymentMethod,
      notes,
      tokenDates = [],
      pricingBreakdown,
      documents = []
    } = req.body;

    // Validate required fields
    if (!propertyId || !customerId || !agentId || !amount) {
      return res.status(400).json(createErrorResponse('Missing required fields: propertyId, customerId, agentId, amount'));
    }

    // Create pricing breakdown if not provided
    const defaultPricingBreakdown = pricingBreakdown || {
      basePrice: amount,
      advanceAmount: advanceAmount || 0,
      remainingAmount: amount - (advanceAmount || 0),
      taxes: 0,
      totalAmount: amount
    };

    // Create booking
    const newBooking = await db
      .insert(bookings)
      .values({
        propertyId,
        inventoryId,
        customerId,
        agentId,
        stage: stage as any,
        status: stage === 'SOLD' ? 'CONFIRMED' : 'PENDING',
        bookingDate: new Date(bookingDate),
        moveInDate: moveInDate ? new Date(moveInDate) : null,
        moveOutDate: moveOutDate ? new Date(moveOutDate) : null,
        amount: amount.toString(),
        advanceAmount: advanceAmount ? advanceAmount.toString() : null,
        paymentMethod: paymentMethod as any,
        paymentStatus: 'PENDING',
        notes,
        tokenDates,
        pricingBreakdown: defaultPricingBreakdown,
        documents,
        createdById: req.user?.id || 'system'
      })
      .returning();

    logger.info(`Booking created with ID: ${newBooking[0].id}, stage: ${stage}, amount: ${amount}`);

    res.status(201).json(createSuccessResponse(newBooking[0], 'Booking created successfully'));

  } catch (error) {
    logger.error('Error creating booking:', error);
    res.status(500).json(createErrorResponse('Failed to create booking', error));
  }
});

/**
 * @swagger
 * /api/v1/bookings/{id}/stage:
 *   put:
 *     summary: Update booking stage
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stage
 *             properties:
 *               stage:
 *                 type: string
 *                 enum: [SOLD, TENTATIVELY_BOOKED, CONFIRMED, CANCELLED]
 *               notes:
 *                 type: string
 *               tokenDates:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: date
 *               pricingBreakdown:
 *                 type: object
 *     responses:
 *       200:
 *         description: Booking stage updated successfully
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
 *                     stage:
 *                       type: string
 *                     status:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 */
router.put('/:id/stage', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stage, notes, tokenDates, pricingBreakdown } = req.body;

    if (!stage) {
      return res.status(400).json(createErrorResponse('Stage is required'));
    }

    // Get current booking
    const currentBooking = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, id), eq(bookings.isActive, true)))
      .limit(1);

    if (currentBooking.length === 0) {
      return res.status(404).json(createErrorResponse('Booking not found'));
    }

    const booking = currentBooking[0];

    // Update stage and related fields
    const updatedBooking = await db
      .update(bookings)
      .set({
        stage: stage as any,
        status: stage === 'SOLD' ? 'CONFIRMED' : stage === 'CANCELLED' ? 'CANCELLED' : 'PENDING',
        notes: notes || booking.notes,
        tokenDates: tokenDates || booking.tokenDates,
        pricingBreakdown: pricingBreakdown || booking.pricingBreakdown,
        updatedAt: new Date(),
        updatedById: req.user?.id || 'system'
      })
      .where(eq(bookings.id, id))
      .returning();

    logger.info(`Booking stage updated for ID: ${id}, new stage: ${stage}`);

    res.status(200).json(createSuccessResponse(updatedBooking[0], 'Booking stage updated successfully'));

  } catch (error) {
    logger.error('Error updating booking stage:', error);
    res.status(500).json(createErrorResponse('Failed to update booking stage', error));
  }
});

/**
 * @swagger
 * /api/v1/bookings/{id}/pricing:
 *   put:
 *     summary: Update booking pricing breakdown
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pricingBreakdown
 *             properties:
 *               pricingBreakdown:
 *                 type: object
 *                 properties:
 *                   basePrice:
 *                     type: number
 *                   advanceAmount:
 *                     type: number
 *                   remainingAmount:
 *                     type: number
 *                   taxes:
 *                     type: number
 *                   totalAmount:
 *                     type: number
 *                   discounts:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                         amount:
 *                           type: number
 *                         description:
 *                           type: string
 *     responses:
 *       200:
 *         description: Booking pricing updated successfully
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
 *                     pricingBreakdown:
 *                       type: object
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 */
router.put('/:id/pricing', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pricingBreakdown } = req.body;

    if (!pricingBreakdown) {
      return res.status(400).json(createErrorResponse('Pricing breakdown is required'));
    }

    // Update pricing breakdown
    const updatedBooking = await db
      .update(bookings)
      .set({
        pricingBreakdown,
        updatedAt: new Date(),
        updatedById: req.user?.id || 'system'
      })
      .where(eq(bookings.id, id))
      .returning();

    if (updatedBooking.length === 0) {
      return res.status(404).json(createErrorResponse('Booking not found'));
    }

    logger.info(`Booking pricing updated for ID: ${id}`);

    res.status(200).json(createSuccessResponse(updatedBooking[0], 'Booking pricing updated successfully'));

  } catch (error) {
    logger.error('Error updating booking pricing:', error);
    res.status(500).json(createErrorResponse('Failed to update booking pricing', error));
  }
});

/**
 * @swagger
 * /api/v1/bookings/stats:
 *   get:
 *     summary: Get booking statistics by stage and status
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: Booking statistics
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
 *                     total:
 *                       type: integer
 *                     byStage:
 *                       type: object
 *                       properties:
 *                         sold:
 *                           type: integer
 *                         tentativelyBooked:
 *                           type: integer
 *                         confirmed:
 *                           type: integer
 *                         cancelled:
 *                           type: integer
 *                     byStatus:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: integer
 *                         confirmed:
 *                           type: integer
 *                         cancelled:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *                     totalValue:
 *                       type: number
 *                     averageValue:
 *                       type: number
 *                     conversionRate:
 *                       type: number
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get total bookings
    const totalResult = await db
      .select({ count: count() })
      .from(bookings)
      .where(eq(bookings.isActive, true));

    const total = totalResult[0].count;

    // Get stage statistics
    const stageStats = await db
      .select({
        stage: bookings.stage,
        count: count()
      })
      .from(bookings)
      .where(eq(bookings.isActive, true))
      .groupBy(bookings.stage);

    const byStage = stageStats.reduce((acc, stat) => {
      acc[stat.stage.toLowerCase()] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    // Get status statistics
    const statusStats = await db
      .select({
        status: bookings.status,
        count: count()
      })
      .from(bookings)
      .where(eq(bookings.isActive, true))
      .groupBy(bookings.status);

    const byStatus = statusStats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    // Get value statistics
    const valueStats = await db
      .select({
        totalValue: sql<number>`sum(amount)`,
        averageValue: sql<number>`avg(amount)`
      })
      .from(bookings)
      .where(eq(bookings.isActive, true));

    const totalValue = valueStats[0].totalValue || 0;
    const averageValue = valueStats[0].averageValue || 0;

    // Calculate conversion rate (sold / total)
    const soldCount = byStage.sold || 0;
    const conversionRate = total > 0 ? (soldCount / total) * 100 : 0;

    const result = {
      total,
      byStage: {
        sold: byStage.sold || 0,
        tentativelyBooked: byStage.tentatively_booked || 0,
        confirmed: byStage.confirmed || 0,
        cancelled: byStage.cancelled || 0
      },
      byStatus: {
        pending: byStatus.pending || 0,
        confirmed: byStatus.confirmed || 0,
        cancelled: byStatus.cancelled || 0,
        completed: byStatus.completed || 0
      },
      totalValue: Math.round(totalValue * 100) / 100,
      averageValue: Math.round(averageValue * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100
    };

    logger.info(`Booking statistics retrieved: ${total} total bookings`);

    res.status(200).json(createSuccessResponse(result, 'Booking statistics retrieved successfully'));

  } catch (error) {
    logger.error('Error retrieving booking statistics:', error);
    res.status(500).json(createErrorResponse('Failed to retrieve booking statistics', error));
  }
});

export default router;
