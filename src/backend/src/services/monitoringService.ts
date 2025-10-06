import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import os from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  disk: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  database: {
    connections: number;
    queries: number;
    slowQueries: number;
    locks: number;
  };
  application: {
    uptime: number;
    requests: number;
    errors: number;
    responseTime: number;
  };
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  checks: {
    database: boolean;
    redis: boolean;
    storage: boolean;
    memory: boolean;
    cpu: boolean;
  };
  details: {
    database?: string;
    redis?: string;
    storage?: string;
    memory?: string;
    cpu?: string;
  };
}

export interface PerformanceMetrics {
  timestamp: number;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  memoryUsage: number;
  cpuUsage: number;
}

class MonitoringService {
  private static instance: MonitoringService;
  private metrics: SystemMetrics[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private maxMetricsHistory: number = 1000;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Start monitoring
      this.startMonitoring();
      
      logger.info('Monitoring service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize monitoring service:', error);
      throw error;
    }
  }

  private startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    
    // Collect metrics every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.collectSystemMetrics();
        this.addMetrics(metrics);
        
        // Keep only recent metrics
        if (this.metrics.length > this.maxMetricsHistory) {
          this.metrics = this.metrics.slice(-this.maxMetricsHistory);
        }
      } catch (error) {
        logger.error('Failed to collect system metrics:', error);
      }
    }, 30000);

    logger.info('System monitoring started');
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    logger.info('System monitoring stopped');
  }

  private async collectSystemMetrics(): Promise<SystemMetrics> {
    const timestamp = Date.now();
    
    // CPU metrics
    const cpuUsage = await this.getCpuUsage();
    const loadAverage = os.loadavg();
    const cores = os.cpus().length;

    // Memory metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    // Disk metrics
    const diskMetrics = await this.getDiskMetrics();

    // Network metrics
    const networkMetrics = await this.getNetworkMetrics();

    // Database metrics
    const databaseMetrics = await this.getDatabaseMetrics();

    // Application metrics
    const applicationMetrics = await this.getApplicationMetrics();

    return {
      timestamp,
      cpu: {
        usage: cpuUsage,
        loadAverage,
        cores,
      },
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        percentage: memoryPercentage,
      },
      disk: diskMetrics,
      network: networkMetrics,
      database: databaseMetrics,
      application: applicationMetrics,
    };
  }

  private async getCpuUsage(): Promise<number> {
    try {
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;

      for (const cpu of cpus) {
        for (const type in cpu.times) {
          totalTick += cpu.times[type as keyof typeof cpu.times];
        }
        totalIdle += cpu.times.idle;
      }

      return 100 - ~~(100 * totalIdle / totalTick);
    } catch (error) {
      logger.error('Failed to get CPU usage:', error);
      return 0;
    }
  }

  private async getDiskMetrics(): Promise<{
    total: number;
    free: number;
    used: number;
    percentage: number;
  }> {
    try {
      // This is a simplified version - in production, you'd use a proper disk monitoring library
      const { stdout } = await execAsync('df -h /');
      const lines = stdout.trim().split('\n');
      const data = lines[1].split(/\s+/);
      
      const total = this.parseSize(data[1]);
      const used = this.parseSize(data[2]);
      const free = this.parseSize(data[3]);
      const percentage = parseFloat(data[4].replace('%', ''));

      return { total, used, free, percentage };
    } catch (error) {
      logger.error('Failed to get disk metrics:', error);
      return { total: 0, free: 0, used: 0, percentage: 0 };
    }
  }

  private parseSize(sizeStr: string): number {
    const units = { K: 1024, M: 1024 * 1024, G: 1024 * 1024 * 1024, T: 1024 * 1024 * 1024 * 1024 };
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)([KMGTP]?)$/);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2] || 'B';
      return value * (units[unit as keyof typeof units] || 1);
    }
    return 0;
  }

  private async getNetworkMetrics(): Promise<{
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  }> {
    try {
      // This is a simplified version - in production, you'd use a proper network monitoring library
      const { stdout } = await execAsync('cat /proc/net/dev');
      const lines = stdout.trim().split('\n');
      
      let bytesIn = 0;
      let bytesOut = 0;
      let packetsIn = 0;
      let packetsOut = 0;

      for (const line of lines.slice(2)) { // Skip header lines
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 10) {
          bytesIn += parseInt(parts[1]) || 0;
          bytesOut += parseInt(parts[9]) || 0;
          packetsIn += parseInt(parts[2]) || 0;
          packetsOut += parseInt(parts[10]) || 0;
        }
      }

      return { bytesIn, bytesOut, packetsIn, packetsOut };
    } catch (error) {
      logger.error('Failed to get network metrics:', error);
      return { bytesIn: 0, bytesOut: 0, packetsIn: 0, packetsOut: 0 };
    }
  }

  private async getDatabaseMetrics(): Promise<{
    connections: number;
    queries: number;
    slowQueries: number;
    locks: number;
  }> {
    try {
      // Get database connection count
      const connectionCount = await prisma.$queryRaw`
        SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'
      ` as any[];

      // Get query statistics
      const queryStats = await prisma.$queryRaw`
        SELECT 
          count(*) as total_queries,
          count(*) FILTER (WHERE query_start < now() - interval '1 minute') as slow_queries
        FROM pg_stat_activity 
        WHERE state = 'active'
      ` as any[];

      // Get lock count
      const lockCount = await prisma.$queryRaw`
        SELECT count(*) as count FROM pg_locks WHERE granted = false
      ` as any[];

      return {
        connections: connectionCount[0]?.count || 0,
        queries: queryStats[0]?.total_queries || 0,
        slowQueries: queryStats[0]?.slow_queries || 0,
        locks: lockCount[0]?.count || 0,
      };
    } catch (error) {
      logger.error('Failed to get database metrics:', error);
      return { connections: 0, queries: 0, slowQueries: 0, locks: 0 };
    }
  }

  private async getApplicationMetrics(): Promise<{
    uptime: number;
    requests: number;
    errors: number;
    responseTime: number;
  }> {
    try {
      const uptime = process.uptime();
      
      // Get request statistics from logs or metrics
      const requests = this.performanceMetrics.length;
      const errors = this.performanceMetrics.filter(m => m.statusCode >= 400).length;
      const responseTime = this.performanceMetrics.length > 0 
        ? this.performanceMetrics.reduce((sum, m) => sum + m.responseTime, 0) / this.performanceMetrics.length
        : 0;

      return { uptime, requests, errors, responseTime };
    } catch (error) {
      logger.error('Failed to get application metrics:', error);
      return { uptime: 0, requests: 0, errors: 0, responseTime: 0 };
    }
  }

  private addMetrics(metrics: SystemMetrics): void {
    this.metrics.push(metrics);
  }

  public addPerformanceMetric(metric: PerformanceMetrics): void {
    this.performanceMetrics.push(metric);
    
    // Keep only recent metrics
    if (this.performanceMetrics.length > this.maxMetricsHistory) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxMetricsHistory);
    }
  }

  public async getHealthCheck(): Promise<HealthCheck> {
    const timestamp = Date.now();
    const checks = {
      database: false,
      redis: false,
      storage: false,
      memory: false,
      cpu: false,
    };
    const details: any = {};

    try {
      // Check database
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      checks.database = false;
      details.database = error.message;
    }

    try {
      // Check Redis (if configured)
      // This would be implemented based on your Redis setup
      checks.redis = true;
    } catch (error) {
      checks.redis = false;
      details.redis = error.message;
    }

    try {
      // Check storage
      const diskMetrics = await this.getDiskMetrics();
      checks.storage = diskMetrics.percentage < 90; // Less than 90% full
      if (!checks.storage) {
        details.storage = `Disk usage: ${diskMetrics.percentage.toFixed(2)}%`;
      }
    } catch (error) {
      checks.storage = false;
      details.storage = error.message;
    }

    try {
      // Check memory
      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const memoryPercentage = (memoryUsage.heapUsed / totalMemory) * 100;
      checks.memory = memoryPercentage < 90; // Less than 90% memory usage
      if (!checks.memory) {
        details.memory = `Memory usage: ${memoryPercentage.toFixed(2)}%`;
      }
    } catch (error) {
      checks.memory = false;
      details.memory = error.message;
    }

    try {
      // Check CPU
      const cpuUsage = await this.getCpuUsage();
      checks.cpu = cpuUsage < 90; // Less than 90% CPU usage
      if (!checks.cpu) {
        details.cpu = `CPU usage: ${cpuUsage.toFixed(2)}%`;
      }
    } catch (error) {
      checks.cpu = false;
      details.cpu = error.message;
    }

    // Determine overall status
    const failedChecks = Object.values(checks).filter(check => !check).length;
    let status: 'healthy' | 'degraded' | 'unhealthy';
    
    if (failedChecks === 0) {
      status = 'healthy';
    } else if (failedChecks <= 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      timestamp,
      checks,
      details,
    };
  }

  public getSystemMetrics(limit: number = 100): SystemMetrics[] {
    return this.metrics.slice(-limit);
  }

  public getPerformanceMetrics(limit: number = 100): PerformanceMetrics[] {
    return this.performanceMetrics.slice(-limit);
  }

  public getMetricsSummary(): {
    system: {
      latest: SystemMetrics | null;
      average: Partial<SystemMetrics> | null;
    };
    performance: {
      latest: PerformanceMetrics | null;
      average: Partial<PerformanceMetrics> | null;
    };
  } {
    const latestSystem = this.metrics[this.metrics.length - 1] || null;
    const latestPerformance = this.performanceMetrics[this.performanceMetrics.length - 1] || null;

    // Calculate averages
    let averageSystem: Partial<SystemMetrics> | null = null;
    if (this.metrics.length > 0) {
      const avgCpu = this.metrics.reduce((sum, m) => sum + m.cpu.usage, 0) / this.metrics.length;
      const avgMemory = this.metrics.reduce((sum, m) => sum + m.memory.percentage, 0) / this.metrics.length;
      const avgDisk = this.metrics.reduce((sum, m) => sum + m.disk.percentage, 0) / this.metrics.length;
      
      averageSystem = {
        cpu: { usage: avgCpu, loadAverage: [], cores: 0 },
        memory: { total: 0, free: 0, used: 0, percentage: avgMemory },
        disk: { total: 0, free: 0, used: 0, percentage: avgDisk },
      };
    }

    let averagePerformance: Partial<PerformanceMetrics> | null = null;
    if (this.performanceMetrics.length > 0) {
      const avgResponseTime = this.performanceMetrics.reduce((sum, m) => sum + m.responseTime, 0) / this.performanceMetrics.length;
      const avgMemoryUsage = this.performanceMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / this.performanceMetrics.length;
      const avgCpuUsage = this.performanceMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / this.performanceMetrics.length;
      
      averagePerformance = {
        responseTime: avgResponseTime,
        memoryUsage: avgMemoryUsage,
        cpuUsage: avgCpuUsage,
      };
    }

    return {
      system: {
        latest: latestSystem,
        average: averageSystem,
      },
      performance: {
        latest: latestPerformance,
        average: averagePerformance,
      },
    };
  }

  public async getAlerts(): Promise<{
    critical: number;
    warning: number;
    info: number;
    alerts: any[];
  }> {
    try {
      // Get recent security events
      const recentEvents = await prisma.securityEvent.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const alerts = recentEvents.map(event => ({
        id: event.id,
        type: event.eventType,
        severity: event.severity,
        message: event.message,
        timestamp: event.createdAt,
        metadata: event.metadata,
      }));

      const critical = alerts.filter(a => a.severity === 'CRITICAL').length;
      const warning = alerts.filter(a => a.severity === 'WARNING').length;
      const info = alerts.filter(a => a.severity === 'INFO').length;

      return { critical, warning, info, alerts };
    } catch (error) {
      logger.error('Failed to get alerts:', error);
      return { critical: 0, warning: 0, info: 0, alerts: [] };
    }
  }

  public async cleanupOldMetrics(): Promise<void> {
    try {
      // Remove metrics older than 7 days
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // This would be implemented based on your metrics storage strategy
      // For now, we just clean up the in-memory arrays
      this.metrics = this.metrics.filter(m => m.timestamp > cutoffDate.getTime());
      this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp > cutoffDate.getTime());
      
      logger.info('Old metrics cleaned up');
    } catch (error) {
      logger.error('Failed to cleanup old metrics:', error);
    }
  }
}

export default MonitoringService;
