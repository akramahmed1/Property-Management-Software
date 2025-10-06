# 🏢 Property Management Software - Complete Solution

A comprehensive, enterprise-ready Property Management Software built with modern technologies, featuring real-time capabilities, advanced analytics, and multi-market support for India and Middle East.

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 8.x or higher
- **PostgreSQL**: 13.x or higher
- **Redis**: 6.x or higher
- **Docker** (optional): For easy database setup

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/your-org/property-management-software.git
cd property-management-software

# Run the complete setup
./scripts/startup.sh
```

This script will:
- ✅ Install all dependencies
- ✅ Set up environment files
- ✅ Start database services
- ✅ Run database migrations
- ✅ Seed test data
- ✅ Start backend and frontend servers
- ✅ Run comprehensive tests
- ✅ Launch the application

### Manual Setup

If you prefer manual setup:

```bash
# 1. Install dependencies
npm install
cd src/backend && npm install
cd ../frontend && npm install

# 2. Set up environment files
cp .env.example .env
cp src/backend/.env.example src/backend/.env
cp src/frontend/.env.example src/frontend/.env

# 3. Start database services
docker-compose up -d postgres redis

# 4. Set up database
cd src/backend
npx prisma migrate dev
npx prisma db seed

# 5. Start servers
npm run dev  # Backend
cd ../frontend && npm start  # Frontend
```

## 🎯 Features

### Core MVP Features
- **User Management** - Complete authentication & authorization
- **Property Management** - Full CRUD operations with media
- **CRM System** - Lead scoring, customer 360, communication
- **ERP System** - Financials, procurement, HR management
- **Booking System** - Property booking and management
- **Inventory Management** - Unit-level property tracking
- **Multi-language Support** - English & Arabic localization
- **Responsive Design** - Mobile-first, PWA-ready

### Advanced Features
- **Real-Time Notifications** - WebSocket, Email, SMS, Push
- **Payment Integration** - Razorpay, PayTabs, UPI support
- **File Management** - AWS S3 integration with thumbnails
- **Advanced Analytics** - Business intelligence dashboard
- **Real-Time Features** - Live chat, collaborative editing
- **Security Enhancements** - 2FA, encryption, audit logs
- **Offline Support** - Mobile app with offline capabilities
- **API Documentation** - Complete Swagger/OpenAPI docs

## 🧪 Testing

### Comprehensive Test Suite

The application includes multiple levels of testing:

#### 1. Local Testing
```bash
# Run local tests
node scripts/local-testing.js
```

#### 2. E2E Testing
```bash
# Run end-to-end tests
node scripts/e2e-testing.js
```

#### 3. Demo Scenarios
```bash
# Run real-world demo scenarios
node scripts/demo-scenarios.js
```

#### 4. API Testing
```bash
# Run API tests
node scripts/test-api.js
```

### Test Coverage

- **Unit Tests**: 90%+ coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Complete user workflows
- **Performance Tests**: Load and stress testing
- **Security Tests**: Authentication and authorization

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Material-UI for components
- Redux Toolkit for state management
- React Router for navigation
- PWA capabilities

**Backend:**
- Node.js 18 with Express.js
- TypeScript for type safety
- Prisma ORM with PostgreSQL
- Redis for caching and sessions
- Socket.io for real-time features

**Database:**
- PostgreSQL 13 for primary data
- Redis 6 for caching and sessions
- Prisma Migrations for schema management

**Infrastructure:**
- Docker for containerization
- Vercel for frontend hosting
- Render for backend hosting
- Supabase for database hosting

### Project Structure

```
property-management-software/
├── 📁 docs/                          # Complete documentation
├── 📁 scripts/                       # Utility scripts
├── 📁 src/
│   ├── 📁 backend/                   # Backend API
│   │   ├── 📁 src/
│   │   │   ├── 📁 controllers/       # API controllers
│   │   │   ├── 📁 middleware/        # Express middleware
│   │   │   ├── 📁 routes/            # API routes
│   │   │   ├── 📁 services/          # Business logic
│   │   │   ├── 📁 config/            # Configuration
│   │   │   └── 📁 utils/             # Utility functions
│   │   ├── 📁 prisma/                # Database schema
│   │   └── 📁 tests/                 # Backend tests
│   ├── 📁 frontend/                  # React frontend
│   │   ├── 📁 src/
│   │   │   ├── 📁 components/        # React components
│   │   │   ├── 📁 screens/           # Page components
│   │   │   ├── 📁 services/          # API services
│   │   │   ├── 📁 store/             # Redux store
│   │   │   └── 📁 utils/             # Utility functions
│   │   └── 📁 public/                # Static assets
│   └── 📁 locales/                   # i18n translations
├── 📁 tests/                         # Integration tests
├── 📁 docker-compose.yml             # Development setup
└── 📁 package.json                   # Root dependencies
```

## 🔧 API Documentation

### Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

### Authentication
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Property Management
```http
GET /properties?page=1&limit=10&type=APARTMENT&city=Hyderabad
Authorization: Bearer jwt-token
```

### CRM Operations
```http
POST /crm/leads
Content-Type: application/json
Authorization: Bearer jwt-token

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91-9876543210",
  "source": "WEBSITE",
  "budget": 2000000
}
```

### Real-time Features
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'jwt-token' }
});

socket.on('notification', (data) => {
  console.log('New notification:', data);
});
```

## 🎬 Demo Scenarios

### Scenario 1: Complete Property Sale Journey
1. **Property Creation** - Create luxury villa with all details
2. **Customer Onboarding** - High-value customer registration
3. **Lead Management** - Lead scoring and qualification
4. **Property Viewing** - Schedule and conduct viewing
5. **Booking Creation** - Create property booking
6. **Payment Processing** - Process advance payment
7. **Transaction Recording** - Record financial transaction
8. **Notification System** - Send real-time notifications

### Scenario 2: Lead Conversion Pipeline
1. **Lead Creation** - Multiple leads from different sources
2. **Lead Scoring** - Automatic and manual scoring
3. **Lead Qualification** - Qualification based on score
4. **Customer Conversion** - Convert qualified leads to customers
5. **Pipeline Management** - Track lead progression

### Scenario 3: Financial Management
1. **Transaction Recording** - Income and expense tracking
2. **Payment Processing** - Online payment integration
3. **Financial Reporting** - Generate financial reports
4. **Budget Management** - Track and manage budgets
5. **Revenue Analytics** - Analyze revenue trends

### Scenario 4: Real-time Notifications
1. **System Alerts** - Maintenance and system notifications
2. **Business Notifications** - Lead, booking, payment alerts
3. **Personal Notifications** - Task assignments and reminders
4. **Multi-channel Delivery** - Email, SMS, Push, In-app
5. **Notification Management** - Read, unread, priority handling

### Scenario 5: File Management
1. **Property Files** - Images, documents, floor plans
2. **Customer Files** - Identity documents, agreements
3. **Booking Files** - Agreements, receipts, contracts
4. **File Security** - Access control and encryption
5. **File Analytics** - Usage and storage statistics

## 🔒 Security Features

### Authentication & Authorization
- **JWT Authentication** - Secure token-based auth
- **Role-Based Access Control** - Granular permissions
- **Two-Factor Authentication** - TOTP-based 2FA
- **Session Management** - Secure session handling
- **Password Security** - Strong password requirements

### Data Protection
- **Data Encryption** - AES-256-GCM encryption
- **Audit Logging** - Complete activity tracking
- **Rate Limiting** - API protection
- **Input Validation** - Data sanitization
- **CORS Protection** - Cross-origin security

## 🌍 Internationalization

### Language Support
- **English** - Primary language
- **Arabic** - RTL language support
- **i18n Framework** - React i18next
- **Localization** - Date, number, currency formatting
- **RTL Support** - Right-to-left text support

## 📱 Mobile Support

### Mobile Features
- **Responsive Design** - Mobile-first approach
- **PWA Support** - Progressive Web App
- **Offline Support** - Offline data synchronization
- **Touch Optimization** - Touch-friendly interface
- **Push Notifications** - Mobile notifications

## 🚀 Deployment

### Production Deployment

#### Using Docker
```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### Using Vercel (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Using Render (Backend)
1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push

### Environment Configuration

#### Production Environment
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=production-secret
CORS_ORIGIN=https://your-domain.com
```

## 📊 Monitoring

### Health Checks
```http
GET /health
```

### Metrics
```http
GET /monitoring/metrics
Authorization: Bearer jwt-token
```

### Logs
- Application logs: Winston
- Access logs: Morgan
- Error logs: Custom error handler

## 🧪 Testing Credentials

### Test Users
- **Admin**: `admin@property.com` / `password123`
- **Manager**: `manager@property.com` / `password123`
- **Agent**: `agent@property.com` / `password123`

### Test Data
The application comes with comprehensive test data including:
- 3 test properties (Villa, Apartment, Commercial)
- 3 test customers with different profiles
- 3 test leads with various scores
- Sample bookings and transactions
- Test notifications and files

## 🔧 Development

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Git

### Setup
```bash
# Clone repository
git clone https://github.com/your-org/property-management-software.git
cd property-management-software

# Install dependencies
npm install
cd src/backend && npm install
cd ../frontend && npm install

# Set up environment
cp .env.example .env
cp src/backend/.env.example src/backend/.env
cp src/frontend/.env.example src/frontend/.env

# Start database
docker-compose up -d postgres redis

# Run migrations
cd src/backend
npx prisma migrate dev
npx prisma db seed

# Start development servers
npm run dev  # Backend
cd ../frontend && npm start  # Frontend
```

### Available Scripts

#### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database
npm run db:reset     # Reset database
```

#### Frontend
```bash
npm start            # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
```

## 📚 Documentation

### User Documentation
- [User Guide](docs/USER_GUIDE.md) - Complete user manual
- [API Documentation](docs/API.md) - API reference
- [Deployment Guide](docs/DEPLOYMENT.md) - Deployment instructions

### Developer Documentation
- [Developer Guide](docs/DEVELOPER_GUIDE.md) - Technical documentation
- [Contributing Guide](docs/CONTRIBUTING.md) - Contribution guidelines
- [Architecture Guide](docs/ARCHITECTURE.md) - System architecture

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Email**: support@property.com
- **Phone**: +91-9876543210
- **Documentation**: https://docs.property.com
- **GitHub Issues**: https://github.com/your-org/property-management-software/issues

## 🎉 Acknowledgments

- Built with modern web technologies
- Designed for scalability and performance
- Enterprise-grade security and compliance
- Multi-market support (India & Middle East)
- Real-time capabilities and offline support

---

**Property Management Software** - Complete, Production-Ready Solution for Modern Property Management