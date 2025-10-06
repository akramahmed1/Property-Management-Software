# Deployment Guide

## Overview

This guide covers deploying the Property Management Software MVP to production using free cloud providers. The deployment strategy includes:

- **Frontend**: Vercel/Netlify (PWA)
- **Backend**: Render/Railway (Node.js)
- **Database**: Supabase (PostgreSQL)
- **CDN**: Cloudflare (free tier)

## Prerequisites

- GitHub repository with the project
- Accounts on deployment platforms
- Domain name (optional)

## Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Vercel)      │◄──►│   (Render)      │◄──►│   (Supabase)    │
│   PWA/Web       │    │   Node.js API   │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN           │    │   Redis         │    │   File Storage  │
│   (Cloudflare)  │    │   (Redis Cloud) │    │   (AWS S3)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Phase 1: Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Choose organization
5. Enter project details:
   - **Name**: property-management-db
   - **Database Password**: Generate strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"

### 2. Configure Database

1. **Get Connection String**
   - Go to Settings → Database
   - Copy the connection string
   - Format: `postgresql://postgres:[password]@[host]:5432/postgres`

2. **Run Migrations**
   ```bash
   # Set production database URL
   export DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
   
   # Run migrations
   cd src/backend
   npm run db:migrate:prod
   
   # Seed database
   npm run db:seed:prod
   ```

3. **Configure Row Level Security (RLS)**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
   ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
   
   -- Create policies (example for users table)
   CREATE POLICY "Users can view own data" ON users
     FOR SELECT USING (auth.uid()::text = id);
   
   CREATE POLICY "Users can update own data" ON users
     FOR UPDATE USING (auth.uid()::text = id);
   ```

### 3. Set Up File Storage

1. **Enable Storage**
   - Go to Storage in Supabase dashboard
   - Click "Create a new bucket"
   - Name: `property-files`
   - Make it public: Yes

2. **Configure Storage Policies**
   ```sql
   -- Allow authenticated users to upload files
   CREATE POLICY "Authenticated users can upload files" ON storage.objects
     FOR INSERT WITH CHECK (auth.role() = 'authenticated');
   
   -- Allow public access to files
   CREATE POLICY "Public files are viewable by everyone" ON storage.objects
     FOR SELECT USING (bucket_id = 'property-files');
   ```

## Phase 2: Backend Deployment (Render)

### 1. Create Render Service

1. Go to [Render](https://render.com)
2. Sign up/Login with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure service:
   - **Name**: property-management-api
   - **Branch**: main
   - **Root Directory**: src/backend
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### 2. Configure Environment Variables

Add these environment variables in Render dashboard:

```env
# Database
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# Redis (use Redis Cloud free tier)
REDIS_URL=redis://[username]:[password]@[host]:[port]

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here

# CORS
CORS_ORIGIN=https://your-frontend-domain.vercel.app

# API Keys
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Email (use Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Storage (AWS S3 free tier)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1

# Monitoring
NODE_ENV=production
LOG_LEVEL=info
```

### 3. Deploy Backend

1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note the service URL (e.g., `https://property-management-api.onrender.com`)

### 4. Test Backend

```bash
# Test health endpoint
curl https://your-backend-url.onrender.com/health

# Test API documentation
open https://your-backend-url.onrender.com/api-docs
```

## Phase 3: Frontend Deployment (Vercel)

### 1. Create Vercel Project

1. Go to [Vercel](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure project:
   - **Framework Preset**: Next.js (or custom)
   - **Root Directory**: src/frontend
   - **Build Command**: `npm run build`
   - **Output Directory**: dist

### 2. Configure Environment Variables

Add these environment variables in Vercel dashboard:

```env
# API Configuration
EXPO_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
EXPO_PUBLIC_WS_URL=https://your-backend-url.onrender.com

# App Configuration
EXPO_PUBLIC_APP_NAME=Property Management
EXPO_PUBLIC_APP_VERSION=1.0.0

# Feature Flags
EXPO_PUBLIC_OFFLINE_MODE=true
EXPO_PUBLIC_PUSH_NOTIFICATIONS=true
```

### 3. Deploy Frontend

1. Click "Deploy"
2. Wait for deployment to complete
3. Note the frontend URL (e.g., `https://property-management.vercel.app`)

### 4. Configure PWA

1. **Update manifest.json**
   ```json
   {
     "name": "Property Management",
     "short_name": "PropMgmt",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#ffffff",
     "theme_color": "#000000",
     "icons": [
       {
         "src": "/icon-192.png",
         "sizes": "192x192",
         "type": "image/png"
       }
     ]
   }
   ```

2. **Update service worker**
   - Ensure offline functionality works
   - Cache API responses
   - Handle background sync

## Phase 4: Mobile App Deployment

### 1. Expo Build Service

1. **Install EAS CLI**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure EAS**
   ```bash
   cd src/frontend
   eas build:configure
   ```

4. **Build for Android**
   ```bash
   eas build --platform android --profile production
   ```

5. **Build for iOS**
   ```bash
   eas build --platform ios --profile production
   ```

### 2. App Store Deployment

1. **Google Play Store**
   - Upload APK to Google Play Console
   - Fill in store listing details
   - Submit for review

2. **Apple App Store**
   - Upload IPA to App Store Connect
   - Fill in app information
   - Submit for review

## Phase 5: CDN and Performance (Cloudflare)

### 1. Set Up Cloudflare

1. Go to [Cloudflare](https://cloudflare.com)
2. Add your domain
3. Update DNS records to point to Vercel

### 2. Configure Caching

1. **Page Rules**
   - Cache static assets: `*.css`, `*.js`, `*.png`, `*.jpg`
   - Cache API responses: `/api/*` (with appropriate TTL)

2. **Browser Cache TTL**
   - Static assets: 1 year
   - API responses: 5 minutes
   - HTML pages: 1 hour

## Phase 6: Monitoring and Analytics

### 1. Application Monitoring

1. **Render Monitoring**
   - Built-in metrics and logs
   - Set up alerts for downtime

2. **Vercel Analytics**
   - Enable Vercel Analytics
   - Monitor performance metrics

### 2. Database Monitoring

1. **Supabase Dashboard**
   - Monitor database performance
   - Check query performance
   - Set up alerts

### 3. Error Tracking

1. **Sentry (Free Tier)**
   ```bash
   # Install Sentry
   npm install @sentry/node @sentry/react-native
   
   # Configure in backend
   import * as Sentry from '@sentry/node';
   Sentry.init({ dsn: 'your-sentry-dsn' });
   ```

## Phase 7: Security Configuration

### 1. SSL/TLS Certificates

- Vercel: Automatic SSL
- Render: Automatic SSL
- Supabase: Automatic SSL

### 2. Security Headers

1. **Backend (Helmet.js)**
   ```typescript
   app.use(helmet({
     contentSecurityPolicy: {
       directives: {
         defaultSrc: ["'self'"],
         styleSrc: ["'self'", "'unsafe-inline'"],
         scriptSrc: ["'self'"],
         imgSrc: ["'self'", "data:", "https:"],
       },
     },
   }));
   ```

2. **Frontend (Vercel)**
   - Configure security headers in `vercel.json`

### 3. Rate Limiting

1. **Backend Rate Limiting**
   ```typescript
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
   });
   ```

2. **Cloudflare Rate Limiting**
   - Set up rate limiting rules
   - Block suspicious traffic

## Phase 8: Backup and Recovery

### 1. Database Backups

1. **Supabase Backups**
   - Automatic daily backups
   - Point-in-time recovery
   - Manual backup exports

2. **Manual Backup Script**
   ```bash
   #!/bin/bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

### 2. File Storage Backups

1. **AWS S3 Cross-Region Replication**
   - Set up replication to another region
   - Versioning enabled

### 3. Code Backups

1. **GitHub Repository**
   - Regular commits
   - Tagged releases
   - Branch protection rules

## Phase 9: Performance Optimization

### 1. Database Optimization

1. **Indexes**
   ```sql
   -- Add indexes for common queries
   CREATE INDEX idx_properties_city ON properties(city);
   CREATE INDEX idx_properties_status ON properties(status);
   CREATE INDEX idx_bookings_customer ON bookings(customer_id);
   ```

2. **Query Optimization**
   - Use EXPLAIN ANALYZE
   - Optimize N+1 queries
   - Implement pagination

### 2. API Optimization

1. **Caching**
   ```typescript
   // Redis caching
   const cacheKey = `properties:${JSON.stringify(filters)}`;
   const cached = await redis.get(cacheKey);
   if (cached) return JSON.parse(cached);
   
   const result = await getPropertiesFromDB(filters);
   await redis.setex(cacheKey, 300, JSON.stringify(result));
   return result;
   ```

2. **Compression**
   ```typescript
   app.use(compression());
   ```

### 3. Frontend Optimization

1. **Code Splitting**
   ```typescript
   const PropertyScreen = lazy(() => import('./screens/PropertyScreen'));
   ```

2. **Image Optimization**
   - Use WebP format
   - Implement lazy loading
   - Responsive images

## Troubleshooting

### Common Deployment Issues

1. **Build Failures**
   ```bash
   # Check build logs
   # Common issues:
   # - Missing environment variables
   # - TypeScript errors
   # - Dependency conflicts
   ```

2. **Database Connection Issues**
   ```bash
   # Test connection
   psql $DATABASE_URL
   
   # Check SSL requirements
   # Supabase requires SSL connections
   ```

3. **CORS Issues**
   ```typescript
   // Update CORS configuration
   app.use(cors({
     origin: ['https://your-frontend.vercel.app'],
     credentials: true
   }));
   ```

### Performance Issues

1. **Slow API Responses**
   - Check database queries
   - Implement caching
   - Optimize images

2. **High Memory Usage**
   - Check for memory leaks
   - Optimize data structures
   - Implement pagination

### Security Issues

1. **Exposed Secrets**
   - Never commit .env files
   - Use environment variables
   - Rotate secrets regularly

2. **SQL Injection**
   - Use parameterized queries
   - Validate all inputs
   - Use Prisma ORM

## Maintenance

### Regular Tasks

1. **Weekly**
   - Check application logs
   - Monitor performance metrics
   - Review security alerts

2. **Monthly**
   - Update dependencies
   - Review and rotate secrets
   - Backup verification

3. **Quarterly**
   - Security audit
   - Performance review
   - Disaster recovery test

### Updates and Patches

1. **Dependency Updates**
   ```bash
   # Check for updates
   npm outdated
   
   # Update dependencies
   npm update
   
   # Test thoroughly before deploying
   ```

2. **Security Patches**
   - Monitor security advisories
   - Apply patches promptly
   - Test in staging first

## Cost Optimization

### Free Tier Limits

1. **Vercel**
   - 100GB bandwidth/month
   - 100 serverless function executions
   - Unlimited static sites

2. **Render**
   - 750 hours/month
   - 512MB RAM
   - Sleeps after 15 minutes of inactivity

3. **Supabase**
   - 500MB database
   - 1GB file storage
   - 2GB bandwidth

### Scaling Considerations

1. **When to Upgrade**
   - Exceed free tier limits
   - Performance requirements
   - Business growth

2. **Cost-Effective Scaling**
   - Optimize before scaling
   - Use CDN for static assets
   - Implement caching strategies

## Support

For deployment issues:
- Check platform documentation
- Review logs and error messages
- Contact platform support
- Create issues in repository