const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

// Import your server file
const server = require('../../server'); // Adjust the path as needed

// Import models
const User = require('../../models/User');
const Parcel = require('../../models/Parcel');

const app = express();
app.use(express.json());
app.use('/', server); // Mount your routes

let adminToken;
let adminUserId;
let testParcelId;

// Connect to a test database before tests
beforeAll(async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/courier_test';
  await mongoose.connect(mongoUri);

  // Create a test admin user
  const adminUser = await User.create({
    username: 'adminuser',
    email: 'admin@test.com',
    password: 'adminpassword123', // Password will be hashed by model pre-save hook
    role: 'Admin',
  });
  adminUserId = adminUser._id;

  // Log in the admin user to get a token
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@test.com',
      password: 'adminpassword123',
    });
  adminToken = res.body.token;

  // Create some test parcels for reports/metrics
  const customerUser = await User.create({
    username: 'customeruser',
    email: 'customer@test.com',
    password: 'customerpassword123',
    role: 'Customer',
  });

  const agentUser = await User.create({
    username: 'agentuser',
    email: 'agent@test.com',
    password: 'agentpassword123',
    role: 'Delivery Agent',
  });

  const parcel1 = await Parcel.create({
    customer: customerUser._id,
    pickupAddress: '123 Main St',
    deliveryAddress: '456 Oak Ave',
    size: 'Medium',
    type: 'Document',
    paymentMethod: 'Prepaid',
    status: 'Delivered',
    assignedAgent: agentUser._id,
  });

   const parcel2 = await Parcel.create({
    customer: customerUser._id,
    pickupAddress: '789 Pine Ln',
    deliveryAddress: '101 Maple Dr',
    size: 'Large',
    type: 'Package',
    paymentMethod: 'COD',
    status: 'Failed',
     assignedAgent: agentUser._id,
     codAmount: 50
  });
    testParcelId = parcel1._id;


});

// Drop the test database after tests
afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

describe('Admin API Integration Tests', () => {
  it('should get dashboard metrics for admin', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/metrics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('dailyBookings');
    expect(res.body).toHaveProperty('failedDeliveries');
    expect(res.body).toHaveProperty('totalCodAmount');
    // Add more specific assertions based on the test data created
    expect(res.body.failedDeliveries).toBeGreaterThanOrEqual(1);
    expect(res.body.totalCodAmount).toBeGreaterThanOrEqual(50);

  });

    it('should not get dashboard metrics for non-admin user', async () => {
       const customerUser = await User.findOne({ email: 'customer@test.com' });
        const customerRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'customer@test.com',
          password: 'customerpassword123',
        });
      const customerToken = customerRes.body.token;

    const res = await request(app)
      .get('/api/admin/dashboard/metrics')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.statusCode).toBe(403); // Forbidden
    expect(res.body).toHaveProperty('message', 'Not authorized as an admin');
  });


  it('should generate CSV parcel report for admin', async () => {
    const res = await request(app)
      .get('/api/admin/reports/parcels')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ format: 'csv' }); // Request CSV format

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.text).toContain('pickupAddress,deliveryAddress,size,type,paymentMethod,status,assignedAgent,codAmount,createdAt,updatedAt'); // Check for CSV headers
    expect(res.text).toContain('123 Main St'); // Check for parcel data
    expect(res.text).toContain('789 Pine Ln'); // Check for parcel data

  });

   it('should generate PDF parcel report for admin', async () => {
    const res = await request(app)
      .get('/api/admin/reports/parcels')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ format: 'pdf' }); // Request PDF format

    expect(res.statusCode).toBe(200);
     expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment');
     // Basic check for PDF content, actual content verification is more complex
     expect(res.body).toBeInstanceOf(Buffer);
     expect(res.body.length).toBeGreaterThan(100); // Check if PDF is not empty

  });

   it('should not generate reports for non-admin user', async () => {
       const customerUser = await User.findOne({ email: 'customer@test.com' });
        const customerRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'customer@test.com',
          password: 'customerpassword123',
        });
      const customerToken = customerRes.body.token;

    const res = await request(app)
      .get('/api/admin/reports/parcels')
      .set('Authorization', `Bearer ${customerToken}`)
      .query({ format: 'csv' });

    expect(res.statusCode).toBe(403); // Forbidden
    expect(res.body).toHaveProperty('message', 'Not authorized as an admin');
  });


});