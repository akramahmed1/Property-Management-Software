# Comprehensive Property Management Software Repository Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [Complete API Documentation](#complete-api-documentation)
6. [Backend Services](#backend-services)
7. [Frontend Application](#frontend-application)
8. [Features & Capabilities](#features--capabilities)
9. [Security Implementation](#security-implementation)
10. [Deployment](#deployment)
11. [Testing](#testing)

---

## Overview

This is a **comprehensive Property Management Software** designed for the **India and Middle East markets**, featuring:
- Multi-region support (India, UAE, Saudi Arabia, Qatar)
- Multi-language support (English, Arabic with RTL)
- BlinderSøe CRM API integration
- Real-time features via WebSockets
- Offline-first mobile application
- Advanced security features
- Payment gateway integrations (Razorpay, PayTabs)
- AI/ML-powered lead scoring
- 3D property visualization

---

## Architecture

### High-Level Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Native  │────▶│   Backend API   │────▶│   PostgreSQL    │
│    Frontend     │     │   (Express.js)  │     │    Database     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       ├──────────────────────▶│
        │                       │                       │
        │                   ┌───▼────┐            ┌────▼────┐
        │                   │ Redis  │            │   AWS   │
        │                   │ Cache  │            │   S3    │
        │                   └────────┘            └─────────┘
        │
        └──────────────────▶ Socket.IO (Real-time)
```

### Project Structure
```
Property Management Software/
├── src/
│   ├── backend/           # Backend API (Node.js + Express + TypeScript)
│   └── frontend/          # Mobile App (React Native + Expo)
├── shared/                # Shared types and utilities
├── tests/                 # Test suites (Unit, Integration, E2E)
├── docs/                  # Documentation
├── monitoring/            # Prometheus monitoring
├── scripts/               # Utility scripts
└── docker-compose.yml     # Docker configuration
```

---

## Technology Stack

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js v4
- **Language**: TypeScript v5
- **Database ORM**: 
  - Prisma (primary)
  - Drizzle ORM (alternative/migration)
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Real-time**: Socket.IO v4
- **Authentication**: JWT + bcrypt
- **File Storage**: AWS S3 + Multer
- **Payment Gateways**: 
  - Razorpay (India)
  - PayTabs (Middle East)
- **Email**: Nodemailer + SendGrid
- **SMS**: Twilio
- **API Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: React Native 0.73
- **UI Library**: React Native Paper v5
- **State Management**: Redux Toolkit + Redux Persist
- **Navigation**: React Navigation v6
- **Data Fetching**: React Query v3
- **Offline Support**: SQLite + Custom Sync
- **Internationalization**: i18next
- **3D Visualization**: React Native WebView (Three.js)
- **ML/AI**: TensorFlow.js

### DevOps & Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Monitoring**: Prometheus + Grafana
- **CI/CD**: GitHub Actions
- **Deployment Platforms**: 
  - Railway
  - Vercel
  - Render

---

## Database Schema

### Users Table
```typescript
model User {
  id: String (CUID)
  email: String (unique)
  password: String (hashed)
  name: String
  phone: String?
  role: UserRole (SUPER_ADMIN | ADMIN | MANAGER | AGENT | CUSTOMER)
  isActive: Boolean
  isEmailVerified: Boolean
  avatar: String?
  twoFactorSecret: String?
  twoFactorEnabled: Boolean
  backupCodes: String[]
  lastLoginAt: DateTime?
  lastPasswordChange: DateTime?
  passwordResetToken: String?
  passwordResetExpires: DateTime?
  loginAttempts: Int
  lockedUntil: DateTime?
  preferences: Json?
  timezone: String
  language: String
  region: String (INDIA | UAE | SAUDI | QATAR)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Properties Table
```typescript
model Property {
  id: String (UUID)
  name: String
  type: PropertyType (APARTMENT | VILLA | HOUSE | PLOT | COMMERCIAL | OFFICE | SHOP | WAREHOUSE)
  status: PropertyStatus (AVAILABLE | SOLD | RENTED | MAINTENANCE | DRAFT)
  location: String
  address: String
  city: String
  state: String
  country: String
  pincode: String?
  price: Decimal(15,2)
  area: Decimal(10,2)
  bedrooms: Int?
  bathrooms: Int?
  floors: Int?
  facing: String?
  vastu: String?
  amenities: String[]
  features: String[]
  description: String?
  images: String[]
  videos: String[]
  documents: String[]
  floorPlan: String?
  layout3D: String?
  gmapIframe: String?
  coordinates: Json?
  isActive: Boolean
  isFeatured: Boolean
  views: Int
  inquiries: Int
  bookings: Int
  createdAt: DateTime
  updatedAt: DateTime
  createdById: UUID
  updatedById: UUID?
}
```

### Inventory Items Table
```typescript
model InventoryItem {
  id: UUID
  propertyId: UUID
  unitNumber: String
  floor: Int
  block: String?
  status: InventoryStatus
  price: Decimal(15,2)
  area: Decimal(10,2)
  bedrooms: Int?
  bathrooms: Int?
  facing: String?
  vastu: String?
  amenities: String[]
  images: String[]
  floorPlan: String?
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Customers Table
```typescript
model Customer {
  id: UUID
  name: String
  email: String (unique)
  phone: String
  address: String?
  city: String?
  state: String?
  country: String?
  pincode: String?
  dateOfBirth: DateTime?
  occupation: String?
  income: Decimal(15,2)?
  preferences: Json?
  budget: Decimal(15,2)?
  notes: String?
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
  createdById: UUID
  updatedById: UUID?
}
```

### Leads Table (BlinderSøe Integration)
```typescript
model Lead {
  id: UUID
  customerId: UUID?
  name: String
  email: String
  phone: String
  source: LeadSource (WEBSITE | WHATSAPP | PHONE | EMAIL | REFERRAL | WALK_IN | SOCIAL_MEDIA | ADVERTISEMENT | OTHER)
  status: LeadStatus (NEW | CONTACTED | QUALIFIED | PROPOSAL | NEGOTIATION | CLOSED | LOST)
  stage: LeadStage (ENQUIRY_RECEIVED | SITE_VISIT | PROPOSAL_SENT | NEGOTIATION | BOOKING | SOLD | LOST)
  score: Int
  interest: String?
  budget: Decimal(15,2)?
  notes: String?
  assignedTo: UUID?
  stageDateStart: DateTime?
  attachments: String[]
  history: Json[]
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
  createdById: UUID
  updatedById: UUID?
}
```

### Bookings Table (BlinderSøe Integration)
```typescript
model Booking {
  id: UUID
  propertyId: UUID
  inventoryId: UUID?
  customerId: UUID
  agentId: UUID
  status: BookingStatus (PENDING | CONFIRMED | CANCELLED | COMPLETED)
  stage: BookingStage (SOLD | TENTATIVELY_BOOKED | CONFIRMED | CANCELLED)
  bookingDate: DateTime
  moveInDate: DateTime?
  moveOutDate: DateTime?
  amount: Decimal(15,2)
  advanceAmount: Decimal(15,2)?
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  tokenDates: String[]
  notes: String?
  pricingBreakdown: Json
  documents: String[]
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
  createdById: UUID
  updatedById: UUID?
}
```

### Projects Table
```typescript
model Project {
  id: UUID
  name: String
  description: String?
  status: ProjectStatus (UPCOMING | ONGOING | COMPLETED | CANCELLED)
  location: String
  address: String
  city: String
  state: String
  country: String
  pincode: String?
  totalUnits: Int
  availableUnits: Int
  soldUnits: Int
  priceRange: Json
  amenities: String[]
  features: String[]
  images: String[]
  videos: String[]
  documents: String[]
  floorPlan: String?
  layout3D: String?
  gmapIframe: String?
  coordinates: Json?
  isActive: Boolean
  isFeatured: Boolean
  views: Int
  inquiries: Int
  bookings: Int
  createdAt: DateTime
  updatedAt: DateTime
  createdById: UUID
  updatedById: UUID?
}
```

### Additional Tables
- **Payments**: Payment processing records
- **Transactions**: Financial transactions (ERP)
- **Notifications**: User notifications
- **Files**: File management
- **Sessions**: User sessions
- **SecurityEvents**: Security audit logs
- **AuditLog**: System audit trail
- **TwoFactorAuth**: 2FA records
- **RateLimit**: Rate limiting records
- **Webhooks**: Webhook subscriptions
- **WebhookEvents**: Webhook event logs
- **ApiKeys**: API key management
- **Companies**: Multi-region company info

---

## Complete API Documentation

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

### Health Check
```
GET /health
```
Returns server status and uptime.

---

### 1. Authentication APIs (`/api/auth`)

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "phone": "+919876543210",
  "role": "AGENT"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "AGENT"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/login
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

#### GET /auth/me
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

#### POST /auth/refresh
Refresh JWT token.

#### POST /auth/logout
Logout and invalidate session.

---

### 2. Property APIs (`/api/properties`)

#### GET /api/properties
Get list of properties with filtering and pagination.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `type` (PropertyType)
- `status` (PropertyStatus)
- `city` (string)
- `minPrice` (number)
- `maxPrice` (number)
- `search` (string)
- `sort` (string: name | price | createdAt)
- `order` (string: asc | desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Luxury Villa",
      "type": "VILLA",
      "status": "AVAILABLE",
      "price": 50000000,
      "area": 2500,
      "bedrooms": 4,
      "bathrooms": 3,
      "city": "Mumbai",
      "images": ["url1", "url2"],
      "amenities": ["Pool", "Garden"],
      "views": 150,
      "inquiries": 25
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### GET /api/properties/:id
Get property details by ID.

#### POST /api/properties
Create new property (requires SUPER_ADMIN, MANAGER, or AGENT role).

**Request Body:**
```json
{
  "name": "Luxury Villa",
  "type": "VILLA",
  "status": "AVAILABLE",
  "location": "Bandra West",
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "pincode": "400050",
  "price": 50000000,
  "area": 2500,
  "bedrooms": 4,
  "bathrooms": 3,
  "floors": 2,
  "facing": "North",
  "vastu": "Compliant",
  "amenities": ["Swimming Pool", "Garden", "Parking", "Gym"],
  "features": ["24/7 Security", "Power Backup"],
  "description": "Luxurious villa in prime location",
  "images": [],
  "videos": [],
  "documents": [],
  "floorPlan": "url",
  "layout3D": "url",
  "coordinates": {"lat": 19.0760, "lng": 72.8777}
}
```

#### PUT /api/properties/:id
Update property details.

#### DELETE /api/properties/:id
Delete property (requires SUPER_ADMIN or MANAGER role).

---

### 3. Inventory APIs (`/api/inventory`)

#### GET /api/inventory
Get inventory items (placeholder).

---

### 4. CRM APIs (`/api/crm`)

#### GET /api/crm/leads
Get list of leads with filters.

**Query Parameters:**
- `search` (string)
- `status` (LeadStatus)
- `source` (LeadSource)
- `assignedTo` (UUID)
- `page`, `limit`, `sort`, `order`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+919876543210",
      "source": "WEBSITE",
      "status": "NEW",
      "score": 85,
      "interest": "3BHK Apartment",
      "budget": 8000000,
      "assignedTo": "agent_uuid",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "meta": {...}
}
```

#### GET /api/crm/leads/:id
Get lead details by ID.

#### POST /api/crm/leads
Create new lead.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+919876543210",
  "source": "WEBSITE",
  "interest": "3BHK Apartment",
  "budget": 8000000,
  "notes": "Interested in Bandra properties",
  "assignedTo": "agent_uuid"
}
```

#### PUT /api/crm/leads/:id
Update lead details.

#### POST /api/crm/leads/:id/score
Update lead score (AI/ML powered).

#### GET /api/crm/customers
Get list of customers.

#### GET /api/crm/customers/:id
Get customer 360° view with complete history.

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": {...},
    "leads": [...],
    "bookings": [...],
    "payments": [...],
    "properties": [...],
    "totalSpent": 5000000,
    "lifetime": "2 years"
  }
}
```

---

### 5. ERP APIs (`/api/erp`)

#### GET /api/erp/transactions
Get financial transactions.

**Query Parameters:**
- `type` (INCOME | EXPENSE | TRANSFER | REFUND | BOOKING | SALE)
- `category` (string)
- `startDate` (ISO date)
- `endDate` (ISO date)
- `page`, `limit`

#### POST /api/erp/transactions
Create transaction (requires SUPER_ADMIN or MANAGER role).

**Request Body:**
```json
{
  "type": "INCOME",
  "category": "Booking Payment",
  "amount": 500000,
  "currency": "INR",
  "description": "Advance payment for Villa #123",
  "reference": "BOOK-2024-001",
  "date": "2024-01-15T10:00:00Z"
}
```

#### PUT /api/erp/transactions/:id
Update transaction.

#### GET /api/erp/financials
Get financial summary.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalIncome": 15000000,
    "totalExpense": 5000000,
    "netProfit": 10000000,
    "pendingPayments": 2000000,
    "monthlyRevenue": [...]
  }
}
```

#### GET /api/erp/payments
Get payment records.

#### GET /api/erp/procurement
Get procurement alerts.

---

### 6. Reports APIs (`/api/reports`)

#### GET /api/reports
Placeholder for reports (to be implemented).

---

### 7. Webhooks APIs (`/api/webhooks`)

#### POST /api/webhooks
Webhook endpoint for external integrations (to be implemented).

---

### 8. Notifications APIs (`/api/notifications`)

#### GET /api/notifications
Get user notifications.

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `unreadOnly` (boolean)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "BOOKING_CREATED",
        "title": "New Booking",
        "message": "A new booking has been created for Villa #123",
        "isRead": false,
        "priority": "HIGH",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "unreadCount": 5,
    "pagination": {...}
  }
}
```

#### PUT /api/notifications/:id/read
Mark notification as read.

#### PUT /api/notifications/read-all
Mark all notifications as read.

#### GET /api/notifications/unread-count
Get unread notification count.

#### POST /api/notifications/test
Send test notification (SUPER_ADMIN only).

---

### 9. Payment APIs (`/api/payments`)

#### POST /api/payments/create-order
Create payment order (Razorpay).

**Request Body:**
```json
{
  "amount": 500000,
  "currency": "INR",
  "customerId": "customer_uuid",
  "bookingId": "booking_uuid",
  "description": "Advance payment for booking",
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "orderId": "order_xyz123",
      "amount": 500000,
      "currency": "INR"
    },
    "payment": {
      "id": "payment_uuid",
      "status": "PENDING"
    }
  }
}
```

#### POST /api/payments/verify
Verify payment (Razorpay signature verification).

**Request Body:**
```json
{
  "orderId": "order_xyz123",
  "paymentId": "pay_xyz123",
  "signature": "razorpay_signature"
}
```

#### GET /api/payments/:id
Get payment details.

#### GET /api/payments
Get payment history.

**Query Parameters:**
- `customerId` (UUID)
- `bookingId` (UUID)
- `status` (PaymentStatus)
- `startDate` (ISO date)
- `endDate` (ISO date)
- `page`, `limit`

#### POST /api/payments/:id/refund
Process refund (requires SUPER_ADMIN or MANAGER role).

**Request Body:**
```json
{
  "amount": 50000,
  "reason": "Customer cancellation"
}
```

#### GET /api/payments/reports/generate
Generate payment report.

**Query Parameters:**
- `startDate` (ISO date, required)
- `endDate` (ISO date, required)
- `format` (json | csv | pdf)

#### POST /api/payments/webhook/razorpay
Razorpay webhook endpoint (public).

---

### 10. File APIs (`/api/files`)

#### POST /api/files/property/:propertyId/images
Upload property images (multipart/form-data).

**Form Data:**
- `images`: File[] (max 10 files, max 10MB each)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "file_uuid",
      "url": "https://s3.amazonaws.com/...",
      "thumbnailUrl": "https://s3.amazonaws.com/..."
    }
  ],
  "message": "3 images uploaded successfully"
}
```

#### POST /api/files/:entityType/:entityId/document
Upload document (property | booking | lead | customer).

**Form Data:**
- `document`: File (max 20MB)
- `documentType`: String

#### GET /api/files/:id
Get file metadata.

#### GET /api/files/folder/:folder
Get files by folder.

#### GET /api/files/:id/signed-url
Generate signed URL for private files.

**Query Parameters:**
- `expiresIn` (number, seconds, default: 3600)

#### DELETE /api/files/:id
Delete file (requires SUPER_ADMIN or MANAGER role).

#### GET /api/files/stats/overview
Get file statistics (requires SUPER_ADMIN or MANAGER role).

#### POST /api/files/cleanup
Cleanup old files (requires SUPER_ADMIN role).

**Request Body:**
```json
{
  "daysOld": 30
}
```

---

### 11. Analytics APIs (`/api/analytics`)

#### GET /api/analytics/sales
Get sales analytics.

**Query Parameters:**
- `startDate` (ISO date)
- `endDate` (ISO date)
- `propertyId` (UUID)
- `agentId` (UUID)
- `groupBy` (day | week | month | year)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSales": 50000000,
    "totalBookings": 25,
    "averageValue": 2000000,
    "timeSeriesData": [
      {
        "period": "2024-01",
        "sales": 10000000,
        "bookings": 5
      }
    ]
  }
}
```

#### GET /api/analytics/leads
Get lead analytics.

#### GET /api/analytics/financial
Get financial analytics (requires SUPER_ADMIN or MANAGER role).

#### GET /api/analytics/properties
Get property performance analytics.

#### GET /api/analytics/customers
Get customer analytics.

#### GET /api/analytics/dashboard
Get comprehensive dashboard data.

**Response:**
```json
{
  "success": true,
  "data": {
    "sales": {...},
    "leads": {...},
    "properties": {...},
    "customers": {...},
    "recentActivity": [...]
  }
}
```

#### GET /api/analytics/export/:type
Export analytics data.

**Path Parameters:**
- `type` (sales | leads | financial | properties | customers | dashboard)

**Query Parameters:**
- `startDate` (ISO date, required)
- `endDate` (ISO date, required)
- `format` (json | csv)

---

### 12. Security APIs (`/api/security`)

#### POST /api/security/validate-password
Validate password strength (public).

**Request Body:**
```json
{
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "strength": "strong",
    "score": 85
  }
}
```

#### POST /api/security/check-login-attempts
Check login attempts for IP/email (public).

#### POST /api/security/record-failed-login
Record failed login attempt (public).

#### POST /api/security/record-successful-login
Record successful login (public).

#### POST /api/security/create-session
Create user session (public).

#### POST /api/security/check-rate-limit
Check rate limit status (public).

#### GET /api/security/events
Get security events (requires authentication).

**Query Parameters:**
- `userId` (UUID)
- `eventType` (string)
- `severity` (INFO | WARNING | ERROR | CRITICAL)
- `startDate`, `endDate`
- `page`, `limit`

#### GET /api/security/events/export
Export security events (requires SUPER_ADMIN or ADMIN role).

#### POST /api/security/events/log
Log security event (requires authentication).

#### GET /api/security/stats
Get security statistics (requires authentication).

#### GET /api/security/config
Get security configuration (requires authentication).

#### PUT /api/security/config
Update security configuration (requires SUPER_ADMIN or ADMIN role).

#### DELETE /api/security/sessions/:sessionId
Invalidate session (requires authentication).

#### DELETE /api/security/sessions/user/:userId
Invalidate all user sessions (requires SUPER_ADMIN or ADMIN role).

#### POST /api/security/generate-token
Generate secure token (requires authentication).

#### POST /api/security/cleanup/sessions
Cleanup expired sessions (requires SUPER_ADMIN or ADMIN role).

#### POST /api/security/cleanup/rate-limits
Cleanup expired rate limits (requires SUPER_ADMIN or ADMIN role).

#### GET /api/security/dashboard
Get security dashboard (requires authentication).

---

### 13. Company APIs (`/api/v1/company`)

#### GET /api/v1/company
Get company information with region-specific compliance.

**Query Parameters:**
- `region` (INDIA | UAE | SAUDI | QATAR)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Property Management Company - INDIA",
    "region": "INDIA",
    "currency": "INR",
    "gst": "29ABCDE1234F1Z5",
    "taxRate": 0.05,
    "taxName": "GST",
    "compliance": {
      "taxRate": 0.05,
      "taxName": "GST",
      "currency": "INR",
      "timezone": "Asia/Kolkata",
      "dateFormat": "DD/MM/YYYY",
      "numberFormat": "en-IN"
    }
  }
}
```

#### POST /api/v1/company/tax-calculate
Calculate tax based on region.

**Request Body:**
```json
{
  "amount": 1000000,
  "region": "INDIA"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "originalAmount": 1000000,
    "taxAmount": 50000,
    "totalAmount": 1050000,
    "taxRate": 0.05,
    "taxName": "GST",
    "currency": "INR",
    "formattedAmount": "₹10,50,000.00",
    "formattedTaxAmount": "₹50,000.00"
  }
}
```

#### GET /api/v1/company/cities
Get cities by region.

**Query Parameters:**
- `region` (INDIA | UAE | SAUDI | QATAR)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "region": "INDIA"
    },
    ...
  ]
}
```

---

### 14. Projects APIs (`/api/v1/projects`)

#### GET /api/v1/projects
Get projects with filters and metadata.

**Query Parameters:**
- `search` (string)
- `status` (UPCOMING | ONGOING | COMPLETED | CANCELLED)
- `city` (string)
- `minPrice` (number)
- `maxPrice` (number)
- `sort` (name | price | createdAt | views | inquiries | bookings)
- `order` (asc | desc)
- `page`, `limit`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Green Valley Residences",
      "status": "ONGOING",
      "location": "Whitefield",
      "city": "Bangalore",
      "totalUnits": 200,
      "availableUnits": 150,
      "soldUnits": 50,
      "priceRange": {
        "min": 3000000,
        "max": 8000000
      },
      "amenities": ["Club House", "Swimming Pool"],
      "views": 1250,
      "inquiries": 180,
      "bookings": 50
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### GET /api/v1/projects/:id
Get project details by ID with metadata.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Green Valley Residences",
    "description": "Premium residential project",
    "status": "ONGOING",
    "totalUnits": 200,
    "availableUnits": 150,
    "soldUnits": 50,
    "priceRange": {...},
    "amenities": [...],
    "images": [...],
    "floorPlan": "url",
    "layout3D": "url",
    "gmapIframe": "iframe_code",
    "meta": {
      "totalUnits": 200,
      "availableUnits": 150,
      "soldUnits": 50,
      "occupancyRate": 25.0,
      "totalValue": 1000000000,
      "averagePrice": 5000000
    }
  }
}
```

#### GET /api/v1/projects/:id/plots
Get plots/inventory for a project.

**Query Parameters:**
- `status` (AVAILABLE | SOLD | RENTED | MAINTENANCE | DRAFT)
- `floor` (number)
- `block` (string)
- `minPrice`, `maxPrice`

#### GET /api/v1/projects/:id/stats
Get project statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUnits": 200,
    "availableUnits": 150,
    "soldUnits": 50,
    "occupancyRate": 25.0,
    "totalValue": 1000000000,
    "averagePrice": 5000000,
    "views": 1250,
    "inquiries": 180,
    "bookings": 50,
    "conversionRate": 4.0
  }
}
```

---

### 15. Leads APIs (BlinderSøe) (`/api/v1/leads`)

#### GET /api/v1/leads
Get leads with BlinderSøe stages.

**Query Parameters:**
- `search` (string)
- `status` (LeadStatus)
- `stage` (ENQUIRY_RECEIVED | SITE_VISIT | PROPOSAL_SENT | NEGOTIATION | BOOKING | SOLD | LOST)
- `source` (LeadSource)
- `assignedTo` (UUID)
- `stageDateStart`, `stageDateEnd`
- `minScore`, `maxScore`
- `page`, `limit`, `sort`, `order`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "source": "WEBSITE",
      "status": "QUALIFIED",
      "stage": "SITE_VISIT",
      "score": 75,
      "interest": "3BHK in Whitefield",
      "budget": 8000000,
      "assignedTo": "agent_uuid",
      "stageDateStart": "2024-01-15T10:00:00Z",
      "history": [
        {
          "stage": "ENQUIRY_RECEIVED",
          "date": "2024-01-10T10:00:00Z",
          "notes": "Initial enquiry",
          "userId": "agent_uuid"
        }
      ],
      "customer": {...},
      "assignedUser": {...}
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "stageStats": {
      "enquiryReceived": 50,
      "siteVisit": 30,
      "proposalSent": 25,
      "negotiation": 20,
      "booking": 15,
      "sold": 10,
      "lost": 5
    }
  }
}
```

#### POST /api/v1/leads
Create new lead with BlinderSøe stage.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "source": "WEBSITE",
  "stage": "ENQUIRY_RECEIVED",
  "interest": "3BHK Apartment",
  "budget": 8000000,
  "notes": "Looking for properties in Whitefield",
  "assignedTo": "agent_uuid",
  "customerId": "customer_uuid",
  "attachments": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "stage": "ENQUIRY_RECEIVED",
    "score": 5,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### PUT /api/v1/leads/:id/stage
Update lead stage with history tracking.

**Request Body:**
```json
{
  "stage": "SITE_VISIT",
  "notes": "Site visit scheduled for tomorrow",
  "attachments": []
}
```

#### GET /api/v1/leads/stats
Get lead statistics by stage and source.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "byStage": {
      "enquiryReceived": 50,
      "siteVisit": 30,
      "proposalSent": 25,
      "negotiation": 20,
      "booking": 15,
      "sold": 10,
      "lost": 5
    },
    "bySource": {
      "website": 60,
      "whatsapp": 30,
      "phone": 25,
      "email": 15,
      "referral": 10,
      "walkIn": 5,
      "socialMedia": 3,
      "advertisement": 2
    },
    "conversionRate": 6.67,
    "averageScore": 42.5
  }
}
```

---

### 16. Bookings APIs (BlinderSøe) (`/api/v1/bookings`)

#### GET /api/v1/bookings
Get bookings with BlinderSøe stages.

**Query Parameters:**
- `search` (string)
- `status` (PENDING | CONFIRMED | CANCELLED | COMPLETED)
- `stage` (SOLD | TENTATIVELY_BOOKED | CONFIRMED | CANCELLED)
- `propertyId`, `customerId`, `agentId`
- `bookingDateFrom`, `bookingDateTo`
- `minAmount`, `maxAmount`
- `page`, `limit`, `sort`, `order`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "propertyId": "property_uuid",
      "inventoryId": "inventory_uuid",
      "customerId": "customer_uuid",
      "agentId": "agent_uuid",
      "status": "CONFIRMED",
      "stage": "CONFIRMED",
      "bookingDate": "2024-01-15T10:00:00Z",
      "moveInDate": "2024-03-01T00:00:00Z",
      "amount": 5000000,
      "advanceAmount": 500000,
      "paymentMethod": "UPI",
      "paymentStatus": "COMPLETED",
      "tokenDates": ["2024-02-01", "2024-02-15"],
      "pricingBreakdown": {
        "basePrice": 5000000,
        "advanceAmount": 500000,
        "remainingAmount": 4500000,
        "taxes": 250000,
        "totalAmount": 5250000
      },
      "property": {...},
      "customer": {...},
      "agent": {...},
      "inventory": {...}
    }
  ],
  "meta": {
    "total": 75,
    "page": 1,
    "limit": 10,
    "stageStats": {
      "sold": 30,
      "tentativelyBooked": 20,
      "confirmed": 20,
      "cancelled": 5
    }
  }
}
```

#### POST /api/v1/bookings
Create new booking with BlinderSøe stage.

**Request Body:**
```json
{
  "propertyId": "property_uuid",
  "inventoryId": "inventory_uuid",
  "customerId": "customer_uuid",
  "agentId": "agent_uuid",
  "stage": "TENTATIVELY_BOOKED",
  "bookingDate": "2024-01-15T10:00:00Z",
  "moveInDate": "2024-03-01T00:00:00Z",
  "amount": 5000000,
  "advanceAmount": 500000,
  "paymentMethod": "UPI",
  "notes": "Customer prefers ground floor",
  "tokenDates": ["2024-02-01", "2024-02-15"],
  "pricingBreakdown": {
    "basePrice": 5000000,
    "advanceAmount": 500000,
    "remainingAmount": 4500000,
    "taxes": 250000,
    "totalAmount": 5250000
  }
}
```

#### PUT /api/v1/bookings/:id/stage
Update booking stage.

**Request Body:**
```json
{
  "stage": "CONFIRMED",
  "notes": "Advance payment received",
  "tokenDates": ["2024-02-01", "2024-02-15"]
}
```

#### PUT /api/v1/bookings/:id/pricing
Update booking pricing breakdown.

**Request Body:**
```json
{
  "pricingBreakdown": {
    "basePrice": 5000000,
    "advanceAmount": 500000,
    "remainingAmount": 4500000,
    "taxes": 250000,
    "discounts": [
      {
        "type": "Early Bird",
        "amount": 100000,
        "description": "10% early payment discount"
      }
    ],
    "totalAmount": 5150000
  }
}
```

#### GET /api/v1/bookings/stats
Get booking statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 75,
    "byStage": {
      "sold": 30,
      "tentativelyBooked": 20,
      "confirmed": 20,
      "cancelled": 5
    },
    "byStatus": {
      "pending": 20,
      "confirmed": 50,
      "cancelled": 5,
      "completed": 0
    },
    "totalValue": 375000000,
    "averageValue": 5000000,
    "conversionRate": 40.0
  }
}
```

---

## Backend Services

### 1. AuthService (`src/backend/src/services/authService.ts`)
Handles user authentication, JWT token generation, password hashing, and session management.

**Key Methods:**
- `register(userData)`: Register new user
- `login(email, password)`: Authenticate user
- `verifyToken(token)`: Verify JWT token
- `refreshToken(token)`: Refresh JWT token
- `resetPassword(token, newPassword)`: Reset password
- `enable2FA(userId)`: Enable two-factor authentication
- `verify2FA(userId, token)`: Verify 2FA token

---

### 2. PropertyService (`src/backend/src/services/propertyService.ts`)
Manages property operations including CRUD operations, search, and analytics.

**Key Methods:**
- `getProperties(filters, pagination)`: Get properties with filters
- `getPropertyById(id)`: Get property details
- `createProperty(propertyData)`: Create new property
- `updateProperty(id, updates)`: Update property
- `deleteProperty(id)`: Delete property
- `incrementViews(id)`: Increment property views
- `incrementInquiries(id)`: Increment property inquiries

---

### 3. NotificationService (`src/backend/src/services/notificationService.ts`)
Handles multi-channel notifications (real-time, email, SMS, push).

**Key Methods:**
- `sendMultiChannelNotification(userId, notification, channels)`: Send notification via multiple channels
- `sendRealtimeNotification(userId, notification)`: Send real-time notification via Socket.IO
- `sendEmailNotification(userId, notification)`: Send email notification
- `sendSMSNotification(userId, notification)`: Send SMS notification
- `getUserNotifications(userId, limit, offset)`: Get user notifications
- `markAsRead(notificationId, userId)`: Mark notification as read
- `markAllAsRead(userId)`: Mark all notifications as read
- `getUnreadCount(userId)`: Get unread notification count

---

### 4. PaymentService (`src/backend/src/services/paymentService.ts`)
Handles payment processing via Razorpay and PayTabs.

**Key Methods:**
- `createRazorpayOrder(orderData)`: Create Razorpay order
- `verifyRazorpayPayment(orderId, paymentId, signature)`: Verify Razorpay payment
- `processRazorpayWebhook(payload, signature)`: Process Razorpay webhook
- `createPayment(paymentData, orderId, userId)`: Create payment record
- `updatePaymentStatus(paymentId, status, metadata)`: Update payment status
- `getPaymentDetails(paymentId)`: Get payment details
- `getPaymentHistory(filters)`: Get payment history
- `refundPayment(paymentId, amount, reason)`: Process refund
- `generatePaymentReport(startDate, endDate, format)`: Generate payment report

---

### 5. FileService (`src/backend/src/services/fileService.ts`)
Manages file uploads to AWS S3 with image processing.

**Key Methods:**
- `getMulterConfig(options)`: Get Multer configuration
- `uploadPropertyImages(propertyId, files)`: Upload property images
- `uploadDocument(entityType, entityId, file, documentType)`: Upload document
- `getFile(fileId)`: Get file metadata
- `getFilesByFolder(folder, page, limit)`: Get files by folder
- `generateSignedUrl(fileId, expiresIn)`: Generate signed URL
- `deleteFile(fileId)`: Delete file
- `getFileStatistics()`: Get file statistics
- `cleanupOldFiles(daysOld)`: Cleanup old files

---

### 6. AnalyticsService (`src/backend/src/services/analyticsService.ts`)
Provides analytics and reporting capabilities.

**Key Methods:**
- `getSalesAnalytics(filters)`: Get sales analytics
- `getLeadAnalytics(filters)`: Get lead analytics
- `getFinancialAnalytics(filters)`: Get financial analytics
- `getPropertyPerformance(filters)`: Get property performance
- `getCustomerAnalytics(filters)`: Get customer analytics
- `getDashboardData(filters)`: Get dashboard data

---

### 7. SecurityService (`src/backend/src/services/securityService.ts`)
Handles security features including rate limiting, session management, and audit logging.

**Key Methods:**
- `validatePassword(password)`: Validate password strength
- `checkLoginAttempts(identifier)`: Check login attempts
- `recordFailedLogin(identifier, ipAddress)`: Record failed login
- `recordSuccessfulLogin(identifier, ipAddress)`: Record successful login
- `createSession(userId, ipAddress, userAgent)`: Create user session
- `invalidateSession(sessionId)`: Invalidate session
- `invalidateUserSessions(userId)`: Invalidate all user sessions
- `checkRateLimit(identifier, action, limit, windowMs)`: Check rate limit
- `logSecurityEvent(event)`: Log security event
- `getSecurityEvents(filters)`: Get security events
- `getRateLimiter(type)`: Get rate limiter middleware

---

### 8. WebSocketService (`src/backend/src/services/websocketService.ts`)
Manages WebSocket connections for real-time features.

**Key Methods:**
- `handleConnection(socket)`: Handle new WebSocket connection
- `handleDisconnection(socket)`: Handle WebSocket disconnection
- `emitToUser(userId, event, data)`: Emit event to specific user
- `emitToRoom(room, event, data)`: Emit event to room
- `broadcast(event, data)`: Broadcast to all connected clients

---

### 9. MonitoringService (`src/backend/src/services/monitoringService.ts`)
Provides system monitoring and health checks.

**Key Methods:**
- `getSystemHealth()`: Get system health status
- `getMetrics()`: Get system metrics
- `recordMetric(metric)`: Record custom metric

---

## Frontend Application

### Architecture
The frontend is built with React Native and Expo, following a modular architecture:

```
src/frontend/
├── App.tsx                  # Main application entry
├── src/
│   ├── components/          # Reusable components
│   ├── screens/             # Screen components
│   │   ├── auth/           # Authentication screens
│   │   └── main/           # Main app screens
│   ├── navigation/          # Navigation configuration
│   ├── services/            # API and business logic services
│   ├── store/              # Redux store and slices
│   ├── theme/              # Theme configuration
│   ├── types/              # TypeScript types
│   ├── utils/              # Utility functions
│   └── locales/            # i18n translations
└── public/                  # Static assets
```

---

### Key Components

#### 1. **AIPropertyRecommendation.tsx**
AI-powered property recommendation component using TensorFlow.js.

**Features:**
- ML-based property recommendations
- User preference learning
- Real-time scoring

---

#### 2. **PlotAvailabilityViewer.tsx**
Interactive plot/unit availability viewer.

**Features:**
- Visual plot selection
- Real-time availability status
- Floor-wise navigation
- Block-wise filtering

---

#### 3. **Layout3DViewer.tsx**
3D property layout viewer using Three.js.

**Features:**
- Interactive 3D models
- Virtual walkthroughs
- 360° views

---

#### 4. **VirtualTourViewer.tsx**
Virtual property tour component.

**Features:**
- 360° panoramic views
- Hotspot navigation
- Multi-room tours

---

#### 5. **PropertyCard.tsx**
Property listing card component.

**Features:**
- Property preview
- Quick actions
- Favorite/bookmark
- Share functionality

---

#### 6. **Dashboard.tsx**
Main dashboard with analytics and metrics.

**Features:**
- Key metrics display
- Charts and graphs
- Recent activity feed
- Quick actions

---

#### 7. **OfflineIndicator.tsx**
Network status indicator.

**Features:**
- Online/offline detection
- Sync status display
- Pending changes count

---

#### 8. **CachedDataView.tsx**
Displays cached data when offline.

**Features:**
- Offline data access
- Cache management
- Sync indicators

---

#### 9. **ConflictResolutionDialog.tsx**
Handles data sync conflicts.

**Features:**
- Conflict detection
- Manual resolution
- Auto-merge options

---

### Key Screens

#### Authentication Screens

##### 1. **LoginScreen.tsx**
User login screen.

**Features:**
- Email/password login
- Social login (optional)
- Remember me
- Forgot password link
- 2FA support

---

##### 2. **RegisterScreen.tsx**
User registration screen.

**Features:**
- Multi-step registration
- Form validation
- Email verification
- Role selection (for internal users)

---

##### 3. **ForgotPasswordScreen.tsx**
Password reset screen.

**Features:**
- Email-based reset
- OTP verification
- New password setup

---

#### Main App Screens

##### 1. **HomeScreen.tsx**
Dashboard and overview screen.

**Features:**
- KPI metrics
- Recent properties
- Recent bookings
- Quick actions
- Analytics charts
- Activity feed

---

##### 2. **PropertiesScreen.tsx**
Property listing and search screen.

**Features:**
- Property grid/list view
- Advanced filters
- Sort options
- Search functionality
- Map view
- Favorites

---

##### 3. **PropertyDetailScreen.tsx**
Property details screen.

**Features:**
- Image gallery
- Property details
- Amenities
- Location map
- 3D tour
- Virtual tour
- Similar properties
- Contact agent
- Schedule visit
- Booking options

---

##### 4. **CreatePropertyScreen.tsx**
Property creation/editing screen.

**Features:**
- Multi-step form
- Image upload
- Document upload
- Location picker
- Amenity selection
- Pricing setup

---

##### 5. **CRMScreen.tsx**
CRM dashboard for managing leads and customers.

**Features:**
- Lead pipeline view (BlinderSøe stages)
- Lead cards with scoring
- Filter by stage/source/agent
- Quick actions (call, email, WhatsApp)
- Lead history
- Activity timeline
- Customer 360° view

---

##### 6. **LeadDetailScreen.tsx**
Lead details and management screen.

**Features:**
- Lead information
- Contact details
- Lead score
- Interaction history
- Stage progression (BlinderSøe)
- Notes and attachments
- Assigned agent
- Related properties
- Follow-up reminders

---

##### 7. **CustomerDetailScreen.tsx**
Customer details and history screen.

**Features:**
- Customer profile
- Purchase history
- Bookings
- Payments
- Property interests
- Documents
- Communication history
- Lifetime value

---

##### 8. **CustomerPortalScreen.tsx**
Self-service portal for customers.

**Features:**
- Browse properties
- Saved properties
- Booking status
- Payment history
- Documents
- Support tickets
- Property recommendations

---

##### 9. **ERPScreen.tsx**
ERP dashboard for financial management.

**Features:**
- Financial summary
- Transaction list
- Revenue charts
- Expense tracking
- Payment tracking
- Invoice management
- Reports

---

##### 10. **ProfileScreen.tsx**
User profile and settings screen.

**Features:**
- Profile information
- Settings
- Preferences
- Language selection
- Theme selection
- Notification settings
- Security settings (2FA)
- Logout

---

### Key Services

#### 1. **apiService.ts**
Central API service for all backend communications.

**Methods:**
- `get(endpoint, params)`: GET request
- `post(endpoint, data)`: POST request
- `put(endpoint, data)`: PUT request
- `delete(endpoint)`: DELETE request
- `upload(endpoint, files)`: File upload
- `setAuthToken(token)`: Set authentication token

---

#### 2. **offlineService.ts**
Offline data management service.

**Features:**
- Data caching
- Queue pending requests
- Sync when online
- Conflict detection
- Conflict resolution

**Methods:**
- `cacheData(key, data)`: Cache data locally
- `getCachedData(key)`: Get cached data
- `queueRequest(request)`: Queue API request
- `syncPendingRequests()`: Sync queued requests
- `clearCache()`: Clear local cache

---

#### 3. **syncService.ts**
Data synchronization service.

**Features:**
- Auto-sync on network change
- Manual sync trigger
- Sync status tracking
- Selective sync

**Methods:**
- `startAutoSync()`: Start auto-sync
- `stopAutoSync()`: Stop auto-sync
- `syncNow()`: Trigger manual sync
- `getSyncStatus()`: Get sync status

---

#### 4. **syncManager.ts**
Manages sync operations and conflict resolution.

**Methods:**
- `sync()`: Perform full sync
- `resolveConflict(conflict, resolution)`: Resolve data conflict
- `getPendingChanges()`: Get pending changes count

---

#### 5. **offlineDatabase.ts**
Local SQLite database for offline storage.

**Methods:**
- `init()`: Initialize database
- `query(sql, params)`: Execute SQL query
- `insert(table, data)`: Insert data
- `update(table, data, where)`: Update data
- `delete(table, where)`: Delete data
- `select(table, where)`: Select data

---

#### 6. **i18nService.ts**
Internationalization service.

**Features:**
- Multi-language support
- RTL support for Arabic
- Dynamic language switching
- Locale-specific formatting

**Methods:**
- `changeLanguage(lang)`: Change app language
- `t(key, params)`: Translate text
- `formatCurrency(amount, currency)`: Format currency
- `formatDate(date)`: Format date

---

#### 7. **aiScoring.ts**
AI-powered lead scoring service.

**Features:**
- Lead quality prediction
- Property recommendation
- Customer behavior analysis

**Methods:**
- `scoreLead(leadData)`: Calculate lead score
- `predictConversion(leadData)`: Predict conversion probability
- `getRecommendedProperties(userData)`: Get property recommendations

---

#### 8. **mlScoringService.ts**
Machine learning scoring service using TensorFlow.js.

**Features:**
- On-device ML inference
- Real-time scoring
- Model updates

**Methods:**
- `loadModel()`: Load ML model
- `predict(input)`: Make prediction
- `updateModel(modelUrl)`: Update ML model

---

### Redux Store

#### Store Structure
```typescript
{
  auth: {
    user: User | null,
    token: string | null,
    isAuthenticated: boolean,
    isLoading: boolean
  },
  properties: {
    list: Property[],
    selectedProperty: Property | null,
    filters: FilterState,
    isLoading: boolean
  },
  leads: {
    list: Lead[],
    selectedLead: Lead | null,
    filters: FilterState,
    isLoading: boolean
  },
  bookings: {
    list: Booking[],
    selectedBooking: Booking | null,
    isLoading: boolean
  },
  offline: {
    isOnline: boolean,
    pendingChanges: number,
    lastSyncTime: Date | null,
    isSyncing: boolean
  },
  ui: {
    theme: 'light' | 'dark',
    language: 'en' | 'ar',
    notifications: Notification[]
  }
}
```

---

## Features & Capabilities

### 1. Multi-Region Support
- **Regions**: India, UAE, Saudi Arabia, Qatar
- **Features**:
  - Region-specific tax calculation (GST/VAT)
  - Currency formatting
  - Timezone handling
  - Date format localization
  - Number format localization
  - Region-specific compliance

---

### 2. Multi-Language Support
- **Languages**: English, Arabic
- **Features**:
  - RTL (Right-to-Left) support for Arabic
  - Dynamic language switching
  - Locale-specific content
  - Translated UI elements
  - Region-specific terminology

---

### 3. BlinderSøe CRM Integration
- **Lead Stages**:
  - Enquiry Received (Stage 5)
  - Site Visit (Stage 15)
  - Proposal Sent (Stage 25)
  - Negotiation (Stage 35)
  - Booking (Stage 45)
  - Sold (Stage 50)
  - Lost (Stage 0)

- **Booking Stages**:
  - Sold (Stage 1)
  - Tentatively Booked (Stage 5)
  - Confirmed (Stage 10)
  - Cancelled (Stage 0)

- **Features**:
  - Stage-based pipeline management
  - Automated stage progression
  - Stage history tracking
  - Performance analytics by stage
  - Conversion rate tracking

---

### 4. Property Management
- **Property Types**: Apartment, Villa, House, Plot, Commercial, Office, Shop, Warehouse
- **Features**:
  - Property CRUD operations
  - Advanced search and filters
  - Image gallery with thumbnails
  - Video tours
  - 3D layouts
  - Floor plans
  - Google Maps integration
  - Vastu compliance tracking
  - Amenity management
  - View/inquiry tracking
  - Featured properties

---

### 5. Inventory Management
- **Features**:
  - Unit-wise inventory tracking
  - Floor-wise organization
  - Block-wise grouping
  - Real-time availability status
  - Plot selection interface
  - Pricing per unit
  - Unit-specific amenities

---

### 6. CRM (Customer Relationship Management)
- **Lead Management**:
  - Lead capture from multiple sources
  - Lead scoring (AI/ML powered)
  - Lead assignment to agents
  - Stage-based pipeline
  - Lead history tracking
  - Follow-up reminders
  - Lead conversion tracking

- **Customer Management**:
  - Customer 360° view
  - Purchase history
  - Booking history
  - Payment history
  - Customer preferences
  - Customer segmentation
  - Lifetime value calculation

---

### 7. Booking Management
- **Features**:
  - Booking creation with BlinderSøe stages
  - Stage progression tracking
  - Token date management
  - Pricing breakdown
  - Advance payment tracking
  - Document management
  - Move-in/move-out dates
  - Booking cancellation

---

### 8. Payment Integration
- **Payment Gateways**:
  - Razorpay (India)
  - PayTabs (Middle East)

- **Payment Methods**:
  - UPI
  - Credit/Debit Card
  - Net Banking
  - Wallet
  - Cash
  - Cheque
  - Bank Transfer

- **Features**:
  - Order creation
  - Payment verification
  - Webhook handling
  - Payment history
  - Refund processing
  - Payment reports
  - Multiple currency support

---

### 9. ERP (Enterprise Resource Planning)
- **Financial Management**:
  - Transaction tracking (Income, Expense, Transfer, Refund)
  - Financial summary
  - Revenue tracking
  - Expense tracking
  - Profit/loss calculation
  - Budget management

- **Reports**:
  - Sales reports
  - Financial reports
  - Property performance reports
  - Agent performance reports
  - Custom date range reports
  - Export to CSV/PDF

---

### 10. Analytics & Reporting
- **Sales Analytics**:
  - Total sales
  - Sales by period
  - Sales by property
  - Sales by agent
  - Conversion rates
  - Average deal value

- **Lead Analytics**:
  - Lead sources
  - Lead stages
  - Conversion funnel
  - Lead quality scores
  - Agent performance

- **Financial Analytics**:
  - Revenue trends
  - Expense analysis
  - Profit margins
  - Payment collection rates
  - Outstanding payments

- **Property Analytics**:
  - Property views
  - Inquiry rates
  - Booking rates
  - Occupancy rates
  - Price trends

- **Customer Analytics**:
  - Customer acquisition
  - Customer lifetime value
  - Customer preferences
  - Repeat customers

---

### 11. Notification System
- **Notification Types**:
  - Booking Created
  - Booking Confirmed
  - Booking Cancelled
  - Payment Received
  - Payment Failed
  - Lead Assigned
  - Lead Updated
  - Property Added
  - Property Updated
  - Customer Added
  - System Alert

- **Delivery Channels**:
  - Real-time (Socket.IO)
  - Email (SendGrid)
  - SMS (Twilio)
  - Push notifications (future)

- **Features**:
  - Multi-channel delivery
  - Priority levels (Low, Medium, High, Urgent)
  - Read/unread status
  - Notification history
  - Notification preferences

---

### 12. File Management
- **Storage**: AWS S3
- **Features**:
  - Multi-file upload
  - Image optimization
  - Thumbnail generation
  - Watermarking (optional)
  - Document management
  - Signed URLs for private files
  - File organization by entity
  - File statistics
  - Old file cleanup

- **Supported Types**:
  - Images: JPG, PNG, WEBP, SVG
  - Documents: PDF, DOC, DOCX, XLS, XLSX
  - Videos: MP4, AVI, MOV

---

### 13. Security Features
- **Authentication**:
  - JWT-based authentication
  - Bcrypt password hashing
  - Password strength validation
  - Two-Factor Authentication (2FA)
  - Backup codes
  - Session management
  - Token refresh

- **Authorization**:
  - Role-based access control (RBAC)
  - Role hierarchy: SUPER_ADMIN > ADMIN > MANAGER > AGENT > CUSTOMER
  - Route-level permissions
  - Resource-level permissions

- **Security Measures**:
  - Rate limiting
  - Login attempt tracking
  - Account lockout
  - Password reset tokens
  - Email verification
  - Security event logging
  - Audit trail
  - CORS protection
  - Helmet.js security headers
  - XSS protection
  - CSRF protection

---

### 14. Offline Support (Mobile)
- **Features**:
  - Offline data access
  - Local caching (SQLite)
  - Request queueing
  - Auto-sync on reconnection
  - Conflict detection
  - Conflict resolution
  - Optimistic UI updates
  - Sync status indicators

---

### 15. Real-time Features
- **WebSocket Events**:
  - booking_created
  - booking_updated
  - payment_received
  - notification
  - property_updated
  - lead_assigned
  - lead_updated

- **Features**:
  - Live updates
  - Real-time notifications
  - Collaborative editing support
  - Presence indicators

---

### 16. AI/ML Features
- **Lead Scoring**:
  - Automated lead quality assessment
  - Conversion probability prediction
  - Source-based scoring
  - Budget-based scoring
  - Behavior-based scoring

- **Property Recommendations**:
  - Personalized recommendations
  - Collaborative filtering
  - Content-based filtering
  - User preference learning

---

### 17. 3D & Virtual Tours
- **Features**:
  - 3D property models
  - Interactive walkthroughs
  - 360° panoramic views
  - Hotspot navigation
  - Multi-room tours
  - Virtual reality support (future)

---

### 18. Projects & Plot Management
- **Features**:
  - Project lifecycle management
  - Unit tracking (totalUnits, availableUnits, soldUnits)
  - Price range management
  - Project status tracking
  - Project statistics
  - Plot availability visualization
  - Floor-wise navigation
  - Block-wise filtering

---

### 19. Multi-Company Support
- **Features**:
  - Company profiles
  - Region-specific company info
  - Tax ID management (GST/VAT)
  - Company branding
  - Multi-tenant architecture ready

---

### 20. Webhooks
- **Events**:
  - booking.created
  - booking.updated
  - payment.completed
  - payment.failed
  - lead.created
  - lead.updated
  - property.created
  - property.updated

- **Features**:
  - Webhook subscriptions
  - Event filtering
  - Retry mechanism
  - Webhook logs
  - Signature verification

---

## Security Implementation

### 1. Authentication & Authorization
```typescript
// JWT Token Structure
{
  userId: string,
  email: string,
  role: UserRole,
  iat: number,
  exp: number
}

// Role Hierarchy
SUPER_ADMIN > ADMIN > MANAGER > AGENT > CUSTOMER
```

### 2. Password Security
- Bcrypt hashing with salt rounds
- Minimum password strength requirements
- Password reset with time-limited tokens
- Password history (prevent reuse)

### 3. Two-Factor Authentication
- Time-based OTP (TOTP)
- QR code generation
- Backup codes
- Trusted devices (optional)

### 4. Session Management
- Session tokens stored in Redis
- Automatic session expiration
- Multiple session support
- Session invalidation on logout
- IP and User-Agent tracking

### 5. Rate Limiting
```typescript
// Rate Limits
{
  general: 100 requests / 15 minutes,
  auth: 5 requests / 15 minutes,
  upload: 10 requests / 15 minutes
}
```

### 6. Security Logging
- Failed login attempts
- Successful logins
- Password changes
- Role changes
- Data access
- Data modifications
- Security events
- Audit trail

### 7. Data Protection
- HTTPS/TLS encryption
- At-rest encryption (database)
- Secure headers (Helmet.js)
- CORS configuration
- XSS protection
- SQL injection prevention (Parameterized queries)

---

## Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
DIRECT_URL=postgresql://user:password@host:5432/dbname

# Redis
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Email
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key

# SMS
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name

# Payment Gateways
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
PAYTABS_MERCHANT_EMAIL=your_paytabs_email
PAYTABS_SECRET_KEY=your_paytabs_secret

# App
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-domain.com
REGION=INDIA
DEFAULT_LANGUAGE=en

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Platform Deployments

#### Railway
- Uses `railway.json` configuration
- Automatic deployments from Git
- Environment variable management
- Database provisioning

#### Vercel
- Uses `vercel.json` configuration
- Serverless functions
- Edge network
- Preview deployments

#### Render
- Uses `render.yaml` configuration
- Managed PostgreSQL
- Redis
- Automatic SSL

---

## Testing

### Test Structure
```
tests/
├── unit/                    # Unit tests
│   ├── auth.test.ts
│   └── security.test.ts
├── integration/             # Integration tests
│   └── api.test.ts
├── e2e/                     # End-to-end tests
│   └── property-management.e2e.test.ts
└── setup/                   # Test setup files
```

### Running Tests
```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Coverage
- Unit tests: Services, utilities, helpers
- Integration tests: API endpoints, database operations
- E2E tests: Complete user workflows

---

## API Summary

### Total API Endpoints: 100+

#### Authentication: 5 endpoints
- POST /auth/register
- POST /auth/login
- GET /auth/me
- POST /auth/refresh
- POST /auth/logout

#### Properties: 5 endpoints
- GET /properties
- GET /properties/:id
- POST /properties
- PUT /properties/:id
- DELETE /properties/:id

#### Inventory: 1 endpoint
- GET /inventory

#### CRM: 7 endpoints
- GET /crm/leads
- GET /crm/leads/:id
- POST /crm/leads
- PUT /crm/leads/:id
- POST /crm/leads/:id/score
- GET /crm/customers
- GET /crm/customers/:id

#### ERP: 6 endpoints
- GET /erp/transactions
- POST /erp/transactions
- PUT /erp/transactions/:id
- GET /erp/financials
- GET /erp/payments
- GET /erp/procurement

#### Reports: 1 endpoint
- GET /reports

#### Webhooks: 1 endpoint
- POST /webhooks

#### Notifications: 5 endpoints
- GET /notifications
- PUT /notifications/:id/read
- PUT /notifications/read-all
- GET /notifications/unread-count
- POST /notifications/test

#### Payments: 8 endpoints
- POST /payments/create-order
- POST /payments/verify
- GET /payments/:id
- GET /payments
- POST /payments/:id/refund
- GET /payments/reports/generate
- POST /payments/webhook/razorpay

#### Files: 8 endpoints
- POST /files/property/:propertyId/images
- POST /files/:entityType/:entityId/document
- GET /files/:id
- GET /files/folder/:folder
- GET /files/:id/signed-url
- DELETE /files/:id
- GET /files/stats/overview
- POST /files/cleanup

#### Analytics: 7 endpoints
- GET /analytics/sales
- GET /analytics/leads
- GET /analytics/financial
- GET /analytics/properties
- GET /analytics/customers
- GET /analytics/dashboard
- GET /analytics/export/:type

#### Security: 15 endpoints
- POST /security/validate-password
- POST /security/check-login-attempts
- POST /security/record-failed-login
- POST /security/record-successful-login
- POST /security/create-session
- POST /security/check-rate-limit
- GET /security/events
- GET /security/events/export
- POST /security/events/log
- GET /security/stats
- GET /security/config
- PUT /security/config
- DELETE /security/sessions/:sessionId
- DELETE /security/sessions/user/:userId
- POST /security/generate-token
- POST /security/cleanup/sessions
- POST /security/cleanup/rate-limits
- GET /security/dashboard

#### Company: 3 endpoints
- GET /v1/company
- POST /v1/company/tax-calculate
- GET /v1/company/cities

#### Projects: 4 endpoints
- GET /v1/projects
- GET /v1/projects/:id
- GET /v1/projects/:id/plots
- GET /v1/projects/:id/stats

#### Leads (BlinderSøe): 4 endpoints
- GET /v1/leads
- POST /v1/leads
- PUT /v1/leads/:id/stage
- GET /v1/leads/stats

#### Bookings (BlinderSøe): 5 endpoints
- GET /v1/bookings
- POST /v1/bookings
- PUT /v1/bookings/:id/stage
- PUT /v1/bookings/:id/pricing
- GET /v1/bookings/stats

---

## Technology Stack Summary

### Backend Stack
- **Runtime**: Node.js v18+
- **Framework**: Express.js v4
- **Language**: TypeScript v5
- **Database**: PostgreSQL 15 (Prisma + Drizzle ORM)
- **Cache**: Redis 7
- **Real-time**: Socket.IO v4
- **File Storage**: AWS S3
- **Authentication**: JWT + Bcrypt
- **Validation**: Joi + Express Validator
- **Documentation**: Swagger/OpenAPI
- **Email**: Nodemailer + SendGrid
- **SMS**: Twilio
- **Payments**: Razorpay + PayTabs
- **Monitoring**: Winston + Prometheus

### Frontend Stack
- **Framework**: React Native 0.73 + Expo
- **UI Library**: React Native Paper v5
- **State Management**: Redux Toolkit + Redux Persist
- **Navigation**: React Navigation v6
- **Data Fetching**: React Query v3
- **Offline Storage**: SQLite
- **Internationalization**: i18next + react-i18next
- **ML/AI**: TensorFlow.js
- **3D Rendering**: Three.js (via WebView)

### DevOps & Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Monitoring**: Prometheus + Grafana
- **CI/CD**: GitHub Actions
- **Deployment**: Railway, Vercel, Render

---

## Key Features Summary

✅ Multi-region support (India, UAE, Saudi Arabia, Qatar)
✅ Multi-language support (English, Arabic with RTL)
✅ BlinderSøe CRM API integration
✅ Property management (8 property types)
✅ Inventory management (plot/unit tracking)
✅ Lead management with AI scoring
✅ Customer 360° view
✅ Booking management with stages
✅ Payment integration (Razorpay, PayTabs)
✅ ERP (Financial management)
✅ Analytics & Reporting
✅ Notification system (Real-time, Email, SMS)
✅ File management (AWS S3)
✅ Security (2FA, Rate limiting, Audit logs)
✅ Offline support (Mobile)
✅ Real-time updates (WebSocket)
✅ 3D property visualization
✅ Virtual tours
✅ Project management
✅ Webhooks
✅ API documentation (Swagger)

---

## Database Tables Summary

Total Tables: 20+

1. **users** - User accounts
2. **properties** - Property listings
3. **inventory_items** - Property units/plots
4. **customers** - Customer records
5. **leads** - Lead management
6. **bookings** - Booking records
7. **projects** - Project management
8. **companies** - Multi-region companies
9. **payments** - Payment records
10. **transactions** - Financial transactions
11. **notifications** - User notifications
12. **files** - File metadata
13. **sessions** - User sessions
14. **security_events** - Security audit logs
15. **audit_logs** - System audit trail
16. **two_factor_auth** - 2FA records
17. **rate_limits** - Rate limiting
18. **webhooks** - Webhook subscriptions
19. **webhook_events** - Webhook logs
20. **api_keys** - API key management
21. **system_config** - System configuration

---

## Contact & Support

For any questions or support:
- Documentation: `/api-docs`
- Repository: GitHub
- API Support: Create an issue

---

## License

MIT License - See LICENSE file for details

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Status**: Production Ready

---

This comprehensive documentation covers all aspects of the Property Management Software repository from a code perspective, including complete API documentation, database schema, features, and implementation details.

