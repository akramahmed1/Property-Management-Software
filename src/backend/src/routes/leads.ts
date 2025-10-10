import { Router } from 'express';
import { Request, Response } from 'express';
import { db } from '../config/drizzle';
import { leads, customers, users } from '../schema/drizzle';
import { eq, and, or, like, gte, lte, desc, asc, count, sql } from 'drizzle-orm';
import { createSuccessResponse, createErrorResponse } from '../../../shared/utils';
import { logger } from '../utils/logger';
import { PaginationParams, FilterParams, LeadStage, LeadSource } from '../../../shared/types';

const router = Router();

/**
 * @swagger
 * /api/v1/leads:
 *   get:
 *     summary: Get leads with BlinderSøe stages and filters
 *     tags: [Leads]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for lead name, email, or phone
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NEW, CONTACTED, QUALIFIED, PROPOSAL, NEGOTIATION, CLOSED, LOST]
 *         description: Filter by lead status
 *       - in: query
 *         name: stage
 *         schema:
 *           type: string
 *           enum: [ENQUIRY_RECEIVED, SITE_VISIT, PROPOSAL_SENT, NEGOTIATION, BOOKING, SOLD, LOST]
 *         description: Filter by BlinderSøe lead stage
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [WEBSITE, WHATSAPP, PHONE, EMAIL, REFERRAL, WALK_IN, SOCIAL_MEDIA, ADVERTISEMENT, OTHER]
 *         description: Filter by lead source
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: Filter by assigned user ID
 *       - in: query
 *         name: stageDateStart
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by stage date start
 *       - in: query
 *         name: stageDateEnd
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by stage date end
 *       - in: query
 *         name: minScore
 *         schema:
 *           type: integer
 *         description: Minimum lead score
 *       - in: query
 *         name: maxScore
 *         schema:
 *           type: integer
 *         description: Maximum lead score
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, email, phone, score, createdAt, stageDateStart]
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
 *         description: List of leads with metadata
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
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       source:
 *                         type: string
 *                       status:
 *                         type: string
 *                       stage:
 *                         type: string
 *                       score:
 *                         type: integer
 *                       interest:
 *                         type: string
 *                       budget:
 *                         type: number
 *                       notes:
 *                         type: string
 *                       assignedTo:
 *                         type: string
 *                       stageDateStart:
 *                         type: string
 *                         format: date-time
 *                       attachments:
 *                         type: array
 *                         items:
 *                           type: string
 *                       history:
 *                         type: array
 *                         items:
 *                           type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       customer:
 *                         type: object
 *                       assignedUser:
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
 *                         enquiryReceived:
 *                           type: integer
 *                         siteVisit:
 *                           type: integer
 *                         proposalSent:
 *                           type: integer
 *                         negotiation:
 *                           type: integer
 *                         booking:
 *                           type: integer
 *                         sold:
 *                           type: integer
 *                         lost:
 *                           type: integer
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      search,
      status,
      stage,
      source,
      assignedTo,
      stageDateStart,
      stageDateEnd,
      minScore,
      maxScore,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query as PaginationParams & FilterParams & {
      stage?: string;
      source?: string;
      assignedTo?: string;
      stageDateStart?: string;
      stageDateEnd?: string;
      minScore?: string;
      maxScore?: string;
    };

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 10, 100);
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    const whereConditions = [eq(leads.isActive, true)];

    if (search) {
      whereConditions.push(
        or(
          like(leads.name, `%${search}%`),
          like(leads.email, `%${search}%`),
          like(leads.phone, `%${search}%`)
        )!
      );
    }

    if (status) {
      whereConditions.push(eq(leads.status, status as any));
    }

    if (stage) {
      whereConditions.push(eq(leads.stage, stage as any));
    }

    if (source) {
      whereConditions.push(eq(leads.source, source as any));
    }

    if (assignedTo) {
      whereConditions.push(eq(leads.assignedTo, assignedTo));
    }

    if (stageDateStart) {
      whereConditions.push(gte(leads.stageDateStart, new Date(stageDateStart)));
    }

    if (stageDateEnd) {
      whereConditions.push(lte(leads.stageDateStart, new Date(stageDateEnd)));
    }

    if (minScore) {
      whereConditions.push(gte(leads.score, parseInt(minScore)));
    }

    if (maxScore) {
      whereConditions.push(lte(leads.score, parseInt(maxScore)));
    }

    // Build order by
    let orderBy;
    const sortField = sort as keyof typeof leads;
    if (order === 'desc') {
      orderBy = desc(leads[sortField]);
    } else {
      orderBy = asc(leads[sortField]);
    }

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(leads)
      .where(and(...whereConditions));

    const total = totalResult[0].count;

    // Get leads with pagination and relations
    const leadsList = await db
      .select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        phone: leads.phone,
        source: leads.source,
        status: leads.status,
        stage: leads.stage,
        score: leads.score,
        interest: leads.interest,
        budget: leads.budget,
        notes: leads.notes,
        assignedTo: leads.assignedTo,
        stageDateStart: leads.stageDateStart,
        attachments: leads.attachments,
        history: leads.history,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
        customerId: leads.customerId,
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone
        },
        assignedUser: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone
        }
      })
      .from(leads)
      .leftJoin(customers, eq(leads.customerId, customers.id))
      .leftJoin(users, eq(leads.assignedTo, users.id))
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .limit(limitNum)
      .offset(offset);

    // Get stage statistics
    const stageStats = await db
      .select({
        stage: leads.stage,
        count: count()
      })
      .from(leads)
      .where(and(...whereConditions))
      .groupBy(leads.stage);

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
        enquiryReceived: stageStatsObj.enquiry_received || 0,
        siteVisit: stageStatsObj.site_visit || 0,
        proposalSent: stageStatsObj.proposal_sent || 0,
        negotiation: stageStatsObj.negotiation || 0,
        booking: stageStatsObj.booking || 0,
        sold: stageStatsObj.sold || 0,
        lost: stageStatsObj.lost || 0
      }
    };

    logger.info(`Leads retrieved: ${leadsList.length} out of ${total} total`);

    res.status(200).json(createSuccessResponse(leadsList, 'Leads retrieved successfully', meta));

  } catch (error) {
    logger.error('Error retrieving leads:', error);
    res.status(500).json(createErrorResponse('Failed to retrieve leads', error));
  }
});

/**
 * @swagger
 * /api/v1/leads:
 *   post:
 *     summary: Create a new lead with BlinderSøe stage
 *     tags: [Leads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - source
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               source:
 *                 type: string
 *                 enum: [WEBSITE, WHATSAPP, PHONE, EMAIL, REFERRAL, WALK_IN, SOCIAL_MEDIA, ADVERTISEMENT, OTHER]
 *               interest:
 *                 type: string
 *               budget:
 *                 type: number
 *               notes:
 *                 type: string
 *               assignedTo:
 *                 type: string
 *               customerId:
 *                 type: string
 *               stage:
 *                 type: string
 *                 enum: [ENQUIRY_RECEIVED, SITE_VISIT, PROPOSAL_SENT, NEGOTIATION, BOOKING, SOLD, LOST]
 *                 default: ENQUIRY_RECEIVED
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Lead created successfully
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
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     source:
 *                       type: string
 *                     stage:
 *                       type: string
 *                     score:
 *                       type: integer
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      source,
      interest,
      budget,
      notes,
      assignedTo,
      customerId,
      stage = 'ENQUIRY_RECEIVED',
      attachments = []
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !source) {
      return res.status(400).json(createErrorResponse('Missing required fields: name, email, phone, source'));
    }

    // Calculate lead score based on source and other factors
    let score = 0;
    switch (source) {
      case 'WEBSITE':
        score = 5;
        break;
      case 'WHATSAPP':
        score = 10;
        break;
      case 'PHONE':
        score = 15;
        break;
      case 'EMAIL':
        score = 20;
        break;
      case 'REFERRAL':
        score = 25;
        break;
      case 'WALK_IN':
        score = 30;
        break;
      case 'SOCIAL_MEDIA':
        score = 35;
        break;
      case 'ADVERTISEMENT':
        score = 40;
        break;
      case 'OTHER':
        score = 45;
        break;
      default:
        score = 0;
    }

    // Add bonus points for budget
    if (budget && budget > 1000000) {
      score += 10;
    } else if (budget && budget > 500000) {
      score += 5;
    }

    // Create lead
    const newLead = await db
      .insert(leads)
      .values({
        name,
        email,
        phone,
        source: source as any,
        stage: stage as any,
        score,
        interest,
        budget: budget ? budget.toString() : null,
        notes,
        assignedTo,
        customerId,
        stageDateStart: new Date(),
        attachments,
        history: [{
          stage: stage as any,
          date: new Date().toISOString(),
          notes: 'Lead created',
          userId: req.user?.id || 'system'
        }],
        createdById: req.user?.id || 'system'
      })
      .returning();

    logger.info(`Lead created with ID: ${newLead[0].id}, score: ${score}`);

    res.status(201).json(createSuccessResponse(newLead[0], 'Lead created successfully'));

  } catch (error) {
    logger.error('Error creating lead:', error);
    res.status(500).json(createErrorResponse('Failed to create lead', error));
  }
});

/**
 * @swagger
 * /api/v1/leads/{id}/stage:
 *   put:
 *     summary: Update lead stage with history tracking
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lead ID
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
 *                 enum: [ENQUIRY_RECEIVED, SITE_VISIT, PROPOSAL_SENT, NEGOTIATION, BOOKING, SOLD, LOST]
 *               notes:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Lead stage updated successfully
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
 *                     stageDateStart:
 *                       type: string
 *                       format: date-time
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.put('/:id/stage', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stage, notes, attachments } = req.body;

    if (!stage) {
      return res.status(400).json(createErrorResponse('Stage is required'));
    }

    // Get current lead
    const currentLead = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, id), eq(leads.isActive, true)))
      .limit(1);

    if (currentLead.length === 0) {
      return res.status(404).json(createErrorResponse('Lead not found'));
    }

    const lead = currentLead[0];

    // Update stage and add to history
    const updatedLead = await db
      .update(leads)
      .set({
        stage: stage as any,
        stageDateStart: new Date(),
        notes: notes || lead.notes,
        attachments: attachments || lead.attachments,
        history: [
          ...(lead.history || []),
          {
            stage: stage as any,
            date: new Date().toISOString(),
            notes: notes || `Stage updated to ${stage}`,
            userId: req.user?.id || 'system'
          }
        ],
        updatedAt: new Date(),
        updatedById: req.user?.id || 'system'
      })
      .where(eq(leads.id, id))
      .returning();

    logger.info(`Lead stage updated for ID: ${id}, new stage: ${stage}`);

    res.status(200).json(createSuccessResponse(updatedLead[0], 'Lead stage updated successfully'));

  } catch (error) {
    logger.error('Error updating lead stage:', error);
    res.status(500).json(createErrorResponse('Failed to update lead stage', error));
  }
});

/**
 * @swagger
 * /api/v1/leads/stats:
 *   get:
 *     summary: Get lead statistics by stage and source
 *     tags: [Leads]
 *     responses:
 *       200:
 *         description: Lead statistics
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
 *                         enquiryReceived:
 *                           type: integer
 *                         siteVisit:
 *                           type: integer
 *                         proposalSent:
 *                           type: integer
 *                         negotiation:
 *                           type: integer
 *                         booking:
 *                           type: integer
 *                         sold:
 *                           type: integer
 *                         lost:
 *                           type: integer
 *                     bySource:
 *                       type: object
 *                       properties:
 *                         website:
 *                           type: integer
 *                         whatsapp:
 *                           type: integer
 *                         phone:
 *                           type: integer
 *                         email:
 *                           type: integer
 *                         referral:
 *                           type: integer
 *                         walkIn:
 *                           type: integer
 *                         socialMedia:
 *                           type: integer
 *                         advertisement:
 *                           type: integer
 *                         other:
 *                           type: integer
 *                     conversionRate:
 *                       type: number
 *                     averageScore:
 *                       type: number
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get total leads
    const totalResult = await db
      .select({ count: count() })
      .from(leads)
      .where(eq(leads.isActive, true));

    const total = totalResult[0].count;

    // Get stage statistics
    const stageStats = await db
      .select({
        stage: leads.stage,
        count: count()
      })
      .from(leads)
      .where(eq(leads.isActive, true))
      .groupBy(leads.stage);

    const byStage = stageStats.reduce((acc, stat) => {
      acc[stat.stage.toLowerCase()] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    // Get source statistics
    const sourceStats = await db
      .select({
        source: leads.source,
        count: count()
      })
      .from(leads)
      .where(eq(leads.isActive, true))
      .groupBy(leads.source);

    const bySource = sourceStats.reduce((acc, stat) => {
      acc[stat.source.toLowerCase()] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    // Get average score
    const scoreResult = await db
      .select({
        averageScore: sql<number>`avg(score)`
      })
      .from(leads)
      .where(eq(leads.isActive, true));

    const averageScore = scoreResult[0].averageScore || 0;

    // Calculate conversion rate (sold / total)
    const soldCount = byStage.sold || 0;
    const conversionRate = total > 0 ? (soldCount / total) * 100 : 0;

    const result = {
      total,
      byStage: {
        enquiryReceived: byStage.enquiry_received || 0,
        siteVisit: byStage.site_visit || 0,
        proposalSent: byStage.proposal_sent || 0,
        negotiation: byStage.negotiation || 0,
        booking: byStage.booking || 0,
        sold: byStage.sold || 0,
        lost: byStage.lost || 0
      },
      bySource: {
        website: bySource.website || 0,
        whatsapp: bySource.whatsapp || 0,
        phone: bySource.phone || 0,
        email: bySource.email || 0,
        referral: bySource.referral || 0,
        walkIn: bySource.walk_in || 0,
        socialMedia: bySource.social_media || 0,
        advertisement: bySource.advertisement || 0,
        other: bySource.other || 0
      },
      conversionRate: Math.round(conversionRate * 100) / 100,
      averageScore: Math.round(averageScore * 100) / 100
    };

    logger.info(`Lead statistics retrieved: ${total} total leads`);

    res.status(200).json(createSuccessResponse(result, 'Lead statistics retrieved successfully'));

  } catch (error) {
    logger.error('Error retrieving lead statistics:', error);
    res.status(500).json(createErrorResponse('Failed to retrieve lead statistics', error));
  }
});

export default router;
