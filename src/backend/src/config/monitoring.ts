import { logger } from '../utils/logger';
import { prisma } from './database';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  lastChecked: Date;
  error?: string;
}

interface SystemMetrics {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  activeConnections: number;
  databaseConnections: number;
  redisConnections: number;
}

class MonitoringService {
  private healthChecks: Map<string, HealthCheck> = new Map();
  private startTime: number = Date.now();
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startMetricsCollection();
  }

  // Health Check Methods
  async checkDatabaseHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;
      
      const healthCheck: HealthCheck = {
        service: 'database',
        status: 'healthy',
        responseTime,
        lastChecked: new Date()
      };

      this.healthChecks.set('database', healthCheck);
      return healthCheck;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const healthCheck: HealthCheck = {
        service: 'database',
        status: 'unhealthy',
        responseTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.healthChecks.set('database', healthCheck);
      logger.error('Database health check failed:', error);
      return healthCheck;
    }
  }

  async checkRedisHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      // This would check Redis connection
      // For now, we'll simulate a check
      const responseTime = Date.now() - startTime;
      
      const healthCheck: HealthCheck = {
        service: 'redis',
        status: 'healthy',
        responseTime,
        lastChecked: new Date()
      };

      this.healthChecks.set('redis', healthCheck);
      return healthCheck;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const healthCheck: HealthCheck = {
        service: 'redis',
        status: 'unhealthy',
        responseTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.healthChecks.set('redis', healthCheck);
      logger.error('Redis health check failed:', error);
      return healthCheck;
    }
  }

  async checkExternalServicesHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      // Check external services like AWS S3, Razorpay, etc.
      const responseTime = Date.now() - startTime;
      
      const healthCheck: HealthCheck = {
        service: 'external_services',
        status: 'healthy',
        responseTime,
        lastChecked: new Date()
      };

      this.healthChecks.set('external_services', healthCheck);
      return healthCheck;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const healthCheck: HealthCheck = {
        service: 'external_services',
        status: 'unhealthy',
        responseTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.healthChecks.set('external_services', healthCheck);
      logger.error('External services health check failed:', error);
      return healthCheck;
    }
  }

  // Run all health checks
  async runAllHealthChecks(): Promise<HealthCheck[]> {
    const checks = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkRedisHealth(),
      this.checkExternalServicesHealth()
    ]);

    return checks;
  }

  // Get system metrics
  getSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      uptime: Date.now() - this.startTime,
      memoryUsage,
      cpuUsage,
      activeConnections: 0, // Would track active connections
      databaseConnections: 0, // Would track DB connections
      redisConnections: 0 // Would track Redis connections
    };
  }

  // Get application metrics
  async getApplicationMetrics(): Promise<any> {
    try {
      const [
        totalUsers,
        totalProperties,
        totalBookings,
        totalLeads,
        totalCustomers,
        totalTransactions,
        totalNotifications
      ] = await Promise.all([
        prisma.user.count(),
        prisma.property.count(),
        prisma.booking.count(),
        prisma.lead.count(),
        prisma.customer.count(),
        prisma.transaction.count(),
        prisma.notification.count()
      ]);

      return {
        users: totalUsers,
        properties: totalProperties,
        bookings: totalBookings,
        leads: totalLeads,
        customers: totalCustomers,
        transactions: totalTransactions,
        notifications: totalNotifications
      };
    } catch (error) {
      logger.error('Failed to get application metrics:', error);
      return {};
    }
  }

  // Get performance metrics
  async getPerformanceMetrics(): Promise<any> {
    try {
      // Get recent performance data
      const recentTransactions = await prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        select: {
          amount: true,
          type: true,
          createdAt: true
        }
      });

      const totalRevenue = recentTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpenses = recentTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        last24Hours: {
          totalRevenue,
          totalExpenses,
          netProfit: totalRevenue - totalExpenses,
          transactionCount: recentTransactions.length
        }
      };
    } catch (error) {
      logger.error('Failed to get performance metrics:', error);
      return {};
    }
  }

  // Start metrics collection
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = this.getSystemMetrics();
        const appMetrics = await this.getApplicationMetrics();
        const perfMetrics = await this.getPerformanceMetrics();

        logger.info('System Metrics:', {
          uptime: metrics.uptime,
          memoryUsage: metrics.memoryUsage,
          appMetrics,
          perfMetrics
        });

        // Log warning if memory usage is high
        if (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal > 0.8) {
          logger.warn('High memory usage detected:', {
            heapUsed: metrics.memoryUsage.heapUsed,
            heapTotal: metrics.memoryUsage.heapTotal,
            percentage: (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100
          });
        }
      } catch (error) {
        logger.error('Failed to collect metrics:', error);
      }
    }, 60000); // Collect metrics every minute
  }

  // Stop metrics collection
  stopMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  // Get health status
  getHealthStatus(): {
    status: 'healthy' | 'unhealthy' | 'degraded';
    checks: HealthCheck[];
    timestamp: Date;
  } {
    const checks = Array.from(this.healthChecks.values());
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (unhealthyCount > 0) {
      status = unhealthyCount === checks.length ? 'unhealthy' : 'degraded';
    }

    return {
      status,
      checks,
      timestamp: new Date()
    };
  }

  // Log security events
  async logSecurityEvent(
    eventType: string,
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL',
    message: string,
    userId?: string,
    metadata?: any
  ): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          userId,
          eventType,
          severity,
          message,
          metadata,
          ipAddress: '127.0.0.1', // Would get from request
          userAgent: 'Monitoring Service'
        }
      });

      logger.info('Security event logged:', {
        eventType,
        severity,
        message,
        userId
      });
    } catch (error) {
      logger.error('Failed to log security event:', error);
    }
  }

  // Cleanup old metrics and logs
  async cleanupOldData(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Clean up old security events
      await prisma.securityEvent.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          },
          severity: 'INFO'
        }
      });

      // Clean up old audit logs
      await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          }
        }
      });

      logger.info('Old data cleanup completed');
    } catch (error) {
      logger.error('Failed to cleanup old data:', error);
    }
  }
}

export default MonitoringService;
