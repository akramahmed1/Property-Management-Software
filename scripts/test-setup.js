#!/usr/bin/env node

/**
 * Test Setup Script
 * Sets up test data and environment for Property Management Software
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const testUsers = [
  {
    email: 'admin@property.com',
    password: 'Admin123!',
    name: 'System Administrator',
    role: 'SUPER_ADMIN',
    phone: '+91-9876543210'
  },
  {
    email: 'manager@property.com',
    password: 'Manager123!',
    name: 'Property Manager',
    role: 'MANAGER',
    phone: '+91-9876543211'
  },
  {
    email: 'agent@property.com',
    password: 'Agent123!',
    name: 'Sales Agent',
    role: 'AGENT',
    phone: '+91-9876543212'
  },
  {
    email: 'customer@property.com',
    password: 'Customer123!',
    name: 'Test Customer',
    role: 'CUSTOMER',
    phone: '+91-9876543213'
  }
];

const testProperties = [
  {
    name: 'Luxury Villa in Hyderabad',
    type: 'VILLA',
    status: 'AVAILABLE',
    location: 'Banjara Hills',
    address: '123, Banjara Hills, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    pincode: '500034',
    price: 15000000,
    area: 5000,
    bedrooms: 4,
    bathrooms: 3,
    floors: 2,
    facing: 'East',
    vastu: 'Vastu Compliant',
    amenities: ['Swimming Pool', 'Garden', 'Parking', 'Security', 'Gym'],
    description: 'Beautiful luxury villa with modern amenities in prime location',
    images: ['https://example.com/villa1.jpg', 'https://example.com/villa2.jpg']
  },
  {
    name: 'Modern Apartment in Dubai',
    type: 'APARTMENT',
    status: 'AVAILABLE',
    location: 'Downtown Dubai',
    address: '456, Sheikh Zayed Road, Dubai',
    city: 'Dubai',
    state: 'Dubai',
    country: 'UAE',
    pincode: '00000',
    price: 2500000,
    area: 1200,
    bedrooms: 2,
    bathrooms: 2,
    floors: 1,
    facing: 'North',
    vastu: 'Vastu Compliant',
    amenities: ['Balcony', 'Parking', 'Security', 'Gym', 'Pool'],
    description: 'Modern apartment with city views in downtown Dubai',
    images: ['https://example.com/apartment1.jpg', 'https://example.com/apartment2.jpg']
  },
  {
    name: 'Commercial Office Space in Riyadh',
    type: 'COMMERCIAL',
    status: 'AVAILABLE',
    location: 'King Fahd Road',
    address: '789, King Fahd Road, Riyadh',
    city: 'Riyadh',
    state: 'Riyadh',
    country: 'Saudi Arabia',
    pincode: '12345',
    price: 5000000,
    area: 3000,
    bedrooms: 0,
    bathrooms: 2,
    floors: 1,
    facing: 'South',
    vastu: 'Vastu Compliant',
    amenities: ['Parking', 'Security', 'Elevator', 'AC', 'WiFi'],
    description: 'Premium commercial office space in business district',
    images: ['https://example.com/office1.jpg', 'https://example.com/office2.jpg']
  }
];

const testCustomers = [
  {
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+91-9876543214',
    address: '123, Main Street, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    pincode: '400001',
    dateOfBirth: '1985-05-15',
    occupation: 'Software Engineer',
    annualIncome: 1500000,
    source: 'WEBSITE',
    status: 'ACTIVE'
  },
  {
    name: 'Ahmed Al-Rashid',
    email: 'ahmed.rashid@email.com',
    phone: '+971-501234567',
    address: '456, Sheikh Zayed Road, Dubai',
    city: 'Dubai',
    state: 'Dubai',
    country: 'UAE',
    pincode: '00000',
    dateOfBirth: '1980-08-20',
    occupation: 'Business Owner',
    annualIncome: 3000000,
    source: 'REFERRAL',
    status: 'ACTIVE'
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+966-501234567',
    address: '789, King Fahd Road, Riyadh',
    city: 'Riyadh',
    state: 'Riyadh',
    country: 'Saudi Arabia',
    pincode: '12345',
    dateOfBirth: '1990-12-10',
    occupation: 'Marketing Manager',
    annualIncome: 2000000,
    source: 'ADVERTISEMENT',
    status: 'ACTIVE'
  }
];

const testLeads = [
  {
    name: 'Lead 1',
    email: 'lead1@email.com',
    phone: '+91-9876543215',
    source: 'WEBSITE',
    status: 'NEW',
    score: 75,
    budget: 10000000,
    preferredLocation: 'Hyderabad',
    notes: 'Interested in luxury villa'
  },
  {
    name: 'Lead 2',
    email: 'lead2@email.com',
    phone: '+971-501234568',
    source: 'REFERRAL',
    status: 'CONTACTED',
    score: 85,
    budget: 3000000,
    preferredLocation: 'Dubai',
    notes: 'Looking for modern apartment'
  },
  {
    name: 'Lead 3',
    email: 'lead3@email.com',
    phone: '+966-501234568',
    source: 'ADVERTISEMENT',
    status: 'QUALIFIED',
    score: 90,
    budget: 6000000,
    preferredLocation: 'Riyadh',
    notes: 'Commercial space requirement'
  }
];

async function setupTestData() {
  try {
    console.log('🚀 Setting up test data...');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.file.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.property.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    console.log('👥 Creating test users...');
    const createdUsers = [];
    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          isActive: true
        }
      });
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    }

    // Create test customers
    console.log('👤 Creating test customers...');
    const createdCustomers = [];
    for (const customerData of testCustomers) {
      const customer = await prisma.customer.create({
        data: {
          ...customerData,
          createdById: createdUsers[0].id // Admin created all customers
        }
      });
      createdCustomers.push(customer);
      console.log(`✅ Created customer: ${customer.name}`);
    }

    // Create test properties
    console.log('🏠 Creating test properties...');
    const createdProperties = [];
    for (const propertyData of testProperties) {
      const property = await prisma.property.create({
        data: {
          ...propertyData,
          createdById: createdUsers[1].id // Manager created all properties
        }
      });
      createdProperties.push(property);
      console.log(`✅ Created property: ${property.name}`);
    }

    // Create test leads
    console.log('🎯 Creating test leads...');
    const createdLeads = [];
    for (const leadData of testLeads) {
      const lead = await prisma.lead.create({
        data: {
          ...leadData,
          createdById: createdUsers[2].id, // Agent created all leads
          assignedTo: createdUsers[2].id
        }
      });
      createdLeads.push(lead);
      console.log(`✅ Created lead: ${lead.name}`);
    }

    // Create test bookings
    console.log('📅 Creating test bookings...');
    const bookingData = [
      {
        propertyId: createdProperties[0].id,
        customerId: createdCustomers[0].id,
        agentId: createdUsers[2].id,
        amount: 15000000,
        status: 'CONFIRMED',
        bookingDate: new Date(),
        moveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        notes: 'Test booking for luxury villa'
      },
      {
        propertyId: createdProperties[1].id,
        customerId: createdCustomers[1].id,
        agentId: createdUsers[2].id,
        amount: 2500000,
        status: 'PENDING',
        bookingDate: new Date(),
        moveInDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        notes: 'Test booking for Dubai apartment'
      }
    ];

    for (const booking of bookingData) {
      const createdBooking = await prisma.booking.create({
        data: booking
      });
      console.log(`✅ Created booking: ${createdBooking.id}`);
    }

    // Create test transactions
    console.log('💰 Creating test transactions...');
    const transactionData = [
      {
        type: 'INCOME',
        amount: 15000000,
        description: 'Property sale - Luxury Villa',
        category: 'SALES',
        status: 'COMPLETED',
        createdById: createdUsers[1].id
      },
      {
        type: 'EXPENSE',
        amount: 500000,
        description: 'Marketing expenses',
        category: 'MARKETING',
        status: 'COMPLETED',
        createdById: createdUsers[1].id
      },
      {
        type: 'INCOME',
        amount: 2500000,
        description: 'Property sale - Dubai Apartment',
        category: 'SALES',
        status: 'PENDING',
        createdById: createdUsers[1].id
      }
    ];

    for (const transaction of transactionData) {
      const createdTransaction = await prisma.transaction.create({
        data: transaction
      });
      console.log(`✅ Created transaction: ${createdTransaction.description}`);
    }

    // Create test notifications
    console.log('🔔 Creating test notifications...');
    const notificationData = [
      {
        userId: createdUsers[0].id,
        type: 'SYSTEM_ALERT',
        title: 'Welcome to Property Management System',
        message: 'Your account has been set up successfully',
        data: { welcome: true }
      },
      {
        userId: createdUsers[1].id,
        type: 'PROPERTY_UPDATED',
        title: 'Property Updated',
        message: 'Luxury Villa in Hyderabad has been updated',
        data: { propertyId: createdProperties[0].id }
      },
      {
        userId: createdUsers[2].id,
        type: 'LEAD_UPDATED',
        title: 'Lead Score Updated',
        message: 'Lead 1 score updated to 75',
        data: { leadId: createdLeads[0].id, score: 75 }
      }
    ];

    for (const notification of notificationData) {
      const createdNotification = await prisma.notification.create({
        data: notification
      });
      console.log(`✅ Created notification: ${createdNotification.title}`);
    }

    // Generate JWT tokens for testing
    console.log('🔑 Generating JWT tokens...');
    const tokens = {};
    for (const user of createdUsers) {
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );
      tokens[user.email] = token;
    }

    // Save tokens to file
    const fs = require('fs');
    fs.writeFileSync('test-tokens.json', JSON.stringify(tokens, null, 2));
    console.log('✅ JWT tokens saved to test-tokens.json');

    console.log('\n🎉 Test data setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${createdUsers.length}`);
    console.log(`- Customers: ${createdCustomers.length}`);
    console.log(`- Properties: ${createdProperties.length}`);
    console.log(`- Leads: ${createdLeads.length}`);
    console.log(`- Bookings: ${bookingData.length}`);
    console.log(`- Transactions: ${transactionData.length}`);
    console.log(`- Notifications: ${notificationData.length}`);

    console.log('\n🔑 Test Credentials:');
    testUsers.forEach(user => {
      console.log(`${user.role}: ${user.email} / ${user.password}`);
    });

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
if (require.main === module) {
  setupTestData();
}

module.exports = { setupTestData };
