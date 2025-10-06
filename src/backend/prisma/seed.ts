import { PrismaClient, UserRole, PropertyType, PropertyStatus, LeadSource, LeadStatus, BookingStatus, PaymentMethod, PaymentStatus, TransactionType, TransactionStatus, NotificationType, NotificationPriority, SecuritySeverity } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await clearDatabase();

    // Create users
    const users = await createUsers();
    console.log(`✅ Created ${users.length} users`);

    // Create properties
    const properties = await createProperties(users);
    console.log(`✅ Created ${properties.length} properties`);

    // Create customers
    const customers = await createCustomers(users);
    console.log(`✅ Created ${customers.length} customers`);

    // Create leads
    const leads = await createLeads(users, customers);
    console.log(`✅ Created ${leads.length} leads`);

    // Create bookings
    const bookings = await createBookings(users, customers, properties);
    console.log(`✅ Created ${bookings.length} bookings`);

    // Create payments
    const payments = await createPayments(bookings);
    console.log(`✅ Created ${payments.length} payments`);

    // Create transactions
    const transactions = await createTransactions(users);
    console.log(`✅ Created ${transactions.length} transactions`);

    // Create notifications
    const notifications = await createNotifications(users);
    console.log(`✅ Created ${notifications.length} notifications`);

    // Create system configuration
    await createSystemConfig();
    console.log('✅ Created system configuration');

    // Create API keys
    await createApiKeys();
    console.log('✅ Created API keys');

    // Create webhooks
    await createWebhooks();
    console.log('✅ Created webhooks');

    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  
  const tables = [
    'WebhookEvent',
    'Webhook',
    'ApiKey',
    'SystemConfig',
    'SecurityEvent',
    'RateLimit',
    'Session',
    'TwoFactorAuth',
    'AuditLog',
    'File',
    'Notification',
    'Transaction',
    'Payment',
    'Booking',
    'Lead',
    'Customer',
    'InventoryItem',
    'Property',
    'User',
  ];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
  }
}

async function createUsers() {
  const users = [
    {
      email: 'admin@propertymgmt.com',
      password: await bcrypt.hash('admin123', 12),
      name: 'Super Admin',
      phone: '+1234567890',
      role: UserRole.SUPER_ADMIN,
      isEmailVerified: true,
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      },
    },
    {
      email: 'manager@propertymgmt.com',
      password: await bcrypt.hash('manager123', 12),
      name: 'Property Manager',
      phone: '+1234567891',
      role: UserRole.MANAGER,
      isEmailVerified: true,
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          sms: true,
        },
      },
    },
    {
      email: 'agent1@propertymgmt.com',
      password: await bcrypt.hash('agent123', 12),
      name: 'John Smith',
      phone: '+1234567892',
      role: UserRole.AGENT,
      isEmailVerified: true,
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      },
    },
    {
      email: 'agent2@propertymgmt.com',
      password: await bcrypt.hash('agent123', 12),
      name: 'Sarah Johnson',
      phone: '+1234567893',
      role: UserRole.AGENT,
      isEmailVerified: true,
      preferences: {
        theme: 'dark',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          sms: true,
        },
      },
    },
    {
      email: 'customer1@example.com',
      password: await bcrypt.hash('customer123', 12),
      name: 'Mike Wilson',
      phone: '+1234567894',
      role: UserRole.CUSTOMER,
      isEmailVerified: true,
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          push: false,
          sms: false,
        },
      },
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData,
    });
    createdUsers.push(user);
  }

  return createdUsers;
}

async function createProperties(users: any[]) {
  const properties = [
    {
      name: 'Luxury Apartment Complex',
      type: PropertyType.APARTMENT,
      status: PropertyStatus.AVAILABLE,
      location: 'Downtown Business District',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      pincode: '10001',
      price: 5000000,
      area: 1200,
      bedrooms: 3,
      bathrooms: 2,
      floors: 1,
      facing: 'North',
      vastu: 'East',
      amenities: ['Swimming Pool', 'Gym', 'Parking', 'Security'],
      features: ['Balcony', 'Garden', 'Modern Kitchen'],
      description: 'Beautiful luxury apartment in the heart of downtown with modern amenities.',
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      videos: ['https://example.com/video1.mp4'],
      documents: ['https://example.com/doc1.pdf'],
      floorPlan: 'https://example.com/floorplan1.jpg',
      layout3D: 'https://example.com/3d1.jpg',
      coordinates: { latitude: 40.7128, longitude: -74.0060 },
      isFeatured: true,
      views: 150,
      inquiries: 25,
      bookings: 5,
      createdById: users[0].id,
      updatedById: users[0].id,
    },
    {
      name: 'Modern Villa',
      type: PropertyType.VILLA,
      status: PropertyStatus.SOLD,
      location: 'Suburban Area',
      address: '456 Oak Avenue',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      pincode: '90210',
      price: 8000000,
      area: 2500,
      bedrooms: 4,
      bathrooms: 3,
      floors: 2,
      facing: 'South',
      vastu: 'West',
      amenities: ['Swimming Pool', 'Garden', 'Garage', 'Security'],
      features: ['Terrace', 'Fireplace', 'Modern Kitchen', 'Home Office'],
      description: 'Spacious modern villa with beautiful garden and pool.',
      images: ['https://example.com/villa1.jpg', 'https://example.com/villa2.jpg'],
      videos: ['https://example.com/villa_video.mp4'],
      documents: ['https://example.com/villa_doc.pdf'],
      floorPlan: 'https://example.com/villa_floorplan.jpg',
      layout3D: 'https://example.com/villa_3d.jpg',
      coordinates: { latitude: 34.0522, longitude: -118.2437 },
      isFeatured: false,
      views: 200,
      inquiries: 40,
      bookings: 8,
      createdById: users[1].id,
      updatedById: users[1].id,
    },
    {
      name: 'Commercial Office Space',
      type: PropertyType.OFFICE,
      status: PropertyStatus.AVAILABLE,
      location: 'Business Park',
      address: '789 Business Blvd',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      pincode: '60601',
      price: 3000000,
      area: 2000,
      bedrooms: 0,
      bathrooms: 2,
      floors: 1,
      facing: 'East',
      vastu: 'North',
      amenities: ['Parking', 'Security', 'Elevator', 'Conference Room'],
      features: ['Open Plan', 'Modern Design', 'High Ceilings'],
      description: 'Modern office space in prime business location.',
      images: ['https://example.com/office1.jpg'],
      videos: [],
      documents: ['https://example.com/office_doc.pdf'],
      floorPlan: 'https://example.com/office_floorplan.jpg',
      layout3D: null,
      coordinates: { latitude: 41.8781, longitude: -87.6298 },
      isFeatured: false,
      views: 75,
      inquiries: 15,
      bookings: 2,
      createdById: users[1].id,
      updatedById: users[1].id,
    },
  ];

  const createdProperties = [];
  for (const propertyData of properties) {
    const property = await prisma.property.create({
      data: propertyData,
    });
    createdProperties.push(property);
  }

  return createdProperties;
}

async function createCustomers(users: any[]) {
  const customers = [
    {
      name: 'Mike Wilson',
      email: 'mike.wilson@example.com',
      phone: '+1234567894',
      address: '100 Customer Street',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      pincode: '10002',
      dateOfBirth: new Date('1985-05-15'),
      occupation: 'Software Engineer',
      income: 120000,
      preferences: {
        propertyTypes: ['APARTMENT', 'VILLA'],
        budget: { min: 3000000, max: 6000000 },
        locations: ['New York', 'Los Angeles'],
      },
      budget: 5000000,
      notes: 'Looking for a modern apartment in downtown area.',
      createdById: users[2].id,
      updatedById: users[2].id,
    },
    {
      name: 'Sarah Davis',
      email: 'sarah.davis@example.com',
      phone: '+1234567895',
      address: '200 Customer Avenue',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      pincode: '90211',
      dateOfBirth: new Date('1990-08-22'),
      occupation: 'Marketing Manager',
      income: 95000,
      preferences: {
        propertyTypes: ['VILLA', 'HOUSE'],
        budget: { min: 5000000, max: 10000000 },
        locations: ['Los Angeles', 'San Francisco'],
      },
      budget: 7500000,
      notes: 'Interested in a family home with garden.',
      createdById: users[3].id,
      updatedById: users[3].id,
    },
  ];

  const createdCustomers = [];
  for (const customerData of customers) {
    const customer = await prisma.customer.create({
      data: customerData,
    });
    createdCustomers.push(customer);
  }

  return createdCustomers;
}

async function createLeads(users: any[], customers: any[]) {
  const leads = [
    {
      customerId: customers[0].id,
      name: 'Mike Wilson',
      email: 'mike.wilson@example.com',
      phone: '+1234567894',
      source: LeadSource.WEBSITE,
      status: LeadStatus.QUALIFIED,
      score: 85,
      interest: '3BHK Apartment in Downtown',
      budget: 5000000,
      notes: 'Very interested in luxury apartment complex.',
      assignedTo: users[2].id,
      createdById: users[2].id,
      updatedById: users[2].id,
    },
    {
      customerId: customers[1].id,
      name: 'Sarah Davis',
      email: 'sarah.davis@example.com',
      phone: '+1234567895',
      source: LeadSource.REFERRAL,
      status: LeadStatus.CONTACTED,
      score: 70,
      interest: '4BHK Villa with Garden',
      budget: 7500000,
      notes: 'Referred by existing customer.',
      assignedTo: users[3].id,
      createdById: users[3].id,
      updatedById: users[3].id,
    },
    {
      name: 'John Brown',
      email: 'john.brown@example.com',
      phone: '+1234567896',
      source: LeadSource.PHONE,
      status: LeadStatus.NEW,
      score: 60,
      interest: 'Office Space for Startup',
      budget: 2000000,
      notes: 'Looking for office space for new startup.',
      assignedTo: users[2].id,
      createdById: users[2].id,
      updatedById: users[2].id,
    },
  ];

  const createdLeads = [];
  for (const leadData of leads) {
    const lead = await prisma.lead.create({
      data: leadData,
    });
    createdLeads.push(lead);
  }

  return createdLeads;
}

async function createBookings(users: any[], customers: any[], properties: any[]) {
  const bookings = [
    {
      propertyId: properties[0].id,
      customerId: customers[0].id,
      agentId: users[2].id,
      status: BookingStatus.CONFIRMED,
      bookingDate: new Date('2024-01-15'),
      moveInDate: new Date('2024-02-01'),
      moveOutDate: null,
      amount: 5000000,
      advanceAmount: 500000,
      paymentMethod: PaymentMethod.UPI,
      paymentStatus: PaymentStatus.COMPLETED,
      notes: 'Customer very satisfied with the property.',
      documents: ['https://example.com/booking1.pdf'],
      createdById: users[2].id,
      updatedById: users[2].id,
    },
    {
      propertyId: properties[1].id,
      customerId: customers[1].id,
      agentId: users[3].id,
      status: BookingStatus.PENDING,
      bookingDate: new Date('2024-01-20'),
      moveInDate: new Date('2024-03-01'),
      moveOutDate: null,
      amount: 8000000,
      advanceAmount: 800000,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentStatus: PaymentStatus.PENDING,
      notes: 'Waiting for customer confirmation.',
      documents: [],
      createdById: users[3].id,
      updatedById: users[3].id,
    },
  ];

  const createdBookings = [];
  for (const bookingData of bookings) {
    const booking = await prisma.booking.create({
      data: bookingData,
    });
    createdBookings.push(booking);
  }

  return createdBookings;
}

async function createPayments(bookings: any[]) {
  const payments = [
    {
      bookingId: bookings[0].id,
      amount: 500000,
      currency: 'INR',
      method: PaymentMethod.UPI,
      status: PaymentStatus.COMPLETED,
      gateway: 'RAZORPAY',
      gatewayId: 'pay_123456789',
      gatewayData: {
        transactionId: 'txn_123456789',
        paymentId: 'pay_123456789',
        orderId: 'order_123456789',
      },
      processedAt: new Date('2024-01-15T10:30:00Z'),
      createdById: bookings[0].agentId,
      updatedById: bookings[0].agentId,
    },
    {
      bookingId: bookings[1].id,
      amount: 800000,
      currency: 'INR',
      method: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.PENDING,
      gateway: 'RAZORPAY',
      gatewayId: null,
      gatewayData: null,
      processedAt: null,
      createdById: bookings[1].agentId,
      updatedById: bookings[1].agentId,
    },
  ];

  const createdPayments = [];
  for (const paymentData of payments) {
    const payment = await prisma.payment.create({
      data: paymentData,
    });
    createdPayments.push(payment);
  }

  return createdPayments;
}

async function createTransactions(users: any[]) {
  const transactions = [
    {
      type: TransactionType.INCOME,
      category: 'Property Sale',
      amount: 5000000,
      currency: 'INR',
      description: 'Sale of luxury apartment',
      reference: 'PROP-001',
      date: new Date('2024-01-15'),
      status: TransactionStatus.COMPLETED,
      createdById: users[0].id,
      updatedById: users[0].id,
    },
    {
      type: TransactionType.EXPENSE,
      category: 'Marketing',
      amount: 50000,
      currency: 'INR',
      description: 'Online advertising campaign',
      reference: 'MKT-001',
      date: new Date('2024-01-10'),
      status: TransactionStatus.COMPLETED,
      createdById: users[1].id,
      updatedById: users[1].id,
    },
  ];

  const createdTransactions = [];
  for (const transactionData of transactions) {
    const transaction = await prisma.transaction.create({
      data: transactionData,
    });
    createdTransactions.push(transaction);
  }

  return createdTransactions;
}

async function createNotifications(users: any[]) {
  const notifications = [
    {
      userId: users[2].id,
      type: NotificationType.BOOKING_CREATED,
      title: 'New Booking Created',
      message: 'A new booking has been created for Luxury Apartment Complex',
      data: {
        bookingId: 'booking_123',
        propertyId: 'property_123',
        customerId: 'customer_123',
      },
      priority: NotificationPriority.MEDIUM,
    },
    {
      userId: users[3].id,
      type: NotificationType.LEAD_ASSIGNED,
      title: 'New Lead Assigned',
      message: 'A new lead has been assigned to you',
      data: {
        leadId: 'lead_123',
        customerId: 'customer_123',
      },
      priority: NotificationPriority.HIGH,
    },
    {
      userId: users[0].id,
      type: NotificationType.SYSTEM_ALERT,
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight from 2 AM to 4 AM',
      data: {
        maintenanceType: 'scheduled',
        startTime: '2024-01-20T02:00:00Z',
        endTime: '2024-01-20T04:00:00Z',
      },
      priority: NotificationPriority.URGENT,
    },
  ];

  const createdNotifications = [];
  for (const notificationData of notifications) {
    const notification = await prisma.notification.create({
      data: notificationData,
    });
    createdNotifications.push(notification);
  }

  return createdNotifications;
}

async function createSystemConfig() {
  const configs = [
    {
      key: 'app_name',
      value: 'Property Management System',
      type: 'string',
      description: 'Application name',
    },
    {
      key: 'app_version',
      value: '1.0.0',
      type: 'string',
      description: 'Application version',
    },
    {
      key: 'max_file_size',
      value: '10485760',
      type: 'number',
      description: 'Maximum file size in bytes (10MB)',
    },
    {
      key: 'allowed_file_types',
      value: 'jpg,jpeg,png,pdf,doc,docx',
      type: 'string',
      description: 'Allowed file types for uploads',
    },
    {
      key: 'email_notifications_enabled',
      value: 'true',
      type: 'boolean',
      description: 'Enable email notifications',
    },
    {
      key: 'sms_notifications_enabled',
      value: 'false',
      type: 'boolean',
      description: 'Enable SMS notifications',
    },
    {
      key: 'rate_limit_requests_per_minute',
      value: '100',
      type: 'number',
      description: 'Rate limit for API requests per minute',
    },
    {
      key: 'session_timeout_minutes',
      value: '30',
      type: 'number',
      description: 'Session timeout in minutes',
    },
  ];

  for (const config of configs) {
    await prisma.systemConfig.create({
      data: config,
    });
  }
}

async function createApiKeys() {
  const apiKeys = [
    {
      name: 'Mobile App API Key',
      key: 'mobile_app_key_123456789',
      secret: 'mobile_app_secret_987654321',
      permissions: ['read:properties', 'read:bookings', 'read:customers'],
      isActive: true,
      expiresAt: new Date('2025-12-31'),
    },
    {
      name: 'Webhook API Key',
      key: 'webhook_key_123456789',
      secret: 'webhook_secret_987654321',
      permissions: ['webhook:notifications', 'webhook:payments'],
      isActive: true,
      expiresAt: new Date('2025-12-31'),
    },
  ];

  for (const apiKey of apiKeys) {
    await prisma.apiKey.create({
      data: apiKey,
    });
  }
}

async function createWebhooks() {
  const webhooks = [
    {
      url: 'https://example.com/webhook/payments',
      events: ['payment.completed', 'payment.failed'],
      secret: 'webhook_secret_123',
      isActive: true,
    },
    {
      url: 'https://example.com/webhook/bookings',
      events: ['booking.created', 'booking.confirmed', 'booking.cancelled'],
      secret: 'webhook_secret_456',
      isActive: true,
    },
  ];

  for (const webhook of webhooks) {
    await prisma.webhook.create({
      data: webhook,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });