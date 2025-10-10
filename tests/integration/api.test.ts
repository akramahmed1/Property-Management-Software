import request from 'supertest';
import { app } from '../../src/backend/src/index';
import { db } from '../../src/backend/src/config/drizzle';
import { users, companies, projects, leads, bookings } from '../../src/backend/src/schema/drizzle';

describe('API Integration Tests', () => {
  let authToken: string;
  let testUserId: string;
  let testCompanyId: string;
  let testProjectId: string;
  let testLeadId: string;
  let testBookingId: string;

  beforeAll(async () => {
    // Create test user
    const testUser = await db.insert(users).values({
      email: 'test@example.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.5.6.7',
      name: 'Test User',
      phone: '+1234567890',
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true
    }).returning();

    testUserId = testUser[0].id;

    // Create test company
    const testCompany = await db.insert(companies).values({
      name: 'Test Company',
      region: 'INDIA',
      currency: 'INR',
      gst: '29ABCDE1234F1Z5',
      taxRate: '0.05',
      taxName: 'GST',
      address: 'Test Address',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      isActive: true
    }).returning();

    testCompanyId = testCompany[0].id;

    // Create test project
    const testProject = await db.insert(projects).values({
      name: 'Test Project',
      description: 'Test Project Description',
      status: 'ONGOING',
      location: 'Test Location',
      address: 'Test Address',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      totalUnits: 100,
      availableUnits: 80,
      soldUnits: 20,
      priceRange: { min: 5000000, max: 10000000 },
      amenities: ['Swimming Pool', 'Gym', 'Parking'],
      features: ['Modern Design', 'Green Building'],
      isActive: true,
      createdById: testUserId
    }).returning();

    testProjectId = testProject[0].id;

    // Create test lead
    const testLead = await db.insert(leads).values({
      name: 'Test Lead',
      email: 'lead@example.com',
      phone: '+1234567890',
      source: 'WEBSITE',
      stage: 'ENQUIRY_RECEIVED',
      score: 10,
      interest: '2 BHK Apartment',
      budget: '5000000',
      notes: 'Test lead notes',
      isActive: true,
      createdById: testUserId
    }).returning();

    testLeadId = testLead[0].id;

    // Create test booking
    const testBooking = await db.insert(bookings).values({
      propertyId: testProjectId,
      customerId: testUserId,
      agentId: testUserId,
      stage: 'TENTATIVELY_BOOKED',
      status: 'PENDING',
      bookingDate: new Date(),
      amount: '5000000',
      advanceAmount: '500000',
      paymentMethod: 'UPI',
      paymentStatus: 'PENDING',
      notes: 'Test booking notes',
      isActive: true,
      createdById: testUserId
    }).returning();

    testBookingId = testBooking[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(bookings).where(eq(bookings.id, testBookingId));
    await db.delete(leads).where(eq(leads.id, testLeadId));
    await db.delete(projects).where(eq(projects.id, testProjectId));
    await db.delete(companies).where(eq(companies.id, testCompanyId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });

  describe('Company Endpoints', () => {
    it('should get company information for INDIA region', async () => {
      const response = await request(app)
        .get('/api/v1/company?region=INDIA')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.region).toBe('INDIA');
      expect(response.body.data.currency).toBe('INR');
      expect(response.body.data.compliance.taxName).toBe('GST');
    });

    it('should get company information for UAE region', async () => {
      const response = await request(app)
        .get('/api/v1/company?region=UAE')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.region).toBe('UAE');
      expect(response.body.data.currency).toBe('AED');
      expect(response.body.data.compliance.taxName).toBe('VAT');
    });

    it('should calculate tax for INDIA region', async () => {
      const response = await request(app)
        .post('/api/v1/company/tax-calculate')
        .send({
          amount: 1000000,
          region: 'INDIA'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.originalAmount).toBe(1000000);
      expect(response.body.data.taxAmount).toBe(50000);
      expect(response.body.data.totalAmount).toBe(1050000);
      expect(response.body.data.taxName).toBe('GST');
    });

    it('should calculate tax for UAE region', async () => {
      const response = await request(app)
        .post('/api/v1/company/tax-calculate')
        .send({
          amount: 1000000,
          region: 'UAE'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.originalAmount).toBe(1000000);
      expect(response.body.data.taxAmount).toBe(50000);
      expect(response.body.data.totalAmount).toBe(1050000);
      expect(response.body.data.taxName).toBe('VAT');
    });

    it('should get cities for INDIA region', async () => {
      const response = await request(app)
        .get('/api/v1/company/cities?region=INDIA')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].region).toBe('INDIA');
    });

    it('should get cities for UAE region', async () => {
      const response = await request(app)
        .get('/api/v1/company/cities?region=UAE')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].region).toBe('UAE');
    });
  });

  describe('Projects Endpoints', () => {
    it('should get projects with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/projects?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(10);
    });

    it('should get projects with filters', async () => {
      const response = await request(app)
        .get('/api/v1/projects?status=ONGOING&city=Mumbai')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should get project by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${testProjectId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testProjectId);
      expect(response.body.data.name).toBe('Test Project');
    });

    it('should get project plots', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${testProjectId}/plots`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should get project statistics', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${testProjectId}/stats`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalUnits).toBeDefined();
      expect(response.body.data.availableUnits).toBeDefined();
      expect(response.body.data.soldUnits).toBeDefined();
    });
  });

  describe('Leads Endpoints', () => {
    it('should get leads with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/leads?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toBeDefined();
    });

    it('should get leads with filters', async () => {
      const response = await request(app)
        .get('/api/v1/leads?source=WEBSITE&stage=ENQUIRY_RECEIVED')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should create new lead', async () => {
      const newLead = {
        name: 'New Test Lead',
        email: 'newlead@example.com',
        phone: '+1234567890',
        source: 'WHATSAPP',
        interest: '3 BHK Villa',
        budget: 8000000,
        notes: 'New test lead notes'
      };

      const response = await request(app)
        .post('/api/v1/leads')
        .send(newLead)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newLead.name);
      expect(response.body.data.email).toBe(newLead.email);
      expect(response.body.data.source).toBe(newLead.source);
    });

    it('should update lead stage', async () => {
      const response = await request(app)
        .put(`/api/v1/leads/${testLeadId}/stage`)
        .send({
          stage: 'SITE_VISIT',
          notes: 'Updated to site visit stage'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stage).toBe('SITE_VISIT');
    });

    it('should get lead statistics', async () => {
      const response = await request(app)
        .get('/api/v1/leads/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.byStage).toBeDefined();
      expect(response.body.data.bySource).toBeDefined();
    });
  });

  describe('Bookings Endpoints', () => {
    it('should get bookings with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/bookings?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toBeDefined();
    });

    it('should get bookings with filters', async () => {
      const response = await request(app)
        .get('/api/v1/bookings?status=PENDING&stage=TENTATIVELY_BOOKED')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should create new booking', async () => {
      const newBooking = {
        propertyId: testProjectId,
        customerId: testUserId,
        agentId: testUserId,
        amount: 6000000,
        advanceAmount: 600000,
        paymentMethod: 'CARD',
        notes: 'New test booking'
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .send(newBooking)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.propertyId).toBe(newBooking.propertyId);
      expect(response.body.data.amount).toBe(newBooking.amount.toString());
    });

    it('should update booking stage', async () => {
      const response = await request(app)
        .put(`/api/v1/bookings/${testBookingId}/stage`)
        .send({
          stage: 'CONFIRMED',
          notes: 'Booking confirmed'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stage).toBe('CONFIRMED');
    });

    it('should update booking pricing', async () => {
      const pricingBreakdown = {
        basePrice: 5000000,
        advanceAmount: 500000,
        remainingAmount: 4500000,
        taxes: 250000,
        totalAmount: 5250000
      };

      const response = await request(app)
        .put(`/api/v1/bookings/${testBookingId}/pricing`)
        .send({ pricingBreakdown })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pricingBreakdown).toEqual(pricingBreakdown);
    });

    it('should get booking statistics', async () => {
      const response = await request(app)
        .get('/api/v1/bookings/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.byStage).toBeDefined();
      expect(response.body.data.byStatus).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/v1/projects/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid tax calculation', async () => {
      const response = await request(app)
        .post('/api/v1/company/tax-calculate')
        .send({
          amount: -1000,
          region: 'INDIA'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid lead creation', async () => {
      const response = await request(app)
        .post('/api/v1/leads')
        .send({
          name: 'Test Lead',
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });
});