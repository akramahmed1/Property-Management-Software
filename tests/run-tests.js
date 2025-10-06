#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const testTypes = {
  unit: 'npm run test:unit',
  integration: 'npm run test:integration',
  e2e: 'npm run test:e2e',
  all: 'npm run test'
};

const testType = process.argv[2] || 'all';

console.log(`Running ${testType} tests...`);

try {
  if (testType === 'all') {
    // Run all tests
    execSync('npm run test', { stdio: 'inherit' });
  } else if (testTypes[testType]) {
    // Run specific test type
    execSync(testTypes[testType], { stdio: 'inherit' });
  } else {
    console.error(`Unknown test type: ${testType}`);
    console.error('Available test types: unit, integration, e2e, all');
    process.exit(1);
  }
  
  console.log(`${testType} tests completed successfully`);
} catch (error) {
  console.error(`${testType} tests failed:`, error.message);
  process.exit(1);
}
