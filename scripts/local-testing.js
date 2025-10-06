#!/usr/bin/env node

/**
 * Local Testing and Validation Script
 * Comprehensive local testing for Property Management Software
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const prisma = new PrismaClient();

class LocalTesting {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.tokens = {};
    this.testData = {};
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  // Helper method to make authenticated requests
  async makeRequest(method, endpoint, data = null, token = null) {
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  // Test helper
  async runTest(testName, testFunction) {
    this.results.total++;
    console.log(`\n🧪 Running: ${testName}`);
    
    try {
      await testFunction();
      this.results.passed++;
      this.results.details.push({ name: testName, status: 'PASSED' });
      console.log(`✅ PASSED: ${testName}`);
    } catch (error) {
      this.results.failed++;
      this.results.details.push({ name: testName, status: 'FAILED', error: error.message });
      console.log(`❌ FAILED: ${testName} - ${error.message}`);
    }
  }

  // Setup test data
  async setupTestData() {
    console.log('🔧 Setting up test data...');

    // Clear existing data
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.file.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.property.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = await Promise.all([
      prisma.user.create({
        data: {
          email: 'admin@property.com',
          password: hashedPassword,
          name: 'System Administrator',
          role: 'SUPER_ADMIN',
          phone: '+91-9876543210',
          isActive: true
        }
      }),
      prisma.user.create({
        data: {
          email: 'manager@property.com',
          password: hashedPassword,
          name: 'Property Manager',
          role: 'MANAGER',
          phone: '+91-9876543211',
          isActive: true
        }
      }),
      prisma.user.create({
        data: {
          email: 'agent@property.com',
          password: hashedPassword,
          name: 'Sales Agent',
          role: 'AGENT',
          phone: '+91-9876543212',
          isActive: true
        }
      })
    ]);

    this.testData.users = {
      admin: users[0],
      manager: users[1],
      agent: users[2]
    };

    // Generate JWT tokens
    for (const [role, user] of Object.entries(this.testData.users)) {
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );
      this.tokens[role] = token;
    }

    console.log('✅ Test data setup completed');
  }

  // Test 1: Database Schema Validation
  async testDatabaseSchema() {
    console.log('📊 Testing database schema...');

    // Test User model
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('User model not working');

    // Test Property model
    const property = await prisma.property.create({
      data: {
        name: 'Test Property',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        location: 'Test Location',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        price: 1000000,
        area: 1000,
        createdById: this.testData.users.manager.id
      }
    });

    if (!property) throw new Error('Property model not working');

    // Test Customer model
    const customer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+91-9876543210',
        createdById: this.testData.users.agent.id
      }
    });

    if (!customer) throw new Error('Customer model not working');

    // Test Lead model
    const lead = await prisma.lead.create({
      data: {
        name: 'Test Lead',
        email: 'lead@example.com',
        phone: '+91-9876543210',
        source: 'WEBSITE',
        status: 'NEW',
        score: 80,
        createdById: this.testData.users.agent.id
      }
    });

    if (!lead) throw new Error('Lead model not working');

    // Test Booking model
    const booking = await prisma.booking.create({
      data: {
        propertyId: property.id,
        customerId: customer.id,
        agentId: this.testData.users.agent.id,
        status: 'PENDING',
        bookingDate: new Date(),
        amount: 1000000
      }
    });

    if (!booking) throw new Error('Booking model not working');

    // Test Transaction model
    const transaction = await prisma.transaction.create({
      data: {
        type: 'INCOME',
        category: 'SALES',
        amount: 1000000,
        description: 'Test transaction',
        date: new Date(),
        createdById: this.testData.users.manager.id
      }
    });

    if (!transaction) throw new Error('Transaction model not working');

    // Test Payment model
    const payment = await prisma.payment.create({
      data: {
        amount: 100000,
        currency: 'INR',
        method: 'BANK_TRANSFER',
        status: 'PENDING'
      }
    });

    if (!payment) throw new Error('Payment model not working');

    // Test Notification model
    const notification = await prisma.notification.create({
      data: {
        userId: this.testData.users.admin.id,
        type: 'SYSTEM_ALERT',
        title: 'Test Notification',
        message: 'This is a test notification'
      }
    });

    if (!notification) throw new Error('Notification model not working');

    // Test File model
    const file = await prisma.file.create({
      data: {
        originalName: 'test.jpg',
        fileName: 'test_123.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
        url: 'https://example.com/test.jpg',
        folder: 'test'
      }
    });

    if (!file) throw new Error('File model not working');

    console.log('✅ All database models working correctly');
  }

  // Test 2: Authentication Flow
  async testAuthenticationFlow() {
    // Test user registration
    const registerData = {
      email: 'test@example.com',
      password: 'Test123!',
      name: 'Test User',
      role: 'CUSTOMER'
    };

    const registerResult = await this.makeRequest('POST', '/auth/register', registerData);
    if (!registerResult.success) {
      throw new Error('User registration failed');
    }

    // Test user login
    const loginData = {
      email: 'admin@property.com',
      password: 'password123'
    };

    const loginResult = await this.makeRequest('POST', '/auth/login', loginData);
    if (!loginResult.success) {
      throw new Error('User login failed');
    }

    this.tokens.test = loginResult.data.token;

    // Test token validation
    const validateResult = await this.makeRequest('GET', '/auth/me', null, this.tokens.test);
    if (!validateResult.success) {
      throw new Error('Token validation failed');
    }

    console.log('✅ Authentication flow working correctly');
  }

  // Test 3: Property Management
  async testPropertyManagement() {
    // Create property
    const propertyData = {
      name: 'Luxury Villa in Hyderabad',
      type: 'VILLA',
      status: 'AVAILABLE',
      location: 'Banjara Hills',
      address: '123, Road No. 12, Banjara Hills, Hyderabad',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      pincode: '500034',
      price: 25000000,
      area: 5000,
      bedrooms: 4,
      bathrooms: 3,
      floors: 2,
      facing: 'East',
      vastu: 'Vastu Compliant',
      amenities: ['Swimming Pool', 'Garden', 'Parking', 'Security', 'Gym'],
      description: 'Beautiful luxury villa with modern amenities'
    };

    const createResult = await this.makeRequest('POST', '/properties', propertyData, this.tokens.manager);
    if (!createResult.success) {
      throw new Error('Property creation failed');
    }

    const propertyId = createResult.data.data.id;
    this.testData.propertyId = propertyId;

    // Get properties
    const getResult = await this.makeRequest('GET', '/properties', null, this.tokens.manager);
    if (!getResult.success) {
      throw new Error('Get properties failed');
    }

    // Update property
    const updateData = { name: 'Updated Luxury Villa' };
    const updateResult = await this.makeRequest('PUT', `/properties/${propertyId}`, updateData, this.tokens.manager);
    if (!updateResult.success) {
      throw new Error('Property update failed');
    }

    // Get property by ID
    const getByIdResult = await this.makeRequest('GET', `/properties/${propertyId}`, null, this.tokens.manager);
    if (!getByIdResult.success) {
      throw new Error('Get property by ID failed');
    }

    console.log('✅ Property management working correctly');
  }

  // Test 4: CRM Lead Management
  async testCRMLeadManagement() {
    // Create lead
    const leadData = {
      name: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      phone: '+91-9876543210',
      source: 'WEBSITE',
      status: 'NEW',
      score: 80,
      budget: 30000000,
      preferredLocation: 'Hyderabad',
      notes: 'Interested in luxury villa'
    };

    const createLeadResult = await this.makeRequest('POST', '/crm/leads', leadData, this.tokens.agent);
    if (!createLeadResult.success) {
      throw new Error('Lead creation failed');
    }

    const leadId = createLeadResult.data.data.id;
    this.testData.leadId = leadId;

    // Get leads
    const getLeadsResult = await this.makeRequest('GET', '/crm/leads', null, this.tokens.agent);
    if (!getLeadsResult.success) {
      throw new Error('Get leads failed');
    }

    // Update lead score
    const scoreData = { score: 90 };
    const updateScoreResult = await this.makeRequest('POST', `/crm/leads/${leadId}/score`, scoreData, this.tokens.agent);
    if (!updateScoreResult.success) {
      throw new Error('Lead score update failed');
    }

    // Update lead status
    const updateData = { status: 'QUALIFIED' };
    const updateResult = await this.makeRequest('PUT', `/crm/leads/${leadId}`, updateData, this.tokens.agent);
    if (!updateResult.success) {
      throw new Error('Lead update failed');
    }

    console.log('✅ CRM lead management working correctly');
  }

  // Test 5: Customer Management
  async testCustomerManagement() {
    // Create customer
    const customerData = {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '+91-9876543211',
      address: '456, Jubilee Hills, Hyderabad',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      pincode: '500033',
      dateOfBirth: '1985-05-15',
      occupation: 'Software Engineer',
      income: 2000000,
      notes: 'Looking for luxury property'
    };

    const createCustomerResult = await this.makeRequest('POST', '/crm/customers', customerData, this.tokens.agent);
    if (!createCustomerResult.success) {
      throw new Error('Customer creation failed');
    }

    const customerId = createCustomerResult.data.data.id;
    this.testData.customerId = customerId;

    // Get customers
    const getCustomersResult = await this.makeRequest('GET', '/crm/customers', null, this.tokens.agent);
    if (!getCustomersResult.success) {
      throw new Error('Get customers failed');
    }

    // Get customer 360
    const getCustomer360Result = await this.makeRequest('GET', `/crm/customers/${customerId}`, null, this.tokens.agent);
    if (!getCustomer360Result.success) {
      throw new Error('Get customer 360 failed');
    }

    console.log('✅ Customer management working correctly');
  }

  // Test 6: ERP Financial Management
  async testERPFinancialManagement() {
    // Create transaction
    const transactionData = {
      type: 'INCOME',
      amount: 25000000,
      description: 'Luxury Villa Sale',
      category: 'PROPERTY_SALE',
      status: 'COMPLETED'
    };

    const createTransactionResult = await this.makeRequest('POST', '/erp/transactions', transactionData, this.tokens.manager);
    if (!createTransactionResult.success) {
      throw new Error('Transaction creation failed');
    }

    const transactionId = createTransactionResult.data.data.id;
    this.testData.transactionId = transactionId;

    // Get transactions
    const getTransactionsResult = await this.makeRequest('GET', '/erp/transactions', null, this.tokens.manager);
    if (!getTransactionsResult.success) {
      throw new Error('Get transactions failed');
    }

    // Get financial summary
    const getFinancialResult = await this.makeRequest('GET', '/erp/financials', null, this.tokens.manager);
    if (!getFinancialResult.success) {
      throw new Error('Get financial summary failed');
    }

    console.log('✅ ERP financial management working correctly');
  }

  // Test 7: Payment Processing
  async testPaymentProcessing() {
    // Create payment order
    const paymentData = {
      amount: 5000000,
      currency: 'INR',
      customerId: this.testData.customerId || 'test_customer',
      description: 'Advance Payment - Villa Sale'
    };

    const createOrderResult = await this.makeRequest('POST', '/payments/create-order', paymentData, this.tokens.agent);
    if (!createOrderResult.success) {
      throw new Error('Payment order creation failed');
    }

    const orderId = createOrderResult.data.data.order.id;
    this.testData.orderId = orderId;

    // Get payment details
    const getPaymentResult = await this.makeRequest('GET', `/payments/${orderId}`, null, this.tokens.agent);
    if (!getPaymentResult.success) {
      throw new Error('Get payment details failed');
    }

    console.log('✅ Payment processing working correctly');
  }

  // Test 8: Real-world Business Scenario
  async testRealWorldBusinessScenario() {
    console.log('\n🏢 Testing Real-world Business Scenario...');

    // Step 1: Create a property
    const propertyData = {
      name: 'Modern Apartment in Dubai',
      type: 'APARTMENT',
      status: 'AVAILABLE',
      location: 'Downtown Dubai',
      address: '456, Sheikh Zayed Road, Dubai',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      pincode: '00000',
      price: 5000000,
      area: 1200,
      bedrooms: 2,
      bathrooms: 2,
      amenities: ['Balcony', 'Parking', 'Security', 'Gym'],
      description: 'Modern apartment with city views'
    };

    const propertyResult = await this.makeRequest('POST', '/properties', propertyData, this.tokens.manager);
    if (!propertyResult.success) {
      throw new Error('Property creation failed in business scenario');
    }

    const propertyId = propertyResult.data.data.id;

    // Step 2: Create a customer
    const customerData = {
      name: 'Ahmed Al-Rashid',
      email: 'ahmed@example.com',
      phone: '+971-501234567',
      address: '789, Jumeirah, Dubai',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      income: 3000000,
      notes: 'Looking for apartment in downtown'
    };

    const customerResult = await this.makeRequest('POST', '/crm/customers', customerData, this.tokens.agent);
    if (!customerResult.success) {
      throw new Error('Customer creation failed in business scenario');
    }

    const customerId = customerResult.data.data.id;

    // Step 3: Create a lead
    const leadData = {
      name: 'Ahmed Al-Rashid',
      email: 'ahmed@example.com',
      phone: '+971-501234567',
      source: 'REFERRAL',
      status: 'NEW',
      score: 85,
      budget: 6000000,
      preferredLocation: 'Downtown Dubai',
      notes: 'Interested in modern apartment'
    };

    const leadResult = await this.makeRequest('POST', '/crm/leads', leadData, this.tokens.agent);
    if (!leadResult.success) {
      throw new Error('Lead creation failed in business scenario');
    }

    const leadId = leadResult.data.data.id;

    // Step 4: Update lead score
    const scoreData = { score: 95 };
    const scoreResult = await this.makeRequest('POST', `/crm/leads/${leadId}/score`, scoreData, this.tokens.agent);
    if (!scoreResult.success) {
      throw new Error('Lead score update failed in business scenario');
    }

    // Step 5: Create a booking
    const bookingData = {
      propertyId: propertyId,
      customerId: customerId,
      agentId: this.testData.users.agent.id,
      status: 'PENDING',
      bookingDate: new Date().toISOString(),
      amount: 5000000,
      advanceAmount: 1000000,
      paymentMethod: 'BANK_TRANSFER',
      notes: 'Customer very interested'
    };

    const bookingResult = await this.makeRequest('POST', '/bookings', bookingData, this.tokens.agent);
    if (!bookingResult.success) {
      throw new Error('Booking creation failed in business scenario');
    }

    // Step 6: Create a transaction
    const transactionData = {
      type: 'INCOME',
      amount: 5000000,
      description: 'Apartment Sale - Dubai',
      category: 'PROPERTY_SALE',
      status: 'PENDING'
    };

    const transactionResult = await this.makeRequest('POST', '/erp/transactions', transactionData, this.tokens.manager);
    if (!transactionResult.success) {
      throw new Error('Transaction creation failed in business scenario');
    }

    // Step 7: Create a payment
    const paymentData = {
      amount: 1000000,
      currency: 'INR',
      customerId: customerId,
      description: 'Advance Payment - Apartment Sale'
    };

    const paymentResult = await this.makeRequest('POST', '/payments/create-order', paymentData, this.tokens.agent);
    if (!paymentResult.success) {
      throw new Error('Payment creation failed in business scenario');
    }

    console.log('✅ Real-world business scenario completed successfully');
  }

  // Test 9: Database Performance
  async testDatabasePerformance() {
    console.log('⚡ Testing database performance...');

    const startTime = Date.now();

    // Test bulk operations
    const properties = [];
    for (let i = 0; i < 100; i++) {
      properties.push({
        name: `Test Property ${i}`,
        type: 'APARTMENT',
        status: 'AVAILABLE',
        location: `Location ${i}`,
        address: `Address ${i}`,
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        price: 1000000 + i * 10000,
        area: 1000 + i * 10,
        createdById: this.testData.users.manager.id
      });
    }

    await prisma.property.createMany({
      data: properties
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ Created 100 properties in ${duration}ms`);

    // Test complex queries
    const complexQueryStart = Date.now();
    
    const complexResult = await prisma.property.findMany({
      where: {
        price: { gte: 1000000, lte: 2000000 },
        area: { gte: 1000, lte: 2000 }
      },
      include: {
        createdBy: true,
        bookings: true,
        _count: true
      },
      orderBy: { price: 'desc' },
      take: 50
    });

    const complexQueryEnd = Date.now();
    const complexDuration = complexQueryEnd - complexQueryStart;

    console.log(`✅ Complex query executed in ${complexDuration}ms`);
    console.log(`✅ Found ${complexResult.length} properties matching criteria`);
  }

  // Test 10: Error Handling
  async testErrorHandling() {
    console.log('🛡️ Testing error handling...');

    // Test invalid property creation
    const invalidPropertyData = {
      name: '', // Invalid: empty name
      type: 'INVALID_TYPE', // Invalid type
      price: -1000 // Invalid: negative price
    };

    const invalidResult = await this.makeRequest('POST', '/properties', invalidPropertyData, this.tokens.manager);
    if (invalidResult.success) {
      throw new Error('Should have failed with invalid data');
    }

    // Test unauthorized access
    const unauthorizedResult = await this.makeRequest('GET', '/properties', null, 'invalid-token');
    if (unauthorizedResult.success) {
      throw new Error('Should have failed with invalid token');
    }

    // Test non-existent resource
    const notFoundResult = await this.makeRequest('GET', '/properties/non-existent-id', null, this.tokens.manager);
    if (notFoundResult.success) {
      throw new Error('Should have failed with non-existent resource');
    }

    console.log('✅ Error handling working correctly');
  }

  // Run all tests
  async runAllTests() {
    try {
      console.log('🚀 STARTING LOCAL TESTING AND VALIDATION');
      console.log('==========================================');

      await this.setupTestData();

      await this.runTest('Database Schema Validation', () => this.testDatabaseSchema());
      await this.runTest('Authentication Flow', () => this.testAuthenticationFlow());
      await this.runTest('Property Management', () => this.testPropertyManagement());
      await this.runTest('CRM Lead Management', () => this.testCRMLeadManagement());
      await this.runTest('Customer Management', () => this.testCustomerManagement());
      await this.runTest('ERP Financial Management', () => this.testERPFinancialManagement());
      await this.runTest('Payment Processing', () => this.testPaymentProcessing());
      await this.runTest('Real-world Business Scenario', () => this.testRealWorldBusinessScenario());
      await this.runTest('Database Performance', () => this.testDatabasePerformance());
      await this.runTest('Error Handling', () => this.testErrorHandling());

      // Print results
      console.log('\n📊 LOCAL TEST RESULTS SUMMARY');
      console.log('==============================');
      console.log(`✅ Passed: ${this.results.passed}`);
      console.log(`❌ Failed: ${this.results.failed}`);
      console.log(`📈 Total: ${this.results.total}`);
      console.log(`🎯 Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(2)}%`);

      if (this.results.failed > 0) {
        console.log('\n❌ Failed Tests:');
        this.results.details
          .filter(test => test.status === 'FAILED')
          .forEach(test => {
            console.log(`- ${test.name}: ${test.error}`);
          });
      }

      // Save results to file
      const fs = require('fs');
      fs.writeFileSync('local-test-results.json', JSON.stringify(this.results, null, 2));
      console.log('\n💾 Local test results saved to local-test-results.json');

      process.exit(this.results.failed > 0 ? 1 : 0);

    } catch (error) {
      console.error('❌ Error running local tests:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const localTest = new LocalTesting();
  localTest.runAllTests();
}

module.exports = LocalTesting;
