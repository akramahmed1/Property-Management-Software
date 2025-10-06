#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Property Management Software - Setup and Test');
console.log('=' * 60);

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
    log(`Error: ${error.message}`, 'red');
    throw error;
  }
}

async function step1_CheckPrerequisites() {
  log('\n🔍 Step 1: Checking Prerequisites', 'cyan');
  
  try {
    // Check Node.js version
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    log(`✅ Node.js version: ${nodeVersion}`, 'green');
    
    // Check npm version
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    log(`✅ npm version: ${npmVersion}`, 'green');
    
    // Check if Docker is available
    try {
      const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
      log(`✅ Docker version: ${dockerVersion}`, 'green');
    } catch (error) {
      log(`⚠️ Docker not available: ${error.message}`, 'yellow');
      log('Please install Docker Desktop and start it before continuing', 'yellow');
    }
    
    return true;
  } catch (error) {
    log(`❌ Prerequisites check failed: ${error.message}`, 'red');
    return false;
  }
}

async function step2_InstallDependencies() {
  log('\n📦 Step 2: Installing Dependencies', 'cyan');
  
  try {
    // Install root dependencies
    log('Installing root dependencies...', 'yellow');
    runCommand('npm install');
    
    // Install backend dependencies
    log('Installing backend dependencies...', 'yellow');
    runCommand('cd src/backend && npm install');
    
    // Install frontend dependencies
    log('Installing frontend dependencies...', 'yellow');
    runCommand('cd src/frontend && npm install');
    
    // Install test dependencies (with legacy peer deps to avoid conflicts)
    log('Installing test dependencies...', 'yellow');
    runCommand('cd tests && npm install --legacy-peer-deps');
    
    log('✅ All dependencies installed successfully!', 'green');
    return true;
  } catch (error) {
    log(`❌ Dependency installation failed: ${error.message}`, 'red');
    return false;
  }
}

async function step3_SetupDatabase() {
  log('\n🗄️ Step 3: Setting up Database', 'cyan');
  
  try {
    // Check if Docker is running
    try {
      execSync('docker ps', { stdio: 'pipe' });
    } catch (error) {
      log('⚠️ Docker is not running. Please start Docker Desktop first.', 'yellow');
      log('Then run: docker-compose up -d postgres redis', 'yellow');
      return false;
    }
    
    // Start database services
    log('Starting database services...', 'yellow');
    runCommand('docker-compose up -d postgres redis');
    
    // Wait for services to be ready
    log('Waiting for database services to be ready...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Generate Prisma client
    log('Generating Prisma client...', 'yellow');
    runCommand('cd src/backend && npx prisma generate');
    
    // Run migrations
    log('Running database migrations...', 'yellow');
    runCommand('cd src/backend && npx prisma migrate deploy');
    
    log('✅ Database setup completed!', 'green');
    return true;
  } catch (error) {
    log(`❌ Database setup failed: ${error.message}`, 'red');
    return false;
  }
}

async function step4_SeedDemoData() {
  log('\n🌱 Step 4: Seeding Demo Data', 'cyan');
  
  try {
    // Create a simple seed script that doesn't rely on complex imports
    const simpleSeedScript = `
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting simple demo data seeding...');

  try {
    // Clear existing data
    await prisma.user.deleteMany();
    await prisma.property.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.notification.deleteMany();

    // Create demo users
    const admin = await prisma.user.create({
      data: {
        email: 'admin@demo.com',
        password: await bcrypt.hash('Admin123!', 12),
        name: 'Demo Admin',
        phone: '+971501234567',
        role: 'SUPER_ADMIN',
        isEmailVerified: true,
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: { email: true, push: true, sms: false },
        },
      },
    });

    const agent = await prisma.user.create({
      data: {
        email: 'agent@demo.com',
        password: await bcrypt.hash('Agent123!', 12),
        name: 'Demo Agent',
        phone: '+971501234569',
        role: 'AGENT',
        isEmailVerified: true,
        preferences: {
          theme: 'dark',
          language: 'ar',
          notifications: { email: true, push: true, sms: false },
        },
      },
    });

    const customer = await prisma.user.create({
      data: {
        email: 'customer@demo.com',
        password: await bcrypt.hash('Customer123!', 12),
        name: 'Demo Customer',
        phone: '+971501234570',
        role: 'CUSTOMER',
        isEmailVerified: true,
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: { email: true, push: false, sms: false },
        },
      },
    });

    // Create demo properties
    const property1 = await prisma.property.create({
      data: {
        name: 'Luxury Apartment Complex - Downtown Dubai',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        location: 'Downtown Dubai',
        address: 'Burj Khalifa Area, Sheikh Mohammed bin Rashid Blvd',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        pincode: '00000',
        price: 2500000,
        area: 1200,
        bedrooms: 3,
        bathrooms: 2,
        floors: 1,
        facing: 'North',
        vastu: 'East',
        amenities: ['Swimming Pool', 'Gym', 'Parking', 'Security', 'Concierge', 'Garden'],
        features: ['Balcony', 'Modern Kitchen', 'Marble Flooring', 'Built-in Wardrobes'],
        description: 'Luxurious 3-bedroom apartment in the heart of Downtown Dubai with stunning Burj Khalifa views.',
        images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
        videos: ['https://example.com/video1.mp4'],
        documents: ['https://example.com/brochure.pdf'],
        floorPlan: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        layout3D: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        coordinates: { latitude: 25.1972, longitude: 55.2744 },
        isFeatured: true,
        views: 250,
        inquiries: 45,
        bookings: 8,
        createdById: admin.id,
        updatedById: admin.id,
      },
    });

    const property2 = await prisma.property.create({
      data: {
        name: 'Modern Villa - Palm Jumeirah',
        type: 'VILLA',
        status: 'SOLD',
        location: 'Palm Jumeirah',
        address: 'Palm Jumeirah, Frond A, Villa 123',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        pincode: '00000',
        price: 8500000,
        area: 4500,
        bedrooms: 5,
        bathrooms: 4,
        floors: 2,
        facing: 'South',
        vastu: 'West',
        amenities: ['Private Beach', 'Swimming Pool', 'Garden', 'Garage', 'Security', 'Maid Room'],
        features: ['Terrace', 'Fireplace', 'Modern Kitchen', 'Home Office', 'Study Room'],
        description: 'Stunning 5-bedroom villa on Palm Jumeirah with private beach access.',
        images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'],
        videos: ['https://example.com/villa_video.mp4'],
        documents: ['https://example.com/villa_doc.pdf'],
        floorPlan: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
        layout3D: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
        coordinates: { latitude: 25.1124, longitude: 55.1390 },
        isFeatured: true,
        views: 500,
        inquiries: 120,
        bookings: 25,
        createdById: admin.id,
        updatedById: admin.id,
      },
    });

    // Create demo customers
    const customer1 = await prisma.customer.create({
      data: {
        name: 'Ahmed Al-Rashid',
        email: 'ahmed@example.com',
        phone: '+971501234571',
        address: 'Jumeirah 1, Villa 12',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        pincode: '00000',
        dateOfBirth: new Date('1985-05-15'),
        occupation: 'Investment Banker',
        income: 450000,
        preferences: {
          propertyTypes: ['APARTMENT', 'VILLA'],
          budget: { min: 2000000, max: 5000000 },
          locations: ['Downtown Dubai', 'Palm Jumeirah', 'Business Bay'],
        },
        budget: 3500000,
        notes: 'Looking for luxury apartment with sea view.',
        createdById: agent.id,
        updatedById: agent.id,
      },
    });

    // Create demo leads
    const lead1 = await prisma.lead.create({
      data: {
        customerId: customer1.id,
        name: 'Ahmed Al-Rashid',
        email: 'ahmed@example.com',
        phone: '+971501234571',
        source: 'WEBSITE',
        status: 'QUALIFIED',
        score: 85,
        interest: '3BHK Apartment in Downtown Dubai',
        budget: 3500000,
        notes: 'Very interested in luxury apartment complex.',
        assignedTo: agent.id,
        createdById: agent.id,
        updatedById: agent.id,
      },
    });

    // Create demo bookings
    const booking1 = await prisma.booking.create({
      data: {
        propertyId: property1.id,
        customerId: customer1.id,
        agentId: agent.id,
        status: 'CONFIRMED',
        bookingDate: new Date('2024-01-15'),
        moveInDate: new Date('2024-02-01'),
        moveOutDate: null,
        amount: 2500000,
        advanceAmount: 250000,
        paymentMethod: 'UPI',
        paymentStatus: 'COMPLETED',
        notes: 'Customer very satisfied with the property.',
        documents: ['https://example.com/booking1.pdf'],
        createdById: agent.id,
        updatedById: agent.id,
      },
    });

    // Create demo payments
    const payment1 = await prisma.payment.create({
      data: {
        bookingId: booking1.id,
        amount: 250000,
        currency: 'AED',
        method: 'UPI',
        status: 'COMPLETED',
        gateway: 'RAZORPAY',
        gatewayId: 'pay_demo_123456789',
        gatewayData: {
          transactionId: 'txn_demo_123456789',
          paymentId: 'pay_demo_123456789',
          orderId: 'order_demo_123456789',
        },
        processedAt: new Date('2024-01-15T10:30:00Z'),
        createdById: agent.id,
        updatedById: agent.id,
      },
    });

    // Create demo transactions
    const transaction1 = await prisma.transaction.create({
      data: {
        type: 'SALE',
        category: 'Property Sale',
        amount: 2500000,
        currency: 'AED',
        description: 'Sale of luxury apartment in Downtown Dubai',
        reference: 'PROP-001',
        date: new Date('2024-01-15'),
        status: 'COMPLETED',
        createdById: admin.id,
        updatedById: admin.id,
      },
    });

    // Create demo notifications
    const notification1 = await prisma.notification.create({
      data: {
        userId: agent.id,
        type: 'BOOKING_CREATED',
        title: 'New Booking Created',
        message: 'A new booking has been created for Luxury Apartment Complex - Downtown Dubai',
        data: {
          bookingId: booking1.id,
          propertyId: property1.id,
          customerId: customer1.id,
        },
        priority: 'MEDIUM',
      },
    });

    console.log('🎉 Demo data seeding completed successfully!');
    console.log('\\n📊 Demo Data Summary:');
    console.log('👥 Users: 3 (Admin, Agent, Customer)');
    console.log('🏠 Properties: 2 (Apartment, Villa)');
    console.log('👤 Customers: 1 (Ahmed Al-Rashid)');
    console.log('🎯 Leads: 1 (Qualified lead)');
    console.log('📅 Bookings: 1 (Confirmed booking)');
    console.log('💳 Payments: 1 (Completed payment)');
    console.log('💰 Transactions: 1 (Property sale)');
    console.log('🔔 Notifications: 1 (Booking notification)');

    console.log('\\n🔑 Demo Login Credentials:');
    console.log('Admin: admin@demo.com / Admin123!');
    console.log('Agent: agent@demo.com / Agent123!');
    console.log('Customer: customer@demo.com / Customer123!');

  } catch (error) {
    console.error('❌ Demo seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
`;

    // Write the simple seed script
    fs.writeFileSync('src/backend/simple-seed.js', simpleSeedScript);
    
    // Run the simple seed script
    log('Running simple demo data seeding...', 'yellow');
    runCommand('cd src/backend && node simple-seed.js');
    
    // Clean up the temporary file
    fs.unlinkSync('src/backend/simple-seed.js');
    
    log('✅ Demo data seeding completed!', 'green');
    return true;
  } catch (error) {
    log(`❌ Demo data seeding failed: ${error.message}`, 'red');
    return false;
  }
}

async function step5_StartBackend() {
  log('\n🚀 Step 5: Starting Backend Server', 'cyan');
  
  try {
    // Build backend
    log('Building backend...', 'yellow');
    runCommand('cd src/backend && npm run build');
    
    // Start backend server in background
    log('Starting backend server...', 'yellow');
    const backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(process.cwd(), 'src/backend'),
      stdio: 'pipe',
      detached: true
    });
    
    // Wait for backend to start
    log('Waiting for backend to start...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Test if backend is running
    try {
      const axios = require('axios');
      const response = await axios.get('http://localhost:3000/api/health', { timeout: 5000 });
      log('✅ Backend server is running!', 'green');
      log(`Health check response: ${JSON.stringify(response.data)}`, 'blue');
      return { backendProcess, success: true };
    } catch (error) {
      log('⚠️ Backend may not be fully ready yet. Please check manually.', 'yellow');
      return { backendProcess, success: false };
    }
  } catch (error) {
    log(`❌ Backend startup failed: ${error.message}`, 'red');
    return { backendProcess: null, success: false };
  }
}

async function step6_TestAPIs() {
  log('\n🧪 Step 6: Testing APIs', 'cyan');
  
  try {
    const axios = require('axios');
    
    // Test health endpoint
    log('Testing health endpoint...', 'yellow');
    const healthResponse = await axios.get('http://localhost:3000/api/health');
    log(`✅ Health check: ${healthResponse.status}`, 'green');
    
    // Test authentication
    log('Testing authentication...', 'yellow');
    const authResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@demo.com',
      password: 'Admin123!'
    });
    const token = authResponse.data.data.token;
    log('✅ Authentication successful', 'green');
    
    // Test protected endpoints
    log('Testing protected endpoints...', 'yellow');
    const propertiesResponse = await axios.get('http://localhost:3000/api/properties', {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Properties endpoint: ${propertiesResponse.data.data.length} properties found`, 'green');
    
    const customersResponse = await axios.get('http://localhost:3000/api/customers', {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Customers endpoint: ${customersResponse.data.data.length} customers found`, 'green');
    
    const leadsResponse = await axios.get('http://localhost:3000/api/leads', {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Leads endpoint: ${leadsResponse.data.data.length} leads found`, 'green');
    
    const bookingsResponse = await axios.get('http://localhost:3000/api/bookings', {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Bookings endpoint: ${bookingsResponse.data.data.length} bookings found`, 'green');
    
    const paymentsResponse = await axios.get('http://localhost:3000/api/payments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ Payments endpoint: ${paymentsResponse.data.data.length} payments found`, 'green');
    
    log('✅ All API tests passed!', 'green');
    return true;
  } catch (error) {
    log(`❌ API testing failed: ${error.message}`, 'red');
    if (error.response) {
      log(`Response data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return false;
  }
}

async function step7_TestRealTransaction() {
  log('\n💰 Step 7: Testing Real Transaction', 'cyan');
  
  try {
    const axios = require('axios');
    
    // Login as admin
    const authResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@demo.com',
      password: 'Admin123!'
    });
    const token = authResponse.data.data.token;
    
    // Create a new property
    log('Creating test property...', 'yellow');
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
    
    const propertyResponse = await axios.post('http://localhost:3000/api/properties', propertyData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const propertyId = propertyResponse.data.data.id;
    log('✅ Test property created', 'green');
    
    // Create a new customer
    log('Creating test customer...', 'yellow');
    const customerData = {
      name: 'E2E Test Customer',
      email: `e2e-customer-${Date.now()}@test.com`,
      phone: '+971501234999',
      address: '456 E2E Customer Street',
      city: 'E2E Customer City',
      occupation: 'Software Engineer',
      income: 150000
    };
    
    const customerResponse = await axios.post('http://localhost:3000/api/customers', customerData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const customerId = customerResponse.data.data.id;
    log('✅ Test customer created', 'green');
    
    // Create a booking
    log('Creating test booking...', 'yellow');
    const bookingData = {
      propertyId: propertyId,
      customerId: customerId,
      status: 'PENDING',
      bookingDate: new Date().toISOString(),
      amount: 2500000,
      advanceAmount: 250000,
      paymentMethod: 'UPI'
    };
    
    const bookingResponse = await axios.post('http://localhost:3000/api/bookings', bookingData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const bookingId = bookingResponse.data.data.id;
    log('✅ Test booking created', 'green');
    
    // Create a payment
    log('Creating test payment...', 'yellow');
    const paymentData = {
      bookingId: bookingId,
      amount: 250000,
      currency: 'AED',
      method: 'UPI',
      status: 'PENDING'
    };
    
    const paymentResponse = await axios.post('http://localhost:3000/api/payments', paymentData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const paymentId = paymentResponse.data.data.id;
    log('✅ Test payment created', 'green');
    
    // Update payment to completed
    log('Updating payment to completed...', 'yellow');
    await axios.put(`http://localhost:3000/api/payments/${paymentId}`, {
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
    log('✅ Payment updated to completed', 'green');
    
    // Update booking to confirmed
    log('Updating booking to confirmed...', 'yellow');
    await axios.put(`http://localhost:3000/api/bookings/${bookingId}`, {
      status: 'CONFIRMED'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log('✅ Booking updated to confirmed', 'green');
    
    log('✅ Real transaction test completed successfully!', 'green');
    return true;
  } catch (error) {
    log(`❌ Real transaction test failed: ${error.message}`, 'red');
    if (error.response) {
      log(`Response data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return false;
  }
}

async function runSetupAndTest() {
  const startTime = Date.now();
  const results = {
    prerequisites: false,
    dependencies: false,
    database: false,
    seeding: false,
    backend: false,
    apis: false,
    transaction: false
  };
  
  try {
    log('🚀 Starting Setup and Test Process', 'bright');
    log('This will set up the entire system and run comprehensive tests', 'blue');
    
    // Run all steps
    results.prerequisites = await step1_CheckPrerequisites();
    if (!results.prerequisites) {
      log('❌ Prerequisites check failed. Please fix the issues and try again.', 'red');
      return false;
    }
    
    results.dependencies = await step2_InstallDependencies();
    if (!results.dependencies) {
      log('❌ Dependency installation failed. Please check the errors and try again.', 'red');
      return false;
    }
    
    results.database = await step3_SetupDatabase();
    if (!results.database) {
      log('❌ Database setup failed. Please check Docker and try again.', 'red');
      return false;
    }
    
    results.seeding = await step4_SeedDemoData();
    if (!results.seeding) {
      log('❌ Demo data seeding failed. Please check the database connection.', 'red');
      return false;
    }
    
    const backendResult = await step5_StartBackend();
    results.backend = backendResult.success;
    if (!results.backend) {
      log('⚠️ Backend startup had issues. Please check manually.', 'yellow');
    }
    
    if (backendResult.success) {
      results.apis = await step6_TestAPIs();
      if (!results.apis) {
        log('❌ API testing failed. Please check the backend logs.', 'red');
      }
      
      results.transaction = await step7_TestRealTransaction();
      if (!results.transaction) {
        log('❌ Real transaction test failed. Please check the API responses.', 'red');
      }
    }
    
    // Print final results
    const duration = (Date.now() - startTime) / 1000;
    log('\n' + '=' * 60, 'cyan');
    log('🎯 SETUP AND TEST RESULTS', 'bright');
    log('=' * 60, 'cyan');
    
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
      log('You can now access the system at http://localhost:3000', 'green');
      log('\n🔑 Demo Login Credentials:', 'bright');
      log('Admin: admin@demo.com / Admin123!', 'blue');
      log('Agent: agent@demo.com / Agent123!', 'blue');
      log('Customer: customer@demo.com / Customer123!', 'blue');
    } else {
      log('\n⚠️ Some tests failed.', 'yellow');
      log('Please review the errors above and fix them.', 'yellow');
    }
    
    return passedTests === totalTests;
    
  } catch (error) {
    log(`\n💥 Setup and test process failed: ${error.message}`, 'red');
    return false;
  }
}

// Main execution
if (require.main === module) {
  runSetupAndTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`💥 Setup and test crashed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { runSetupAndTest };
