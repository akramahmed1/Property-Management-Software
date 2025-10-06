# Deployment Guide

This guide covers deploying the Property Management Software to various free cloud providers.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Mobile App Deployment](#mobile-app-deployment)
7. [Monitoring Setup](#monitoring-setup)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ installed locally
- Git installed
- Docker installed (optional)
- Accounts on:
  - [Railway](https://railway.app) (Backend)
  - [Vercel](https://vercel.com) (Frontend)
  - [Supabase](https://supabase.com) (Database)
  - [GitHub](https://github.com) (Code repository)

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/property-management-software.git
cd property-management-software
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd src/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install test dependencies
cd ../../tests
npm install
```

### 3. Environment Variables

Create environment files for different environments:

#### Development (.env.development)
```env
# Application
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3000,http://localhost:19006

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/property_management_dev"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/property_management_dev"

# JWT
JWT_SECRET=your_development_jwt_secret
JWT_ACCESS_EXPIRATION_MINUTES=15
JWT_REFRESH_EXPIRATION_DAYS=7

# Redis
REDIS_URL=redis://localhost:6379

# Email (SendGrid)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
EMAIL_FROM=support@yourdomain.com

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket

# Payment Gateways
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
PAYTABS_PROFILE_ID=your_paytabs_profile_id
PAYTABS_SERVER_KEY=your_paytabs_server_key
```

#### Production (.env.production)
```env
# Application
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend-domain.vercel.app

# Database (Supabase)
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
DIRECT_URL="postgresql://postgres:[password]@[host]:5432/postgres"

# JWT
JWT_SECRET=your_production_jwt_secret_here
JWT_ACCESS_EXPIRATION_MINUTES=15
JWT_REFRESH_EXPIRATION_DAYS=7

# Redis (Railway Redis)
REDIS_URL=redis://[username]:[password]@[host]:[port]

# Email (SendGrid)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_production_sendgrid_api_key
EMAIL_FROM=support@yourdomain.com

# Twilio
TWILIO_ACCOUNT_SID=your_production_twilio_account_sid
TWILIO_AUTH_TOKEN=your_production_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# AWS S3
AWS_ACCESS_KEY_ID=your_production_aws_access_key
AWS_SECRET_ACCESS_KEY=your_production_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-production-s3-bucket

# Payment Gateways
RAZORPAY_KEY_ID=your_production_razorpay_key_id
RAZORPAY_KEY_SECRET=your_production_razorpay_key_secret
PAYTABS_PROFILE_ID=your_production_paytabs_profile_id
PAYTABS_SERVER_KEY=your_production_paytabs_server_key
```

## Database Setup

### Option 1: Supabase (Recommended)

1. **Create Supabase Project**
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Note down the database URL and API keys

2. **Run Migrations**
   ```bash
   cd src/backend
   npx prisma migrate deploy
   npx prisma db seed
   ```

3. **Enable Row Level Security (RLS)**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
   ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
   ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
   ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
   ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
   ```

### Option 2: Railway PostgreSQL

1. **Create Railway Project**
   - Go to [Railway](https://railway.app)
   - Create a new project
   - Add PostgreSQL service
   - Note down the connection string

2. **Run Migrations**
   ```bash
   cd src/backend
   npx prisma migrate deploy
   npx prisma db seed
   ```

## Backend Deployment

### Option 1: Railway (Recommended)

1. **Connect Repository**
   - Go to [Railway](https://railway.app)
   - Create a new project
   - Connect your GitHub repository
   - Select the `src/backend` directory

2. **Configure Environment Variables**
   - Add all production environment variables
   - Set `NODE_ENV=production`
   - Set `PORT=3000`

3. **Deploy**
   - Railway will automatically deploy on push to main branch
   - Monitor the deployment logs

4. **Configure Custom Domain (Optional)**
   - Go to project settings
   - Add custom domain
   - Configure DNS records

### Option 2: Render

1. **Create Render Service**
   - Go to [Render](https://render.com)
   - Create a new Web Service
   - Connect your GitHub repository
   - Set build command: `cd src/backend && npm install && npm run build`
   - Set start command: `cd src/backend && npm start`

2. **Configure Environment Variables**
   - Add all production environment variables

3. **Deploy**
   - Render will automatically deploy on push to main branch

### Option 3: Docker Deployment

1. **Build Docker Image**
   ```bash
   docker build -t property-management-backend .
   ```

2. **Run Container**
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL="your_database_url" \
     -e JWT_SECRET="your_jwt_secret" \
     property-management-backend
   ```

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Set root directory to `src/frontend`

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`

3. **Environment Variables**
   - Add `REACT_APP_API_URL` pointing to your backend
   - Add `REACT_APP_ENVIRONMENT=production`

4. **Deploy**
   - Vercel will automatically deploy on push to main branch

### Option 2: Netlify

1. **Connect Repository**
   - Go to [Netlify](https://netlify.com)
   - Connect your GitHub repository
   - Set build command: `cd src/frontend && npm run build`
   - Set publish directory: `src/frontend/dist`

2. **Environment Variables**
   - Add environment variables in site settings

3. **Deploy**
   - Netlify will automatically deploy on push to main branch

### Option 3: GitHub Pages

1. **Configure GitHub Actions**
   - The repository includes a GitHub Actions workflow
   - It will automatically build and deploy to GitHub Pages

2. **Enable GitHub Pages**
   - Go to repository settings
   - Enable GitHub Pages
   - Select source as GitHub Actions

## Mobile App Deployment

### 1. Build for Android

```bash
cd src/frontend
npx expo build:android
```

### 2. Build for iOS

```bash
cd src/frontend
npx expo build:ios
```

### 3. Deploy to App Stores

1. **Google Play Store**
   - Upload the generated APK/AAB file
   - Fill in store listing details
   - Submit for review

2. **Apple App Store**
   - Upload the generated IPA file
   - Fill in store listing details
   - Submit for review

## Monitoring Setup

### 1. Application Monitoring

The application includes built-in monitoring capabilities:

- **Health Checks**: `/api/health`
- **Metrics**: `/api/monitoring/metrics/system`
- **Alerts**: `/api/monitoring/alerts`
- **Dashboard**: `/api/monitoring/dashboard`

### 2. External Monitoring

#### Uptime Monitoring
- **UptimeRobot**: Monitor your API endpoints
- **Pingdom**: Monitor website availability
- **StatusCake**: Monitor service health

#### Error Tracking
- **Sentry**: Track and monitor errors
- **Bugsnag**: Real-time error monitoring
- **Rollbar**: Error tracking and monitoring

#### Log Management
- **LogRocket**: Session replay and logging
- **Papertrail**: Log management and analysis
- **LogDNA**: Centralized logging

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues

**Problem**: Cannot connect to database
**Solution**:
```bash
# Check database URL
echo $DATABASE_URL

# Test connection
npx prisma db pull

# Reset database
npx prisma migrate reset
```

#### 2. Environment Variables Not Loading

**Problem**: Environment variables not available
**Solution**:
```bash
# Check if .env file exists
ls -la .env*

# Load environment variables
source .env.production

# Verify variables
echo $JWT_SECRET
```

#### 3. Build Failures

**Problem**: Build fails during deployment
**Solution**:
```bash
# Clear node_modules
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# Check for TypeScript errors
npx tsc --noEmit

# Run tests locally
npm test
```

#### 4. CORS Issues

**Problem**: CORS errors in browser
**Solution**:
```bash
# Check CORS_ORIGIN environment variable
echo $CORS_ORIGIN

# Update CORS configuration
# In src/backend/src/index.ts
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true
};
```

#### 5. Memory Issues

**Problem**: Application runs out of memory
**Solution**:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Monitor memory usage
node --inspect src/backend/dist/index.js
```

### Debugging Commands

```bash
# Check application status
curl http://localhost:3000/api/health

# Check database connection
npx prisma db pull

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Check logs
docker logs property_management_backend

# Monitor resources
docker stats
```

### Performance Optimization

1. **Database Optimization**
   - Add indexes for frequently queried columns
   - Use connection pooling
   - Optimize queries

2. **Caching**
   - Implement Redis caching
   - Use CDN for static assets
   - Enable browser caching

3. **Code Optimization**
   - Use compression middleware
   - Optimize images
   - Minify JavaScript and CSS

## Security Checklist

- [ ] Environment variables are secure
- [ ] Database has proper access controls
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Input validation is implemented
- [ ] SQL injection protection is in place
- [ ] XSS protection is enabled
- [ ] CSRF protection is implemented
- [ ] Security headers are set
- [ ] Regular security updates
- [ ] Monitoring and alerting setup

## Backup Strategy

1. **Database Backups**
   - Automated daily backups
   - Point-in-time recovery
   - Cross-region replication

2. **Code Backups**
   - Git repository backups
   - Regular commits
   - Branch protection

3. **File Backups**
   - S3 bucket versioning
   - Cross-region replication
   - Regular snapshots

## Scaling Considerations

1. **Horizontal Scaling**
   - Load balancers
   - Multiple instances
   - Database read replicas

2. **Vertical Scaling**
   - Increase server resources
   - Optimize application code
   - Database optimization

3. **Caching Strategy**
   - Redis caching
   - CDN implementation
   - Browser caching

## Maintenance

1. **Regular Updates**
   - Dependencies updates
   - Security patches
   - Feature updates

2. **Monitoring**
   - Performance monitoring
   - Error tracking
   - Resource monitoring

3. **Backups**
   - Regular backups
   - Disaster recovery testing
   - Data integrity checks

## Support

For deployment issues:

1. Check the logs
2. Review the troubleshooting section
3. Check the GitHub issues
4. Contact support

## Conclusion

This deployment guide provides comprehensive instructions for deploying the Property Management Software to various cloud providers. Follow the steps carefully and refer to the troubleshooting section if you encounter any issues.

Remember to:
- Keep your environment variables secure
- Monitor your application regularly
- Keep your dependencies updated
- Test your deployment thoroughly
- Have a backup strategy in place
