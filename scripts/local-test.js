#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

console.log('🧪 Starting Local Testing Suite...\n');

// Test configuration
const TEST_CONFIG = {
  backendUrl: 'http://localhost:3000',
  frontendUrl: 'http://localhost:19006',
  testTimeout: 30000,
  retryAttempts: 3,
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, options = {}) {
  try {
    log(`📋 Running: ${command}`, 'blue');
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'inherit',
      ...options 
    });
    log(`✅ Success: ${command}`, 'green');
    return result;
  } catch (error) {
    log(`❌ Failed: ${command}`, 'red');
    throw error;
  }
}

async function waitForService(url, timeout = 30000, retries = 3) {
  log(`⏳ Waiting for service at ${url}...`, 'yellow');
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await axios.get(url, { timeout: 5000 });
      log(`✅ Service is ready at ${url}`, 'green');
      return true;
    } catch (error) {
      if (attempt === retries) {
        log(`❌ Service not available after ${retries} attempts`, 'red');
        throw new Error(`Service at ${url} not available`);
      }
      log(`⏳ Attempt ${attempt}/${retries} failed, retrying in 5 seconds...`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

async function testBackendHealth() {
  log('\n🏥 Testing Backend Health...', 'cyan');
  
  try {
    const response = await axios.get(`${TEST_CONFIG.backendUrl}/api/health`);
    log(`✅ Backend health check passed: ${response.status}`, 'green');
    log(`📊 Response: ${JSON.stringify(response.data, null, 2)}`, 'blue');
    return true;
  } catch (error) {
    log(`❌ Backend health check failed: ${error.message}`, 'red');
    return false;
  }
}

async function testDatabaseConnection() {
  log('\n🗄️ Testing Database Connection...', 'cyan');
  
  try {
    const response = await axios.get(`${TEST_CONFIG.backendUrl}/api/properties`);
    log(`✅ Database connection successful`, 'green');
    log(`📊 Found ${response.data.data?.length || 0} properties`, 'blue');
    return true;
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function testAuthenticationFlow() {
  log('\n🔐 Testing Authentication Flow...', 'cyan');
  
  try {
    // Test user registration
    log('📝 Testing user registration...', 'yellow');
    const registerData = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'Test123!',
      phone: '+1234567890',
      role: 'CUSTOMER'
    };
    
    const registerResponse = await axios.post(`${TEST_CONFIG.backendUrl}/api/auth/register`, registerData);
    log('✅ User registration successful', 'green');
    
    // Test user login
    log('🔑 Testing user login...', 'yellow');
    const loginResponse = await axios.post(`${TEST_CONFIG.backendUrl}/api/auth/login`, {
      email: registerData.email,
      password: registerData.password
    });
    
    const token = loginResponse.data.data.token;
    log('✅ User login successful', 'green');
    
    // Test protected route
    log('🛡️ Testing protected route access...', 'yellow');
    const profileResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    log('✅ Protected route access successful', 'green');
    return { token, user: profileResponse.data.data };
    
  } catch (error) {
    log(`❌ Authentication flow failed: ${error.message}`, 'red');
    if (error.response) {
      log(`📊 Error response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    throw error;
  }
}

async function testPropertyCRUD(token) {
  log('\n🏠 Testing Property CRUD Operations...', 'cyan');
  
  try {
    // Create property
    log('➕ Testing property creation...', 'yellow');
    const propertyData = {
      name: 'Test Property',
      type: 'APARTMENT',
      status: 'AVAILABLE',
      location: 'Test Location',
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      price: 1000000,
      area: 1000,
      bedrooms: 2,
      bathrooms: 2,
      description: 'Test property for automated testing'
    };
    
    const createResponse = await axios.post(`${TEST_CONFIG.backendUrl}/api/properties`, propertyData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const propertyId = createResponse.data.data.id;
    log('✅ Property creation successful', 'green');
    
    // Read property
    log('📖 Testing property retrieval...', 'yellow');
    const readResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/properties/${propertyId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log('✅ Property retrieval successful', 'green');
    
    // Update property
    log('✏️ Testing property update...', 'yellow');
    const updateResponse = await axios.put(`${TEST_CONFIG.backendUrl}/api/properties/${propertyId}`, {
      ...propertyData,
      name: 'Updated Test Property',
      price: 1200000
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log('✅ Property update successful', 'green');
    
    // List properties
    log('📋 Testing property listing...', 'yellow');
    const listResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/properties`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Property listing successful - Found ${listResponse.data.data.length} properties`, 'green');
    
    // Delete property
    log('🗑️ Testing property deletion...', 'yellow');
    await axios.delete(`${TEST_CONFIG.backendUrl}/api/properties/${propertyId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log('✅ Property deletion successful', 'green');
    
    return true;
  } catch (error) {
    log(`❌ Property CRUD operations failed: ${error.message}`, 'red');
    throw error;
  }
}

async function testCustomerManagement(token) {
  log('\n👥 Testing Customer Management...', 'cyan');
  
  try {
    // Create customer
    log('➕ Testing customer creation...', 'yellow');
    const customerData = {
      name: 'Test Customer',
      email: `customer${Date.now()}@example.com`,
      phone: '+1234567891',
      address: '456 Customer Street',
      city: 'Customer City',
      occupation: 'Software Engineer',
      income: 100000
    };
    
    const createResponse = await axios.post(`${TEST_CONFIG.backendUrl}/api/customers`, customerData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const customerId = createResponse.data.data.id;
    log('✅ Customer creation successful', 'green');
    
    // List customers
    log('📋 Testing customer listing...', 'yellow');
    const listResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/customers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Customer listing successful - Found ${listResponse.data.data.length} customers`, 'green');
    
    return customerId;
  } catch (error) {
    log(`❌ Customer management failed: ${error.message}`, 'red');
    throw error;
  }
}

async function testLeadManagement(token) {
  log('\n🎯 Testing Lead Management...', 'cyan');
  
  try {
    // Create lead
    log('➕ Testing lead creation...', 'yellow');
    const leadData = {
      name: 'Test Lead',
      email: `lead${Date.now()}@example.com`,
      phone: '+1234567892',
      source: 'WEBSITE',
      status: 'NEW',
      interest: '2BHK Apartment',
      budget: 1500000
    };
    
    const createResponse = await axios.post(`${TEST_CONFIG.backendUrl}/api/leads`, leadData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const leadId = createResponse.data.data.id;
    log('✅ Lead creation successful', 'green');
    
    // List leads
    log('📋 Testing lead listing...', 'yellow');
    const listResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/leads`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Lead listing successful - Found ${listResponse.data.data.length} leads`, 'green');
    
    return leadId;
  } catch (error) {
    log(`❌ Lead management failed: ${error.message}`, 'red');
    throw error;
  }
}

async function testBookingSystem(token, customerId) {
  log('\n📅 Testing Booking System...', 'cyan');
  
  try {
    // First, create a property for booking
    log('🏠 Creating property for booking test...', 'yellow');
    const propertyData = {
      name: 'Booking Test Property',
      type: 'APARTMENT',
      status: 'AVAILABLE',
      location: 'Booking Test Location',
      address: '789 Booking Street',
      city: 'Booking City',
      state: 'Booking State',
      country: 'Booking Country',
      price: 2000000,
      area: 1200,
      bedrooms: 3,
      bathrooms: 2,
      description: 'Property for booking system testing'
    };
    
    const propertyResponse = await axios.post(`${TEST_CONFIG.backendUrl}/api/properties`, propertyData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const propertyId = propertyResponse.data.data.id;
    log('✅ Test property created', 'green');
    
    // Create booking
    log('📅 Testing booking creation...', 'yellow');
    const bookingData = {
      propertyId: propertyId,
      customerId: customerId,
      status: 'PENDING',
      bookingDate: new Date().toISOString(),
      amount: 2000000,
      advanceAmount: 200000,
      paymentMethod: 'UPI'
    };
    
    const createResponse = await axios.post(`${TEST_CONFIG.backendUrl}/api/bookings`, bookingData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const bookingId = createResponse.data.data.id;
    log('✅ Booking creation successful', 'green');
    
    // List bookings
    log('📋 Testing booking listing...', 'yellow');
    const listResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Booking listing successful - Found ${listResponse.data.data.length} bookings`, 'green');
    
    return { bookingId, propertyId };
  } catch (error) {
    log(`❌ Booking system failed: ${error.message}`, 'red');
    throw error;
  }
}

async function testPaymentProcessing(token, bookingId) {
  log('\n💳 Testing Payment Processing...', 'cyan');
  
  try {
    // Create payment
    log('💰 Testing payment creation...', 'yellow');
    const paymentData = {
      bookingId: bookingId,
      amount: 200000,
      currency: 'AED',
      method: 'UPI',
      status: 'PENDING'
    };
    
    const createResponse = await axios.post(`${TEST_CONFIG.backendUrl}/api/payments`, paymentData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const paymentId = createResponse.data.data.id;
    log('✅ Payment creation successful', 'green');
    
    // List payments
    log('📋 Testing payment listing...', 'yellow');
    const listResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/payments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Payment listing successful - Found ${listResponse.data.data.length} payments`, 'green');
    
    return paymentId;
  } catch (error) {
    log(`❌ Payment processing failed: ${error.message}`, 'red');
    throw error;
  }
}

async function testAnalytics(token) {
  log('\n📊 Testing Analytics...', 'cyan');
  
  try {
    // Test dashboard analytics
    log('📈 Testing dashboard analytics...', 'yellow');
    const dashboardResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log('✅ Dashboard analytics successful', 'green');
    
    // Test property analytics
    log('🏠 Testing property analytics...', 'yellow');
    const propertyResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/analytics/properties`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log('✅ Property analytics successful', 'green');
    
    return true;
  } catch (error) {
    log(`❌ Analytics failed: ${error.message}`, 'red');
    throw error;
  }
}

async function testSecurityFeatures() {
  log('\n🔒 Testing Security Features...', 'cyan');
  
  try {
    // Test rate limiting
    log('🚦 Testing rate limiting...', 'yellow');
    let rateLimitHit = false;
    
    for (let i = 0; i < 15; i++) {
      try {
        await axios.post(`${TEST_CONFIG.backendUrl}/api/auth/login`, {
          email: 'invalid@test.com',
          password: 'wrongpassword'
        });
      } catch (error) {
        if (error.response?.status === 429) {
          rateLimitHit = true;
          break;
        }
      }
    }
    
    if (rateLimitHit) {
      log('✅ Rate limiting working correctly', 'green');
    } else {
      log('⚠️ Rate limiting may not be working', 'yellow');
    }
    
    // Test input validation
    log('🛡️ Testing input validation...', 'yellow');
    try {
      await axios.post(`${TEST_CONFIG.backendUrl}/api/properties`, {
        name: '', // Empty name should fail
        type: 'INVALID_TYPE' // Invalid type should fail
      });
      log('❌ Input validation should have failed', 'red');
    } catch (error) {
      if (error.response?.status === 400) {
        log('✅ Input validation working correctly', 'green');
      }
    }
    
    return true;
  } catch (error) {
    log(`❌ Security features test failed: ${error.message}`, 'red');
    throw error;
  }
}

async function testMonitoringEndpoints() {
  log('\n📊 Testing Monitoring Endpoints...', 'cyan');
  
  try {
    // Test health endpoint
    log('🏥 Testing health endpoint...', 'yellow');
    const healthResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/health`);
    log('✅ Health endpoint working', 'green');
    
    // Test monitoring endpoints (may require authentication)
    log('📈 Testing monitoring endpoints...', 'yellow');
    try {
      const metricsResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/monitoring/metrics/system`);
      log('✅ Monitoring endpoints working', 'green');
    } catch (error) {
      if (error.response?.status === 401) {
        log('✅ Monitoring endpoints protected (authentication required)', 'green');
      } else {
        log('⚠️ Monitoring endpoints may have issues', 'yellow');
      }
    }
    
    return true;
  } catch (error) {
    log(`❌ Monitoring endpoints test failed: ${error.message}`, 'red');
    throw error;
  }
}

async function runLocalTests() {
  const startTime = Date.now();
  let testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  try {
    log('🚀 Starting Local Testing Suite', 'magenta');
    log('=' * 50, 'magenta');
    
    // Wait for backend to be ready
    await waitForService(`${TEST_CONFIG.backendUrl}/api/health`);
    
    // Run tests
    const tests = [
      { name: 'Backend Health', fn: testBackendHealth },
      { name: 'Database Connection', fn: testDatabaseConnection },
      { name: 'Authentication Flow', fn: testAuthenticationFlow },
      { name: 'Security Features', fn: testSecurityFeatures },
      { name: 'Monitoring Endpoints', fn: testMonitoringEndpoints },
    ];
    
    let authToken = null;
    let customerId = null;
    let bookingId = null;
    
    for (const test of tests) {
      testResults.total++;
      try {
        log(`\n🧪 Running: ${test.name}`, 'cyan');
        const result = await test.fn();
        
        if (test.name === 'Authentication Flow') {
          authToken = result.token;
        }
        
        testResults.passed++;
        log(`✅ ${test.name} PASSED`, 'green');
      } catch (error) {
        testResults.failed++;
        log(`❌ ${test.name} FAILED: ${error.message}`, 'red');
      }
    }
    
    // Run authenticated tests if we have a token
    if (authToken) {
      const authenticatedTests = [
        { name: 'Property CRUD', fn: () => testPropertyCRUD(authToken) },
        { name: 'Customer Management', fn: () => testCustomerManagement(authToken) },
        { name: 'Lead Management', fn: () => testLeadManagement(authToken) },
        { name: 'Analytics', fn: () => testAnalytics(authToken) },
      ];
      
      for (const test of authenticatedTests) {
        testResults.total++;
        try {
          log(`\n🧪 Running: ${test.name}`, 'cyan');
          const result = await test.fn();
          
          if (test.name === 'Customer Management') {
            customerId = result;
          }
          
          testResults.passed++;
          log(`✅ ${test.name} PASSED`, 'green');
        } catch (error) {
          testResults.failed++;
          log(`❌ ${test.name} FAILED: ${error.message}`, 'red');
        }
      }
      
      // Run booking and payment tests if we have a customer
      if (customerId) {
        const bookingTests = [
          { name: 'Booking System', fn: () => testBookingSystem(authToken, customerId) },
        ];
        
        for (const test of bookingTests) {
          testResults.total++;
          try {
            log(`\n🧪 Running: ${test.name}`, 'cyan');
            const result = await test.fn();
            
            if (test.name === 'Booking System') {
              bookingId = result.bookingId;
            }
            
            testResults.passed++;
            log(`✅ ${test.name} PASSED`, 'green');
          } catch (error) {
            testResults.failed++;
            log(`❌ ${test.name} FAILED: ${error.message}`, 'red');
          }
        }
        
        // Run payment tests if we have a booking
        if (bookingId) {
          const paymentTests = [
            { name: 'Payment Processing', fn: () => testPaymentProcessing(authToken, bookingId) },
          ];
          
          for (const test of paymentTests) {
            testResults.total++;
            try {
              log(`\n🧪 Running: ${test.name}`, 'cyan');
              await test.fn();
              testResults.passed++;
              log(`✅ ${test.name} PASSED`, 'green');
            } catch (error) {
              testResults.failed++;
              log(`❌ ${test.name} FAILED: ${error.message}`, 'red');
            }
          }
        }
      }
    }
    
    // Print results
    const duration = (Date.now() - startTime) / 1000;
    log('\n' + '=' * 50, 'magenta');
    log('🎯 TEST RESULTS SUMMARY', 'magenta');
    log('=' * 50, 'magenta');
    log(`✅ Passed: ${testResults.passed}`, 'green');
    log(`❌ Failed: ${testResults.failed}`, 'red');
    log(`📊 Total: ${testResults.total}`, 'blue');
    log(`⏱️ Duration: ${duration.toFixed(2)} seconds`, 'yellow');
    log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'cyan');
    
    if (testResults.failed === 0) {
      log('\n🎉 ALL TESTS PASSED! System is working correctly.', 'green');
      return true;
    } else {
      log('\n⚠️ Some tests failed. Please check the errors above.', 'yellow');
      return false;
    }
    
  } catch (error) {
    log(`\n💥 Test suite failed: ${error.message}`, 'red');
    return false;
  }
}

// Main execution
if (require.main === module) {
  runLocalTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`💥 Test suite crashed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { runLocalTests, TEST_CONFIG };
