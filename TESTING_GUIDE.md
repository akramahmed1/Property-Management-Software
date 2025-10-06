# Comprehensive Testing Guide

This guide provides step-by-step instructions to test the Property Management Software system end-to-end with demo data and real transactions.

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed
- Git installed
- Terminal/Command Prompt access

## Quick Start Testing

### 1. Environment Setup

```bash
# Clone and navigate to the project
cd property-management-software

# Install all dependencies
npm run install:all

# Or install individually:
cd src/backend && npm install
cd ../frontend && npm install
cd ../../tests && npm install
```

### 2. Database Setup

```bash
# Start PostgreSQL and Redis using Docker
docker-compose up -d postgres redis

# Wait for services to start (about 15-30 seconds)
# Check if containers are running:
docker-compose ps

# Run database migrations
cd src/backend
npx prisma migrate deploy

# Seed demo data
npx ts-node prisma/seed-demo.ts

# Generate Prisma client
npx prisma generate
```

### 3. Start Backend Server

```bash
# Start the backend server
cd src/backend
npm run dev

# The server will start on http://localhost:3000
# You should see: "Server running on port 3000"
```

### 4. Test Backend APIs

Open a new terminal and test the APIs:

#### Health Check
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-20T10:30:00.000Z",
    "checks": {
      "database": true,
      "redis": true,
      "storage": true,
      "memory": true,
      "cpu": true
    }
  }
}
```

#### Authentication Test
```bash
# Login with demo admin credentials
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "Admin123!"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "admin@demo.com",
      "name": "Demo Admin",
      "role": "SUPER_ADMIN"
    },
    "token": "jwt_token_here"
  }
}
```

#### Test Protected Endpoints
```bash
# Get properties (replace TOKEN with actual token from login response)
curl -X GET http://localhost:3000/api/properties \
  -H "Authorization: Bearer TOKEN"

# Get customers
curl -X GET http://localhost:3000/api/customers \
  -H "Authorization: Bearer TOKEN"

# Get leads
curl -X GET http://localhost:3000/api/leads \
  -H "Authorization: Bearer TOKEN"

# Get bookings
curl -X GET http://localhost:3000/api/bookings \
  -H "Authorization: Bearer TOKEN"

# Get payments
curl -X GET http://localhost:3000/api/payments \
  -H "Authorization: Bearer TOKEN"
```

### 5. Test Real Transactions

#### Create a New Property
```bash
curl -X POST http://localhost:3000/api/properties \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Property E2E",
    "type": "APARTMENT",
    "status": "AVAILABLE",
    "location": "Test Location",
    "address": "123 Test Street",
    "city": "Test City",
    "state": "Test State",
    "country": "Test Country",
    "price": 2500000,
    "area": 1200,
    "bedrooms": 3,
    "bathrooms": 2,
    "description": "Property created during E2E testing"
  }'
```

#### Create a New Customer
```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "E2E Test Customer",
    "email": "e2e-customer@test.com",
    "phone": "+971501234999",
    "address": "456 E2E Customer Street",
    "city": "E2E Customer City",
    "occupation": "Software Engineer",
    "income": 150000
  }'
```

#### Create a Lead
```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "E2E Test Lead",
    "email": "e2e-lead@test.com",
    "phone": "+971501234998",
    "source": "WEBSITE",
    "status": "NEW",
    "interest": "3BHK Apartment",
    "budget": 2500000
  }'
```

#### Create a Booking
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "PROPERTY_ID_FROM_CREATE_RESPONSE",
    "customerId": "CUSTOMER_ID_FROM_CREATE_RESPONSE",
    "status": "PENDING",
    "bookingDate": "2024-01-20T10:30:00.000Z",
    "amount": 2500000,
    "advanceAmount": 250000,
    "paymentMethod": "UPI"
  }'
```

#### Create a Payment
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BOOKING_ID_FROM_CREATE_RESPONSE",
    "amount": 250000,
    "currency": "AED",
    "method": "UPI",
    "status": "PENDING"
  }'
```

#### Update Payment to Completed
```bash
curl -X PUT http://localhost:3000/api/payments/PAYMENT_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED",
    "gateway": "RAZORPAY",
    "gatewayId": "pay_test_123456789",
    "gatewayData": {
      "transactionId": "txn_test_123456789",
      "paymentId": "pay_test_123456789",
      "orderId": "order_test_123456789"
    },
    "processedAt": "2024-01-20T10:30:00.000Z"
  }'
```

### 6. Test Security Features

#### Test Rate Limiting
```bash
# Try to login multiple times with wrong credentials
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "invalid@test.com",
      "password": "wrongpassword"
    }'
  echo "Attempt $i"
done
```

You should see rate limiting kick in after a few attempts.

#### Test Input Validation
```bash
# Try to create property with invalid data
curl -X POST http://localhost:3000/api/properties \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "type": "INVALID_TYPE"
  }'
```

This should return a 400 error with validation messages.

#### Test Authentication Required
```bash
# Try to access protected endpoint without token
curl -X GET http://localhost:3000/api/properties
```

This should return a 401 Unauthorized error.

### 7. Test Frontend

```bash
# Build and start frontend
cd src/frontend
npm run build
npm start

# The frontend will start on http://localhost:19006
# Open in browser and test the UI
```

### 8. Test Monitoring Endpoints

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test monitoring endpoints (requires admin token)
curl -X GET http://localhost:3000/api/monitoring/metrics/system \
  -H "Authorization: Bearer ADMIN_TOKEN"

curl -X GET http://localhost:3000/api/monitoring/dashboard \
  -H "Authorization: Bearer ADMIN_TOKEN"

curl -X GET http://localhost:3000/api/security/events \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 9. Test Analytics

```bash
# Test analytics endpoints
curl -X GET http://localhost:3000/api/analytics/dashboard \
  -H "Authorization: Bearer TOKEN"

curl -X GET http://localhost:3000/api/analytics/properties \
  -H "Authorization: Bearer TOKEN"

curl -X GET http://localhost:3000/api/analytics/customers \
  -H "Authorization: Bearer TOKEN"
```

### 10. Run Automated Tests

```bash
# Run unit tests
cd tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run all tests
npm test
```

## Demo Data Available

The system comes with pre-seeded demo data:

### Demo Users
- **Admin**: admin@demo.com / Admin123!
- **Manager**: manager@demo.com / Manager123!
- **Agent**: agent@demo.com / Agent123!
- **Customer**: customer@demo.com / Customer123!

### Demo Properties
- Luxury Apartment Complex - Downtown Dubai (2.5M AED)
- Modern Villa - Palm Jumeirah (8.5M AED)
- Commercial Office Space - Business Bay (1.8M AED)
- Investment Plot - Dubai Hills (1.2M AED)
- Retail Shop - Dubai Mall (3.2M AED)

### Demo Customers
- Ahmed Al-Rashid (Investment Banker)
- Sarah Johnson (Marketing Director)
- Mohammed Hassan (Business Owner)
- Priya Patel (Software Engineer)

### Demo Leads
- Qualified leads with different sources
- Various statuses (NEW, CONTACTED, QUALIFIED, PROPOSAL)
- Different budget ranges and interests

### Demo Bookings
- Confirmed bookings with completed payments
- Pending bookings awaiting confirmation
- Different payment methods and statuses

## Expected Test Results

### ✅ Successful Tests Should Show:
1. **Health Check**: All services healthy
2. **Authentication**: Successful login with valid credentials
3. **API Endpoints**: All CRUD operations working
4. **Real Transactions**: Complete property sale workflow
5. **Security**: Rate limiting, input validation, authentication
6. **Monitoring**: System metrics and health data
7. **Analytics**: Dashboard data and reports

### ❌ Failed Tests May Indicate:
1. **Database Issues**: Connection problems or missing data
2. **Authentication Issues**: JWT token problems or user permissions
3. **API Issues**: Missing endpoints or incorrect responses
4. **Security Issues**: Rate limiting not working or validation bypassed
5. **Monitoring Issues**: Services not reporting metrics correctly

## Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart services
docker-compose restart postgres redis
```

#### Backend Server Won't Start
```bash
# Check if port 3000 is available
lsof -i :3000

# Kill process if needed
kill -9 $(lsof -t -i:3000)

# Restart backend
cd src/backend
npm run dev
```

#### Frontend Build Failed
```bash
# Clear cache and reinstall
cd src/frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Tests Failing
```bash
# Check if backend is running
curl http://localhost:3000/api/health

# Check test configuration
cd tests
npm test -- --verbose
```

## Performance Testing

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Create load test configuration
cat > load-test.yml << EOF
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "API Load Test"
    requests:
      - get:
          url: "/api/health"
      - post:
          url: "/api/auth/login"
          json:
            email: "admin@demo.com"
            password: "Admin123!"
EOF

# Run load test
artillery run load-test.yml
```

### Memory Testing
```bash
# Monitor memory usage
cd src/backend
node --inspect dist/index.js

# Use Chrome DevTools to monitor memory
# Open chrome://inspect in Chrome browser
```

## Security Testing

### OWASP Testing
```bash
# Test for SQL injection
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com'; DROP TABLE users; --",
    "password": "Admin123!"
  }'

# Test for XSS
curl -X POST http://localhost:3000/api/properties \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<script>alert('XSS')</script>",
    "type": "APARTMENT"
  }'
```

### Authentication Testing
```bash
# Test token expiration
# Wait for token to expire or use expired token
curl -X GET http://localhost:3000/api/properties \
  -H "Authorization: Bearer EXPIRED_TOKEN"
```

## Cleanup

```bash
# Stop all services
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Clean up test data (optional)
cd src/backend
npx prisma migrate reset
```

## Success Criteria

The system is considered successfully tested if:

1. ✅ All health checks pass
2. ✅ Authentication works with demo credentials
3. ✅ All CRUD operations work for all entities
4. ✅ Real transaction workflow completes successfully
5. ✅ Security features are working (rate limiting, validation, auth)
6. ✅ Monitoring endpoints return data
7. ✅ Analytics endpoints provide insights
8. ✅ Frontend builds and runs without errors
9. ✅ All automated tests pass
10. ✅ Performance is acceptable under load

## Next Steps

After successful testing:

1. **Deploy to Staging**: Use the deployment guide to deploy to staging environment
2. **User Acceptance Testing**: Have real users test the system
3. **Performance Optimization**: Optimize based on load testing results
4. **Security Audit**: Conduct thorough security audit
5. **Production Deployment**: Deploy to production with confidence

## Support

If you encounter issues during testing:

1. Check the logs for error messages
2. Verify all services are running
3. Ensure database is properly seeded
4. Check network connectivity
5. Review the troubleshooting section above

For additional support, refer to the documentation in the `/docs` folder or check the GitHub issues.
