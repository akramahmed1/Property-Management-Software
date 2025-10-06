import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { join } from 'path';

const prisma = new PrismaClient();

export const setupTestDatabase = async () => {
  try {
    // Reset database
    await prisma.$executeRaw`TRUNCATE TABLE "AuditLog" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Session" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "TwoFactorAuth" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Payment" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Booking" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "InventoryItem" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Property" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Lead" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Customer" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Notification" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "File" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Transaction" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "SystemConfig" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "RateLimit" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "SecurityEvent" CASCADE`;

    // Reset sequences
    await prisma.$executeRaw`ALTER SEQUENCE "User_id_seq" RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE "Property_id_seq" RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE "Customer_id_seq" RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE "Lead_id_seq" RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE "Booking_id_seq" RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE "Payment_id_seq" RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE "Transaction_id_seq" RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE "Notification_id_seq" RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE "File_id_seq" RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE "AuditLog_id_seq" RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE "SystemConfig_id_seq" RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE "RateLimit_id_seq" RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE "SecurityEvent_id_seq" RESTART WITH 1`;

    console.log('Test database reset successfully');
  } catch (error) {
    console.error('Error resetting test database:', error);
    throw error;
  }
};

export const seedTestData = async () => {
  try {
    // Create test users
    const adminUser = await prisma.user.create({
      data: {
        name: 'Test Admin',
        email: 'admin@test.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        phone: '+1111111111',
        role: 'SUPER_ADMIN',
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: new Date(),
      },
    });

    const agentUser = await prisma.user.create({
      data: {
        name: 'Test Agent',
        email: 'agent@test.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        phone: '+2222222222',
        role: 'AGENT',
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: new Date(),
      },
    });

    const customerUser = await prisma.user.create({
      data: {
        name: 'Test Customer',
        email: 'customer@test.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        phone: '+3333333333',
        role: 'CUSTOMER',
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: new Date(),
      },
    });

    // Create test properties
    const property1 = await prisma.property.create({
      data: {
        name: 'Test Property 1',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 5000000,
        area: 1200,
        bedrooms: 3,
        bathrooms: 2,
        location: 'Test Location 1',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        description: 'Test Property Description 1',
        features: ['Parking', 'Garden', 'Security'],
        amenities: ['Swimming Pool', 'Gym', 'Clubhouse'],
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });

    const property2 = await prisma.property.create({
      data: {
        name: 'Test Property 2',
        type: 'VILLA',
        status: 'SOLD',
        price: 10000000,
        area: 2500,
        bedrooms: 4,
        bathrooms: 3,
        location: 'Test Location 2',
        address: '456 Test Avenue',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        description: 'Test Property Description 2',
        features: ['Parking', 'Garden', 'Security', 'Pool'],
        amenities: ['Swimming Pool', 'Gym', 'Clubhouse', 'Tennis Court'],
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });

    // Create test customers
    const customer1 = await prisma.customer.create({
      data: {
        name: 'Test Customer 1',
        email: 'customer1@test.com',
        phone: '+4444444444',
        address: '789 Customer Street',
        city: 'Customer City',
        state: 'Customer State',
        country: 'Customer Country',
        occupation: 'Software Engineer',
        income: 1500000,
        preferences: ['APARTMENT', 'VILLA'],
        budget: 8000000,
        notes: 'Test Customer Notes 1',
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });

    const customer2 = await prisma.customer.create({
      data: {
        name: 'Test Customer 2',
        email: 'customer2@test.com',
        phone: '+5555555555',
        address: '321 Customer Avenue',
        city: 'Customer City',
        state: 'Customer State',
        country: 'Customer Country',
        occupation: 'Business Owner',
        income: 3000000,
        preferences: ['VILLA'],
        budget: 15000000,
        notes: 'Test Customer Notes 2',
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });

    // Create test leads
    const lead1 = await prisma.lead.create({
      data: {
        name: 'Test Lead 1',
        email: 'lead1@test.com',
        phone: '+6666666666',
        source: 'WEBSITE',
        status: 'NEW',
        interest: '3BHK Apartment',
        budget: 5000000,
        notes: 'Test Lead Notes 1',
        assignedTo: agentUser.id,
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });

    const lead2 = await prisma.lead.create({
      data: {
        name: 'Test Lead 2',
        email: 'lead2@test.com',
        phone: '+7777777777',
        source: 'REFERRAL',
        status: 'QUALIFIED',
        interest: '4BHK Villa',
        budget: 12000000,
        notes: 'Test Lead Notes 2',
        assignedTo: agentUser.id,
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });

    // Create test bookings
    const booking1 = await prisma.booking.create({
      data: {
        propertyId: property1.id,
        customerId: customer1.id,
        amount: 5000000,
        advanceAmount: 500000,
        paymentMethod: 'UPI',
        status: 'PENDING',
        notes: 'Test Booking Notes 1',
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });

    const booking2 = await prisma.booking.create({
      data: {
        propertyId: property2.id,
        customerId: customer2.id,
        amount: 10000000,
        advanceAmount: 1000000,
        paymentMethod: 'BANK_TRANSFER',
        status: 'CONFIRMED',
        notes: 'Test Booking Notes 2',
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });

    // Create test payments
    const payment1 = await prisma.payment.create({
      data: {
        bookingId: booking1.id,
        amount: 500000,
        method: 'UPI',
        status: 'PENDING',
        gateway: 'RAZORPAY',
        gatewayTransactionId: 'test_txn_1',
        notes: 'Test Payment Notes 1',
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });

    const payment2 = await prisma.payment.create({
      data: {
        bookingId: booking2.id,
        amount: 1000000,
        method: 'BANK_TRANSFER',
        status: 'COMPLETED',
        gateway: 'RAZORPAY',
        gatewayTransactionId: 'test_txn_2',
        notes: 'Test Payment Notes 2',
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });

    // Create test transactions
    const transaction1 = await prisma.transaction.create({
      data: {
        bookingId: booking1.id,
        type: 'BOOKING',
        amount: 5000000,
        status: 'PENDING',
        description: 'Test Transaction 1',
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });

    const transaction2 = await prisma.transaction.create({
      data: {
        bookingId: booking2.id,
        type: 'SALE',
        amount: 10000000,
        status: 'COMPLETED',
        description: 'Test Transaction 2',
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });

    // Create test notifications
    const notification1 = await prisma.notification.create({
      data: {
        userId: adminUser.id,
        type: 'BOOKING_CREATED',
        title: 'New Booking Created',
        message: 'A new booking has been created for Test Property 1',
        isRead: false,
        data: {
          bookingId: booking1.id,
          propertyId: property1.id,
          customerId: customer1.id,
        },
      },
    });

    const notification2 = await prisma.notification.create({
      data: {
        userId: agentUser.id,
        type: 'LEAD_ASSIGNED',
        title: 'New Lead Assigned',
        message: 'A new lead has been assigned to you',
        isRead: false,
        data: {
          leadId: lead1.id,
        },
      },
    });

    // Create test system config
    await prisma.systemConfig.create({
      data: {
        key: 'test_config',
        value: 'test_value',
        description: 'Test configuration',
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });

    console.log('Test data seeded successfully');
    
    return {
      users: { adminUser, agentUser, customerUser },
      properties: { property1, property2 },
      customers: { customer1, customer2 },
      leads: { lead1, lead2 },
      bookings: { booking1, booking2 },
      payments: { payment1, payment2 },
      transactions: { transaction1, transaction2 },
      notifications: { notification1, notification2 },
    };
  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  }
};

export const cleanupTestData = async () => {
  try {
    await setupTestDatabase();
    console.log('Test data cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    throw error;
  }
};

export const generateTestToken = (userId: string, role: string = 'AGENT') => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { 
      userId, 
      role,
      email: 'test@example.com',
      name: 'Test User'
    },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
};

export const waitForDatabase = async (maxRetries = 30) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection established');
      return;
    } catch (error) {
      console.log(`Waiting for database... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Database connection timeout');
};

export const closeDatabaseConnection = async () => {
  await prisma.$disconnect();
};
