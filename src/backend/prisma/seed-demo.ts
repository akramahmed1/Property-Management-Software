import { PrismaClient, UserRole, PropertyType, PropertyStatus, LeadSource, LeadStatus, BookingStatus, PaymentMethod, PaymentStatus, TransactionType, TransactionStatus, NotificationType, NotificationPriority } from '../src/generated/client';
import bcrypt from 'bcryptjs';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting demo data seeding...');

    // Clear existing data
    await clearDatabase();

    // Create demo users
    const users = await createDemoUsers();
    console.log(`✅ Created ${users.length} demo users`);

    // Create demo properties
    const properties = await createDemoProperties(users);
    console.log(`✅ Created ${properties.length} demo properties`);

    // Create demo customers
    const customers = await createDemoCustomers(users);
    console.log(`✅ Created ${customers.length} demo customers`);

    // Create demo leads
    const leads = await createDemoLeads(users, customers);
    console.log(`✅ Created ${leads.length} demo leads`);

    // Create demo bookings
    const bookings = await createDemoBookings(users, customers, properties);
    console.log(`✅ Created ${bookings.length} demo bookings`);

    // Create demo payments
    const payments = await createDemoPayments(bookings);
    console.log(`✅ Created ${payments.length} demo payments`);

    // Create demo transactions
    const transactions = await createDemoTransactions(users);
    console.log(`✅ Created ${transactions.length} demo transactions`);

    // Create demo notifications
    const notifications = await createDemoNotifications(users);
    console.log(`✅ Created ${notifications.length} demo notifications`);

    // Create demo files
    await createDemoFiles();
    console.log('✅ Created demo files');

    // Create demo analytics data
    await createDemoAnalytics();
    console.log('✅ Created demo analytics data');

    console.log('🎉 Demo data seeding completed successfully!');
    console.log('\n📊 Demo Data Summary:');
    console.log(`👥 Users: ${users.length}`);
    console.log(`🏠 Properties: ${properties.length}`);
    console.log(`👤 Customers: ${customers.length}`);
    console.log(`🎯 Leads: ${leads.length}`);
    console.log(`📅 Bookings: ${bookings.length}`);
    console.log(`💳 Payments: ${payments.length}`);
    console.log(`💰 Transactions: ${transactions.length}`);
    console.log(`🔔 Notifications: ${notifications.length}`);

    console.log('\n🔑 Demo Login Credentials:');
    console.log('Admin: admin@demo.com / Admin123!');
    console.log('Manager: manager@demo.com / Manager123!');
    console.log('Agent: agent@demo.com / Agent123!');
    console.log('Customer: customer@demo.com / Customer123!');

  } catch (error) {
    console.error('❌ Demo seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function clearDatabase() {
  console.log('🧹 Clearing existing demo data...');
  
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

async function createDemoUsers() {
  const users = [
    {
      email: 'admin@demo.com',
      password: await bcrypt.hash('Admin123!', 12),
      name: 'Demo Admin',
      phone: '+971501234567',
      role: UserRole.SUPER_ADMIN,
      isEmailVerified: true,
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: { email: true, push: true, sms: false },
      },
    },
    {
      email: 'manager@demo.com',
      password: await bcrypt.hash('Manager123!', 12),
      name: 'Demo Manager',
      phone: '+971501234568',
      role: UserRole.MANAGER,
      isEmailVerified: true,
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: { email: true, push: true, sms: true },
      },
    },
    {
      email: 'agent@demo.com',
      password: await bcrypt.hash('Agent123!', 12),
      name: 'Demo Agent',
      phone: '+971501234569',
      role: UserRole.AGENT,
      isEmailVerified: true,
      preferences: {
        theme: 'dark',
        language: 'ar',
        notifications: { email: true, push: true, sms: false },
      },
    },
    {
      email: 'customer@demo.com',
      password: await bcrypt.hash('Customer123!', 12),
      name: 'Demo Customer',
      phone: '+971501234570',
      role: UserRole.CUSTOMER,
      isEmailVerified: true,
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: { email: true, push: false, sms: false },
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

async function createDemoProperties(users: any[]) {
  const properties = [
    {
      name: 'Luxury Apartment Complex - Downtown Dubai',
      type: PropertyType.APARTMENT,
      status: PropertyStatus.AVAILABLE,
      location: 'Downtown Dubai',
      address: 'Burj Khalifa Area, Sheikh Mohammed bin Rashid Blvd',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      pincode: '00000',
      price: 2500000, // 2.5M AED
      area: 1200,
      bedrooms: 3,
      bathrooms: 2,
      floors: 1,
      facing: 'North',
      vastu: 'East',
      amenities: ['Swimming Pool', 'Gym', 'Parking', 'Security', 'Concierge', 'Garden'],
      features: ['Balcony', 'Modern Kitchen', 'Marble Flooring', 'Built-in Wardrobes'],
      description: 'Luxurious 3-bedroom apartment in the heart of Downtown Dubai with stunning Burj Khalifa views. Modern amenities and premium finishes throughout.',
      images: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800',
        'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800'
      ],
      videos: ['https://example.com/video1.mp4'],
      documents: ['https://example.com/brochure.pdf'],
      floorPlan: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      layout3D: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      coordinates: { latitude: 25.1972, longitude: 55.2744 },
      isFeatured: true,
      views: 250,
      inquiries: 45,
      bookings: 8,
      createdById: users[0].id,
      updatedById: users[0].id,
    },
    {
      name: 'Modern Villa - Palm Jumeirah',
      type: PropertyType.VILLA,
      status: PropertyStatus.SOLD,
      location: 'Palm Jumeirah',
      address: 'Palm Jumeirah, Frond A, Villa 123',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      pincode: '00000',
      price: 8500000, // 8.5M AED
      area: 4500,
      bedrooms: 5,
      bathrooms: 4,
      floors: 2,
      facing: 'South',
      vastu: 'West',
      amenities: ['Private Beach', 'Swimming Pool', 'Garden', 'Garage', 'Security', 'Maid Room'],
      features: ['Terrace', 'Fireplace', 'Modern Kitchen', 'Home Office', 'Study Room'],
      description: 'Stunning 5-bedroom villa on Palm Jumeirah with private beach access. Premium finishes and world-class amenities.',
      images: [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'
      ],
      videos: ['https://example.com/villa_video.mp4'],
      documents: ['https://example.com/villa_doc.pdf'],
      floorPlan: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      layout3D: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      coordinates: { latitude: 25.1124, longitude: 55.1390 },
      isFeatured: true,
      views: 500,
      inquiries: 120,
      bookings: 25,
      createdById: users[1].id,
      updatedById: users[1].id,
    },
    {
      name: 'Commercial Office Space - Business Bay',
      type: PropertyType.OFFICE,
      status: PropertyStatus.AVAILABLE,
      location: 'Business Bay',
      address: 'Business Bay, Emirates Towers Area',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      pincode: '00000',
      price: 1800000, // 1.8M AED
      area: 2500,
      bedrooms: 0,
      bathrooms: 3,
      floors: 1,
      facing: 'East',
      vastu: 'North',
      amenities: ['Parking', 'Security', 'Elevator', 'Conference Room', 'Reception', 'Cafeteria'],
      features: ['Open Plan', 'Modern Design', 'High Ceilings', 'Glass Facade'],
      description: 'Premium office space in Business Bay with modern facilities and excellent connectivity.',
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'
      ],
      videos: [],
      documents: ['https://example.com/office_doc.pdf'],
      floorPlan: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      layout3D: null,
      coordinates: { latitude: 25.1881, longitude: 55.2639 },
      isFeatured: false,
      views: 150,
      inquiries: 30,
      bookings: 5,
      createdById: users[1].id,
      updatedById: users[1].id,
    },
    {
      name: 'Investment Plot - Dubai Hills',
      type: PropertyType.PLOT,
      status: PropertyStatus.AVAILABLE,
      location: 'Dubai Hills Estate',
      address: 'Dubai Hills Estate, Plot 456',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      pincode: '00000',
      price: 1200000, // 1.2M AED
      area: 5000,
      bedrooms: 0,
      bathrooms: 0,
      floors: 0,
      facing: 'North',
      vastu: 'East',
      amenities: ['Gated Community', 'Security', 'Landscaping', 'Utilities'],
      features: ['Corner Plot', 'Garden View', 'Near Golf Course'],
      description: 'Premium investment plot in Dubai Hills Estate with excellent potential for villa construction.',
      images: [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
      ],
      videos: [],
      documents: ['https://example.com/plot_doc.pdf'],
      floorPlan: null,
      layout3D: null,
      coordinates: { latitude: 25.0594, longitude: 55.3042 },
      isFeatured: false,
      views: 80,
      inquiries: 15,
      bookings: 2,
      createdById: users[2].id,
      updatedById: users[2].id,
    },
    {
      name: 'Retail Shop - Dubai Mall',
      type: PropertyType.SHOP,
      status: PropertyStatus.RENTED,
      location: 'Dubai Mall',
      address: 'Dubai Mall, Ground Floor, Shop 789',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      pincode: '00000',
      price: 3200000, // 3.2M AED
      area: 800,
      bedrooms: 0,
      bathrooms: 1,
      floors: 1,
      facing: 'West',
      vastu: 'South',
      amenities: ['Air Conditioning', 'Security', 'Parking', 'Storage'],
      features: ['High Footfall', 'Prime Location', 'Modern Fit-out'],
      description: 'Prime retail space in Dubai Mall with high footfall and excellent visibility.',
      images: [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'
      ],
      videos: [],
      documents: ['https://example.com/shop_doc.pdf'],
      floorPlan: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      layout3D: null,
      coordinates: { latitude: 25.1972, longitude: 55.2744 },
      isFeatured: false,
      views: 300,
      inquiries: 80,
      bookings: 15,
      createdById: users[2].id,
      updatedById: users[2].id,
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

async function createDemoCustomers(users: any[]) {
  const customers = [
    {
      name: 'Ahmed Al-Rashid',
      email: 'ahmed@example.com',
      phone: '+971501234571',
      address: 'Jumeirah 1, Villa 12',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      pincode: '00000',
      dateOfBirth: new Date('1985-05-15'),
      occupation: 'Investment Banker',
      income: 450000,
      preferences: {
        propertyTypes: ['APARTMENT', 'VILLA'],
        budget: { min: 2000000, max: 5000000 },
        locations: ['Downtown Dubai', 'Palm Jumeirah', 'Business Bay'],
      },
      budget: 3500000,
      notes: 'Looking for luxury apartment with sea view. Prefers modern amenities and proximity to business district.',
      createdById: users[2].id,
      updatedById: users[2].id,
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '+971501234572',
      address: 'Marina Walk, Apartment 45',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      pincode: '00000',
      dateOfBirth: new Date('1990-08-22'),
      occupation: 'Marketing Director',
      income: 280000,
      preferences: {
        propertyTypes: ['VILLA', 'HOUSE'],
        budget: { min: 3000000, max: 8000000 },
        locations: ['Palm Jumeirah', 'Emirates Hills', 'Jumeirah'],
      },
      budget: 6000000,
      notes: 'Interested in family villa with garden. Needs good schools nearby.',
      createdById: users[2].id,
      updatedById: users[2].id,
    },
    {
      name: 'Mohammed Hassan',
      email: 'mohammed@example.com',
      phone: '+971501234573',
      address: 'Deira, Building 78',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      pincode: '00000',
      dateOfBirth: new Date('1978-12-10'),
      occupation: 'Business Owner',
      income: 650000,
      preferences: {
        propertyTypes: ['OFFICE', 'SHOP'],
        budget: { min: 1500000, max: 4000000 },
        locations: ['Business Bay', 'Dubai Mall', 'DIFC'],
      },
      budget: 2500000,
      notes: 'Looking for commercial space for expanding business.',
      createdById: users[2].id,
      updatedById: users[2].id,
    },
    {
      name: 'Priya Patel',
      email: 'priya@example.com',
      phone: '+971501234574',
      address: 'JBR, Tower 23',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      pincode: '00000',
      dateOfBirth: new Date('1988-03-18'),
      occupation: 'Software Engineer',
      income: 180000,
      preferences: {
        propertyTypes: ['APARTMENT'],
        budget: { min: 1200000, max: 2500000 },
        locations: ['JBR', 'Marina', 'Downtown Dubai'],
      },
      budget: 1800000,
      notes: 'First-time buyer, looking for modern apartment with good amenities.',
      createdById: users[2].id,
      updatedById: users[2].id,
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

async function createDemoLeads(users: any[], customers: any[]) {
  const leads = [
    {
      customerId: customers[0].id,
      name: 'Ahmed Al-Rashid',
      email: 'ahmed@example.com',
      phone: '+971501234571',
      source: LeadSource.WEBSITE,
      status: LeadStatus.QUALIFIED,
      score: 85,
      interest: '3BHK Apartment in Downtown Dubai',
      budget: 3500000,
      notes: 'Very interested in luxury apartment complex. Has pre-approval for mortgage.',
      assignedTo: users[2].id,
      createdById: users[2].id,
      updatedById: users[2].id,
    },
    {
      customerId: customers[1].id,
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '+971501234572',
      source: LeadSource.REFERRAL,
      status: LeadStatus.CONTACTED,
      score: 75,
      interest: '5BHK Villa with Garden',
      budget: 6000000,
      notes: 'Referred by existing customer. Looking for family home.',
      assignedTo: users[2].id,
      createdById: users[2].id,
      updatedById: users[2].id,
    },
    {
      name: 'John Smith',
      email: 'john@example.com',
      phone: '+971501234575',
      source: LeadSource.PHONE,
      status: LeadStatus.NEW,
      score: 60,
      interest: 'Office Space for Startup',
      budget: 2000000,
      notes: 'Looking for office space for new tech startup.',
      assignedTo: users[2].id,
      createdById: users[2].id,
      updatedById: users[2].id,
    },
    {
      name: 'Fatima Al-Zahra',
      email: 'fatima@example.com',
      phone: '+971501234576',
      source: LeadSource.SOCIAL,
      status: LeadStatus.PROPOSAL,
      score: 90,
      interest: 'Investment Property',
      budget: 1500000,
      notes: 'High-value lead interested in investment properties.',
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

async function createDemoBookings(users: any[], customers: any[], properties: any[]) {
  const bookings = [
    {
      propertyId: properties[0].id,
      customerId: customers[0].id,
      agentId: users[2].id,
      status: BookingStatus.CONFIRMED,
      bookingDate: new Date('2024-01-15'),
      moveInDate: new Date('2024-02-01'),
      moveOutDate: null,
      amount: 2500000,
      advanceAmount: 250000,
      paymentMethod: PaymentMethod.UPI,
      paymentStatus: PaymentStatus.COMPLETED,
      notes: 'Customer very satisfied with the property. Ready to proceed with full payment.',
      documents: ['https://example.com/booking1.pdf'],
      createdById: users[2].id,
      updatedById: users[2].id,
    },
    {
      propertyId: properties[1].id,
      customerId: customers[1].id,
      agentId: users[2].id,
      status: BookingStatus.PENDING,
      bookingDate: new Date('2024-01-20'),
      moveInDate: new Date('2024-03-01'),
      moveOutDate: null,
      amount: 8500000,
      advanceAmount: 850000,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentStatus: PaymentStatus.PENDING,
      notes: 'Waiting for customer confirmation and mortgage approval.',
      documents: [],
      createdById: users[2].id,
      updatedById: users[2].id,
    },
    {
      propertyId: properties[2].id,
      customerId: customers[2].id,
      agentId: users[2].id,
      status: BookingStatus.CONFIRMED,
      bookingDate: new Date('2024-01-10'),
      moveInDate: new Date('2024-02-15'),
      moveOutDate: null,
      amount: 1800000,
      advanceAmount: 180000,
      paymentMethod: PaymentMethod.CARD,
      paymentStatus: PaymentStatus.COMPLETED,
      notes: 'Commercial lease agreement signed. Office space ready for occupation.',
      documents: ['https://example.com/lease_agreement.pdf'],
      createdById: users[2].id,
      updatedById: users[2].id,
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

async function createDemoPayments(bookings: any[]) {
  const payments = [
    {
      bookingId: bookings[0].id,
      amount: 250000,
      currency: 'AED',
      method: PaymentMethod.UPI,
      status: PaymentStatus.COMPLETED,
      gateway: 'RAZORPAY',
      gatewayId: 'pay_demo_123456789',
      gatewayData: {
        transactionId: 'txn_demo_123456789',
        paymentId: 'pay_demo_123456789',
        orderId: 'order_demo_123456789',
      },
      processedAt: new Date('2024-01-15T10:30:00Z'),
      createdById: bookings[0].agentId,
      updatedById: bookings[0].agentId,
    },
    {
      bookingId: bookings[1].id,
      amount: 850000,
      currency: 'AED',
      method: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.PENDING,
      gateway: 'RAZORPAY',
      gatewayId: null,
      gatewayData: null,
      processedAt: null,
      createdById: bookings[1].agentId,
      updatedById: bookings[1].agentId,
    },
    {
      bookingId: bookings[2].id,
      amount: 180000,
      currency: 'AED',
      method: PaymentMethod.CARD,
      status: PaymentStatus.COMPLETED,
      gateway: 'RAZORPAY',
      gatewayId: 'pay_demo_987654321',
      gatewayData: {
        transactionId: 'txn_demo_987654321',
        paymentId: 'pay_demo_987654321',
        orderId: 'order_demo_987654321',
      },
      processedAt: new Date('2024-01-10T14:45:00Z'),
      createdById: bookings[2].agentId,
      updatedById: bookings[2].agentId,
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

async function createDemoTransactions(users: any[]) {
  const transactions = [
    {
      type: TransactionType.SALE,
      category: 'Property Sale',
      amount: 2500000,
      currency: 'AED',
      description: 'Sale of luxury apartment in Downtown Dubai',
      reference: 'PROP-001',
      date: new Date('2024-01-15'),
      status: TransactionStatus.COMPLETED,
      createdById: users[0].id,
      updatedById: users[0].id,
    },
    {
      type: TransactionType.EXPENSE,
      category: 'Marketing',
      amount: 25000,
      currency: 'AED',
      description: 'Online advertising campaign for property listings',
      reference: 'MKT-001',
      date: new Date('2024-01-10'),
      status: TransactionStatus.COMPLETED,
      createdById: users[1].id,
      updatedById: users[1].id,
    },
    {
      type: TransactionType.INCOME,
      category: 'Commission',
      amount: 125000,
      currency: 'AED',
      description: 'Commission from property sale',
      reference: 'COM-001',
      date: new Date('2024-01-15'),
      status: TransactionStatus.COMPLETED,
      createdById: users[2].id,
      updatedById: users[2].id,
    },
    {
      type: TransactionType.EXPENSE,
      category: 'Office Rent',
      amount: 45000,
      currency: 'AED',
      description: 'Monthly office rent',
      reference: 'RENT-001',
      date: new Date('2024-01-01'),
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

async function createDemoNotifications(users: any[]) {
  const notifications = [
    {
      userId: users[2].id,
      type: NotificationType.BOOKING_CREATED,
      title: 'New Booking Created',
      message: 'A new booking has been created for Luxury Apartment Complex - Downtown Dubai',
      data: {
        bookingId: 'booking_demo_123',
        propertyId: 'property_demo_123',
        customerId: 'customer_demo_123',
      },
      priority: NotificationPriority.MEDIUM,
    },
    {
      userId: users[2].id,
      type: NotificationType.LEAD_ASSIGNED,
      title: 'New Lead Assigned',
      message: 'A new high-value lead has been assigned to you',
      data: {
        leadId: 'lead_demo_123',
        customerId: 'customer_demo_123',
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
    {
      userId: users[1].id,
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Payment Received',
      message: 'Payment of AED 250,000 has been received for booking #BK-001',
      data: {
        paymentId: 'payment_demo_123',
        amount: 250000,
        currency: 'AED',
      },
      priority: NotificationPriority.MEDIUM,
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

async function createDemoFiles() {
  const files = [
    {
      originalName: 'property_brochure.pdf',
      fileName: 'brochure_123456.pdf',
      fileSize: 2048576,
      mimeType: 'application/pdf',
      url: 'https://example.com/files/brochure_123456.pdf',
      thumbnailUrl: 'https://example.com/files/thumbnails/brochure_123456.jpg',
      folder: 'properties',
      metadata: {
        uploadedBy: 'Demo Agent',
        uploadDate: new Date().toISOString(),
      },
      propertyId: 'property_demo_123',
      createdById: 'user_demo_123',
    },
    {
      originalName: 'customer_id_copy.jpg',
      fileName: 'id_copy_789012.jpg',
      fileSize: 1024768,
      mimeType: 'image/jpeg',
      url: 'https://example.com/files/id_copy_789012.jpg',
      thumbnailUrl: 'https://example.com/files/thumbnails/id_copy_789012.jpg',
      folder: 'customers',
      metadata: {
        uploadedBy: 'Demo Customer',
        uploadDate: new Date().toISOString(),
      },
      customerId: 'customer_demo_123',
      createdById: 'user_demo_123',
    },
  ];

  // Note: These are demo file records - actual file upload would require file system or cloud storage
  console.log('📁 Demo file records created (simulated)');
}

async function createDemoAnalytics() {
  // Create demo analytics data
  console.log('📊 Demo analytics data created (simulated)');
  
  // This would typically involve:
  // - Property view analytics
  // - Lead conversion rates
  // - Revenue analytics
  // - Performance metrics
  // - User activity data
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
