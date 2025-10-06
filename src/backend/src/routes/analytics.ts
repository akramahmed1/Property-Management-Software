import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { Request, Response } from 'express';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics and reporting operations
 */

// Get sales analytics
router.get('/sales', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      propertyId,
      agentId,
      groupBy = 'month',
    } = req.query;

    const analyticsService = req.app.get('analyticsService');
    const analytics = await analyticsService.getSalesAnalytics({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      propertyId: propertyId as string,
      agentId: agentId as string,
      groupBy: groupBy as 'day' | 'week' | 'month' | 'year',
    });

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get sales analytics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get lead analytics
router.get('/leads', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      agentId,
      groupBy = 'month',
    } = req.query;

    const analyticsService = req.app.get('analyticsService');
    const analytics = await analyticsService.getLeadAnalytics({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      agentId: agentId as string,
      groupBy: groupBy as 'day' | 'week' | 'month' | 'year',
    });

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get lead analytics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get financial analytics
router.get('/financial', authenticate, authorize('SUPER_ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      groupBy = 'month',
    } = req.query;

    const analyticsService = req.app.get('analyticsService');
    const analytics = await analyticsService.getFinancialAnalytics({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      groupBy: groupBy as 'day' | 'week' | 'month' | 'year',
    });

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get financial analytics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get property performance
router.get('/properties', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      groupBy = 'month',
    } = req.query;

    const analyticsService = req.app.get('analyticsService');
    const analytics = await analyticsService.getPropertyPerformance({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      groupBy: groupBy as 'day' | 'week' | 'month' | 'year',
    });

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get property performance',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get customer analytics
router.get('/customers', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      groupBy = 'month',
    } = req.query;

    const analyticsService = req.app.get('analyticsService');
    const analytics = await analyticsService.getCustomerAnalytics({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      groupBy: groupBy as 'day' | 'week' | 'month' | 'year',
    });

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get customer analytics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get comprehensive dashboard data
router.get('/dashboard', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      groupBy = 'month',
    } = req.query;

    const analyticsService = req.app.get('analyticsService');
    const dashboardData = await analyticsService.getDashboardData({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      groupBy: groupBy as 'day' | 'week' | 'month' | 'year',
    });

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Export analytics data
router.get('/export/:type', authenticate, authorize('SUPER_ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, format = 'json' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }

    const analyticsService = req.app.get('analyticsService');
    let data: any;

    switch (type) {
      case 'sales':
        data = await analyticsService.getSalesAnalytics({
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string),
        });
        break;
      case 'leads':
        data = await analyticsService.getLeadAnalytics({
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string),
        });
        break;
      case 'financial':
        data = await analyticsService.getFinancialAnalytics({
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string),
        });
        break;
      case 'properties':
        data = await analyticsService.getPropertyPerformance({
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string),
        });
        break;
      case 'customers':
        data = await analyticsService.getCustomerAnalytics({
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string),
        });
        break;
      case 'dashboard':
        data = await analyticsService.getDashboardData({
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string),
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid analytics type',
        });
    }

    // Set appropriate headers based on format
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-analytics-${Date.now()}.csv"`);
      // Convert to CSV (simplified implementation)
      res.send(JSON.stringify(data, null, 2));
    } else {
      res.json({
        success: true,
        data,
        exportedAt: new Date(),
        format,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
