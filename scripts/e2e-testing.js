#!/usr/bin/env node

/**
 * End-to-End Testing Script
 * Comprehensive E2E testing for Property Management Software
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

class E2ETesting {
  constructor() {
    this.baseURL = process.env.API_URL || 'http://localhost:3000/api';
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

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = await Promise.all([
      prisma.user.upsert({
        where: { email: 'admin@property.com' },
        update: {},
        create: {
          email: 'admin@property.com',
          password: hashedPassword,
          name: 'System Administrator',
          role: 'SUPER_ADMIN',
          phone: '+91-9876543210',
          isActive: true
        }
      }),
      prisma.user.upsert({
        where: { email: 'manager@property.com' },
        update: {},
        create: {
          email: 'manager@property.com',
          password: hashedPassword,
          name: 'Property Manager',
          role: 'MANAGER',
          phone: '+91-9876543211',
          isActive: true
        }
      }),
      prisma.user.upsert({
        where: { email: 'agent@property.com' },
        update: {},
        create: {
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

  // Test 1: Complete Authentication Flow
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

    // Test logout
    const logoutResult = await this.makeRequest('POST', '/auth/logout', null, this.tokens.test);
    if (!logoutResult.success) {
      throw new Error('User logout failed');
    }
  }

  // Test 2: Property Management E2E
  async testPropertyManagementE2E() {
    // Create property
    const propertyData = {
      name: 'E2E Test Property',
      type: 'APARTMENT',
      status: 'AVAILABLE',
      location: 'Test Location',
      address: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      pincode: '12345',
      price: 1000000,
      area: 1000,
      bedrooms: 2,
      bathrooms: 2,
      amenities: ['Parking', 'Security'],
      description: 'E2E test property'
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
    const updateData = { name: 'Updated E2E Test Property' };
    const updateResult = await this.makeRequest('PUT', `/properties/${propertyId}`, updateData, this.tokens.manager);
    if (!updateResult.success) {
      throw new Error('Property update failed');
    }

    // Get property by ID
    const getByIdResult = await this.makeRequest('GET', `/properties/${propertyId}`, null, this.tokens.manager);
    if (!getByIdResult.success) {
      throw new Error('Get property by ID failed');
    }

    // Delete property
    const deleteResult = await this.makeRequest('DELETE', `/properties/${propertyId}`, null, this.tokens.manager);
    if (!deleteResult.success) {
      throw new Error('Property deletion failed');
    }
  }

  // Test 3: CRM Lead Management E2E
  async testCRMLeadManagementE2E() {
    // Create lead
    const leadData = {
      name: 'E2E Test Lead',
      email: 'lead@example.com',
      phone: '+91-9876543210',
      source: 'WEBSITE',
      status: 'NEW',
      score: 80,
      budget: 2000000,
      preferredLocation: 'Test City',
      notes: 'E2E test lead'
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
    const scoreData = { score: 85 };
    const updateScoreResult = await this.makeRequest('POST', `/crm/leads/${leadId}/score`, scoreData, this.tokens.agent);
    if (!updateScoreResult.success) {
      throw new Error('Lead score update failed');
    }

    // Update lead
    const updateData = { status: 'QUALIFIED' };
    const updateResult = await this.makeRequest('PUT', `/crm/leads/${leadId}`, updateData, this.tokens.agent);
    if (!updateResult.success) {
      throw new Error('Lead update failed');
    }

    // Get lead by ID
    const getLeadByIdResult = await this.makeRequest('GET', `/crm/leads/${leadId}`, null, this.tokens.agent);
    if (!getLeadByIdResult.success) {
      throw new Error('Get lead by ID failed');
    }
  }

  // Test 4: Customer Management E2E
  async testCustomerManagementE2E() {
    // Create customer
    const customerData = {
      name: 'E2E Test Customer',
      email: 'customer@example.com',
      phone: '+91-9876543211',
      address: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      pincode: '12345',
      dateOfBirth: '1990-01-01',
      occupation: 'Software Engineer',
      income: 1000000,
      notes: 'E2E test customer'
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
  }

  // Test 5: ERP Financial Management E2E
  async testERPFinancialManagementE2E() {
    // Create transaction
    const transactionData = {
      type: 'INCOME',
      amount: 1000000,
      description: 'E2E test transaction',
      category: 'SALES',
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

    // Update transaction
    const updateData = { status: 'COMPLETED' };
    const updateResult = await this.makeRequest('PUT', `/erp/transactions/${transactionId}`, updateData, this.tokens.manager);
    if (!updateResult.success) {
      throw new Error('Transaction update failed');
    }
  }

  // Test 6: Payment Processing E2E
  async testPaymentProcessingE2E() {
    // Create payment order
    const paymentData = {
      amount: 100000,
      currency: 'INR',
      customerId: this.testData.customerId || 'test_customer',
      description: 'E2E test payment'
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

    // Get payment history
    const getHistoryResult = await this.makeRequest('GET', '/payments', null, this.tokens.agent);
    if (!getHistoryResult.success) {
      throw new Error('Get payment history failed');
    }
  }

  // Test 7: File Management E2E
  async testFileManagementE2E() {
    // Get file statistics
    const getStatsResult = await this.makeRequest('GET', '/files/stats/overview', null, this.tokens.agent);
    if (!getStatsResult.success) {
      throw new Error('Get file statistics failed');
    }

    // Get files by folder
    const getFilesResult = await this.makeRequest('GET', '/files/folder/properties', null, this.tokens.agent);
    if (!getFilesResult.success) {
      throw new Error('Get files by folder failed');
    }
  }

  // Test 8: Analytics E2E
  async testAnalyticsE2E() {
    // Get dashboard data
    const getDashboardResult = await this.makeRequest('GET', '/analytics/dashboard', null, this.tokens.manager);
    if (!getDashboardResult.success) {
      throw new Error('Get dashboard data failed');
    }

    // Get sales analytics
    const getSalesResult = await this.makeRequest('GET', '/analytics/sales', null, this.tokens.manager);
    if (!getSalesResult.success) {
      throw new Error('Get sales analytics failed');
    }

    // Get lead analytics
    const getLeadAnalyticsResult = await this.makeRequest('GET', '/analytics/leads', null, this.tokens.manager);
    if (!getLeadAnalyticsResult.success) {
      throw new Error('Get lead analytics failed');
    }

    // Get financial analytics
    const getFinancialResult = await this.makeRequest('GET', '/analytics/financial', null, this.tokens.manager);
    if (!getFinancialResult.success) {
      throw new Error('Get financial analytics failed');
    }
  }

  // Test 9: Notifications E2E
  async testNotificationsE2E() {
    // Get notifications
    const getNotificationsResult = await this.makeRequest('GET', '/notifications', null, this.tokens.agent);
    if (!getNotificationsResult.success) {
      throw new Error('Get notifications failed');
    }

    // Get unread count
    const getUnreadResult = await this.makeRequest('GET', '/notifications/unread-count', null, this.tokens.agent);
    if (!getUnreadResult.success) {
      throw new Error('Get unread count failed');
    }

    // Mark all as read
    const markAllReadResult = await this.makeRequest('PUT', '/notifications/read-all', null, this.tokens.agent);
    if (!markAllReadResult.success) {
      throw new Error('Mark all as read failed');
    }
  }

  // Test 10: Security E2E
  async testSecurityE2E() {
    // Test password validation
    const passwordData = { password: 'Test123!' };
    const validatePasswordResult = await this.makeRequest('POST', '/security/password/validate', passwordData);
    if (!validatePasswordResult.success) {
      throw new Error('Password validation failed');
    }

    // Get audit logs
    const getAuditLogsResult = await this.makeRequest('GET', '/security/audit-logs', null, this.tokens.admin);
    if (!getAuditLogsResult.success) {
      throw new Error('Get audit logs failed');
    }

    // Get active sessions
    const getSessionsResult = await this.makeRequest('GET', '/security/sessions', null, this.tokens.admin);
    if (!getSessionsResult.success) {
      throw new Error('Get active sessions failed');
    }
  }

  // Test 11: Monitoring E2E
  async testMonitoringE2E() {
    // Health check
    const healthResult = await this.makeRequest('GET', '/monitoring/health');
    if (!healthResult.success) {
      throw new Error('Health check failed');
    }

    // Get system status
    const statusResult = await this.makeRequest('GET', '/monitoring/status');
    if (!statusResult.success) {
      throw new Error('Get system status failed');
    }

    // Get metrics
    const metricsResult = await this.makeRequest('GET', '/monitoring/metrics', null, this.tokens.admin);
    if (!metricsResult.success) {
      throw new Error('Get metrics failed');
    }
  }

  // Test 12: Real-world Business Scenario
  async testRealWorldBusinessScenario() {
    console.log('\n🏢 Testing Real-world Business Scenario...');

    // Step 1: Create a property
    const propertyData = {
      name: 'Luxury Apartment in Downtown',
      type: 'APARTMENT',
      status: 'AVAILABLE',
      location: 'Downtown',
      address: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001',
      price: 5000000,
      area: 1200,
      bedrooms: 2,
      bathrooms: 2,
      amenities: ['Parking', 'Security', 'Gym'],
      description: 'Beautiful apartment in prime location'
    };

    const propertyResult = await this.makeRequest('POST', '/properties', propertyData, this.tokens.manager);
    if (!propertyResult.success) {
      throw new Error('Property creation failed in business scenario');
    }

    const propertyId = propertyResult.data.data.id;

    // Step 2: Create a customer
    const customerData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+91-9876543210',
      address: '456 Oak Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400002',
      income: 2000000,
      notes: 'Looking for apartment in downtown area'
    };

    const customerResult = await this.makeRequest('POST', '/crm/customers', customerData, this.tokens.agent);
    if (!customerResult.success) {
      throw new Error('Customer creation failed in business scenario');
    }

    const customerId = customerResult.data.data.id;

    // Step 3: Create a lead
    const leadData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+91-9876543210',
      source: 'WEBSITE',
      status: 'NEW',
      score: 80,
      budget: 6000000,
      preferredLocation: 'Downtown',
      notes: 'Interested in luxury apartment'
    };

    const leadResult = await this.makeRequest('POST', '/crm/leads', leadData, this.tokens.agent);
    if (!leadResult.success) {
      throw new Error('Lead creation failed in business scenario');
    }

    const leadId = leadResult.data.data.id;

    // Step 4: Update lead score
    const scoreData = { score: 90 };
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
      description: 'Apartment Sale - Downtown',
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

  // Run all E2E tests
  async runAllTests() {
    try {
      console.log('🚀 STARTING END-TO-END TESTING');
      console.log('================================');

      await this.setupTestData();

      await this.runTest('Authentication Flow', () => this.testAuthenticationFlow());
      await this.runTest('Property Management E2E', () => this.testPropertyManagementE2E());
      await this.runTest('CRM Lead Management E2E', () => this.testCRMLeadManagementE2E());
      await this.runTest('Customer Management E2E', () => this.testCustomerManagementE2E());
      await this.runTest('ERP Financial Management E2E', () => this.testERPFinancialManagementE2E());
      await this.runTest('Payment Processing E2E', () => this.testPaymentProcessingE2E());
      await this.runTest('File Management E2E', () => this.testFileManagementE2E());
      await this.runTest('Analytics E2E', () => this.testAnalyticsE2E());
      await this.runTest('Notifications E2E', () => this.testNotificationsE2E());
      await this.runTest('Security E2E', () => this.testSecurityE2E());
      await this.runTest('Monitoring E2E', () => this.testMonitoringE2E());
      await this.runTest('Real-world Business Scenario', () => this.testRealWorldBusinessScenario());

      // Print results
      console.log('\n📊 E2E TEST RESULTS SUMMARY');
      console.log('============================');
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
      fs.writeFileSync('e2e-test-results.json', JSON.stringify(this.results, null, 2));
      console.log('\n💾 E2E test results saved to e2e-test-results.json');

      process.exit(this.results.failed > 0 ? 1 : 0);

    } catch (error) {
      console.error('❌ Error running E2E tests:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const e2e = new E2ETesting();
  e2e.runAllTests();
}

module.exports = E2ETesting;
