#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const path = require('path');

const prisma = new PrismaClient();

async function runMigrations() {
  try {
    console.log('🚀 Starting database migration...');
    
    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Run database migrations
    console.log('🗄️  Running database migrations...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    // Seed initial data
    console.log('🌱 Seeding initial data...');
    execSync('npx prisma db seed', { stdio: 'inherit' });
    
    console.log('✅ Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    
    // Reset database
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    
    // Generate Prisma client
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Seed initial data
    execSync('npx prisma db seed', { stdio: 'inherit' });
    
    console.log('✅ Database reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkDatabaseConnection() {
  try {
    console.log('🔍 Checking database connection...');
    
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log(`📊 Found ${tables.length} tables in database`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createIndexes() {
  try {
    console.log('📈 Creating database indexes...');
    
    // Create additional indexes for performance
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_properties_type_status 
      ON properties(type, status);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_properties_city_price 
      ON properties(city, price);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_bookings_status_date 
      ON bookings(status, booking_date);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_customers_email_phone 
      ON customers(email, phone);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_leads_status_source 
      ON leads(status, source);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_payments_status_method 
      ON payments(status, method);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
      ON notifications(user_id, is_read);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_date 
      ON audit_logs(entity, created_at);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_security_events_severity_date 
      ON security_events(severity, created_at);
    `;
    
    console.log('✅ Database indexes created successfully!');
    
  } catch (error) {
    console.error('❌ Failed to create indexes:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function analyzeDatabase() {
  try {
    console.log('📊 Analyzing database performance...');
    
    // Get table sizes
    const tableSizes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `;
    
    console.log('📈 Table sizes:');
    console.table(tableSizes);
    
    // Get index usage
    const indexUsage = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC;
    `;
    
    console.log('🔍 Index usage:');
    console.table(indexUsage);
    
  } catch (error) {
    console.error('❌ Database analysis failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'migrate':
    runMigrations();
    break;
  case 'reset':
    resetDatabase();
    break;
  case 'check':
    checkDatabaseConnection();
    break;
  case 'indexes':
    createIndexes();
    break;
  case 'analyze':
    analyzeDatabase();
    break;
  default:
    console.log(`
Usage: node migrate.js <command>

Commands:
  migrate   - Run database migrations and seed data
  reset     - Reset database and run migrations
  check     - Check database connection
  indexes   - Create additional database indexes
  analyze   - Analyze database performance

Examples:
  node migrate.js migrate
  node migrate.js reset
  node migrate.js check
  node migrate.js indexes
  node migrate.js analyze
    `);
    process.exit(1);
}
