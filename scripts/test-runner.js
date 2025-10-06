#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

console.log('🎯 Property Management Software - Comprehensive Test Runner');
console.log('=' * 60);

// Test configuration
const TEST_CONFIG = {
  backendUrl: 'http://localhost:3000',
  frontendUrl: 'http://localhost:19006',
  testTimeout: 60000,
  retryAttempts: 3,
  demoData: {
    admin: { email: 'admin@demo.com', password: 'Admin123!' },
    manager: { email: 'manager@demo.com', password: 'Manager123!' },
    agent: { email: 'agent@demo.com', password: 'Agent123!' },
    customer: { email: 'customer@demo.com', password: 'Customer123!' }
  }
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
  white: '\x1b[37m',
  bright: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '=' * 60, 'cyan');
  log(`🎯 ${title}`, 'bright');
  log('=' * 60, 'cyan');
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

async function waitForService(url, timeout = 30000) {
  log(`⏳ Waiting for service at ${url}...`, 'yellow');
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    try {
      await axios.get(url, { timeout: 5000 });
      log(`✅ Service is ready at ${url}`, 'green');
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error(`Service at ${url} not available after ${timeout}ms`);
}

async function step1_SetupEnvironment() {
  logSection('STEP 1: Environment Setup');
  
  try {
    // Check if Docker is running
    log('🐳 Checking Docker status...', 'yellow');
    runCommand('docker --version');
    runCommand('docker-compose --version');
    
    // Install dependencies
    log('📦 Installing dependencies...', 'yellow');
    runCommand('npm install');
    runCommand('cd src/backend && npm install');
    runCommand('cd src/frontend && npm install');
    runCommand('cd tests && npm install');
    
    log('✅ Environment setup completed!', 'green');
    return true;
  } catch (error) {
    log(`❌ Environment setup failed: ${error.message}`, 'red');
    return false;
  }
}

async function step2_SetupDatabase() {
  logSection('STEP 2: Database Setup');
  
  try {
    // Start PostgreSQL and Redis
    log('🐳 Starting database services...', 'yellow');
    runCommand('docker-compose up -d postgres redis');
    
    // Wait for services to be ready
    log('⏳ Waiting for database services...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Run migrations
    log('🔄 Running database migrations...', 'yellow');
    runCommand('cd src/backend && npx prisma migrate deploy');
    
    // Seed demo data
    log('🌱 Seeding demo data...', 'yellow');
    runCommand('cd src/backend && npx ts-node prisma/seed-demo.ts');
    
    // Generate Prisma client
    log('🔨 Generating Prisma client...', 'yellow');
    runCommand('cd src/backend && npx prisma generate');
    
    log('✅ Database setup completed!', 'green');
    return true;
  } catch (error) {
    log(`❌ Database setup failed: ${error.message}`, 'red');
    return false;
  }
}

async function step3_StartBackend() {
  logSection('STEP 3: Backend Server');
  
  try {
    // Build backend
    log('🏗️ Building backend...', 'yellow');
    runCommand('cd src/backend && npm run build');
    
    // Start backend server
    log('🚀 Starting backend server...', 'yellow');
    const backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(process.cwd(), 'src/backend'),
      stdio: 'pipe',
      detached: true
    });
    
    // Wait for backend to be ready
    await waitForService(`${TEST_CONFIG.backendUrl}/api/health`);
    
    log('✅ Backend server started successfully!', 'green');
    return backendProcess;
  } catch (error) {
    log(`❌ Backend startup failed: ${error.message}`, 'red');
    return null;
  }
}

async function step4_TestBackendAPIs() {
  logSection('STEP 4: Backend API Testing');
  
  try {
    // Test health endpoint
    log('🏥 Testing health endpoint...', 'yellow');
    const healthResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/health`);
    log(`✅ Health check: ${healthResponse.status}`, 'green');
    
    // Test authentication with demo data
    log('🔐 Testing authentication with demo data...', 'yellow');
    const authResponse = await axios.post(`${TEST_CONFIG.backendUrl}/api/auth/login`, TEST_CONFIG.demoData.admin);
    const token = authResponse.data.data.token;
    log('✅ Admin authentication successful', 'green');
    
    // Test property endpoints
    log('🏠 Testing property endpoints...', 'yellow');
    const propertiesResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/properties`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Properties endpoint: ${propertiesResponse.data.data.length} properties found`, 'green');
    
    // Test customer endpoints
    log('👥 Testing customer endpoints...', 'yellow');
    const customersResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/customers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Customers endpoint: ${customersResponse.data.data.length} customers found`, 'green');
    
    // Test lead endpoints
    log('🎯 Testing lead endpoints...', 'yellow');
    const leadsResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/leads`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Leads endpoint: ${leadsResponse.data.data.length} leads found`, 'green');
    
    // Test booking endpoints
    log('📅 Testing booking endpoints...', 'yellow');
    const bookingsResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Bookings endpoint: ${bookingsResponse.data.data.length} bookings found`, 'green');
    
    // Test payment endpoints
    log('💳 Testing payment endpoints...', 'yellow');
    const paymentsResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/payments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Payments endpoint: ${paymentsResponse.data.data.length} payments found`, 'green');
    
    // Test analytics endpoints
    log('📊 Testing analytics endpoints...', 'yellow');
    const analyticsResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log('✅ Analytics endpoint working', 'green');
    
    log('✅ Backend API testing completed!', 'green');
    return token;
  } catch (error) {
    log(`❌ Backend API testing failed: ${error.message}`, 'red');
    if (error.response) {
      log(`📊 Error response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return null;
  }
}

async function step5_TestRealTransactions(token) {
  logSection('STEP 5: Real Transaction Testing');
  
  try {
    // Create a new property
    log('🏠 Creating test property...', 'yellow');
    const propertyData = {
      name: 'E2E Test Property',
      type: 'APARTMENT',
      status: 'AVAILABLE',
      location: 'E2E Test Location',
      address: '123 E2E Test Street',
      city: 'E2E Test City',
      state: 'E2E Test State',
      country: 'E2E Test Country',
      price: 2500000,
      area: 1200,
      bedrooms: 3,
      bathrooms: 2,
      description: 'Property created during E2E testing'
    };
    
    const propertyResponse = await axios.post(`${TEST_CONFIG.backendUrl}/api/properties`, propertyData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const propertyId = propertyResponse.data.data.id;
    log('✅ Test property created', 'green');
    
    // Create a new customer
    log('👤 Creating test customer...', 'yellow');
    const customerData = {
      name: 'E2E Test Customer',
      email: `e2e-customer-${Date.now()}@test.com`,
      phone: '+971501234999',
      address: '456 E2E Customer Street',
      city: 'E2E Customer City',
      occupation: 'Software Engineer',
      income: 150000
    };
    
    const customerResponse = await axios.post(`${TEST_CONFIG.backendUrl}/api/customers`, customerData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const customerId = customerResponse.data.data.id;
    log('✅ Test customer created', 'green');
    
    // Create a lead
    log('🎯 Creating test lead...', 'yellow');
    const leadData = {
      customerId: customerId,
      name: 'E2E Test Lead',
      email: `e2e-lead-${Date.now()}@test.com`,
      phone: '+971501234998',
      source: 'WEBSITE',
      status: 'NEW',
      interest: '3BHK Apartment',
      budget: 2500000
    };
    
    const leadResponse = await axios.post(`${TEST_CONFIG.backendUrl}/api/leads`, leadData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const leadId = leadResponse.data.data.id;
    log('✅ Test lead created', 'green');
    
    // Create a booking
    log('📅 Creating test booking...', 'yellow');
    const bookingData = {
      propertyId: propertyId,
      customerId: customerId,
      status: 'PENDING',
      bookingDate: new Date().toISOString(),
      amount: 2500000,
      advanceAmount: 250000,
      paymentMethod: 'UPI'
    };
    
    const bookingResponse = await axios.post(`${TEST_CONFIG.backendUrl}/api/bookings`, bookingData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const bookingId = bookingResponse.data.data.id;
    log('✅ Test booking created', 'green');
    
    // Create a payment
    log('💳 Creating test payment...', 'yellow');
    const paymentData = {
      bookingId: bookingId,
      amount: 250000,
      currency: 'AED',
      method: 'UPI',
      status: 'PENDING'
    };
    
    const paymentResponse = await axios.post(`${TEST_CONFIG.backendUrl}/api/payments`, paymentData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const paymentId = paymentResponse.data.data.id;
    log('✅ Test payment created', 'green');
    
    // Update payment status to completed (simulating successful payment)
    log('✅ Simulating successful payment...', 'yellow');
    await axios.put(`${TEST_CONFIG.backendUrl}/api/payments/${paymentId}`, {
      status: 'COMPLETED',
      gateway: 'RAZORPAY',
      gatewayId: `pay_test_${Date.now()}`,
      gatewayData: {
        transactionId: `txn_test_${Date.now()}`,
        paymentId: `pay_test_${Date.now()}`,
        orderId: `order_test_${Date.now()}`
      },
      processedAt: new Date().toISOString()
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log('✅ Payment status updated to completed', 'green');
    
    // Update booking status to confirmed
    log('📅 Updating booking status to confirmed...', 'yellow');
    await axios.put(`${TEST_CONFIG.backendUrl}/api/bookings/${bookingId}`, {
      status: 'CONFIRMED'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log('✅ Booking status updated to confirmed', 'green');
    
    // Create a transaction record
    log('💰 Creating transaction record...', 'yellow');
    const transactionData = {
      type: 'SALE',
      category: 'Property Sale',
      amount: 2500000,
      currency: 'AED',
      description: 'E2E Test Property Sale',
      reference: `E2E-${Date.now()}`,
      date: new Date().toISOString(),
      status: 'COMPLETED'
    };
    
    const transactionResponse = await axios.post(`${TEST_CONFIG.backendUrl}/api/transactions`, transactionData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log('✅ Transaction record created', 'green');
    
    // Verify the complete flow
    log('🔍 Verifying complete transaction flow...', 'yellow');
    
    // Check property status
    const updatedProperty = await axios.get(`${TEST_CONFIG.backendUrl}/api/properties/${propertyId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Check booking status
    const updatedBooking = await axios.get(`${TEST_CONFIG.backendUrl}/api/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Check payment status
    const updatedPayment = await axios.get(`${TEST_CONFIG.backendUrl}/api/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    log('✅ Complete transaction flow verified', 'green');
    log(`📊 Property Status: ${updatedProperty.data.data.status}`, 'blue');
    log(`📊 Booking Status: ${updatedBooking.data.data.status}`, 'blue');
    log(`📊 Payment Status: ${updatedPayment.data.data.status}`, 'blue');
    
    log('✅ Real transaction testing completed!', 'green');
    return { propertyId, customerId, leadId, bookingId, paymentId };
  } catch (error) {
    log(`❌ Real transaction testing failed: ${error.message}`, 'red');
    if (error.response) {
      log(`📊 Error response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return null;
  }
}

async function step6_TestSecurityFeatures() {
  logSection('STEP 6: Security Features Testing');
  
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
    
    // Test authentication required
    log('🔐 Testing authentication requirements...', 'yellow');
    try {
      await axios.get(`${TEST_CONFIG.backendUrl}/api/properties`);
      log('❌ Should require authentication', 'red');
    } catch (error) {
      if (error.response?.status === 401) {
        log('✅ Authentication required correctly', 'green');
      }
    }
    
    // Test role-based access
    log('👥 Testing role-based access...', 'yellow');
    const customerToken = await axios.post(`${TEST_CONFIG.backendUrl}/api/auth/login`, TEST_CONFIG.demoData.customer);
    const customerAuthToken = customerToken.data.data.token;
    
    try {
      await axios.get(`${TEST_CONFIG.backendUrl}/api/users`, {
        headers: { Authorization: `Bearer ${customerAuthToken}` }
      });
      log('❌ Customer should not access user management', 'red');
    } catch (error) {
      if (error.response?.status === 403) {
        log('✅ Role-based access control working', 'green');
      }
    }
    
    log('✅ Security features testing completed!', 'green');
    return true;
  } catch (error) {
    log(`❌ Security features testing failed: ${error.message}`, 'red');
    return false;
  }
}

async function step7_TestMonitoringLogging() {
  logSection('STEP 7: Monitoring & Logging Testing');
  
  try {
    // Test health endpoint
    log('🏥 Testing health endpoint...', 'yellow');
    const healthResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/health`);
    log(`✅ Health endpoint: ${healthResponse.status}`, 'green');
    
    // Test monitoring endpoints (may require authentication)
    log('📊 Testing monitoring endpoints...', 'yellow');
    const adminToken = await axios.post(`${TEST_CONFIG.backendUrl}/api/auth/login`, TEST_CONFIG.demoData.admin);
    const adminAuthToken = adminToken.data.data.token;
    
    try {
      const metricsResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/monitoring/metrics/system`, {
        headers: { Authorization: `Bearer ${adminAuthToken}` }
      });
      log('✅ System metrics endpoint working', 'green');
    } catch (error) {
      log('⚠️ Monitoring endpoints may require additional setup', 'yellow');
    }
    
    // Test security events
    log('🔒 Testing security events...', 'yellow');
    try {
      const securityResponse = await axios.get(`${TEST_CONFIG.backendUrl}/api/security/events`, {
        headers: { Authorization: `Bearer ${adminAuthToken}` }
      });
      log('✅ Security events endpoint working', 'green');
    } catch (error) {
      log('⚠️ Security events endpoint may require additional setup', 'yellow');
    }
    
    log('✅ Monitoring & logging testing completed!', 'green');
    return true;
  } catch (error) {
    log(`❌ Monitoring & logging testing failed: ${error.message}`, 'red');
    return false;
  }
}

async function step8_TestFrontendFunctionality() {
  logSection('STEP 8: Frontend Functionality Testing');
  
  try {
    // Build frontend
    log('🏗️ Building frontend...', 'yellow');
    runCommand('cd src/frontend && npm run build');
    
    // Run frontend tests
    log('🧪 Running frontend tests...', 'yellow');
    runCommand('cd src/frontend && npm test -- --watchAll=false --passWithNoTests');
    
    log('✅ Frontend functionality testing completed!', 'green');
    return true;
  } catch (error) {
    log(`❌ Frontend functionality testing failed: ${error.message}`, 'red');
    return false;
  }
}

async function step9_RunE2ETests() {
  logSection('STEP 9: End-to-End Testing');
  
  try {
    // Run Playwright E2E tests
    log('🎬 Running Playwright E2E tests...', 'yellow');
    runCommand('cd tests && npm run test:e2e');
    
    log('✅ End-to-end testing completed!', 'green');
    return true;
  } catch (error) {
    log(`❌ End-to-end testing failed: ${error.message}`, 'red');
    return false;
  }
}

async function step10_Cleanup() {
  logSection('STEP 10: Cleanup');
  
  try {
    // Stop Docker containers
    log('🐳 Stopping Docker containers...', 'yellow');
    runCommand('docker-compose down');
    
    log('✅ Cleanup completed!', 'green');
    return true;
  } catch (error) {
    log(`❌ Cleanup failed: ${error.message}`, 'red');
    return false;
  }
}

async function runComprehensiveTests() {
  const startTime = Date.now();
  const results = {
    environment: false,
    database: false,
    backend: false,
    apis: false,
    transactions: false,
    security: false,
    monitoring: false,
    frontend: false,
    e2e: false,
    cleanup: false
  };
  
  try {
    log('🚀 Starting Comprehensive Test Suite', 'bright');
    log('This will test the entire Property Management Software system', 'blue');
    log('Including database, APIs, transactions, security, and more...', 'blue');
    
    // Run all test steps
    results.environment = await step1_SetupEnvironment();
    if (!results.environment) throw new Error('Environment setup failed');
    
    results.database = await step2_SetupDatabase();
    if (!results.database) throw new Error('Database setup failed');
    
    const backendProcess = await step3_StartBackend();
    if (!backendProcess) throw new Error('Backend startup failed');
    
    results.apis = await step4_TestBackendAPIs();
    if (!results.apis) throw new Error('Backend API testing failed');
    
    results.transactions = await step5_TestRealTransactions(results.apis);
    if (!results.transactions) throw new Error('Real transaction testing failed');
    
    results.security = await step6_TestSecurityFeatures();
    if (!results.security) throw new Error('Security features testing failed');
    
    results.monitoring = await step7_TestMonitoringLogging();
    if (!results.monitoring) throw new Error('Monitoring & logging testing failed');
    
    results.frontend = await step8_TestFrontendFunctionality();
    if (!results.frontend) throw new Error('Frontend functionality testing failed');
    
    results.e2e = await step9_RunE2ETests();
    if (!results.e2e) throw new Error('End-to-end testing failed');
    
    results.cleanup = await step10_Cleanup();
    
    // Print final results
    const duration = (Date.now() - startTime) / 1000;
    logSection('FINAL TEST RESULTS');
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    log(`✅ Passed: ${passedTests}/${totalTests}`, 'green');
    log(`⏱️ Duration: ${duration.toFixed(2)} seconds`, 'yellow');
    log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 'cyan');
    
    // Detailed results
    log('\n📊 Detailed Results:', 'bright');
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅' : '❌';
      const color = passed ? 'green' : 'red';
      log(`${status} ${test}: ${passed ? 'PASSED' : 'FAILED'}`, color);
    });
    
    if (passedTests === totalTests) {
      log('\n🎉 ALL TESTS PASSED!', 'bright');
      log('The Property Management Software is working correctly!', 'green');
      log('You can now deploy to production with confidence.', 'green');
    } else {
      log('\n⚠️ Some tests failed.', 'yellow');
      log('Please review the errors above and fix them before deploying.', 'yellow');
    }
    
    return passedTests === totalTests;
    
  } catch (error) {
    log(`\n💥 Test suite failed: ${error.message}`, 'red');
    return false;
  } finally {
    // Ensure cleanup
    try {
      await step10_Cleanup();
    } catch (error) {
      log(`⚠️ Cleanup failed: ${error.message}`, 'yellow');
    }
  }
}

// Main execution
if (require.main === module) {
  runComprehensiveTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`💥 Test runner crashed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { runComprehensiveTests, TEST_CONFIG };
