# API Documentation

## Overview

The Property Management Software API provides comprehensive endpoints for managing properties, customers, bookings, payments, and more. The API follows RESTful principles and includes real-time capabilities via WebSockets.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+1234567890",
  "role": "AGENT"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "AGENT"
    },
    "token": "jwt_token"
  }
}
```

#### POST /auth/login
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

#### POST /auth/logout
Logout user and invalidate tokens.

#### POST /auth/forgot-password
Request password reset.

#### POST /auth/reset-password
Reset password using reset token.

## Property Management

### Properties

#### GET /properties
Get list of properties with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `type` (string): Property type filter
- `status` (string): Property status filter
- `city` (string): City filter
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter

**Response:**
```json
{
  "success": true,
  "data": {
    "properties": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

#### GET /properties/:id
Get property details by ID.

#### POST /properties
Create new property (Manager/Admin only).

**Request Body:**
```json
{
  "name": "Luxury Villa",
  "type": "VILLA",
  "location": "Hyderabad",
  "address": "123 Main Street",
  "city": "Hyderabad",
  "state": "Telangana",
  "country": "India",
  "price": 5000000,
  "area": 2500,
  "bedrooms": 4,
  "bathrooms": 3,
  "facing": "North",
  "vastu": "Good",
  "amenities": ["Swimming Pool", "Garden", "Parking"],
  "description": "Beautiful luxury villa"
}
```

#### PUT /properties/:id
Update property details.

#### DELETE /properties/:id
Delete property (Admin only).

### Inventory Management

#### GET /inventory
Get inventory items with filtering.

#### GET /inventory/:id
Get inventory item details.

#### POST /inventory
Create inventory item.

#### PUT /inventory/:id
Update inventory item.

#### DELETE /inventory/:id
Delete inventory item.

## CRM (Customer Relationship Management)

### Customers

#### GET /crm/customers
Get list of customers.

#### GET /crm/customers/:id
Get customer details.

#### POST /crm/customers
Create new customer.

#### PUT /crm/customers/:id
Update customer details.

### Leads

#### GET /crm/leads
Get list of leads with filtering.

**Query Parameters:**
- `status` (string): Lead status filter
- `source` (string): Lead source filter
- `assignedTo` (string): Assigned agent filter

#### GET /crm/leads/:id
Get lead details.

#### POST /crm/leads
Create new lead.

#### PUT /crm/leads/:id
Update lead details.

#### POST /crm/leads/:id/score
Update lead score.

## ERP (Enterprise Resource Planning)

### Transactions

#### GET /erp/transactions
Get financial transactions.

#### POST /erp/transactions
Create new transaction.

#### GET /erp/transactions/summary
Get financial summary.

### Reports

#### GET /reports/sales
Get sales reports.

#### GET /reports/financial
Get financial reports.

#### GET /reports/analytics
Get analytics reports.

## Booking Management

### Bookings

#### GET /bookings
Get list of bookings.

#### GET /bookings/:id
Get booking details.

#### POST /bookings
Create new booking.

**Request Body:**
```json
{
  "propertyId": "property_id",
  "inventoryId": "inventory_id",
  "customerId": "customer_id",
  "bookingDate": "2024-01-15T10:00:00Z",
  "amount": 500000,
  "advanceAmount": 50000,
  "notes": "Booking notes"
}
```

#### PUT /bookings/:id
Update booking details.

#### POST /bookings/:id/confirm
Confirm booking.

#### POST /bookings/:id/cancel
Cancel booking.

## Payment Management

### Payments

#### GET /payments
Get list of payments.

#### GET /payments/:id
Get payment details.

#### POST /payments
Create new payment.

#### POST /payments/:id/process
Process payment.

#### POST /payments/:id/refund
Process refund.

### Payment Gateways

#### POST /payments/razorpay/create-order
Create Razorpay order.

#### POST /payments/razorpay/verify
Verify Razorpay payment.

#### POST /payments/paytabs/create-payment
Create PayTabs payment.

## File Management

### Files

#### POST /files/upload
Upload file.

**Request:** Multipart form data with file.

#### GET /files/:id
Download file.

#### DELETE /files/:id
Delete file.

## Notifications

### Notifications

#### GET /notifications
Get user notifications.

#### PUT /notifications/:id/read
Mark notification as read.

#### PUT /notifications/read-all
Mark all notifications as read.

## Real-time Features

### WebSocket Events

Connect to WebSocket at `/socket.io/` for real-time updates.

#### Events:
- `booking_created`: New booking created
- `booking_updated`: Booking status updated
- `payment_received`: Payment processed
- `notification`: New notification
- `property_updated`: Property details updated

## Error Handling

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {...}
  }
}
```

### Common Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Rate Limiting

API requests are rate limited:
- **General**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **File Upload**: 10 requests per 15 minutes per IP

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response Format:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Filtering and Sorting

Most list endpoints support filtering and sorting:

**Query Parameters:**
- `filter[field]`: Filter by specific field
- `sort`: Sort field (prefix with `-` for descending)
- `search`: Search term

**Example:**
```
GET /properties?filter[type]=VILLA&filter[status]=AVAILABLE&sort=-createdAt&search=luxury
```

## Webhooks

The API supports webhooks for external integrations:

### Available Webhooks
- `booking.created`
- `booking.updated`
- `payment.completed`
- `payment.failed`
- `lead.created`
- `lead.updated`

### Webhook Configuration
Configure webhooks via the admin panel or API endpoints.

## SDK and Libraries

### JavaScript/TypeScript
```bash
npm install property-management-sdk
```

### React Native
```bash
npm install @property-management/react-native-sdk
```

## Postman Collection

Import the Postman collection from `/docs/postman/Property-Management-API.postman_collection.json` for easy API testing.

## Support

For API support and questions:
- Check the API documentation at `/api-docs`
- Create an issue in the repository
- Contact the development team