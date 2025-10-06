#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing E2E Setup...\n');

// Check if required files exist
const requiredFiles = [
  'tests/playwright.config.ts',
  'tests/e2e/property-management.e2e.test.ts',
  'tests/package.json',
  'src/backend/package.json',
  'src/frontend/package.json'
];

console.log('📁 Checking required files...');
let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. E2E setup incomplete.');
  process.exit(1);
}

// Check if dependencies are installed
console.log('\n📦 Checking dependencies...');
try {
  const backendPackageJson = JSON.parse(fs.readFileSync('src/backend/package.json', 'utf8'));
  const frontendPackageJson = JSON.parse(fs.readFileSync('src/frontend/package.json', 'utf8'));
  const testPackageJson = JSON.parse(fs.readFileSync('tests/package.json', 'utf8'));
  
  console.log('✅ Package.json files found');
  
  // Check if node_modules exist
  const backendNodeModules = fs.existsSync('src/backend/node_modules');
  const frontendNodeModules = fs.existsSync('src/frontend/node_modules');
  const testNodeModules = fs.existsSync('tests/node_modules');
  
  console.log(`Backend node_modules: ${backendNodeModules ? '✅' : '❌'}`);
  console.log(`Frontend node_modules: ${frontendNodeModules ? '✅' : '❌'}`);
  console.log(`Test node_modules: ${testNodeModules ? '✅' : '❌'}`);
  
} catch (error) {
  console.log(`❌ Error reading package.json files: ${error.message}`);
}

// Check if environment file exists
console.log('\n🔧 Checking environment setup...');
const envExists = fs.existsSync('.env');
console.log(`Environment file: ${envExists ? '✅' : '❌'}`);

if (!envExists) {
  console.log('⚠️  No .env file found. Creating from env.example...');
  try {
    const envExample = fs.readFileSync('env.example', 'utf8');
    fs.writeFileSync('.env', envExample);
    console.log('✅ .env file created');
  } catch (error) {
    console.log(`❌ Could not create .env file: ${error.message}`);
  }
}

// Check if Docker is available
console.log('\n🐳 Checking Docker availability...');
try {
  execSync('docker --version', { stdio: 'pipe' });
  console.log('✅ Docker is available');
} catch (error) {
  console.log('❌ Docker not available - required for database and Redis');
}

// Check if ports are available
console.log('\n🔌 Checking port availability...');
try {
  execSync('netstat -an | findstr :3000', { stdio: 'pipe' });
  console.log('⚠️  Port 3000 is in use');
} catch (error) {
  console.log('✅ Port 3000 is available');
}

try {
  execSync('netstat -an | findstr :5432', { stdio: 'pipe' });
  console.log('⚠️  Port 5432 is in use');
} catch (error) {
  console.log('✅ Port 5432 is available');
}

console.log('\n🎯 E2E Setup Check Complete!');
console.log('\nTo run E2E tests:');
console.log('1. Start database: docker-compose up -d postgres redis');
console.log('2. Install dependencies: npm run install:all');
console.log('3. Run migrations: npm run db:migrate');
console.log('4. Start backend: npm run dev:backend');
console.log('5. Run E2E tests: npm run test:e2e');
