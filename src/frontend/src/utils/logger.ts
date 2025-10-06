import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.DEBUG;
  private maxLogEntries: number = 1000;
  private logs: LogEntry[] = [];
  private userId?: string;
  private sessionId?: string;

  private constructor() {
    this.initializeLogger();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private async initializeLogger(): Promise<void> {
    try {
      // Load existing logs from storage
      await this.loadLogs();
      
      // Set up log level based on environment
      this.logLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.INFO;
      
      // Generate session ID
      this.sessionId = this.generateSessionId();
      
      console.log('Logger initialized', { 
        logLevel: this.logLevel, 
        sessionId: this.sessionId 
      });
    } catch (error) {
      console.error('Error initializing logger:', error);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadLogs(): Promise<void> {
    try {
      const storedLogs = await AsyncStorage.getItem('app_logs');
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  }

  private async saveLogs(): Promise<void> {
    try {
      // Keep only the most recent logs
      if (this.logs.length > this.maxLogEntries) {
        this.logs = this.logs.slice(-this.maxLogEntries);
      }
      
      await AsyncStorage.setItem('app_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Error saving logs:', error);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userId: this.userId,
      sessionId: this.sessionId,
    };
  }

  private async addLog(level: LogLevel, message: string, data?: any): Promise<void> {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry = this.formatLogEntry(level, message, data);
    this.logs.push(logEntry);

    // Save logs asynchronously
    this.saveLogs();

    // Also log to console in development
    if (__DEV__) {
      const logMessage = `[${LogLevel[level]}] ${message}`;
      if (data) {
        console.log(logMessage, data);
      } else {
        console.log(logMessage);
      }
    }
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public debug(message: string, data?: any): void {
    this.addLog(LogLevel.DEBUG, message, data);
  }

  public info(message: string, data?: any): void {
    this.addLog(LogLevel.INFO, message, data);
  }

  public warn(message: string, data?: any): void {
    this.addLog(LogLevel.WARN, message, data);
  }

  public error(message: string, data?: any): void {
    this.addLog(LogLevel.ERROR, message, data);
  }

  public async getLogs(level?: LogLevel, limit?: number): Promise<LogEntry[]> {
    try {
      let filteredLogs = this.logs;
      
      if (level !== undefined) {
        filteredLogs = this.logs.filter(log => log.level >= level);
      }
      
      if (limit) {
        filteredLogs = filteredLogs.slice(-limit);
      }
      
      return filteredLogs;
    } catch (error) {
      console.error('Error getting logs:', error);
      return [];
    }
  }

  public async clearLogs(): Promise<void> {
    try {
      this.logs = [];
      await AsyncStorage.removeItem('app_logs');
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  }

  public async exportLogs(): Promise<string> {
    try {
      const logs = await this.getLogs();
      return JSON.stringify(logs, null, 2);
    } catch (error) {
      console.error('Error exporting logs:', error);
      return '';
    }
  }

  public async sendLogsToServer(): Promise<void> {
    try {
      const logs = await this.getLogs();
      if (logs.length === 0) {
        return;
      }

      // This would integrate with your API service
      const apiService = require('../services/apiService').default;
      await apiService.makeRequest('/logs', {
        method: 'POST',
        body: JSON.stringify({ logs }),
      });

      // Clear logs after successful send
      await this.clearLogs();
    } catch (error) {
      console.error('Error sending logs to server:', error);
    }
  }

  public getLogStats(): { total: number; byLevel: Record<string, number> } {
    const stats = {
      total: this.logs.length,
      byLevel: {
        DEBUG: 0,
        INFO: 0,
        WARN: 0,
        ERROR: 0,
      },
    };

    this.logs.forEach(log => {
      stats.byLevel[LogLevel[log.level]]++;
    });

    return stats;
  }
}

export const logger = Logger.getInstance();
export default Logger;
