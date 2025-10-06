import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { Redis } from 'ioredis';

const prisma = new PrismaClient();

// Redis client for caching
let redis: Redis;
try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
} catch (error) {
  logger.warn('Redis connection failed, analytics caching disabled:', error);
}

export interface DashboardMetrics {
  totalProperties: number;
  availableProperties: number;
  bookedProperties: number;
  soldProperties: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  averageDealSize: number;
  topPerformingAgents: Array<{
    id: string;
    name: string;
    bookings: number;
    revenue: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: Date;
  }>;
}

export interface PropertyAnalytics {
  propertyId: string;
  propertyName: string;
  totalViews: number;
  totalBookings: number;
  conversionRate: number;
  averageTimeToBook: number;
  revenue: number;
  monthlyTrend: Array<{
    month: string;
    views: number;
    bookings: number;
    revenue: number;
  }>;
  leadSources: Record<string, number>;
  customerDemographics: {
    ageGroups: Record<string, number>;
    incomeRanges: Record<string, number>;
    locations: Record<string, number>;
  };
}

export interface SalesAnalytics {
  period: string;
  totalSales: number;
  totalRevenue: number;
  averageDealSize: number;
  salesByMonth: Array<{
    month: string;
    sales: number;
    revenue: number;
  }>;
  salesByProperty: Array<{
    propertyId: string;
    propertyName: string;
    sales: number;
    revenue: number;
  }>;
  salesByAgent: Array<{
    agentId: string;
    agentName: string;
    sales: number;
    revenue: number;
  }>;
  conversionFunnel: {
    leads: number;
    qualified: number;
    proposals: number;
    negotiations: number;
    closed: number;
  };
}

export interface FinancialAnalytics {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueBySource: Record<string, number>;
  expensesByCategory: Record<string, number>;
  monthlyTrend: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  cashFlow: Array<{
    month: string;
    inflow: number;
    outflow: number;
    balance: number;
  }>;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private readonly CACHE_PREFIX = 'analytics:';
  private readonly CACHE_TTL = 300; // 5 minutes

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(period: string = '30d'): Promise<DashboardMetrics> {
    const cacheKey = `${this.CACHE_PREFIX}dashboard:${period}`;

    try {
      // Try to get from cache first
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.debug('Returning cached dashboard metrics');
          return JSON.parse(cached);
        }
      }

      const startDate = this.getStartDate(period);
      const now = new Date();

      // Get property metrics
      const [
        totalProperties,
        availableProperties,
        bookedProperties,
        soldProperties
      ] = await Promise.all([
        prisma.property.count({ where: { isActive: true } }),
        prisma.property.count({ where: { isActive: true, status: 'AVAILABLE' } }),
        prisma.property.count({ where: { isActive: true, status: 'BOOKED' } }),
        prisma.property.count({ where: { isActive: true, status: 'SOLD' } })
      ]);

      // Get booking metrics
      const [
        totalBookings,
        confirmedBookings,
        pendingBookings,
        totalRevenue,
        monthlyRevenue
      ] = await Promise.all([
        prisma.booking.count({ where: { createdAt: { gte: startDate } } }),
        prisma.booking.count({ where: { status: 'CONFIRMED', createdAt: { gte: startDate } } }),
        prisma.booking.count({ where: { status: 'PENDING', createdAt: { gte: startDate } } }),
        prisma.booking.aggregate({
          where: { status: 'CONFIRMED', createdAt: { gte: startDate } },
          _sum: { amount: true }
        }),
        prisma.booking.aggregate({
          where: { 
            status: 'CONFIRMED', 
            createdAt: { 
              gte: new Date(now.getFullYear(), now.getMonth(), 1),
              lte: now
            }
          },
          _sum: { amount: true }
        })
      ]);

      // Get lead metrics
      const [
        totalLeads,
        convertedLeads
      ] = await Promise.all([
        prisma.lead.count({ where: { createdAt: { gte: startDate } } }),
        prisma.lead.count({ where: { status: 'CLOSED_WON', createdAt: { gte: startDate } } })
      ]);

      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
      const averageDealSize = confirmedBookings > 0 ? Number(totalRevenue._sum.amount || 0) / confirmedBookings : 0;

      // Get top performing agents
      const topAgents = await prisma.booking.groupBy({
        by: ['agentId'],
        where: { status: 'CONFIRMED', createdAt: { gte: startDate } },
        _count: { id: true },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5
      });

      const topPerformingAgents = await Promise.all(
        topAgents.map(async (agent) => {
          const user = await prisma.user.findUnique({
            where: { id: agent.agentId },
            select: { name: true }
          });
          return {
            id: agent.agentId,
            name: user?.name || 'Unknown',
            bookings: agent._count.id,
            revenue: Number(agent._sum.amount || 0)
          };
        })
      );

      // Get recent activity
      const recentActivity = await this.getRecentActivity(10);

      const metrics: DashboardMetrics = {
        totalProperties,
        availableProperties,
        bookedProperties,
        soldProperties,
        totalBookings,
        confirmedBookings,
        pendingBookings,
        totalRevenue: Number(totalRevenue._sum.amount || 0),
        monthlyRevenue: Number(monthlyRevenue._sum.amount || 0),
        totalLeads,
        convertedLeads,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageDealSize: Math.round(averageDealSize),
        topPerformingAgents,
        recentActivity
      };

      // Cache the result
      if (redis) {
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(metrics));
      }

      return metrics;
    } catch (error) {
      logger.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Get property analytics
   */
  async getPropertyAnalytics(propertyId: string, period: string = '30d'): Promise<PropertyAnalytics> {
    const cacheKey = `${this.CACHE_PREFIX}property:${propertyId}:${period}`;

    try {
      // Try to get from cache first
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.debug('Returning cached property analytics');
          return JSON.parse(cached);
        }
      }

      const startDate = this.getStartDate(period);

      // Get property details
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { name: true }
      });

      if (!property) {
        throw new Error('Property not found');
      }

      // Get property views (mock data for now)
      const totalViews = Math.floor(Math.random() * 1000) + 100;

      // Get booking metrics
      const bookings = await prisma.booking.findMany({
        where: {
          propertyId,
          createdAt: { gte: startDate }
        },
        include: {
          customer: true
        }
      });

      const totalBookings = bookings.length;
      const conversionRate = totalViews > 0 ? (totalBookings / totalViews) * 100 : 0;
      const revenue = bookings.reduce((sum, booking) => sum + Number(booking.amount), 0);

      // Calculate average time to book (mock calculation)
      const averageTimeToBook = totalBookings > 0 ? Math.floor(Math.random() * 30) + 7 : 0;

      // Get monthly trend
      const monthlyTrend = await this.getMonthlyTrend(propertyId, startDate);

      // Get lead sources
      const leadSources = await this.getLeadSources(propertyId, startDate);

      // Get customer demographics
      const customerDemographics = await this.getCustomerDemographics(bookings);

      const analytics: PropertyAnalytics = {
        propertyId,
        propertyName: property.name,
        totalViews,
        totalBookings,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageTimeToBook,
        revenue,
        monthlyTrend,
        leadSources,
        customerDemographics
      };

      // Cache the result
      if (redis) {
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(analytics));
      }

      return analytics;
    } catch (error) {
      logger.error('Error fetching property analytics:', error);
      throw error;
    }
  }

  /**
   * Get sales analytics
   */
  async getSalesAnalytics(period: string = '30d'): Promise<SalesAnalytics> {
    const cacheKey = `${this.CACHE_PREFIX}sales:${period}`;

    try {
      // Try to get from cache first
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.debug('Returning cached sales analytics');
          return JSON.parse(cached);
        }
      }

      const startDate = this.getStartDate(period);

      // Get sales data
      const bookings = await prisma.booking.findMany({
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: startDate }
        },
        include: {
          property: true,
          agent: true
        }
      });

      const totalSales = bookings.length;
      const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.amount), 0);
      const averageDealSize = totalSales > 0 ? totalRevenue / totalSales : 0;

      // Get sales by month
      const salesByMonth = await this.getSalesByMonth(startDate);

      // Get sales by property
      const salesByProperty = await this.getSalesByProperty(startDate);

      // Get sales by agent
      const salesByAgent = await this.getSalesByAgent(startDate);

      // Get conversion funnel
      const conversionFunnel = await this.getConversionFunnel(startDate);

      const analytics: SalesAnalytics = {
        period,
        totalSales,
        totalRevenue,
        averageDealSize: Math.round(averageDealSize),
        salesByMonth,
        salesByProperty,
        salesByAgent,
        conversionFunnel
      };

      // Cache the result
      if (redis) {
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(analytics));
      }

      return analytics;
    } catch (error) {
      logger.error('Error fetching sales analytics:', error);
      throw error;
    }
  }

  /**
   * Get financial analytics
   */
  async getFinancialAnalytics(period: string = '30d'): Promise<FinancialAnalytics> {
    const cacheKey = `${this.CACHE_PREFIX}financial:${period}`;

    try {
      // Try to get from cache first
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.debug('Returning cached financial analytics');
          return JSON.parse(cached);
        }
      }

      const startDate = this.getStartDate(period);

      // Get revenue data
      const revenueData = await prisma.booking.aggregate({
          where: {
          status: 'CONFIRMED',
          createdAt: { gte: startDate }
        },
        _sum: { amount: true }
      });

      const totalRevenue = Number(revenueData._sum.amount || 0);

      // Get expense data (mock for now)
      const totalExpenses = totalRevenue * 0.3; // Assume 30% expenses
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // Get revenue by source
      const revenueBySource = await this.getRevenueBySource(startDate);

      // Get expenses by category (mock data)
      const expensesByCategory = {
        'Marketing': totalExpenses * 0.4,
        'Operations': totalExpenses * 0.3,
        'Administration': totalExpenses * 0.2,
        'Other': totalExpenses * 0.1
      };

      // Get monthly trend
      const monthlyTrend = await this.getMonthlyFinancialTrend(startDate);

      // Get cash flow
      const cashFlow = await this.getCashFlow(startDate);

      const analytics: FinancialAnalytics = {
        period,
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: Math.round(profitMargin * 100) / 100,
        revenueBySource,
        expensesByCategory,
        monthlyTrend,
        cashFlow
      };

      // Cache the result
      if (redis) {
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(analytics));
      }

      return analytics;
    } catch (error) {
      logger.error('Error fetching financial analytics:', error);
      throw error;
    }
  }

  // Private helper methods

  private getStartDate(period: string): Date {
    const now = new Date();
    const startDate = new Date();

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

    return startDate;
  }

  private async getRecentActivity(limit: number) {
    const activities = [];

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
        include: {
        property: { select: { name: true } },
        customer: { select: { name: true } }
      }
    });

    activities.push(...recentBookings.map(booking => ({
      id: booking.id,
      type: 'booking',
      description: `New booking for ${booking.property.name} by ${booking.customer.name}`,
      timestamp: booking.createdAt
    })));

    // Get recent leads
    const recentLeads = await prisma.lead.findMany({
      take: Math.floor(limit / 2),
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true } }
      }
    });

    activities.push(...recentLeads.map(lead => ({
      id: lead.id,
      type: 'lead',
      description: `New lead ${lead.name} assigned to ${lead.createdBy.name}`,
      timestamp: lead.createdAt
    })));

    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  private async getMonthlyTrend(propertyId: string, startDate: Date) {
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toISOString().slice(0, 7));
    }

    const trend = [];

    for (const month of months) {
      const monthStart = new Date(month + '-01');
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const bookings = await prisma.booking.count({
        where: {
          propertyId,
          status: 'CONFIRMED',
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          }
        }
      });

      const revenue = await prisma.booking.aggregate({
        where: {
          propertyId,
          status: 'CONFIRMED',
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          }
        },
        _sum: { amount: true }
      });

      trend.push({
        month,
        views: Math.floor(Math.random() * 100) + 50, // Mock data
        bookings,
        revenue: Number(revenue._sum.amount || 0)
      });
    }

    return trend;
  }

  private async getLeadSources(propertyId: string, startDate: Date) {
    const leads = await prisma.lead.findMany({
      where: {
        interest: { contains: 'property', mode: 'insensitive' },
        createdAt: { gte: startDate }
      },
      select: { source: true }
    });

    return leads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private async getCustomerDemographics(bookings: any[]) {
    const ageGroups = { '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '55+': 0 };
    const incomeRanges = { '0-5L': 0, '5-10L': 0, '10-20L': 0, '20L+': 0 };
    const locations = {};

    // Mock demographic data based on bookings
    bookings.forEach(booking => {
      const age = Math.floor(Math.random() * 40) + 25;
      if (age < 26) ageGroups['18-25']++;
      else if (age < 36) ageGroups['26-35']++;
      else if (age < 46) ageGroups['36-45']++;
      else if (age < 56) ageGroups['46-55']++;
      else ageGroups['55+']++;

      const income = Math.floor(Math.random() * 20) + 5;
      if (income < 5) incomeRanges['0-5L']++;
      else if (income < 10) incomeRanges['5-10L']++;
      else if (income < 20) incomeRanges['10-20L']++;
      else incomeRanges['20L+']++;

      const city = booking.customer.city || 'Unknown';
      locations[city] = (locations[city] || 0) + 1;
    });

    return { ageGroups, incomeRanges, locations };
  }

  private async getSalesByMonth(startDate: Date) {
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toISOString().slice(0, 7));
    }

    const trend = [];

    for (const month of months) {
      const monthStart = new Date(month + '-01');
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const sales = await prisma.booking.count({
        where: {
          status: 'CONFIRMED',
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          }
        }
      });

      const revenue = await prisma.booking.aggregate({
        where: {
          status: 'CONFIRMED',
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          }
        },
        _sum: { amount: true }
      });

      trend.push({
        month,
        sales,
        revenue: Number(revenue._sum.amount || 0)
      });
    }

    return trend;
  }

  private async getSalesByProperty(startDate: Date) {
    const sales = await prisma.booking.groupBy({
      by: ['propertyId'],
      where: {
        status: 'CONFIRMED',
        createdAt: { gte: startDate }
      },
      _count: { id: true },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10
    });

    return await Promise.all(
      sales.map(async (sale) => {
        const property = await prisma.property.findUnique({
          where: { id: sale.propertyId },
          select: { name: true }
        });

        return {
          propertyId: sale.propertyId,
          propertyName: property?.name || 'Unknown',
          sales: sale._count.id,
          revenue: Number(sale._sum.amount || 0)
        };
      })
    );
  }

  private async getSalesByAgent(startDate: Date) {
    const sales = await prisma.booking.groupBy({
      by: ['agentId'],
      where: {
        status: 'CONFIRMED',
        createdAt: { gte: startDate }
      },
      _count: { id: true },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10
    });

    return await Promise.all(
      sales.map(async (sale) => {
        const agent = await prisma.user.findUnique({
          where: { id: sale.agentId },
          select: { name: true }
        });

        return {
          agentId: sale.agentId,
          agentName: agent?.name || 'Unknown',
          sales: sale._count.id,
          revenue: Number(sale._sum.amount || 0)
        };
      })
    );
  }

  private async getConversionFunnel(startDate: Date) {
    const [
      leads,
      qualified,
      proposals,
      negotiations,
      closed
    ] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: startDate } } }),
      prisma.lead.count({ where: { status: 'QUALIFIED', createdAt: { gte: startDate } } }),
      prisma.lead.count({ where: { status: 'PROPOSAL', createdAt: { gte: startDate } } }),
      prisma.lead.count({ where: { status: 'NEGOTIATION', createdAt: { gte: startDate } } }),
      prisma.lead.count({ where: { status: 'CLOSED_WON', createdAt: { gte: startDate } } })
    ]);

    return { leads, qualified, proposals, negotiations, closed };
  }

  private async getRevenueBySource(startDate: Date) {
    // Mock revenue by source data
    return {
      'Property Sales': 0.7,
      'Rentals': 0.2,
      'Consulting': 0.1
    };
  }

  private async getMonthlyFinancialTrend(startDate: Date) {
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toISOString().slice(0, 7));
    }

    const trend = [];

    for (const month of months) {
      const monthStart = new Date(month + '-01');
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const revenue = await prisma.booking.aggregate({
      where: {
          status: 'CONFIRMED',
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          }
        },
        _sum: { amount: true }
      });

      const monthlyRevenue = Number(revenue._sum.amount || 0);
      const monthlyExpenses = monthlyRevenue * 0.3; // Assume 30% expenses

      trend.push({
        month,
        revenue: monthlyRevenue,
        expenses: monthlyExpenses,
        profit: monthlyRevenue - monthlyExpenses
      });
    }

    return trend;
  }

  private async getCashFlow(startDate: Date) {
    // Mock cash flow data
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toISOString().slice(0, 7));
    }

    return months.map(month => ({
      month,
      inflow: Math.floor(Math.random() * 1000000) + 500000,
      outflow: Math.floor(Math.random() * 300000) + 200000,
      balance: Math.floor(Math.random() * 500000) + 100000
    }));
  }
}

export default AnalyticsService;