#!/usr/bin/env node

/**
 * API Test Script
 * Comprehensive API testing for Property Management Software
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const TEST_TOKENS_FILE = 'test-tokens.json';

// Load test tokens
let testTokens = {};
try {
  testTokens = JSON.parse(fs.readFileSync(TEST_TOKENS_FILE, 'utf8'));
} catch (error) {
  console.error('❌ Test tokens file not found. Run test-setup.js first.');
  process.exit(1);
}

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
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

// Test function
async function runTest(testName, testFunction) {
  testResults.total++;
  console.log(`\n🧪 Running: ${testName}`);
  
  try {
    await testFunction();
    testResults.passed++;
    testResults.details.push({ name: testName, status: 'PASSED' });
    console.log(`✅ PASSED: ${testName}`);
  } catch (error) {
    testResults.failed++;
    testResults.details.push({ name: testName, status: 'FAILED', error: error.message });
    console.log(`❌ FAILED: ${testName} - ${error.message}`);
  }
}

// Authentication Tests
async function testAuthentication() {
  // Test user registration
  const registerData = {
    email: 'test@example.com',
    password: 'Test123!',
    name: 'Test User',
    role: 'CUSTOMER'
  };

  const registerResult = await apiCall('POST', '/auth/register', registerData);
  if (!registerResult.success) {
    throw new Error('User registration failed');
  }

  // Test user login
  const loginData = {
    email: 'admin@property.com',
    password: 'Admin123!'
  };

  const loginResult = await apiCall('POST', '/auth/login', loginData);
  if (!loginResult.success) {
    throw new Error('User login failed');
  }

  // Test token validation
  const token = loginResult.data.token;
  const validateResult = await apiCall('GET', '/auth/me', null, token);
  if (!validateResult.success) {
    throw new Error('Token validation failed');
  }
}

// Property Management Tests
async function testPropertyManagement() {
  const token = testTokens['admin@property.com'];
  
  // Test create property
  const propertyData = {
    name: 'Test Property',
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
    description: 'Test property description'
  };

  const createResult = await apiCall('POST', '/properties', propertyData, token);
  if (!createResult.success) {
    throw new Error('Property creation failed');
  }

  const propertyId = createResult.data.data.id;

  // Test get properties
  const getResult = await apiCall('GET', '/properties', null, token);
  if (!getResult.success) {
    throw new Error('Get properties failed');
  }

  // Test get property by ID
  const getByIdResult = await apiCall('GET', `/properties/${propertyId}`, null, token);
  if (!getByIdResult.success) {
    throw new Error('Get property by ID failed');
  }

  // Test update property
  const updateData = { name: 'Updated Test Property' };
  const updateResult = await apiCall('PUT', `/properties/${propertyId}`, updateData, token);
  if (!updateResult.success) {
    throw new Error('Property update failed');
  }

  // Test delete property
  const deleteResult = await apiCall('DELETE', `/properties/${propertyId}`, null, token);
  if (!deleteResult.success) {
    throw new Error('Property deletion failed');
  }
}

// CRM Tests
async function testCRM() {
  const token = testTokens['agent@property.com'];

  // Test create lead
  const leadData = {
    name: 'Test Lead',
    email: 'lead@example.com',
    phone: '+91-9876543210',
    source: 'WEBSITE',
    status: 'NEW',
    score: 80,
    budget: 2000000,
    preferredLocation: 'Test City',
    notes: 'Test lead notes'
  };

  const createLeadResult = await apiCall('POST', '/crm/leads', leadData, token);
  if (!createLeadResult.success) {
    throw new Error('Lead creation failed');
  }

  const leadId = createLeadResult.data.data.id;

  // Test get leads
  const getLeadsResult = await apiCall('GET', '/crm/leads', null, token);
  if (!getLeadsResult.success) {
    throw new Error('Get leads failed');
  }

  // Test update lead score
  const scoreData = { score: 85 };
  const updateScoreResult = await apiCall('POST', `/crm/leads/${leadId}/score`, scoreData, token);
  if (!updateScoreResult.success) {
    throw new Error('Lead score update failed');
  }

  // Test get customers
  const getCustomersResult = await apiCall('GET', '/crm/customers', null, token);
  if (!getCustomersResult.success) {
    throw new Error('Get customers failed');
  }
}

// ERP Tests
async function testERP() {
  const token = testTokens['manager@property.com'];

  // Test create transaction
  const transactionData = {
    type: 'INCOME',
    amount: 1000000,
    description: 'Test transaction',
    category: 'SALES',
    status: 'COMPLETED'
  };

  const createTransactionResult = await apiCall('POST', '/erp/transactions', transactionData, token);
  if (!createTransactionResult.success) {
    throw new Error('Transaction creation failed');
  }

  // Test get transactions
  const getTransactionsResult = await apiCall('GET', '/erp/transactions', null, token);
  if (!getTransactionsResult.success) {
    throw new Error('Get transactions failed');
  }

  // Test get financial summary
  const getFinancialResult = await apiCall('GET', '/erp/financials', null, token);
  if (!getFinancialResult.success) {
    throw new Error('Get financial summary failed');
  }
}

// Notifications Tests
async function testNotifications() {
  const token = testTokens['admin@property.com'];

  // Test get notifications
  const getNotificationsResult = await apiCall('GET', '/notifications', null, token);
  if (!getNotificationsResult.success) {
    throw new Error('Get notifications failed');
  }

  // Test get unread count
  const getUnreadResult = await apiCall('GET', '/notifications/unread-count', null, token);
  if (!getUnreadResult.success) {
    throw new Error('Get unread count failed');
  }
}

// Analytics Tests
async function testAnalytics() {
  const token = testTokens['manager@property.com'];

  // Test get dashboard data
  const getDashboardResult = await apiCall('GET', '/analytics/dashboard', null, token);
  if (!getDashboardResult.success) {
    throw new Error('Get dashboard data failed');
  }

  // Test get sales analytics
  const getSalesResult = await apiCall('GET', '/analytics/sales', null, token);
  if (!getSalesResult.success) {
    throw new Error('Get sales analytics failed');
  }

  // Test get lead analytics
  const getLeadAnalyticsResult = await apiCall('GET', '/analytics/leads', null, token);
  if (!getLeadAnalyticsResult.success) {
    throw new Error('Get lead analytics failed');
  }
}

// Security Tests
async function testSecurity() {
  const token = testTokens['admin@property.com'];

  // Test password validation
  const passwordData = { password: 'Test123!' };
  const validatePasswordResult = await apiCall('POST', '/security/password/validate', passwordData);
  if (!validatePasswordResult.success) {
    throw new Error('Password validation failed');
  }

  // Test get audit logs
  const getAuditLogsResult = await apiCall('GET', '/security/audit-logs', null, token);
  if (!getAuditLogsResult.success) {
    throw new Error('Get audit logs failed');
  }

  // Test get active sessions
  const getSessionsResult = await apiCall('GET', '/security/sessions', null, token);
  if (!getSessionsResult.success) {
    throw new Error('Get active sessions failed');
  }
}

// File Management Tests
async function testFileManagement() {
  const token = testTokens['agent@property.com'];

  // Test get file statistics
  const getStatsResult = await apiCall('GET', '/files/stats/overview', null, token);
  if (!getStatsResult.success) {
    throw new Error('Get file statistics failed');
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting API Tests...');
  console.log(`📍 Testing against: ${BASE_URL}`);

  // Authentication tests
  await runTest('Authentication - User Registration & Login', testAuthentication);

  // Property management tests
  await runTest('Property Management - CRUD Operations', testPropertyManagement);

  // CRM tests
  await runTest('CRM - Lead Management', testCRM);

  // ERP tests
  await runTest('ERP - Financial Management', testERP);

  // Notifications tests
  await runTest('Notifications - User Notifications', testNotifications);

  // Analytics tests
  await runTest('Analytics - Business Intelligence', testAnalytics);

  // Security tests
  await runTest('Security - Authentication & Authorization', testSecurity);

  // File management tests
  await runTest('File Management - File Operations', testFileManagement);

  // Print results
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Total: ${testResults.total}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.details
      .filter(test => test.status === 'FAILED')
      .forEach(test => {
        console.log(`- ${test.name}: ${test.error}`);
      });
  }

  // Save results to file
  fs.writeFileSync('test-results.json', JSON.stringify(testResults, null, 2));
  console.log('\n💾 Test results saved to test-results.json');

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
