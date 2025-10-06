# 🚀 Quick Start Testing Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed
- ✅ Docker Desktop installed and running
- ✅ Git installed
- ✅ Terminal/Command Prompt access

## Step-by-Step Testing

### 1. Start Docker Desktop
- Open Docker Desktop application
- Wait for it to fully start (green status)
- Ensure Docker is running before proceeding

### 2. Run the Setup and Test Script
```bash
npm run setup:test
```

This single command will:
- ✅ Check prerequisites
- ✅ Install all dependencies
- ✅ Set up the database
- ✅ Seed demo data
- ✅ Start the backend server
- ✅ Test all APIs
- ✅ Run real transaction tests

### 3. Manual Testing (Optional)

If you want to test manually, follow these steps:

#### Start Database Services
```bash
docker-compose up -d postgres redis
```

#### Install Dependencies
```bash
npm run install:all
```

#### Setup Database
```bash
cd src/backend
npx prisma generate
npx prisma migrate deploy
```

#### Seed Demo Data
```bash
cd src/backend
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
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
    },
  });

  // Create demo property
  const property = await prisma.property.create({
    data: {
      name: 'Luxury Apartment Complex - Downtown Dubai',
      type: 'APARTMENT',
      status: 'AVAILABLE',
      location: 'Downtown Dubai',
      address: 'Burj Khalifa Area, Sheikh Mohammed bin Rashid Blvd',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      price: 2500000,
      area: 1200,
      bedrooms: 3,
      bathrooms: 2,
      description: 'Luxurious 3-bedroom apartment in the heart of Downtown Dubai',
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  console.log('✅ Demo data created successfully!');
  console.log('🔑 Login credentials:');
  console.log('Admin: admin@demo.com / Admin123!');
  console.log('Agent: agent@demo.com / Agent123!');
  console.log('Customer: customer@demo.com / Customer123!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
"
```

#### Start Backend Server
```bash
cd src/backend
npm run dev
```

#### Test APIs
Open a new terminal and test:

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "Admin123!"
  }'

# Test properties endpoint (replace TOKEN with actual token)
curl -X GET http://localhost:3000/api/properties \
  -H "Authorization: Bearer TOKEN"
```

## Expected Results

### ✅ Successful Setup Should Show:
1. **Dependencies installed** without critical errors
2. **Database connected** and migrations applied
3. **Demo data seeded** with users and properties
4. **Backend server running** on port 3000
5. **Health check passing** with status "healthy"
6. **Authentication working** with demo credentials
7. **APIs responding** with demo data

### 🔑 Demo Login Credentials:
- **Admin**: admin@demo.com / Admin123!
- **Agent**: agent@demo.com / Agent123!
- **Customer**: customer@demo.com / Customer123!

### 📊 Demo Data Available:
- **Users**: 3 (Admin, Agent, Customer)
- **Properties**: 1 (Luxury Apartment)
- **All CRUD operations** working
- **Real transaction flow** functional

## Troubleshooting

### Common Issues:

#### 1. Docker Not Running
```
Error: unable to get image
```
**Solution**: Start Docker Desktop and wait for it to fully load.

#### 2. Database Connection Failed
```
Error: connect ECONNREFUSED
```
**Solution**: 
```bash
docker-compose down
docker-compose up -d postgres redis
# Wait 30 seconds, then try again
```

#### 3. Prisma Client Not Generated
```
Error: Module '@prisma/client' has no exported member
```
**Solution**:
```bash
cd src/backend
npx prisma generate
```

#### 4. Dependencies Installation Failed
```
Error: ERESOLVE could not resolve
```
**Solution**:
```bash
cd tests
npm install --legacy-peer-deps
```

#### 5. Backend Server Won't Start
```
Error: Port 3000 already in use
```
**Solution**:
```bash
# Kill process using port 3000
npx kill-port 3000
# Or change port in src/backend/.env
```

## Success Criteria

The system is working correctly when:

1. ✅ **Health Check**: `curl http://localhost:3000/api/health` returns healthy status
2. ✅ **Authentication**: Login with demo credentials works
3. ✅ **API Endpoints**: All CRUD operations return data
4. ✅ **Database**: Demo data is loaded and accessible
5. ✅ **Real Transactions**: Complete property sale workflow works
6. ✅ **Security**: Rate limiting and validation work
7. ✅ **Monitoring**: System metrics are available

## Next Steps

After successful testing:

1. **Explore the APIs** using the demo data
2. **Test different user roles** and permissions
3. **Create real transactions** and verify data flow
4. **Check security features** like rate limiting
5. **Deploy to staging** for user acceptance testing
6. **Deploy to production** with confidence

## Support

If you encounter issues:

1. Check the error messages carefully
2. Ensure Docker Desktop is running
3. Verify all prerequisites are installed
4. Check the troubleshooting section above
5. Review the detailed TESTING_GUIDE.md for more information

**🎉 Happy Testing!**
