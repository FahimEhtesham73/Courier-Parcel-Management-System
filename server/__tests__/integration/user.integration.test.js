const request = require('supertest');
const app = require('../../server'); // Assuming your Express app is exported from server.js
const mongoose = require('mongoose');
const User = require('../../models/User');
const connectDB = require('../../config/db'); // Assuming your DB connection is in config/db.js
const generateToken = require('../../utils/generateToken'); // Assuming you have a token generation utility

let mongoServer;
let adminToken;
let agentToken;
let customerToken;

beforeAll(async () => {
  // Use a test database (e.g., mongodb-memory-server)
  // For demonstration, we'll use the development DB.
  // REPLACE WITH A PROPER TEST DATABASE SETUP IN REAL PROJECT
   await connectDB();

  // Clean up the test database
  await User.deleteMany({});

  // Create test users with different roles
  const adminUser = await User.create({
    username: 'testadmin',
    email: 'admin@test.com',
    password: 'password123',
    role: 'Admin',
  });
  adminToken = generateToken(adminUser._id, adminUser.role);

  const agentUser = await User.create({
    username: 'testagent',
    email: 'agent@test.com',
    password: 'password123',
    role: 'Delivery Agent',
  });
  agentToken = generateToken(agentUser._id, agentUser.role);

  const customerUser = await User.create({
    username: 'testcustomer',
    email: 'customer@test.com',
    password: 'password123',
    role: 'Customer',
  });
  customerToken = generateToken(customerUser._id, customerUser.role);
});

afterAll(async () => {
  // Clean up the test database
  await User.deleteMany({});
  // Disconnect from the database
  await mongoose.connection.close();
  // If using mongodb-memory-server, stop it here
  // await mongoServer.stop();
});

describe('User API Integration Tests', () => {
  describe('GET /api/users', () => {
    it('should allow admin to get all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3); // Admin, Agent, Customer
    });

    it('should not allow non-admin users (agent) to get all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${agentToken}`);
      expect(res.statusCode).toBe(403);
    });

    it('should not allow non-admin users (customer) to get all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.statusCode).toBe(403);
    });

    it('should return 401 if no token is provided', async () => {
        const res = await request(app)
          .get('/api/users');
        expect(res.statusCode).toBe(401);
    });

    it('should filter users by role if role query parameter is provided (Admin)', async () => {
        const res = await request(app)
          .get('/api/users?role=Admin')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.every(user => user.role === 'Admin')).toBe(true);
    });

    it('should filter users by role if role query parameter is provided (Delivery Agent)', async () => {
        const res = await request(app)
          .get('/api/users?role=Delivery Agent')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.every(user => user.role === 'Delivery Agent')).toBe(true);
    });
  });

  describe('PUT /api/users/location', () => {
    it('should allow delivery agent to update their location', async () => {
      const res = await request(app)
        .put('/api/users/location')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ latitude: 10, longitude: 20 });
      expect(res.statusCode).toBe(200);
      expect(res.body.currentLocation).toBeDefined();
      expect(res.body.currentLocation.latitude).toBe(10);
      expect(res.body.currentLocation.longitude).toBe(20);

      // Verify location is updated in the database
      const updatedAgent = await User.findById(res.body._id);
      expect(updatedAgent.currentLocation).toBeDefined();
      expect(updatedAgent.currentLocation.latitude).toBe(10);
      expect(updatedAgent.currentLocation.longitude).toBe(20);
    });

    it('should return 400 if latitude or longitude is missing', async () => {
        const res = await request(app)
          .put('/api/users/location')
          .set('Authorization', `Bearer ${agentToken}`)
          .send({ latitude: 10 });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain('Latitude and longitude are required');
    });

    it('should not allow admin to update location via this endpoint', async () => {
      const res = await request(app)
        .put('/api/users/location')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ latitude: 30, longitude: 40 });
      expect(res.statusCode).toBe(403); // Or whatever status code your isAdmin middleware returns for non-agent access
    });

    it('should not allow customer to update location via this endpoint', async () => {
      const res = await request(app)
        .put('/api/users/location')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ latitude: 50, longitude: 60 });
      expect(res.statusCode).toBe(403); // Or whatever status code your isAdmin middleware returns for non-agent access
    });

    it('should return 401 if no token is provided', async () => {
        const res = await request(app)
          .put('/api/users/location')
          .send({ latitude: 10, longitude: 20 });
        expect(res.statusCode).toBe(401);
    });
  });
});