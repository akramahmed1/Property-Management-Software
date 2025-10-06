import request from 'supertest';
import { Express } from 'express';
import { app } from '../../src/backend/src/index';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('API Integration Tests', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword123', 12);
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'AGENT',
        isActive: true
      }
    });
    testUserId = user.id;

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword123'
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: 'test@example.com' }
    });
    await prisma.property.deleteMany({
      where: { createdById: testUserId }
    });
    await prisma.auditLog.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.$disconnect();
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);

      // Clean up
      await prisma.user.delete({
        where: { email: userData.email }
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Properties', () => {
    let propertyId: string;

    it('should create a new property', async () => {
      const propertyData = {
        name: 'Test Property',
        type: 'APARTMENT',
        location: 'Test Location',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        price: 5000000,
        area: 1200,
        bedrooms: 3,
        bathrooms: 2
      };

      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send(propertyData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(propertyData.name);
      
      propertyId = response.body.data.id;
    });

    it('should get all properties', async () => {
      const response = await request(app)
        .get('/api/properties')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.properties).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should get property by ID', async () => {
      const response = await request(app)
        .get(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(propertyId);
    });

    it('should update property', async () => {
      const updateData = {
        name: 'Updated Test Property',
        price: 5500000
      };

      const response = await request(app)
        .put(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
    });

    it('should delete property', async () => {
      const response = await request(app)
        .delete(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('CRM - Customers', () => {
    let customerId: string;

    it('should create a new customer', async () => {
      const customerData = {
        name: 'Test Customer',
        email: 'customer@example.com',
        phone: '+1234567890',
        address: '123 Customer Street',
        city: 'Customer City',
        state: 'Customer State',
        country: 'Customer Country'
      };

      const response = await request(app)
        .post('/api/crm/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(customerData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(customerData.name);
      
      customerId = response.body.data.id;
    });

    it('should get all customers', async () => {
      const response = await request(app)
        .get('/api/crm/customers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customers).toBeInstanceOf(Array);
    });

    it('should get customer by ID', async () => {
      const response = await request(app)
        .get(`/api/crm/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(customerId);
    });

    // Clean up
    afterAll(async () => {
      if (customerId) {
        await prisma.customer.delete({
          where: { id: customerId }
        });
      }
    });
  });

  describe('CRM - Leads', () => {
    let leadId: string;

    it('should create a new lead', async () => {
      const leadData = {
        name: 'Test Lead',
        email: 'lead@example.com',
        phone: '+1234567890',
        source: 'WEBSITE',
        status: 'NEW',
        interest: '3BHK Apartment',
        budget: 5000000
      };

      const response = await request(app)
        .post('/api/crm/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send(leadData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(leadData.name);
      
      leadId = response.body.data.id;
    });

    it('should get all leads', async () => {
      const response = await request(app)
        .get('/api/crm/leads')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.leads).toBeInstanceOf(Array);
    });

    it('should update lead score', async () => {
      const response = await request(app)
        .post(`/api/crm/leads/${leadId}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ score: 85 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    // Clean up
    afterAll(async () => {
      if (leadId) {
        await prisma.lead.delete({
          where: { id: leadId }
        });
      }
    });
  });

  describe('Bookings', () => {
    let propertyId: string;
    let customerId: string;
    let bookingId: string;

    beforeAll(async () => {
      // Create test property
      const property = await prisma.property.create({
        data: {
          name: 'Test Property for Booking',
          type: 'APARTMENT',
          status: 'AVAILABLE',
          location: 'Test Location',
          address: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          price: 5000000,
          area: 1200,
          createdById: testUserId
        }
      });
      propertyId = property.id;

      // Create test customer
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer for Booking',
          email: 'bookingcustomer@example.com',
          phone: '+1234567890',
          createdById: testUserId
        }
      });
      customerId = customer.id;
    });

    it('should create a new booking', async () => {
      const bookingData = {
        propertyId,
        customerId,
        agentId: testUserId,
        bookingDate: new Date().toISOString(),
        amount: 5000000,
        advanceAmount: 500000,
        paymentMethod: 'UPI',
        notes: 'Test booking'
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(bookingData.amount);
      
      bookingId = response.body.data.id;
    });

    it('should get all bookings', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bookings).toBeInstanceOf(Array);
    });

    it('should confirm booking', async () => {
      const response = await request(app)
        .post(`/api/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    // Clean up
    afterAll(async () => {
      if (bookingId) {
        await prisma.booking.delete({
          where: { id: bookingId }
        });
      }
      if (propertyId) {
        await prisma.property.delete({
          where: { id: propertyId }
        });
      }
      if (customerId) {
        await prisma.customer.delete({
          where: { id: customerId }
        });
      }
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route');

      expect(response.status).toBe(404);
    });

    it('should return 401 for protected routes without auth', async () => {
      const response = await request(app)
        .get('/api/properties');

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Invalid empty name
          type: 'INVALID_TYPE' // Invalid type
        });

      expect(response.status).toBe(400);
    });
  });
});