# Property Management Software MVP

## Overview

A comprehensive Property Management Software MVP designed for India (Hyderabad-focused) and Dubai/Riyadh (Middle East) markets. This all-in-one solution incorporates interactive layouts, inventory management, portals, sales analytics, integrations, and add-ons with integrated CRM and ERP functionalities.

## Key Features

### Core Blindersoe Features
- **Interactive Real-Time Digital Layouts**: 2D/3D layouts with filters (availability, facing, Vastu, amenities)
- **Plot & Apartment Management**: Inventory tracking, construction updates, title/deed management
- **Agent & Customer Portals**: Dashboards, lead tracking, commission management
- **Sales & Analytics**: Booking management, payment processing, reporting
- **Additional Capabilities**: Payment integrations, security, compliance

### CRM Features
- Lead management with scoring
- Customer 360-degree view
- Marketing automation
- Communication tracking

### ERP Features
- Multi-currency financial management
- Procurement alerts
- HR management
- Inventory tracking

### Mobile App Features
- iOS/Android support via React Native
- Offline-first architecture
- Push notifications
- AI-driven onboarding wizard
- Multilingual support (English/Arabic)

## Technology Stack

### Frontend/Mobile
- **Framework**: React Native with Expo
- **State Management**: Redux Toolkit with Redux Persist
- **UI Library**: React Native Paper (Material Design)
- **Navigation**: React Navigation 6
- **Internationalization**: i18next
- **Offline Storage**: SQLite with Redux Persist

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis
- **Real-time**: Socket.io
- **Authentication**: JWT with 2FA support
- **Security**: Helmet, rate limiting, OWASP compliance

### Database
- **Primary**: PostgreSQL (Supabase for production)
- **Offline**: SQLite for mobile
- **Caching**: Redis
- **Features**: RBAC, audit logs, connection pooling

### Deployment
- **Frontend**: Vercel/Netlify (PWA)
- **Backend**: Render/Railway
- **Database**: Supabase (PostgreSQL)
- **CDN**: Cloudflare (free tier)

## Project Structure

```
property-management-software/
├── docs/                    # Documentation
│   ├── API.md              # API documentation
│   ├── CONTRIBUTING.md     # Contribution guidelines
│   ├── DEPLOYMENT.md       # Deployment guide
│   ├── DEVELOPER_GUIDE.md  # Developer setup
│   ├── USER_GUIDE.md       # User manual
│   └── postman/            # Postman collections
├── src/
│   ├── backend/            # Node.js backend
│   │   ├── src/
│   │   │   ├── config/     # Database, Redis config
│   │   │   ├── controllers/# API controllers
│   │   │   ├── middleware/ # Auth, error handling
│   │   │   ├── routes/     # API routes
│   │   │   ├── services/   # Business logic
│   │   │   └── utils/      # Utilities
│   │   └── prisma/         # Database schema
│   ├── frontend/           # React Native app
│   │   ├── src/
│   │   │   ├── navigation/ # Navigation setup
│   │   │   ├── screens/    # App screens
│   │   │   ├── services/   # API services
│   │   │   ├── store/      # Redux store
│   │   │   ├── theme/      # UI theme
│   │   │   └── utils/      # Utilities
│   │   └── public/         # PWA assets
│   └── locales/            # Internationalization
│       ├── en.json         # English translations
│       └── ar.json         # Arabic translations
├── tests/                  # Test suites
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # End-to-end tests
└── scripts/               # Utility scripts
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm 8+
- PostgreSQL 14+
- Redis 6+

### Local Development

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd property-management-software
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your database and API keys
   ```

3. **Database Setup**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start Development Servers**
   ```bash
   # Start all services
   npm run dev
   
   # Or start individually
   npm run dev:backend    # Backend API
   npm run dev:frontend   # React Native
   npm run dev:mobile     # Mobile app
   ```

5. **Access Applications**
   - API: http://localhost:3000
   - API Docs: http://localhost:3000/api-docs
   - Mobile: Expo Go app

### Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### Building for Production

```bash
# Build all applications
npm run build

# Build individually
npm run build:backend
npm run build:frontend
```

## API Documentation

The API documentation is available at `/api-docs` when running the backend server. It includes:

- Authentication endpoints
- Property management APIs
- CRM and ERP endpoints
- Payment processing
- File upload/download
- Real-time notifications

## Security Features

- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Security Headers**: Helmet.js protection
- **Rate Limiting**: Express rate limiting
- **Input Validation**: Joi validation
- **Audit Logging**: Comprehensive audit trails
- **2FA Support**: TOTP-based two-factor authentication

## Offline Support

The mobile app provides comprehensive offline support:

- **Data Caching**: SQLite for local storage
- **Sync Mechanism**: Background sync when online
- **Draft Mode**: Work offline with sync indicators
- **Conflict Resolution**: Automatic conflict resolution

## Internationalization

Currently supports:
- English (en)
- Arabic (ar)

Additional languages can be added by creating new JSON files in `/src/locales/`.

## Performance

- **Load Time**: <2 seconds
- **Concurrent Users**: 100+ users
- **Offline First**: Full functionality offline
- **Caching**: Redis for API responses
- **CDN**: Static asset delivery

## Monitoring and Logging

- **Structured Logging**: Winston with log rotation
- **Error Tracking**: Global error handlers
- **Performance Monitoring**: Request timing
- **Security Events**: Comprehensive security logging

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the [USER_GUIDE.md](USER_GUIDE.md) for user documentation
- Review [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for development setup

## Roadmap

### Q1 2026
- AI Predictive Analytics
- Enhanced mobile features

### Q2 2026
- Blockchain Deeds integration
- Advanced reporting

### Q3 2026
- AR/VR Tours
- Advanced analytics

### Q4 2026
- ESG Scoring
- Voice AI Assistant