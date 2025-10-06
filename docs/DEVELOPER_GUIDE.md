# Developer Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Development Environment](#development-environment)
4. [Code Standards](#code-standards)
5. [Database Management](#database-management)
6. [API Development](#api-development)
7. [Frontend Development](#frontend-development)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **PostgreSQL**: 14.0 or higher
- **Redis**: 6.0 or higher
- **Git**: Latest version
- **VS Code**: Recommended with Cursor AI extension

### Initial Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd property-management-software
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Configure the following environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/property_management"
   
   # Redis
   REDIS_URL="redis://localhost:6379"
   
   # JWT
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_REFRESH_SECRET="your-refresh-secret-key"
   
   # API Keys
   RAZORPAY_KEY_ID="your-razorpay-key"
   RAZORPAY_KEY_SECRET="your-razorpay-secret"
   
   # Email
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   
   # File Storage
   AWS_ACCESS_KEY_ID="your-aws-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret"
   AWS_S3_BUCKET="your-bucket-name"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Seed database
   npm run db:seed
   ```

5. **Start Development Servers**
   ```bash
   # Start all services
   npm run dev
   
   # Or start individually
   npm run dev:backend    # Backend API (port 3000)
   npm run dev:frontend   # React Native (Expo)
   ```

## Project Structure

```
property-management-software/
├── docs/                           # Documentation
├── src/
│   ├── backend/                    # Node.js Backend
│   │   ├── src/
│   │   │   ├── config/            # Configuration files
│   │   │   │   ├── database.ts    # Database connection
│   │   │   │   ├── redis.ts       # Redis connection
│   │   │   │   └── monitoring.ts  # Monitoring config
│   │   │   ├── controllers/       # API Controllers
│   │   │   │   ├── authController.ts
│   │   │   │   ├── propertyController.ts
│   │   │   │   ├── crmController.ts
│   │   │   │   └── erpController.ts
│   │   │   ├── middleware/        # Express Middleware
│   │   │   │   ├── auth.ts        # Authentication
│   │   │   │   ├── errorHandler.ts
│   │   │   │   └── notFound.ts
│   │   │   ├── routes/            # API Routes
│   │   │   │   ├── auth.ts
│   │   │   │   ├── properties.ts
│   │   │   │   ├── crm.ts
│   │   │   │   └── erp.ts
│   │   │   ├── services/          # Business Logic
│   │   │   │   ├── authService.ts
│   │   │   │   ├── propertyService.ts
│   │   │   │   ├── paymentService.ts
│   │   │   │   └── notificationService.ts
│   │   │   └── utils/             # Utilities
│   │   │       └── logger.ts
│   │   ├── prisma/                # Database Schema
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── frontend/                  # React Native Frontend
│   │   ├── src/
│   │   │   ├── navigation/        # Navigation Setup
│   │   │   ├── screens/           # App Screens
│   │   │   │   ├── auth/          # Authentication screens
│   │   │   │   └── main/          # Main app screens
│   │   │   ├── services/          # API Services
│   │   │   │   ├── apiService.ts
│   │   │   │   ├── offlineService.ts
│   │   │   │   └── syncService.ts
│   │   │   ├── store/             # Redux Store
│   │   │   │   ├── index.ts
│   │   │   │   └── slices/        # Redux Slices
│   │   │   ├── theme/             # UI Theme
│   │   │   └── utils/             # Utilities
│   │   ├── App.tsx
│   │   └── package.json
│   └── locales/                   # Internationalization
│       ├── en.json
│       └── ar.json
├── tests/                         # Test Suites
│   ├── unit/                      # Unit Tests
│   ├── integration/               # Integration Tests
│   └── e2e/                       # End-to-End Tests
├── scripts/                       # Utility Scripts
├── package.json
└── README.md
```

## Development Environment

### VS Code Setup

1. **Install Extensions**
   - Cursor AI (for AI-assisted development)
   - Prisma (for database schema)
   - TypeScript (for type checking)
   - ESLint (for code linting)
   - Prettier (for code formatting)

2. **Workspace Settings**
   Create `.vscode/settings.json`:
   ```json
   {
     "typescript.preferences.importModuleSpecifier": "relative",
     "editor.formatOnSave": true,
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     },
     "prisma.showPrismaDataPlatformNotification": false
   }
   ```

### Database Management

#### Prisma Commands

```bash
# Generate Prisma client
npx prisma generate

# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Seed database
npx prisma db seed
```

#### Database Schema Changes

1. **Modify Schema**: Edit `src/backend/prisma/schema.prisma`
2. **Create Migration**: `npx prisma migrate dev --name your_migration_name`
3. **Update Client**: `npx prisma generate`
4. **Test Changes**: Run tests to ensure compatibility

### Redis Management

```bash
# Start Redis server
redis-server

# Connect to Redis CLI
redis-cli

# Monitor Redis
redis-cli monitor
```

## Code Standards

### TypeScript Guidelines

1. **Type Safety**
   ```typescript
   // Use strict typing
   interface User {
     id: string;
     name: string;
     email: string;
   }
   
   // Avoid any type
   const user: User = await getUserById(id);
   ```

2. **Error Handling**
   ```typescript
   try {
     const result = await riskyOperation();
     return { success: true, data: result };
   } catch (error) {
     logger.error('Operation failed:', error);
     return { success: false, error: error.message };
   }
   ```

3. **Async/Await**
   ```typescript
   // Prefer async/await over promises
   const fetchUser = async (id: string): Promise<User> => {
     const user = await prisma.user.findUnique({ where: { id } });
     if (!user) throw new Error('User not found');
     return user;
   };
   ```

### API Development Standards

1. **Controller Structure**
   ```typescript
   export class PropertyController {
     async getProperties(req: Request, res: Response) {
       try {
         const { page = 1, limit = 10, ...filters } = req.query;
         const properties = await propertyService.getProperties({
           page: Number(page),
           limit: Number(limit),
           ...filters
         });
         
         res.json({
           success: true,
           data: properties
         });
       } catch (error) {
         res.status(500).json({
           success: false,
           error: error.message
         });
       }
     }
   }
   ```

2. **Service Layer**
   ```typescript
   export class PropertyService {
     async getProperties(options: GetPropertiesOptions) {
       const { page, limit, ...filters } = options;
       
       const [properties, total] = await Promise.all([
         prisma.property.findMany({
           where: filters,
           skip: (page - 1) * limit,
           take: limit,
           include: { createdBy: true }
         }),
         prisma.property.count({ where: filters })
       ]);
       
       return {
         properties,
         pagination: {
           page,
           limit,
           total,
           pages: Math.ceil(total / limit)
         }
       };
     }
   }
   ```

3. **Validation**
   ```typescript
   import Joi from 'joi';
   
   const createPropertySchema = Joi.object({
     name: Joi.string().required(),
     type: Joi.string().valid('APARTMENT', 'VILLA', 'PLOT').required(),
     price: Joi.number().positive().required(),
     // ... other fields
   });
   
   const validateCreateProperty = (req: Request, res: Response, next: NextFunction) => {
     const { error } = createPropertySchema.validate(req.body);
     if (error) {
       return res.status(400).json({
         success: false,
         error: error.details[0].message
       });
     }
     next();
   };
   ```

### Frontend Development Standards

1. **Component Structure**
   ```typescript
   interface PropertyCardProps {
     property: Property;
     onPress: (property: Property) => void;
   }
   
   export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onPress }) => {
     return (
       <Card onPress={() => onPress(property)}>
         <Card.Content>
           <Title>{property.name}</Title>
           <Paragraph>{property.description}</Paragraph>
         </Card.Content>
       </Card>
     );
   };
   ```

2. **Redux Slice**
   ```typescript
   const propertySlice = createSlice({
     name: 'properties',
     initialState: {
       properties: [],
       loading: false,
       error: null
     },
     reducers: {
       setProperties: (state, action) => {
         state.properties = action.payload;
       },
       setLoading: (state, action) => {
         state.loading = action.payload;
       }
     }
   });
   ```

3. **API Service**
   ```typescript
   class ApiService {
     private baseURL = process.env.EXPO_PUBLIC_API_URL;
     
     async getProperties(params?: GetPropertiesParams) {
       const response = await fetch(`${this.baseURL}/properties?${new URLSearchParams(params)}`);
       const data = await response.json();
       
       if (!data.success) {
         throw new Error(data.error.message);
       }
       
       return data.data;
     }
   }
   ```

## Testing

### Unit Tests

```typescript
// tests/unit/propertyService.test.ts
describe('PropertyService', () => {
  let propertyService: PropertyService;
  
  beforeEach(() => {
    propertyService = new PropertyService();
  });
  
  it('should get properties with pagination', async () => {
    const result = await propertyService.getProperties({
      page: 1,
      limit: 10
    });
    
    expect(result.properties).toBeDefined();
    expect(result.pagination.page).toBe(1);
  });
});
```

### Integration Tests

```typescript
// tests/integration/properties.test.ts
describe('Properties API', () => {
  it('should get properties list', async () => {
    const response = await request(app)
      .get('/api/properties')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.properties).toBeDefined();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Deployment

### Environment Setup

1. **Production Environment Variables**
   ```env
   NODE_ENV=production
   DATABASE_URL=postgresql://user:pass@host:5432/db
   REDIS_URL=redis://host:6379
   JWT_SECRET=production-secret
   ```

2. **Build Applications**
   ```bash
   npm run build
   ```

### Backend Deployment (Render)

1. **Create Render Service**
   - Connect GitHub repository
   - Set build command: `npm run build:backend`
   - Set start command: `npm start`
   - Set environment variables

2. **Database Setup**
   - Use Supabase PostgreSQL
   - Run migrations: `npm run db:migrate:prod`
   - Seed data: `npm run db:seed:prod`

### Frontend Deployment (Vercel)

1. **Create Vercel Project**
   - Connect GitHub repository
   - Set build command: `npm run build:frontend`
   - Set output directory: `src/frontend/dist`

2. **Environment Variables**
   - Set API URL
   - Set other required variables

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database status
   pg_isready -h localhost -p 5432
   
   # Reset database
   npm run db:migrate:reset
   ```

2. **Redis Connection Issues**
   ```bash
   # Check Redis status
   redis-cli ping
   
   # Restart Redis
   sudo systemctl restart redis
   ```

3. **Port Conflicts**
   ```bash
   # Check port usage
   lsof -i :3000
   
   # Kill process
   kill -9 <PID>
   ```

4. **Dependency Issues**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Delete node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

### Debug Mode

1. **Backend Debug**
   ```bash
   DEBUG=* npm run dev:backend
   ```

2. **Frontend Debug**
   ```bash
   REACT_NATIVE_DEBUGGER=true npm run dev:frontend
   ```

### Logs

1. **Application Logs**
   - Backend: Check console output
   - Frontend: Check Expo logs

2. **Database Logs**
   ```bash
   # PostgreSQL logs
   tail -f /var/log/postgresql/postgresql-14-main.log
   ```

3. **Redis Logs**
   ```bash
   # Redis logs
   tail -f /var/log/redis/redis-server.log
   ```

## Best Practices

1. **Code Quality**
   - Write meaningful commit messages
   - Use TypeScript strict mode
   - Follow ESLint rules
   - Write comprehensive tests

2. **Security**
   - Never commit secrets
   - Use environment variables
   - Validate all inputs
   - Implement proper authentication

3. **Performance**
   - Use database indexes
   - Implement caching
   - Optimize queries
   - Monitor performance

4. **Documentation**
   - Document APIs
   - Write README files
   - Add code comments
   - Keep documentation updated

## Support

For development support:
- Check existing issues in the repository
- Create new issues for bugs or features
- Contact the development team
- Review the API documentation