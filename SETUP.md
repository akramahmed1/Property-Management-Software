# Property Management Software - Setup Instructions

## Quick Start Guide

This guide will help you set up and run the Property Management Software MVP locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **Git**
- **Expo CLI** (for mobile development)
- **Cursor AI** (recommended for development)

## Installation Steps

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd property-management-software
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# This will automatically install dependencies for all sub-projects
# Backend: src/backend/node_modules
# Frontend: src/frontend/node_modules
# Tests: tests/node_modules
```

### 3. Database Setup

#### Option A: Local PostgreSQL
```bash
# Create database
createdb property_management

# Set up environment variables
cp env.example .env
# Edit .env with your database credentials
```

#### Option B: Docker (Recommended)
```bash
# Start PostgreSQL and Redis with Docker
docker-compose up postgres redis -d
```

### 4. Backend Setup

```bash
cd src/backend

# Install dependencies (if not already done)
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database
npx prisma db seed

# Start the backend server
npm run dev
```

The backend will be available at `http://localhost:3000`
API documentation: `http://localhost:3000/api-docs`

### 5. Frontend Setup

```bash
cd src/frontend

# Install dependencies (if not already done)
npm install

# Start the development server
npm start
```

The frontend will be available at `http://localhost:3001`

### 6. Mobile App Setup

```bash
cd src/frontend

# Install Expo CLI globally (if not already installed)
npm install -g @expo/cli

# Start Expo development server
npx expo start
```

Scan the QR code with Expo Go app on your mobile device.

## Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Backend tests
npm run test:backend

# Frontend tests
npm run test:frontend

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Test Coverage
```bash
npm run test:coverage
```

## Development Commands

### Backend Commands
```bash
cd src/backend

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npm run db:migrate
npm run db:seed
npm run db:studio

# Linting
npm run lint
npm run lint:fix
```

### Frontend Commands
```bash
cd src/frontend

# Development server
npm start

# Build for production
npm run build

# Mobile development
npx expo start
npx expo start --android
npx expo start --ios

# Linting
npm run lint
npm run lint:fix
```

## Environment Configuration

### Backend Environment Variables
Create `src/backend/.env`:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/property_management
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### Frontend Environment Variables
Create `src/frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_APP_NAME=Property Management
REACT_APP_VERSION=1.0.0
```

## Default Login Credentials

After seeding the database, you can use these credentials:

- **Super Admin**: admin@propertymanagement.com / admin123
- **Manager**: manager@propertymanagement.com / manager123
- **Agent**: agent@propertymanagement.com / agent123

## Project Structure

```
property-management-software/
├── docs/                    # Documentation
├── src/
│   ├── backend/            # Node.js API server
│   ├── frontend/           # React Native app
│   └── locales/            # i18n files (English/Arabic)
├── tests/                  # Test suites
├── db/                     # Database files
├── docker-compose.yml      # Docker configuration
└── package.json           # Root package.json
```

## API Endpoints

- **Health Check**: `GET /health`
- **Authentication**: `POST /api/auth/login`, `POST /api/auth/register`
- **Properties**: `GET /api/properties`, `POST /api/properties`
- **API Documentation**: `http://localhost:3000/api-docs`

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Run `npx prisma migrate dev` to create tables

2. **Port Already in Use**
   - Change ports in `.env` files
   - Kill existing processes: `lsof -ti:3000 | xargs kill -9`

3. **Expo Issues**
   - Clear Expo cache: `npx expo start -c`
   - Update Expo CLI: `npm install -g @expo/cli@latest`

4. **Build Errors**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js version: `node --version`

### Getting Help

1. Check the logs in `logs/` directory
2. Review error messages in terminal
3. Check API documentation at `/api-docs`
4. Refer to the main README.md for detailed information

## Next Steps

1. **Customize the application** for your specific needs
2. **Add more features** based on the PRD roadmap
3. **Deploy to production** using the deployment guide
4. **Set up CI/CD** for automated testing and deployment

## Support

For support and questions:
- Check the documentation in `/docs`
- Review the API documentation
- Create an issue in the repository

Happy coding! 🚀
