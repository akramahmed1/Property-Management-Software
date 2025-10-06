#!/usr/bin/env node

/**
 * Database Backup Script
 * Creates automated backups of the Property Management database
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_NAME = process.env.DB_NAME || 'property_management';
const DB_USER = process.env.DB_USER || 'property_user';
const DB_PASSWORD = process.env.DB_PASSWORD || 'password';
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');

class DatabaseBackup {
  constructor() {
    this.backupDir = BACKUP_DIR;
    this.ensureBackupDirectory();
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`✅ Created backup directory: ${this.backupDir}`);
    }
  }

  // Create full database backup
  async createFullBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `full_backup_${timestamp}.sql`);
    
    return new Promise((resolve, reject) => {
      const command = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} --no-password --verbose --format=custom --compress=9 --file="${backupFile}"`;
      
      const env = { ...process.env, PGPASSWORD: DB_PASSWORD };
      
      console.log(`🔄 Creating full backup: ${backupFile}`);
      
      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Full backup failed: ${error.message}`);
          reject(error);
          return;
        }
        
        if (stderr) {
          console.log(`📝 Backup info: ${stderr}`);
        }
        
        console.log(`✅ Full backup completed: ${backupFile}`);
        resolve(backupFile);
      });
    });
  }

  // Create schema-only backup
  async createSchemaBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `schema_backup_${timestamp}.sql`);
    
    return new Promise((resolve, reject) => {
      const command = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} --no-password --verbose --schema-only --file="${backupFile}"`;
      
      const env = { ...process.env, PGPASSWORD: DB_PASSWORD };
      
      console.log(`🔄 Creating schema backup: ${backupFile}`);
      
      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Schema backup failed: ${error.message}`);
          reject(error);
          return;
        }
        
        if (stderr) {
          console.log(`📝 Schema backup info: ${stderr}`);
        }
        
        console.log(`✅ Schema backup completed: ${backupFile}`);
        resolve(backupFile);
      });
    });
  }

  // Create data-only backup
  async createDataBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `data_backup_${timestamp}.sql`);
    
    return new Promise((resolve, reject) => {
      const command = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} --no-password --verbose --data-only --file="${backupFile}"`;
      
      const env = { ...process.env, PGPASSWORD: DB_PASSWORD };
      
      console.log(`🔄 Creating data backup: ${backupFile}`);
      
      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Data backup failed: ${error.message}`);
          reject(error);
          return;
        }
        
        if (stderr) {
          console.log(`📝 Data backup info: ${stderr}`);
        }
        
        console.log(`✅ Data backup completed: ${backupFile}`);
        resolve(backupFile);
      });
    });
  }

  // Create table-specific backup
  async createTableBackup(tableName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `table_${tableName}_backup_${timestamp}.sql`);
    
    return new Promise((resolve, reject) => {
      const command = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} --no-password --verbose --table=${tableName} --file="${backupFile}"`;
      
      const env = { ...process.env, PGPASSWORD: DB_PASSWORD };
      
      console.log(`🔄 Creating table backup for ${tableName}: ${backupFile}`);
      
      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Table backup failed for ${tableName}: ${error.message}`);
          reject(error);
          return;
        }
        
        if (stderr) {
          console.log(`📝 Table backup info: ${stderr}`);
        }
        
        console.log(`✅ Table backup completed for ${tableName}: ${backupFile}`);
        resolve(backupFile);
      });
    });
  }

  // Restore database from backup
  async restoreDatabase(backupFile) {
    return new Promise((resolve, reject) => {
      const command = `pg_restore -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} --no-password --verbose --clean --if-exists "${backupFile}"`;
      
      const env = { ...process.env, PGPASSWORD: DB_PASSWORD };
      
      console.log(`🔄 Restoring database from: ${backupFile}`);
      
      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Database restore failed: ${error.message}`);
          reject(error);
          return;
        }
        
        if (stderr) {
          console.log(`📝 Restore info: ${stderr}`);
        }
        
        console.log(`✅ Database restore completed from: ${backupFile}`);
        resolve();
      });
    });
  }

  // Clean up old backups
  async cleanupOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`🗑️  Deleted old backup: ${file}`);
        }
      }

      console.log(`✅ Cleanup completed. Deleted ${deletedCount} old backup files.`);
      return deletedCount;
    } catch (error) {
      console.error(`❌ Cleanup failed: ${error.message}`);
      throw error;
    }
  }

  // List available backups
  listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backups = files
        .filter(file => file.endsWith('.sql'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            created: stats.mtime,
            path: filePath
          };
        })
        .sort((a, b) => b.created - a.created);

      console.log(`📋 Available backups (${backups.length}):`);
      backups.forEach(backup => {
        const sizeMB = (backup.size / (1024 * 1024)).toFixed(2);
        console.log(`  - ${backup.name} (${sizeMB} MB) - ${backup.created.toISOString()}`);
      });

      return backups;
    } catch (error) {
      console.error(`❌ Failed to list backups: ${error.message}`);
      return [];
    }
  }

  // Verify backup integrity
  async verifyBackup(backupFile) {
    return new Promise((resolve, reject) => {
      const command = `pg_restore --list "${backupFile}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Backup verification failed: ${error.message}`);
          reject(error);
          return;
        }
        
        if (stderr) {
          console.log(`📝 Verification info: ${stderr}`);
        }
        
        console.log(`✅ Backup verification completed: ${backupFile}`);
        resolve(stdout);
      });
    });
  }

  // Create backup metadata
  async createBackupMetadata(backupFile, type) {
    try {
      const metadata = {
        file: path.basename(backupFile),
        type: type,
        created: new Date().toISOString(),
        size: fs.statSync(backupFile).size,
        database: DB_NAME,
        host: DB_HOST,
        port: DB_PORT
      };

      const metadataFile = backupFile.replace('.sql', '.json');
      fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
      
      console.log(`📄 Backup metadata created: ${metadataFile}`);
      return metadata;
    } catch (error) {
      console.error(`❌ Failed to create backup metadata: ${error.message}`);
      throw error;
    }
  }

  // Get backup statistics
  getBackupStatistics() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const sqlFiles = files.filter(file => file.endsWith('.sql'));
      
      let totalSize = 0;
      let fullBackups = 0;
      let schemaBackups = 0;
      let dataBackups = 0;
      let tableBackups = 0;

      sqlFiles.forEach(file => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;

        if (file.includes('full_backup')) fullBackups++;
        else if (file.includes('schema_backup')) schemaBackups++;
        else if (file.includes('data_backup')) dataBackups++;
        else if (file.includes('table_')) tableBackups++;
      });

      const stats = {
        totalBackups: sqlFiles.length,
        totalSize: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        fullBackups,
        schemaBackups,
        dataBackups,
        tableBackups,
        retentionDays: RETENTION_DAYS
      };

      console.log('📊 Backup Statistics:');
      console.log(`  Total Backups: ${stats.totalBackups}`);
      console.log(`  Total Size: ${stats.totalSizeMB} MB`);
      console.log(`  Full Backups: ${stats.fullBackups}`);
      console.log(`  Schema Backups: ${stats.schemaBackups}`);
      console.log(`  Data Backups: ${stats.dataBackups}`);
      console.log(`  Table Backups: ${stats.tableBackups}`);
      console.log(`  Retention: ${stats.retentionDays} days`);

      return stats;
    } catch (error) {
      console.error(`❌ Failed to get backup statistics: ${error.message}`);
      return {};
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const backup = new DatabaseBackup();

  try {
    switch (command) {
      case 'full':
        const fullBackup = await backup.createFullBackup();
        await backup.createBackupMetadata(fullBackup, 'full');
        break;

      case 'schema':
        const schemaBackup = await backup.createSchemaBackup();
        await backup.createBackupMetadata(schemaBackup, 'schema');
        break;

      case 'data':
        const dataBackup = await backup.createDataBackup();
        await backup.createBackupMetadata(dataBackup, 'data');
        break;

      case 'table':
        const tableName = args[1];
        if (!tableName) {
          console.error('❌ Table name required for table backup');
          process.exit(1);
        }
        const tableBackup = await backup.createTableBackup(tableName);
        await backup.createBackupMetadata(tableBackup, 'table');
        break;

      case 'restore':
        const backupFile = args[1];
        if (!backupFile) {
          console.error('❌ Backup file required for restore');
          process.exit(1);
        }
        await backup.restoreDatabase(backupFile);
        break;

      case 'list':
        backup.listBackups();
        break;

      case 'verify':
        const verifyFile = args[1];
        if (!verifyFile) {
          console.error('❌ Backup file required for verification');
          process.exit(1);
        }
        await backup.verifyBackup(verifyFile);
        break;

      case 'cleanup':
        await backup.cleanupOldBackups();
        break;

      case 'stats':
        backup.getBackupStatistics();
        break;

      case 'all':
        console.log('🔄 Creating all backup types...');
        const full = await backup.createFullBackup();
        await backup.createBackupMetadata(full, 'full');
        
        const schema = await backup.createSchemaBackup();
        await backup.createBackupMetadata(schema, 'schema');
        
        const data = await backup.createDataBackup();
        await backup.createBackupMetadata(data, 'data');
        
        await backup.cleanupOldBackups();
        break;

      default:
        console.log('📖 Database Backup Tool');
        console.log('');
        console.log('Usage: node backup-database.js <command> [options]');
        console.log('');
        console.log('Commands:');
        console.log('  full                    Create full database backup');
        console.log('  schema                  Create schema-only backup');
        console.log('  data                    Create data-only backup');
        console.log('  table <name>            Create table-specific backup');
        console.log('  restore <file>          Restore database from backup');
        console.log('  list                    List available backups');
        console.log('  verify <file>           Verify backup integrity');
        console.log('  cleanup                 Clean up old backups');
        console.log('  stats                   Show backup statistics');
        console.log('  all                     Create all backup types and cleanup');
        console.log('');
        console.log('Environment Variables:');
        console.log('  BACKUP_DIR              Backup directory (default: ./backups)');
        console.log('  DB_HOST                 Database host (default: localhost)');
        console.log('  DB_PORT                 Database port (default: 5432)');
        console.log('  DB_NAME                 Database name (default: property_management)');
        console.log('  DB_USER                 Database user (default: property_user)');
        console.log('  DB_PASSWORD             Database password');
        console.log('  BACKUP_RETENTION_DAYS   Backup retention days (default: 30)');
        break;
    }
  } catch (error) {
    console.error(`❌ Operation failed: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DatabaseBackup;
