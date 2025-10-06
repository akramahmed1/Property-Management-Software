#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('⚡ Quick Setup - Minimal Dependencies');
console.log('=' * 50);

function runCommand(command, options = {}) {
  try {
    console.log(`📋 Running: ${command}`);
    execSync(command, { 
      encoding: 'utf8', 
      stdio: 'inherit',
      ...options 
    });
    console.log(`✅ Success: ${command}`);
  } catch (error) {
    console.log(`❌ Failed: ${command}`);
    throw error;
  }
}

async function quickSetup() {
  try {
    console.log('🚀 Starting Quick Setup...');
    
    // 1. Install only essential backend dependencies
    console.log('\n📦 Installing backend dependencies (minimal)...');
    runCommand('cd src/backend && npm install --production --no-optional');
    
    // 2. Generate Prisma client only
    console.log('\n🔨 Generating Prisma client...');
    runCommand('cd src/backend && npx prisma generate');
    
    // 3. Start database with minimal setup
    console.log('\n🗄️ Starting database...');
    runCommand('docker-compose up -d postgres');
    
    // Wait for database
    console.log('⏳ Waiting for database to be ready...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 4. Run migrations
    console.log('\n🔄 Running migrations...');
    runCommand('cd src/backend && npx prisma migrate deploy');
    
    // 5. Create minimal demo data
    console.log('\n🌱 Creating minimal demo data...');
    const minimalSeed = `
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating minimal demo data...');
  
  // Create only essential demo data
  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      password: await bcrypt.hash('Admin123!', 12),
      name: 'Demo Admin',
      phone: '+971501234567',
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
    },
  });

  const property = await prisma.property.create({
    data: {
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
      description: 'Test property for quick setup',
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  console.log('✅ Minimal demo data created!');
  console.log('🔑 Login: admin@demo.com / Admin123!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
`;
    
    fs.writeFileSync('src/backend/minimal-seed.js', minimalSeed);
    runCommand('cd src/backend && node minimal-seed.js');
    fs.unlinkSync('src/backend/minimal-seed.js');
    
    // 6. Start backend server
    console.log('\n🚀 Starting backend server...');
    console.log('✅ Setup complete! Backend should be running on http://localhost:3000');
    console.log('🔑 Test with: curl http://localhost:3000/api/health');
    console.log('🔑 Login: curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d \'{"email":"admin@demo.com","password":"Admin123!"}\'');
    
    runCommand('cd src/backend && npm run dev');
    
  } catch (error) {
    console.log(`❌ Quick setup failed: ${error.message}`);
  }
}

quickSetup();
