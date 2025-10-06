import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

/**
 * @swagger
 * components:
 *   schemas:
 *     Lead:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - source
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the lead
 *         name:
 *           type: string
 *           description: The lead name
 *         email:
 *           type: string
 *           format: email
 *           description: The lead email
 *         phone:
 *           type: string
 *           description: The lead phone number
 *         source:
 *           type: string
 *           enum: [WEBSITE, REFERRAL, ADVERTISEMENT, SOCIAL_MEDIA, DIRECT_VISIT, PHONE_CALL, EMAIL, OTHER]
 *           description: The lead source
 *         status:
 *           type: string
 *           enum: [NEW, CONTACTED, QUALIFIED, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST]
 *           description: The lead status
 *         score:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           description: The lead score
 *         interest:
 *           type: string
 *           description: The lead interest
 *         budget:
 *           type: number
 *           format: decimal
 *           description: The lead budget
 *         notes:
 *           type: string
 *           description: Additional notes
 *         assignedTo:
 *           type: string
 *           description: Assigned agent ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the lead was created
 */

/**
 * @swagger
 * /api/crm/leads:
 *   get:
 *     summary: Get all leads with filters
 *     tags: [CRM]
 *     security:
 *       - bearerAuth: []
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
 *         description: Number of leads per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NEW, CONTACTED, QUALIFIED, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST]
 *         description: Filter by lead status
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [WEBSITE, REFERRAL, ADVERTISEMENT, SOCIAL_MEDIA, DIRECT_VISIT, PHONE_CALL, EMAIL, OTHER]
 *         description: Filter by lead source
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: Filter by assigned agent
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
 *     responses:
 *       200:
 *         description: Leads retrieved successfully
 *       500:
 *         description: Server error
 */
export const getLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      source,
      assignedTo,
      minScore,
      maxScore,
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (minScore || maxScore) {
      where.score = {};
      if (minScore) {
        where.score.gte = parseInt(minScore as string);
      }
      if (maxScore) {
        where.score.lte = parseInt(maxScore as string);
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Get leads with pagination
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: {
        leads,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: totalPages,
        },
      },
      message: 'Leads retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Get leads error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * @swagger
 * /api/crm/leads/{id}:
 *   get:
 *     summary: Get lead by ID
 *     tags: [CRM]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lead ID
 *     responses:
 *       200:
 *         description: Lead retrieved successfully
 *       404:
 *         description: Lead not found
 *       500:
 *         description: Server error
 */
export const getLeadById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!lead) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Lead not found',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        lead,
      },
      message: 'Lead retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Get lead by ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * @swagger
 * /api/crm/leads:
 *   post:
 *     summary: Create new lead
 *     tags: [CRM]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
 *     responses:
 *       201:
 *         description: Lead created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
export const createLead = async (req: AuthRequest, res: Response): Promise<void> => {
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
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !source) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Name, email, phone, and source are required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Calculate lead score
    const score = calculateLeadScore({
      source,
      budget,
      interest,
      phone,
      email,
    });

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        source: source as any,
        interest,
        budget: budget ? parseFloat(budget) : null,
        notes,
        assignedTo: assignedTo || req.user!.id,
        customerId,
        score,
        createdById: req.user!.id,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        lead,
      },
      message: 'Lead created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Create lead error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * @swagger
 * /api/crm/leads/{id}:
 *   put:
 *     summary: Update lead
 *     tags: [CRM]
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/Lead'
 *     responses:
 *       200:
 *         description: Lead updated successfully
 *       404:
 *         description: Lead not found
 *       500:
 *         description: Server error
 */
export const updateLead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Lead not found',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Recalculate score if relevant fields changed
    if (updateData.source || updateData.budget || updateData.interest) {
      const score = calculateLeadScore({
        source: updateData.source || existingLead.source,
        budget: updateData.budget || existingLead.budget,
        interest: updateData.interest || existingLead.interest,
        phone: updateData.phone || existingLead.phone,
        email: updateData.email || existingLead.email,
      });
      updateData.score = score;
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        lead,
      },
      message: 'Lead updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Update lead error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * @swagger
 * /api/crm/leads/{id}/score:
 *   post:
 *     summary: Update lead score
 *     tags: [CRM]
 *     security:
 *       - bearerAuth: []
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
 *             properties:
 *               score:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: New lead score
 *     responses:
 *       200:
 *         description: Lead score updated successfully
 *       404:
 *         description: Lead not found
 *       500:
 *         description: Server error
 */
export const updateLeadScore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { score } = req.body;

    if (score < 0 || score > 100) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Score must be between 0 and 100',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: { score },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        lead,
      },
      message: 'Lead score updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Update lead score error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * @swagger
 * /api/crm/customers:
 *   get:
 *     summary: Get all customers
 *     tags: [CRM]
 *     security:
 *       - bearerAuth: []
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
 *         description: Number of customers per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or phone
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *       500:
 *         description: Server error
 */
export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Get customers with pagination
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              bookings: true,
              leads: true,
            },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: {
        customers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: totalPages,
        },
      },
      message: 'Customers retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * @swagger
 * /api/crm/customers/{id}:
 *   get:
 *     summary: Get customer 360 view
 *     tags: [CRM]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer 360 view retrieved successfully
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
export const getCustomer360 = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bookings: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                location: true,
                price: true,
              },
            },
            agent: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        leads: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Customer not found',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Calculate customer metrics
    const totalBookings = customer.bookings.length;
    const totalValue = customer.bookings.reduce((sum, booking) => sum + Number(booking.amount), 0);
    const activeLeads = customer.leads.filter(lead => 
      !['CLOSED_WON', 'CLOSED_LOST'].includes(lead.status)
    ).length;

    const customer360 = {
      ...customer,
      metrics: {
        totalBookings,
        totalValue,
        activeLeads,
        averageBookingValue: totalBookings > 0 ? totalValue / totalBookings : 0,
      },
    };

    res.status(200).json({
      success: true,
      data: {
        customer: customer360,
      },
      message: 'Customer 360 view retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Get customer 360 error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

// Helper function to calculate lead score
function calculateLeadScore(leadData: {
  source: string;
  budget?: number | null;
  interest?: string | null;
  phone: string;
  email: string;
}): number {
  let score = 0;

  // Source scoring
  const sourceScores: { [key: string]: number } = {
    'REFERRAL': 30,
    'DIRECT_VISIT': 25,
    'PHONE_CALL': 20,
    'WEBSITE': 15,
    'SOCIAL_MEDIA': 10,
    'ADVERTISEMENT': 5,
    'EMAIL': 5,
    'OTHER': 0,
  };

  score += sourceScores[leadData.source] || 0;

  // Budget scoring
  if (leadData.budget) {
    if (leadData.budget >= 10000000) score += 25;
    else if (leadData.budget >= 5000000) score += 20;
    else if (leadData.budget >= 2000000) score += 15;
    else if (leadData.budget >= 1000000) score += 10;
    else if (leadData.budget >= 500000) score += 5;
  }

  // Interest scoring
  if (leadData.interest) {
    const interestKeywords = ['urgent', 'immediate', 'ready', 'buy', 'purchase'];
    const hasUrgentKeywords = interestKeywords.some(keyword => 
      leadData.interest!.toLowerCase().includes(keyword)
    );
    if (hasUrgentKeywords) score += 15;
  }

  // Contact quality scoring
  if (leadData.phone && leadData.email) score += 10;
  else if (leadData.phone || leadData.email) score += 5;

  // Cap at 100
  return Math.min(score, 100);
}
