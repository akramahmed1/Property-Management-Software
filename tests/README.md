# Testing Documentation

This directory contains comprehensive tests for the Property Management Software MVP.

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── auth.test.ts        # Authentication service tests
│   ├── property.test.ts    # Property service tests
│   ├── payment.test.ts     # Payment service tests
│   └── ...
├── integration/            # Integration tests
│   ├── api.test.ts        # API endpoint tests
│   ├── database.test.ts   # Database integration tests
│   └── ...
├── e2e/                   # End-to-end tests
│   ├── property-management.e2e.test.ts
│   └── ...
├── setup/                 # Test setup and utilities
│   ├── test-setup.ts      # Database setup and seeding
│   ├── jest.setup.ts      # Jest configuration
│   ├── global-setup.ts    # Global test setup
│   └── global-teardown.ts # Global test teardown
├── jest.config.js         # Jest configuration
├── run-tests.js          # Test runner script
├── coverage-report.js    # Coverage report generator
└── README.md             # This file
```

## Test Types

### Unit Tests
- Test individual functions and methods in isolation
- Mock external dependencies
- Fast execution
- High coverage of business logic

### Integration Tests
- Test API endpoints and database interactions
- Use real database connections
- Test service integrations
- Verify data flow between components

### End-to-End Tests
- Test complete user workflows
- Use real browser automation
- Test mobile responsiveness
- Verify offline functionality

## Running Tests

### Prerequisites
1. Install dependencies: `npm install`
2. Set up test database
3. Configure environment variables

### Commands

```bash
# Run all tests
npm run test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests with verbose output
npm run test:verbose
```

### Using Test Scripts

```bash
# Run specific test type
node tests/run-tests.js unit
node tests/run-tests.js integration
node tests/run-tests.js e2e
node tests/run-tests.js all

# Generate coverage report
node tests/coverage-report.js
```

## Test Configuration

### Jest Configuration
- TypeScript support
- Coverage reporting
- Database setup/teardown
- Mock configurations
- Timeout settings

### Database Setup
- Automatic database reset before tests
- Test data seeding
- Sequence reset
- Connection management

### Environment Variables
```env
# Test Database
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/property_management_test_db"

# Test JWT Secret
TEST_JWT_SECRET="test_jwt_secret"

# Test Redis
TEST_REDIS_URL="redis://localhost:6379/1"
```

## Test Data

### Seeded Data
- Test users (admin, agent, customer)
- Test properties
- Test customers and leads
- Test bookings and payments
- Test transactions and notifications

### Data Cleanup
- Automatic cleanup after tests
- Database truncation
- Sequence reset
- Connection cleanup

## Coverage Requirements

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Best Practices

### Unit Tests
- Test one thing at a time
- Use descriptive test names
- Mock external dependencies
- Test edge cases and error conditions
- Keep tests fast and isolated

### Integration Tests
- Test real API endpoints
- Use test database
- Test authentication and authorization
- Test error handling
- Test data validation

### E2E Tests
- Test complete user journeys
- Test mobile responsiveness
- Test offline functionality
- Test error scenarios
- Test performance

## Debugging Tests

### Common Issues
1. **Database Connection**: Ensure test database is running
2. **Port Conflicts**: Check if ports are available
3. **Timeout Issues**: Increase test timeout if needed
4. **Memory Issues**: Run tests with more memory

### Debug Commands
```bash
# Run specific test file
npm test -- auth.test.ts

# Run tests with debug output
npm test -- --verbose

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run Tests
  run: |
    npm install
    npm run test:coverage
    npm run test:e2e
```

### Coverage Reports
- LCOV format for CI/CD
- HTML format for local viewing
- Coverage thresholds enforcement
- Badge generation

## Test Maintenance

### Regular Tasks
1. Update test data as needed
2. Review and update test coverage
3. Fix flaky tests
4. Update test documentation
5. Review test performance

### Adding New Tests
1. Follow naming conventions
2. Add appropriate test data
3. Update documentation
4. Ensure coverage requirements
5. Test error scenarios

## Troubleshooting

### Common Problems
1. **Tests failing**: Check database connection and test data
2. **Slow tests**: Optimize database queries and mocks
3. **Memory issues**: Increase Node.js memory limit
4. **Port conflicts**: Use different ports for test environment

### Getting Help
1. Check test logs for error details
2. Review test setup and configuration
3. Verify environment variables
4. Check database connectivity
5. Review test data integrity
