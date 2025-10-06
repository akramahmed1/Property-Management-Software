#!/usr/bin/env node

/**
 * Real-World Demo Scenarios
 * Comprehensive demo scenarios for Property Management Software
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

class DemoScenarios {
  constructor() {
    this.scenarios = [];
    this.users = {};
    this.properties = {};
    this.customers = {};
    this.leads = {};
    this.bookings = {};
  }

  // Scenario 1: Complete Property Sale Journey
  async scenario1_PropertySaleJourney() {
    console.log('\n🏠 SCENARIO 1: Complete Property Sale Journey');
    console.log('================================================');

    try {
      // Step 1: Create a luxury villa property
      console.log('📝 Step 1: Creating luxury villa property...');
      const villa = await prisma.property.create({
        data: {
          name: 'Luxury Villa in Banjara Hills',
          type: 'VILLA',
          status: 'AVAILABLE',
          location: 'Banjara Hills',
          address: '123, Road No. 12, Banjara Hills, Hyderabad',
          city: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          pincode: '500034',
          price: 25000000, // 2.5 crores
          area: 5000,
          bedrooms: 4,
          bathrooms: 3,
          floors: 2,
          facing: 'East',
          vastu: 'Vastu Compliant',
          amenities: ['Swimming Pool', 'Garden', 'Parking', 'Security', 'Gym', 'Home Theater'],
          description: 'Stunning luxury villa with modern amenities in prime Banjara Hills location',
          images: [
            'https://example.com/villa-exterior.jpg',
            'https://example.com/villa-living-room.jpg',
            'https://example.com/villa-master-bedroom.jpg'
          ],
          documents: ['https://example.com/villa-title-deed.pdf'],
          createdById: this.users.manager.id
        }
      });
      this.properties.villa = villa;
      console.log(`✅ Created villa: ${villa.name} - ₹${villa.price.toLocaleString()}`);

      // Step 2: Create a high-value customer
      console.log('\n📝 Step 2: Creating high-value customer...');
      const customer = await prisma.customer.create({
        data: {
          name: 'Rajesh Kumar',
          email: 'rajesh.kumar@email.com',
          phone: '+91-9876543210',
          address: '456, Jubilee Hills, Hyderabad',
          city: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          pincode: '500033',
          dateOfBirth: new Date('1980-05-15'),
          occupation: 'Software Engineer',
          income: 5000000, // 50 lakhs per annum
          notes: 'Looking for luxury property in Banjara Hills',
          createdById: this.users.agent.id
        }
      });
      this.customers.rajesh = customer;
      console.log(`✅ Created customer: ${customer.name} - Income: ₹${customer.income.toLocaleString()}/year`);

      // Step 3: Create a lead for this customer
      console.log('\n📝 Step 3: Creating lead...');
      const lead = await prisma.lead.create({
        data: {
          customerId: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          source: 'WEBSITE',
          status: 'NEW',
          score: 85,
          interest: 'Luxury Villa',
          budget: 30000000, // 3 crores budget
          notes: 'Interested in luxury villa in Banjara Hills area',
          assignedTo: this.users.agent.id,
          createdById: this.users.agent.id
        }
      });
      this.leads.rajesh = lead;
      console.log(`✅ Created lead: ${lead.name} - Score: ${lead.score} - Budget: ₹${lead.budget.toLocaleString()}`);

      // Step 4: Lead qualification and scoring
      console.log('\n📝 Step 4: Lead qualification and scoring...');
      const updatedLead = await prisma.lead.update({
        where: { id: lead.id },
        data: {
          status: 'QUALIFIED',
          score: 92, // High score due to budget alignment
          notes: 'Qualified lead - Budget matches property price, high income, serious buyer'
        }
      });
      console.log(`✅ Lead qualified: Score updated to ${updatedLead.score}`);

      // Step 5: Property viewing and interest
      console.log('\n📝 Step 5: Property viewing scheduled...');
      // Create a property viewing event (this would be a separate model in real app)
      console.log('📅 Property viewing scheduled for tomorrow at 10 AM');
      console.log('📞 Customer contacted and confirmed viewing');

      // Step 6: Create booking
      console.log('\n📝 Step 6: Creating property booking...');
      const booking = await prisma.booking.create({
        data: {
          propertyId: villa.id,
          customerId: customer.id,
          agentId: this.users.agent.id,
          status: 'PENDING',
          bookingDate: new Date(),
          moveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          amount: 25000000,
          advanceAmount: 5000000, // 50 lakhs advance
          paymentMethod: 'BANK_TRANSFER',
          paymentStatus: 'PENDING',
          notes: 'Customer very interested, advance payment to be made within 3 days'
        }
      });
      this.bookings.villa = booking;
      console.log(`✅ Booking created: Amount ₹${booking.amount.toLocaleString()}, Advance ₹${booking.advanceAmount.toLocaleString()}`);

      // Step 7: Process advance payment
      console.log('\n📝 Step 7: Processing advance payment...');
      const advancePayment = await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: 5000000,
          currency: 'INR',
          method: 'BANK_TRANSFER',
          status: 'COMPLETED',
          gateway: 'Razorpay',
          gatewayId: 'pay_' + Date.now(),
          gatewayData: {
            paymentId: 'pay_' + Date.now(),
            orderId: 'order_' + Date.now(),
            signature: 'signature_' + Date.now()
          },
          processedAt: new Date()
        }
      });
      console.log(`✅ Advance payment processed: ₹${advancePayment.amount.toLocaleString()}`);

      // Step 8: Update booking status
      console.log('\n📝 Step 8: Updating booking status...');
      const confirmedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'PARTIAL'
        }
      });
      console.log(`✅ Booking confirmed: Status updated to ${confirmedBooking.status}`);

      // Step 9: Create transaction record
      console.log('\n📝 Step 9: Creating transaction record...');
      const transaction = await prisma.transaction.create({
        data: {
          type: 'INCOME',
          category: 'PROPERTY_SALE',
          amount: 25000000,
          currency: 'INR',
          description: 'Luxury Villa Sale - Banjara Hills',
          reference: `PROP-${villa.id.slice(-8)}`,
          date: new Date(),
          status: 'PENDING',
          createdById: this.users.manager.id
        }
      });
      console.log(`✅ Transaction created: ₹${transaction.amount.toLocaleString()}`);

      // Step 10: Send notifications
      console.log('\n📝 Step 10: Sending notifications...');
      const notifications = [
        {
          userId: this.users.manager.id,
          type: 'BOOKING_CONFIRMED',
          title: 'Property Booking Confirmed',
          message: `Villa booking confirmed for ₹${booking.amount.toLocaleString()}`,
          data: { bookingId: booking.id, propertyId: villa.id },
          priority: 'high'
        },
        {
          userId: this.users.agent.id,
          type: 'PAYMENT_RECEIVED',
          title: 'Advance Payment Received',
          message: `Advance payment of ₹${advancePayment.amount.toLocaleString()} received`,
          data: { paymentId: advancePayment.id, bookingId: booking.id },
          priority: 'high'
        }
      ];

      for (const notification of notifications) {
        await prisma.notification.create({ data: notification });
      }
      console.log(`✅ Notifications sent: ${notifications.length} notifications`);

      console.log('\n🎉 SCENARIO 1 COMPLETED: Property Sale Journey');
      console.log('================================================');
      console.log(`Property: ${villa.name}`);
      console.log(`Customer: ${customer.name}`);
      console.log(`Lead Score: ${updatedLead.score}`);
      console.log(`Booking Amount: ₹${booking.amount.toLocaleString()}`);
      console.log(`Advance Received: ₹${advancePayment.amount.toLocaleString()}`);
      console.log(`Transaction Created: ₹${transaction.amount.toLocaleString()}`);

    } catch (error) {
      console.error('❌ Error in Scenario 1:', error);
      throw error;
    }
  }

  // Scenario 2: Lead Conversion Pipeline
  async scenario2_LeadConversionPipeline() {
    console.log('\n🎯 SCENARIO 2: Lead Conversion Pipeline');
    console.log('==========================================');

    try {
      // Step 1: Create multiple leads from different sources
      console.log('📝 Step 1: Creating leads from different sources...');
      const leadsData = [
        {
          name: 'Priya Sharma',
          email: 'priya.sharma@email.com',
          phone: '+91-9876543211',
          source: 'WEBSITE',
          budget: 15000000,
          interest: '2BHK Apartment',
          score: 75
        },
        {
          name: 'Ahmed Al-Rashid',
          email: 'ahmed.rashid@email.com',
          phone: '+971-501234567',
          source: 'REFERRAL',
          budget: 5000000,
          interest: 'Commercial Office',
          score: 90
        },
        {
          name: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          phone: '+966-501234567',
          source: 'ADVERTISEMENT',
          budget: 8000000,
          interest: 'Villa',
          score: 60
        }
      ];

      const createdLeads = [];
      for (const leadData of leadsData) {
        const lead = await prisma.lead.create({
          data: {
            ...leadData,
            status: 'NEW',
            assignedTo: this.users.agent.id,
            createdById: this.users.agent.id,
            notes: `Lead from ${leadData.source} - ${leadData.interest}`
          }
        });
        createdLeads.push(lead);
        console.log(`✅ Created lead: ${lead.name} (${lead.source}) - Score: ${lead.score}`);
      }

      // Step 2: Lead scoring and qualification
      console.log('\n📝 Step 2: Lead scoring and qualification...');
      for (const lead of createdLeads) {
        let newScore = lead.score;
        let newStatus = lead.status;

        // Update score based on various factors
        if (lead.budget > 10000000) newScore += 10; // High budget
        if (lead.source === 'REFERRAL') newScore += 15; // Referral bonus
        if (lead.source === 'WEBSITE') newScore += 5; // Website bonus

        if (newScore >= 80) newStatus = 'QUALIFIED';
        else if (newScore >= 60) newStatus = 'CONTACTED';
        else newStatus = 'NEW';

        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            score: newScore,
            status: newStatus
          }
        });

        console.log(`✅ Lead ${lead.name}: Score ${lead.score} → ${newScore}, Status ${lead.status} → ${newStatus}`);
      }

      // Step 3: Convert qualified leads to customers
      console.log('\n📝 Step 3: Converting qualified leads to customers...');
      const qualifiedLeads = createdLeads.filter(lead => lead.score >= 80);
      
      for (const lead of qualifiedLeads) {
        const customer = await prisma.customer.create({
          data: {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            address: 'Address to be updated',
            city: 'Hyderabad',
            state: 'Telangana',
            country: 'India',
            income: lead.budget * 0.1, // Assume 10% of budget as annual income
            notes: `Converted from lead - ${lead.interest}`,
            createdById: this.users.agent.id
          }
        });

        // Update lead with customer reference
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            customerId: customer.id,
            status: 'CLOSED_WON'
          }
        });

        console.log(`✅ Lead converted to customer: ${customer.name}`);
      }

      console.log('\n🎉 SCENARIO 2 COMPLETED: Lead Conversion Pipeline');
      console.log('==================================================');
      console.log(`Total Leads Created: ${createdLeads.length}`);
      console.log(`Qualified Leads: ${qualifiedLeads.length}`);
      console.log(`Converted to Customers: ${qualifiedLeads.length}`);

    } catch (error) {
      console.error('❌ Error in Scenario 2:', error);
      throw error;
    }
  }

  // Scenario 3: Financial Management and Reporting
  async scenario3_FinancialManagement() {
    console.log('\n💰 SCENARIO 3: Financial Management and Reporting');
    console.log('==================================================');

    try {
      // Step 1: Create various transactions
      console.log('📝 Step 1: Creating various transactions...');
      const transactions = [
        {
          type: 'INCOME',
          category: 'PROPERTY_SALE',
          amount: 25000000,
          description: 'Luxury Villa Sale - Banjara Hills',
          status: 'COMPLETED'
        },
        {
          type: 'INCOME',
          category: 'COMMISSION',
          amount: 500000,
          description: 'Agent Commission - Villa Sale',
          status: 'COMPLETED'
        },
        {
          type: 'EXPENSE',
          category: 'MARKETING',
          amount: 100000,
          description: 'Digital Marketing Campaign',
          status: 'COMPLETED'
        },
        {
          type: 'EXPENSE',
          category: 'OFFICE_RENT',
          amount: 50000,
          description: 'Monthly Office Rent',
          status: 'COMPLETED'
        },
        {
          type: 'EXPENSE',
          category: 'STAFF_SALARY',
          amount: 200000,
          description: 'Monthly Staff Salaries',
          status: 'COMPLETED'
        },
        {
          type: 'INCOME',
          category: 'PROPERTY_RENT',
          amount: 75000,
          description: 'Commercial Property Rent',
          status: 'PENDING'
        }
      ];

      const createdTransactions = [];
      for (const transaction of transactions) {
        const created = await prisma.transaction.create({
          data: {
            ...transaction,
            currency: 'INR',
            reference: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            date: new Date(),
            createdById: this.users.manager.id
          }
        });
        createdTransactions.push(created);
        console.log(`✅ Created transaction: ${created.description} - ₹${created.amount.toLocaleString()}`);
      }

      // Step 2: Calculate financial summary
      console.log('\n📝 Step 2: Calculating financial summary...');
      const incomeTransactions = createdTransactions.filter(t => t.type === 'INCOME' && t.status === 'COMPLETED');
      const expenseTransactions = createdTransactions.filter(t => t.type === 'EXPENSE' && t.status === 'COMPLETED');

      const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const netProfit = totalIncome - totalExpenses;
      const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

      console.log(`💰 Total Income: ₹${totalIncome.toLocaleString()}`);
      console.log(`💸 Total Expenses: ₹${totalExpenses.toLocaleString()}`);
      console.log(`📈 Net Profit: ₹${netProfit.toLocaleString()}`);
      console.log(`📊 Profit Margin: ${profitMargin.toFixed(2)}%`);

      // Step 3: Create payment records
      console.log('\n📝 Step 3: Creating payment records...');
      const payments = [
        {
          amount: 5000000,
          method: 'BANK_TRANSFER',
          status: 'COMPLETED',
          gateway: 'Razorpay',
          description: 'Advance Payment - Villa Sale'
        },
        {
          amount: 20000000,
          method: 'CHEQUE',
          status: 'PENDING',
          gateway: null,
          description: 'Balance Payment - Villa Sale'
        },
        {
          amount: 75000,
          method: 'UPI',
          status: 'COMPLETED',
          gateway: 'Razorpay',
          description: 'Monthly Rent Payment'
        }
      ];

      for (const payment of payments) {
        const created = await prisma.payment.create({
          data: {
            ...payment,
            currency: 'INR',
            gatewayId: payment.gateway ? `pay_${Date.now()}` : null,
            processedAt: payment.status === 'COMPLETED' ? new Date() : null
          }
        });
        console.log(`✅ Created payment: ${created.description} - ₹${created.amount.toLocaleString()}`);
      }

      console.log('\n🎉 SCENARIO 3 COMPLETED: Financial Management');
      console.log('===============================================');
      console.log(`Transactions Created: ${createdTransactions.length}`);
      console.log(`Total Revenue: ₹${totalIncome.toLocaleString()}`);
      console.log(`Total Expenses: ₹${totalExpenses.toLocaleString()}`);
      console.log(`Net Profit: ₹${netProfit.toLocaleString()}`);

    } catch (error) {
      console.error('❌ Error in Scenario 3:', error);
      throw error;
    }
  }

  // Scenario 4: Real-time Notifications and Communication
  async scenario4_RealTimeNotifications() {
    console.log('\n🔔 SCENARIO 4: Real-time Notifications and Communication');
    console.log('==========================================================');

    try {
      // Step 1: Create various notification types
      console.log('📝 Step 1: Creating various notification types...');
      const notifications = [
        {
          userId: this.users.manager.id,
          type: 'SYSTEM_ALERT',
          title: 'System Maintenance Scheduled',
          message: 'System maintenance scheduled for tonight 2 AM - 4 AM',
          priority: 'high',
          data: { maintenanceWindow: '2024-12-20T02:00:00Z' }
        },
        {
          userId: this.users.agent.id,
          type: 'LEAD_ASSIGNED',
          title: 'New Lead Assigned',
          message: 'New lead Priya Sharma has been assigned to you',
          priority: 'medium',
          data: { leadId: 'lead_123', leadName: 'Priya Sharma' }
        },
        {
          userId: this.users.agent.id,
          type: 'BOOKING_CREATED',
          title: 'New Booking Created',
          message: 'New booking created for Villa in Banjara Hills',
          priority: 'high',
          data: { bookingId: 'booking_456', propertyName: 'Villa in Banjara Hills' }
        },
        {
          userId: this.users.manager.id,
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Received',
          message: 'Payment of ₹50,00,000 received for Villa sale',
          priority: 'high',
          data: { paymentId: 'pay_789', amount: 5000000 }
        },
        {
          userId: this.users.agent.id,
          type: 'LEAD_UPDATED',
          title: 'Lead Score Updated',
          message: 'Lead Ahmed Al-Rashid score updated to 95',
          priority: 'low',
          data: { leadId: 'lead_456', leadName: 'Ahmed Al-Rashid', newScore: 95 }
        }
      ];

      for (const notification of notifications) {
        await prisma.notification.create({ data: notification });
        console.log(`✅ Created notification: ${notification.title}`);
      }

      // Step 2: Simulate notification delivery
      console.log('\n📝 Step 2: Simulating notification delivery...');
      console.log('📧 Email notifications sent to users');
      console.log('📱 Push notifications sent to mobile apps');
      console.log('💬 In-app notifications displayed');
      console.log('📞 SMS notifications sent for high priority alerts');

      // Step 3: Mark some notifications as read
      console.log('\n📝 Step 3: Marking notifications as read...');
      const unreadNotifications = await prisma.notification.findMany({
        where: { isRead: false },
        take: 3
      });

      for (const notification of unreadNotifications) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { isRead: true }
        });
        console.log(`✅ Marked as read: ${notification.title}`);
      }

      // Step 4: Get notification statistics
      console.log('\n📝 Step 4: Getting notification statistics...');
      const totalNotifications = await prisma.notification.count();
      const unreadCount = await prisma.notification.count({ where: { isRead: false } });
      const readCount = totalNotifications - unreadCount;

      console.log(`📊 Total Notifications: ${totalNotifications}`);
      console.log(`📖 Read Notifications: ${readCount}`);
      console.log(`📬 Unread Notifications: ${unreadCount}`);

      console.log('\n🎉 SCENARIO 4 COMPLETED: Real-time Notifications');
      console.log('==================================================');
      console.log(`Notifications Created: ${notifications.length}`);
      console.log(`Read Notifications: ${readCount}`);
      console.log(`Unread Notifications: ${unreadCount}`);

    } catch (error) {
      console.error('❌ Error in Scenario 4:', error);
      throw error;
    }
  }

  // Scenario 5: File Management and Document Handling
  async scenario5_FileManagement() {
    console.log('\n📁 SCENARIO 5: File Management and Document Handling');
    console.log('====================================================');

    try {
      // Step 1: Create file records for properties
      console.log('📝 Step 1: Creating file records for properties...');
      const propertyFiles = [
        {
          originalName: 'villa-exterior.jpg',
          fileName: 'villa_ext_123456.jpg',
          fileSize: 2048576, // 2MB
          mimeType: 'image/jpeg',
          url: 'https://s3.amazonaws.com/property-files/villa_ext_123456.jpg',
          thumbnailUrl: 'https://s3.amazonaws.com/property-files/thumbnails/villa_ext_123456.jpg',
          folder: 'properties/villa_123',
          metadata: { propertyId: 'villa_123', type: 'exterior_image' }
        },
        {
          originalName: 'villa-floor-plan.pdf',
          fileName: 'villa_floor_123456.pdf',
          fileSize: 1024000, // 1MB
          mimeType: 'application/pdf',
          url: 'https://s3.amazonaws.com/property-files/villa_floor_123456.pdf',
          folder: 'properties/villa_123',
          metadata: { propertyId: 'villa_123', type: 'floor_plan' }
        },
        {
          originalName: 'villa-title-deed.pdf',
          fileName: 'villa_title_123456.pdf',
          fileSize: 512000, // 512KB
          mimeType: 'application/pdf',
          url: 'https://s3.amazonaws.com/property-files/villa_title_123456.pdf',
          folder: 'properties/villa_123',
          metadata: { propertyId: 'villa_123', type: 'title_deed' }
        }
      ];

      for (const file of propertyFiles) {
        const created = await prisma.file.create({
          data: {
            ...file,
            propertyId: this.properties.villa?.id || 'villa_123'
          }
        });
        console.log(`✅ Created file: ${created.originalName} (${(created.fileSize / 1024).toFixed(0)}KB)`);
      }

      // Step 2: Create file records for customers
      console.log('\n📝 Step 2: Creating file records for customers...');
      const customerFiles = [
        {
          originalName: 'rajesh-pan-card.pdf',
          fileName: 'rajesh_pan_123456.pdf',
          fileSize: 256000, // 256KB
          mimeType: 'application/pdf',
          url: 'https://s3.amazonaws.com/property-files/rajesh_pan_123456.pdf',
          folder: 'customers/rajesh_123',
          metadata: { customerId: 'rajesh_123', type: 'pan_card' }
        },
        {
          originalName: 'rajesh-aadhar-card.pdf',
          fileName: 'rajesh_aadhar_123456.pdf',
          fileSize: 384000, // 384KB
          mimeType: 'application/pdf',
          url: 'https://s3.amazonaws.com/property-files/rajesh_aadhar_123456.pdf',
          folder: 'customers/rajesh_123',
          metadata: { customerId: 'rajesh_123', type: 'aadhar_card' }
        }
      ];

      for (const file of customerFiles) {
        const created = await prisma.file.create({
          data: {
            ...file,
            customerId: this.customers.rajesh?.id || 'rajesh_123'
          }
        });
        console.log(`✅ Created file: ${created.originalName} (${(created.fileSize / 1024).toFixed(0)}KB)`);
      }

      // Step 3: Create file records for bookings
      console.log('\n📝 Step 3: Creating file records for bookings...');
      const bookingFiles = [
        {
          originalName: 'booking-agreement.pdf',
          fileName: 'booking_agreement_123456.pdf',
          fileSize: 768000, // 768KB
          mimeType: 'application/pdf',
          url: 'https://s3.amazonaws.com/property-files/booking_agreement_123456.pdf',
          folder: 'bookings/booking_123',
          metadata: { bookingId: 'booking_123', type: 'agreement' }
        },
        {
          originalName: 'payment-receipt.pdf',
          fileName: 'payment_receipt_123456.pdf',
          fileSize: 128000, // 128KB
          mimeType: 'application/pdf',
          url: 'https://s3.amazonaws.com/property-files/payment_receipt_123456.pdf',
          folder: 'bookings/booking_123',
          metadata: { bookingId: 'booking_123', type: 'receipt' }
        }
      ];

      for (const file of bookingFiles) {
        const created = await prisma.file.create({
          data: {
            ...file,
            bookingId: this.bookings.villa?.id || 'booking_123'
          }
        });
        console.log(`✅ Created file: ${created.originalName} (${(created.fileSize / 1024).toFixed(0)}KB)`);
      }

      // Step 4: Calculate file statistics
      console.log('\n📝 Step 4: Calculating file statistics...');
      const totalFiles = await prisma.file.count();
      const totalSize = await prisma.file.aggregate({
        _sum: { fileSize: true }
      });
      const filesByType = await prisma.file.groupBy({
        by: ['mimeType'],
        _count: { id: true },
        _sum: { fileSize: true }
      });

      console.log(`📊 Total Files: ${totalFiles}`);
      console.log(`💾 Total Size: ${(totalSize._sum.fileSize / (1024 * 1024)).toFixed(2)} MB`);
      console.log('📁 Files by Type:');
      filesByType.forEach(type => {
        console.log(`  - ${type.mimeType}: ${type._count.id} files (${(type._sum.fileSize / 1024).toFixed(0)}KB)`);
      });

      console.log('\n🎉 SCENARIO 5 COMPLETED: File Management');
      console.log('==========================================');
      console.log(`Property Files: ${propertyFiles.length}`);
      console.log(`Customer Files: ${customerFiles.length}`);
      console.log(`Booking Files: ${bookingFiles.length}`);
      console.log(`Total Files: ${totalFiles}`);

    } catch (error) {
      console.error('❌ Error in Scenario 5:', error);
      throw error;
    }
  }

  // Initialize demo data
  async initializeDemoData() {
    console.log('🚀 Initializing demo data...');

    // Create demo users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = await Promise.all([
      prisma.user.upsert({
        where: { email: 'admin@property.com' },
        update: {},
        create: {
          email: 'admin@property.com',
          password: hashedPassword,
          name: 'System Administrator',
          role: 'SUPER_ADMIN',
          phone: '+91-9876543210',
          isActive: true
        }
      }),
      prisma.user.upsert({
        where: { email: 'manager@property.com' },
        update: {},
        create: {
          email: 'manager@property.com',
          password: hashedPassword,
          name: 'Property Manager',
          role: 'MANAGER',
          phone: '+91-9876543211',
          isActive: true
        }
      }),
      prisma.user.upsert({
        where: { email: 'agent@property.com' },
        update: {},
        create: {
          email: 'agent@property.com',
          password: hashedPassword,
          name: 'Sales Agent',
          role: 'AGENT',
          phone: '+91-9876543212',
          isActive: true
        }
      })
    ]);

    this.users = {
      admin: users[0],
      manager: users[1],
      agent: users[2]
    };

    console.log('✅ Demo users created');
  }

  // Run all scenarios
  async runAllScenarios() {
    try {
      console.log('🎬 STARTING COMPREHENSIVE DEMO SCENARIOS');
      console.log('==========================================');

      await this.initializeDemoData();

      await this.scenario1_PropertySaleJourney();
      await this.scenario2_LeadConversionPipeline();
      await this.scenario3_FinancialManagement();
      await this.scenario4_RealTimeNotifications();
      await this.scenario5_FileManagement();

      console.log('\n🎉 ALL DEMO SCENARIOS COMPLETED SUCCESSFULLY!');
      console.log('==============================================');
      console.log('✅ Property Sale Journey');
      console.log('✅ Lead Conversion Pipeline');
      console.log('✅ Financial Management');
      console.log('✅ Real-time Notifications');
      console.log('✅ File Management');

    } catch (error) {
      console.error('❌ Error running demo scenarios:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run scenarios if called directly
if (require.main === module) {
  const demo = new DemoScenarios();
  demo.runAllScenarios();
}

module.exports = DemoScenarios;
