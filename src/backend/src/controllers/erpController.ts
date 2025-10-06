import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       required:
 *         - type
 *         - category
 *         - amount
 *         - date
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the transaction
 *         type:
 *           type: string
 *           enum: [INCOME, EXPENSE, TRANSFER, REFUND]
 *           description: The transaction type
 *         category:
 *           type: string
 *           description: The transaction category
 *         amount:
 *           type: number
 *           format: decimal
 *           description: The transaction amount
 *         currency:
 *           type: string
 *           default: INR
 *           description: The transaction currency
 *         description:
 *           type: string
 *           description: Transaction description
 *         reference:
 *           type: string
 *           description: Reference number
 *         date:
 *           type: string
 *           format: date-time
 *           description: Transaction date
 *         status:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, CANCELLED]
 *           description: Transaction status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the transaction was created
 */

/**
 * @swagger
 * /api/erp/transactions:
 *   get:
 *     summary: Get all transactions with filters
 *     tags: [ERP]
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
 *         description: Number of transactions per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE, TRANSFER, REFUND]
 *         description: Filter by transaction type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, CANCELLED]
 *         description: Filter by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       500:
 *         description: Server error
 */
export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      category,
      status,
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = {
        contains: category as string,
        mode: 'insensitive',
      };
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { date: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: totalPages,
        },
      },
      message: 'Transactions retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Get transactions error:', error);
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
 * /api/erp/transactions:
 *   post:
 *     summary: Create new transaction
 *     tags: [ERP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transaction'
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      type,
      category,
      amount,
      currency = 'INR',
      description,
      reference,
      date,
    } = req.body;

    // Validate required fields
    if (!type || !category || !amount || !date) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Type, category, amount, and date are required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const transaction = await prisma.transaction.create({
      data: {
        type: type as any,
        category,
        amount: parseFloat(amount),
        currency,
        description,
        reference,
        date: new Date(date),
        status: 'PENDING',
        createdById: req.user!.id,
      },
      include: {
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
        transaction,
      },
      message: 'Transaction created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Create transaction error:', error);
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
 * /api/erp/transactions/{id}:
 *   put:
 *     summary: Update transaction
 *     tags: [ERP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transaction'
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 */
export const updateTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Transaction not found',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
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
        transaction,
      },
      message: 'Transaction updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Update transaction error:', error);
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
 * /api/erp/financials:
 *   get:
 *     summary: Get financial summary
 *     tags: [ERP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for financial summary
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for financial summary
 *     responses:
 *       200:
 *         description: Financial summary retrieved successfully
 *       500:
 *         description: Server error
 */
export const getFinancialSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    const where = Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {};

    // Get financial data
    const [
      totalIncome,
      totalExpense,
      pendingTransactions,
      completedTransactions,
      recentTransactions,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          ...where,
          type: 'INCOME',
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.transaction.aggregate({
        where: {
          ...where,
          type: 'EXPENSE',
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.transaction.count({
        where: {
          ...where,
          status: 'PENDING',
        },
      }),
      prisma.transaction.count({
        where: {
          ...where,
          status: 'COMPLETED',
        },
      }),
      prisma.transaction.findMany({
        where,
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const income = totalIncome._sum.amount || 0;
    const expense = totalExpense._sum.amount || 0;
    const netProfit = income - expense;

    const summary = {
      totalIncome: income,
      totalExpense: expense,
      netProfit,
      pendingTransactions,
      completedTransactions,
      recentTransactions,
      profitMargin: income > 0 ? (netProfit / income) * 100 : 0,
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
      },
      message: 'Financial summary retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Get financial summary error:', error);
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
 * /api/erp/payments:
 *   get:
 *     summary: Get all payments
 *     tags: [ERP]
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
 *         description: Number of payments per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, REFUNDED]
 *         description: Filter by payment status
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [UPI, CARD, NET_BANKING, WALLET, CASH, CHEQUE, BANK_TRANSFER]
 *         description: Filter by payment method
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *       500:
 *         description: Server error
 */
export const getPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      method,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (method) {
      where.method = method;
    }

    // Get payments with pagination
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            include: {
              property: {
                select: {
                  id: true,
                  name: true,
                  location: true,
                },
              },
              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          transaction: {
            select: {
              id: true,
              type: true,
              category: true,
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: totalPages,
        },
      },
      message: 'Payments retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Get payments error:', error);
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
 * /api/erp/procurement:
 *   get:
 *     summary: Get procurement alerts
 *     tags: [ERP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Procurement alerts retrieved successfully
 *       500:
 *         description: Server error
 */
export const getProcurementAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    // This would typically integrate with construction milestones
    // For now, return mock data
    const alerts = [
      {
        id: '1',
        type: 'MATERIAL_NEEDED',
        title: 'Concrete Required',
        description: 'Foundation work requires 50 cubic meters of concrete',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        estimatedCost: 150000,
        status: 'PENDING',
      },
      {
        id: '2',
        type: 'EQUIPMENT_MAINTENANCE',
        title: 'Crane Maintenance Due',
        description: 'Monthly maintenance for Tower Crane #3',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        estimatedCost: 25000,
        status: 'PENDING',
      },
    ];

    res.status(200).json({
      success: true,
      data: {
        alerts,
      },
      message: 'Procurement alerts retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Get procurement alerts error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};
