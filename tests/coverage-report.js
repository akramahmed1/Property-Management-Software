#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Generating test coverage report...');

try {
  // Run tests with coverage
  execSync('npm run test:coverage', { stdio: 'inherit' });
  
  // Check if coverage report was generated
  const coverageDir = path.join(__dirname, 'coverage');
  if (fs.existsSync(coverageDir)) {
    console.log('Coverage report generated successfully');
    console.log(`Coverage report location: ${coverageDir}`);
    
    // Display coverage summary
    const lcovPath = path.join(coverageDir, 'lcov.info');
    if (fs.existsSync(lcovPath)) {
      console.log('LCOV report available for CI/CD integration');
    }
    
    const htmlPath = path.join(coverageDir, 'index.html');
    if (fs.existsSync(htmlPath)) {
      console.log('HTML coverage report available');
    }
  } else {
    console.error('Coverage report not generated');
    process.exit(1);
  }
} catch (error) {
  console.error('Failed to generate coverage report:', error.message);
  process.exit(1);
}
