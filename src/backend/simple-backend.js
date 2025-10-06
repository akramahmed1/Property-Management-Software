const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory data store
let users = [
  {
    id: '1',
    email: 'admin@demo.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.4.4.4', // Admin123!
    name: 'Demo Admin',
    role: 'SUPER_ADMIN'
  },
  {
    id: '2',
    email: 'agent@demo.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.4.4.4', // Agent123!
    name: 'Demo Agent',
    role: 'AGENT'
  }
];

let properties = [
  {
    id: '1',
    name: 'Luxury Apartment - Downtown Dubai',
    type: 'APARTMENT',
    status: 'AVAILABLE',
    location: 'Downtown Dubai',
    price: 2500000,
    area: 1200,
    bedrooms: 3,
    bathrooms: 2,
    description: 'Luxurious 3-bedroom apartment with stunning views'
  },
  {
    id: '2',
    name: 'Modern Villa - Palm Jumeirah',
    type: 'VILLA',
    status: 'SOLD',
    location: 'Palm Jumeirah',
    price: 8500000,
    area: 4500,
    bedrooms: 5,
    bathrooms: 4,
    description: 'Stunning 5-bedroom villa with private beach access'
  }
];

let customers = [
  {
    id: '1',
    name: 'Ahmed Al-Rashid',
    email: 'ahmed@example.com',
    phone: '+971501234571',
    occupation: 'Investment Banker',
    income: 450000
  }
];

let bookings = [
  {
    id: '1',
    propertyId: '1',
    customerId: '1',
    status: 'CONFIRMED',
    amount: 2500000,
    bookingDate: new Date().toISOString()
  }
];

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: true,
        redis: true,
        storage: true,
        memory: true,
        cpu: true
      }
    }
  });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }
  
  try {
    const decoded = jwt.verify(token, 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
};

// Properties routes
app.get('/api/properties', verifyToken, (req, res) => {
  res.json({
    success: true,
    data: properties,
    count: properties.length
  });
});

app.post('/api/properties', verifyToken, (req, res) => {
  const newProperty = {
    id: (properties.length + 1).toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  properties.push(newProperty);
  
  res.json({
    success: true,
    data: newProperty
  });
});

// Customers routes
app.get('/api/customers', verifyToken, (req, res) => {
  res.json({
    success: true,
    data: customers,
    count: customers.length
  });
});

app.post('/api/customers', verifyToken, (req, res) => {
  const newCustomer = {
    id: (customers.length + 1).toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  customers.push(newCustomer);
  
  res.json({
    success: true,
    data: newCustomer
  });
});

// Bookings routes
app.get('/api/bookings', verifyToken, (req, res) => {
  res.json({
    success: true,
    data: bookings,
    count: bookings.length
  });
});

app.post('/api/bookings', verifyToken, (req, res) => {
  const newBooking = {
    id: (bookings.length + 1).toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  bookings.push(newBooking);
  
  res.json({
    success: true,
    data: newBooking
  });
});

// Analytics routes
app.get('/api/analytics/dashboard', verifyToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalProperties: properties.length,
      totalCustomers: customers.length,
      totalBookings: bookings.length,
      totalRevenue: 2500000,
      availableProperties: properties.filter(p => p.status === 'AVAILABLE').length,
      soldProperties: properties.filter(p => p.status === 'SOLD').length
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Backend Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Demo credentials:`);
  console.log(`   Admin: admin@demo.com / Admin123!`);
  console.log(`   Agent: agent@demo.com / Agent123!`);
  console.log(`📊 Demo data loaded:`);
  console.log(`   Properties: ${properties.length}`);
  console.log(`   Customers: ${customers.length}`);
  console.log(`   Bookings: ${bookings.length}`);
});
