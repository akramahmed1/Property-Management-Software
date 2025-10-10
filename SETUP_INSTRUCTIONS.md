# Property Management Software - Setup Instructions

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 20+ 
- PostgreSQL 15+
- Redis 7+
- npm or yarn

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# Backend dependencies
cd src/backend
npm install
cd ../..

# Frontend dependencies  
cd src/frontend
npm install
cd ../..

# Test dependencies
cd tests
npm install
cd ..
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
# Property Management Software Environment Variables
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://pms_user:pms_password@localhost:5432/property_management
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d
BCRYPT_SALT_ROUNDS=10
REGION=INDIA
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info

# Database Configuration
POSTGRES_DB=property_management
POSTGRES_USER=pms_user
POSTGRES_PASSWORD=pms_password

# Redis Configuration
REDIS_PASSWORD=redis_password

# Frontend Configuration
REACT_APP_API_URL=http://localhost:3000
REACT_APP_REGION=INDIA
REACT_APP_DEFAULT_LANGUAGE=en

# Monitoring
GRAFANA_PASSWORD=admin
```

### 3. Database Setup

```bash
# Start PostgreSQL and Redis (using Docker)
docker-compose up -d postgres redis

# Run Prisma migrations
cd src/backend
npx prisma migrate dev --name init
npx prisma db seed
cd ../..
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd src/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd src/frontend
npm start
```

**Terminal 3 - Tests:**
```bash
cd tests
npm run test
```

### 5. Verify Installation

```bash
# Test backend API
curl http://localhost:3000/api/v1/company?region=INDIA

# Expected response:
{
  "region": "INDIA",
  "taxName": "GST",
  "taxRate": 0.05,
  "currency": "INR"
}
```

## 🧪 Testing

### Run All Tests
```bash
# Unit tests
cd tests && npm run test:unit

# Integration tests  
cd tests && npm run test:integration

# E2E tests
cd tests && npm run test:e2e

# Coverage report
cd tests && npm run test:coverage
```

### Test Individual Components
```bash
# Backend tests
cd src/backend && npm test

# Frontend tests
cd src/frontend && npm test
```

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoring

### Access Monitoring Tools
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Kibana**: http://localhost:5601
- **Elasticsearch**: http://localhost:9200

## 🔧 Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**2. Database Connection Issues**
```bash
# Check PostgreSQL status
docker-compose ps postgres

# Restart database
docker-compose restart postgres
```

**3. Redis Connection Issues**
```bash
# Check Redis status
docker-compose ps redis

# Restart Redis
docker-compose restart redis
```

**4. Missing Dependencies**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Logs
```bash
# Backend logs
cd src/backend && npm run dev

# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🚀 Production Deployment

### 1. Environment Variables
Update `.env` with production values:
- Strong JWT secrets
- Production database URLs
- Secure Redis passwords
- HTTPS certificates

### 2. Build Applications
```bash
# Build backend
cd src/backend && npm run build

# Build frontend
cd src/frontend && npm run build
```

### 3. Deploy with Docker
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Health Checks
```bash
# Backend health
curl http://localhost:3000/health

# Frontend health
curl http://localhost:80/health
```

## 📱 Mobile Development

### React Native Setup
```bash
cd src/frontend

# iOS
npx react-native run-ios

# Android
npx react-native run-android

# Expo
npx expo start
```

## 🔐 Security Checklist

- [ ] Change default JWT secrets
- [ ] Set strong database passwords
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Configure firewall rules
- [ ] Set up monitoring alerts

## 📈 Performance Optimization

### Backend
- Enable Redis caching
- Optimize database queries
- Use connection pooling
- Implement request compression

### Frontend
- Enable code splitting
- Use lazy loading
- Optimize images
- Enable service workers

## 🎯 API Endpoints

### Company Information
- `GET /api/v1/company?region=INDIA` - Get company info for India
- `GET /api/v1/company?region=UAE` - Get company info for UAE

### Projects/Properties
- `GET /api/v1/projects` - List properties with filters
- `GET /api/v1/projects/:id` - Get property details

### Leads
- `GET /api/v1/leads` - List leads with filters
- `POST /api/v1/leads` - Create new lead

### Bookings
- `GET /api/v1/bookings` - List bookings with filters
- `POST /api/v1/bookings` - Create new booking

## 🌍 Multi-Region Support

### Supported Regions
- **India**: GST compliance, INR currency
- **UAE**: VAT compliance, AED currency  
- **Saudi Arabia**: VAT compliance, SAR currency
- **Qatar**: VAT compliance, QAR currency

### Region Configuration
Set `REGION` environment variable:
```bash
export REGION=INDIA    # For India
export REGION=UAE      # For UAE
export REGION=SAUDI    # For Saudi Arabia
export REGION=QATAR    # For Qatar
```

## 🎉 Success!

If everything is working correctly, you should see:

1. ✅ Backend API running on http://localhost:3000
2. ✅ Frontend app running on http://localhost:3001
3. ✅ Database connected and migrated
4. ✅ Redis cache connected
5. ✅ All tests passing
6. ✅ API documentation at http://localhost:3000/api-docs

## 📞 Support

For issues or questions:
1. Check the logs for error messages
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Check that PostgreSQL and Redis are running
5. Review the troubleshooting section above

Happy coding! 🚀
