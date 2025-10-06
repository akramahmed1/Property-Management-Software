import { Request, Response } from 'express';
import { MonitoringService } from '../services/monitoringService';
import { logger } from '../utils/logger';

const monitoringService = MonitoringService.getInstance();

export const getHealthCheck = async (req: Request, res: Response) => {
  try {
    const healthCheck = await monitoringService.getHealthCheck();
    
    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      success: healthCheck.status !== 'unhealthy',
      data: healthCheck,
    });
  } catch (error) {
    logger.error('Failed to get health check:', error);
    res.status(503).json({
      success: false,
      message: 'Health check failed',
    });
  }
};

export const getSystemMetrics = async (req: Request, res: Response) => {
  try {
    const { limit = 100 } = req.query;
    const metrics = monitoringService.getSystemMetrics(parseInt(limit as string));

    res.json({
      success: true,
      data: metrics,
      count: metrics.length,
    });
  } catch (error) {
    logger.error('Failed to get system metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system metrics',
    });
  }
};

export const getPerformanceMetrics = async (req: Request, res: Response) => {
  try {
    const { limit = 100 } = req.query;
    const metrics = monitoringService.getPerformanceMetrics(parseInt(limit as string));

    res.json({
      success: true,
      data: metrics,
      count: metrics.length,
    });
  } catch (error) {
    logger.error('Failed to get performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics',
    });
  }
};

export const getMetricsSummary = async (req: Request, res: Response) => {
  try {
    const summary = monitoringService.getMetricsSummary();

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('Failed to get metrics summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get metrics summary',
    });
  }
};

export const getAlerts = async (req: Request, res: Response) => {
  try {
    const alerts = await monitoringService.getAlerts();

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    logger.error('Failed to get alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alerts',
    });
  }
};

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const [healthCheck, summary, alerts] = await Promise.all([
      monitoringService.getHealthCheck(),
      monitoringService.getMetricsSummary(),
      monitoringService.getAlerts(),
    ]);

    res.json({
      success: true,
      data: {
        health: healthCheck,
        metrics: summary,
        alerts,
      },
    });
  } catch (error) {
    logger.error('Failed to get monitoring dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monitoring dashboard',
    });
  }
};

export const recordPerformanceMetric = async (req: Request, res: Response) => {
  try {
    const {
      endpoint,
      method,
      responseTime,
      statusCode,
      memoryUsage,
      cpuUsage,
    } = req.body;

    if (!endpoint || !method || responseTime === undefined || !statusCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: endpoint, method, responseTime, statusCode',
      });
    }

    const metric = {
      timestamp: Date.now(),
      endpoint,
      method,
      responseTime: parseFloat(responseTime),
      statusCode: parseInt(statusCode),
      memoryUsage: parseFloat(memoryUsage) || 0,
      cpuUsage: parseFloat(cpuUsage) || 0,
    };

    monitoringService.addPerformanceMetric(metric);

    res.json({
      success: true,
      message: 'Performance metric recorded',
    });
  } catch (error) {
    logger.error('Failed to record performance metric:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record performance metric',
    });
  }
};

export const cleanupOldMetrics = async (req: Request, res: Response) => {
  try {
    await monitoringService.cleanupOldMetrics();

    res.json({
      success: true,
      message: 'Old metrics cleaned up successfully',
    });
  } catch (error) {
    logger.error('Failed to cleanup old metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old metrics',
    });
  }
};

export const getSystemInfo = async (req: Request, res: Response) => {
  try {
    const os = require('os');
    const process = require('process');
    
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      nodeVersion: process.version,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown',
      },
      loadAverage: os.loadavg(),
    };

    res.json({
      success: true,
      data: systemInfo,
    });
  } catch (error) {
    logger.error('Failed to get system info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system information',
    });
  }
};

export const getDatabaseStats = async (req: Request, res: Response) => {
  try {
    const { prisma } = require('../config/database');
    
    const [
      userCount,
      propertyCount,
      customerCount,
      leadCount,
      bookingCount,
      paymentCount,
      transactionCount,
      notificationCount,
      securityEventCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.property.count(),
      prisma.customer.count(),
      prisma.lead.count(),
      prisma.booking.count(),
      prisma.payment.count(),
      prisma.transaction.count(),
      prisma.notification.count(),
      prisma.securityEvent.count(),
    ]);

    const stats = {
      users: userCount,
      properties: propertyCount,
      customers: customerCount,
      leads: leadCount,
      bookings: bookingCount,
      payments: paymentCount,
      transactions: transactionCount,
      notifications: notificationCount,
      securityEvents: securityEventCount,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get database stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get database statistics',
    });
  }
};

export const getLogStats = async (req: Request, res: Response) => {
  try {
    const { logger } = require('../utils/logger');
    
    // Get log statistics from the logger
    const logStats = logger.getStats ? logger.getStats() : {
      total: 0,
      byLevel: {
        DEBUG: 0,
        INFO: 0,
        WARN: 0,
        ERROR: 0,
      },
    };

    res.json({
      success: true,
      data: logStats,
    });
  } catch (error) {
    logger.error('Failed to get log stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get log statistics',
    });
  }
};

export const exportMetrics = async (req: Request, res: Response) => {
  try {
    const { format = 'json', type = 'all' } = req.query;
    
    let data: any = {};
    
    if (type === 'all' || type === 'system') {
      data.system = monitoringService.getSystemMetrics(1000);
    }
    
    if (type === 'all' || type === 'performance') {
      data.performance = monitoringService.getPerformanceMetrics(1000);
    }
    
    if (type === 'all' || type === 'alerts') {
      data.alerts = await monitoringService.getAlerts();
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=metrics.csv');
      res.send(csvData);
    } else {
      res.json({
        success: true,
        data,
        exportedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Failed to export metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export metrics',
    });
  }
};

function convertToCSV(data: any): string {
  const csvRows: string[] = [];
  
  // System metrics CSV
  if (data.system && data.system.length > 0) {
    csvRows.push('System Metrics');
    csvRows.push('Timestamp,CPU Usage,Memory Usage,Disk Usage,Load Average');
    
    data.system.forEach((metric: any) => {
      csvRows.push([
        new Date(metric.timestamp).toISOString(),
        metric.cpu.usage.toFixed(2),
        metric.memory.percentage.toFixed(2),
        metric.disk.percentage.toFixed(2),
        metric.cpu.loadAverage.join(';'),
      ].join(','));
    });
    
    csvRows.push(''); // Empty line
  }
  
  // Performance metrics CSV
  if (data.performance && data.performance.length > 0) {
    csvRows.push('Performance Metrics');
    csvRows.push('Timestamp,Endpoint,Method,Response Time,Status Code,Memory Usage,CPU Usage');
    
    data.performance.forEach((metric: any) => {
      csvRows.push([
        new Date(metric.timestamp).toISOString(),
        metric.endpoint,
        metric.method,
        metric.responseTime.toFixed(2),
        metric.statusCode,
        metric.memoryUsage.toFixed(2),
        metric.cpuUsage.toFixed(2),
      ].join(','));
    });
    
    csvRows.push(''); // Empty line
  }
  
  // Alerts CSV
  if (data.alerts && data.alerts.alerts.length > 0) {
    csvRows.push('Alerts');
    csvRows.push('ID,Type,Severity,Message,Timestamp');
    
    data.alerts.alerts.forEach((alert: any) => {
      csvRows.push([
        alert.id,
        alert.type,
        alert.severity,
        `"${alert.message.replace(/"/g, '""')}"`,
        new Date(alert.timestamp).toISOString(),
      ].join(','));
    });
  }
  
  return csvRows.join('\n');
}
