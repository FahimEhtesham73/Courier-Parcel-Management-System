const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../../server'); // Assuming your Express app is exported from server.js
const User = require('../../models/User');
const Parcel = require('../../models/Parcel');

let mongoServer;
let adminToken;
let customerToken;
let agentToken;

beforeAll(async () => {
  // Start in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to the test database
  await mongoose.connect(mongoUri);

  // Create test users and get tokens
  const adminUser = await User.create({
    username: 'adminuser',
    email: 'admin@example.com',
    password: 'password123',
    role: 'Admin',
  });
  const customerUser = await User.create({
    username: 'customeruser',
    email: 'customer@example.com',
    password: 'password123',
    role: 'Customer',
  });
  const agentUser = await User.create({
    username: 'agentuser',
    email: 'agent@example.com',
    password: 'password123',
    role: 'Delivery Agent',
  });

  adminToken = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  customerToken = jwt.sign({ id: customerUser._id, role: customerUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  agentToken = jwt.sign({ id: agentUser._id, role: agentUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  // Disconnect from the database
  await mongoose.disconnect();

  // Stop the in-memory MongoDB server
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear the database before each test
  await Parcel.deleteMany({});
});

describe('Parcel API', () => {
  let parcelId;

  // Test Create Parcel
  describe('POST /api/parcels', () => {
    it('should allow a customer to create a parcel', async () => {
      const newParcel = {
        pickupAddress: '123 Customer St',
        deliveryAddress: '456 Recipient Ave',
        size: 'Small',
        type: 'Document',
        paymentMethod: 'Prepaid',
      };
      const res = await request(app)
        .post('/api/parcels')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(newParcel);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.customer).toBeDefined(); // Customer ID should be set
      parcelId = res.body._id; // Store for future tests
    });

    it('should not allow an agent to create a parcel', async () => {
      const newParcel = {
        pickupAddress: '123 Agent St',
        deliveryAddress: '456 Other Ave',
        size: 'Medium',
        type: 'Box',
        paymentMethod: 'COD',
      };
      const res = await request(app)
        .post('/api/parcels')
        .set('Authorization', `Bearer ${agentToken}`)
        .send(newParcel);

      expect(res.statusCode).toBe(403); // Forbidden
    });

    it('should require authentication to create a parcel', async () => {
      const newParcel = {
        pickupAddress: '123 Guest St',
        deliveryAddress: '456 Another Ave',
        size: 'Large',
        type: 'Pallet',
        paymentMethod: 'Prepaid',
      };
      const res = await request(app)
        .post('/api/parcels')
        .send(newParcel);

      expect(res.statusCode).toBe(401); // Unauthorized
    });
  });

  // Test Get All Parcels
  describe('GET /api/parcels', () => {
    it('should allow an admin to get all parcels', async () => {
      // Create a parcel first
      await request(app)
        .post('/api/parcels')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          pickupAddress: '123 Customer St',
          deliveryAddress: '456 Recipient Ave',
          size: 'Small',
          type: 'Document',
          paymentMethod: 'Prepaid',
        });

      const res = await request(app)
        .get('/api/parcels')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(1); // Should have the created parcel
    });

    it('should allow a customer to get only their parcels', async () => {
      // Create a parcel by the customer
      await request(app)
        .post('/api/parcels')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          pickupAddress: 'Customer Parcel 1',
          deliveryAddress: 'Delivery 1',
          size: 'Small',
          type: 'Doc',
          paymentMethod: 'Prepaid',
        });

      // Create a parcel by another user (optional, to ensure filtering works)
      const anotherUser = await User.create({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'password123',
        role: 'Customer',
      });
      const anotherUserToken = jwt.sign({ id: anotherUser._id, role: anotherUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
      await request(app)
        .post('/api/parcels')
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({
          pickupAddress: 'Another User Parcel 1',
          deliveryAddress: 'Delivery 2',
          size: 'Medium',
          type: 'Box',
          paymentMethod: 'COD',
        });

      const res = await request(app)
        .get('/api/parcels')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(1); // Should only have the customer's parcel
      expect(res.body[0].pickupAddress).toBe('Customer Parcel 1');
    });

    it('should allow a delivery agent to get parcels assigned to them (assuming assignment logic exists)', async () => {
        // This test requires prior agent assignment logic to be tested correctly.
        // For now, we'll assume the API returns assigned parcels for agents.
        // A more comprehensive test would involve creating a parcel and assigning the agent to it.
        const res = await request(app)
          .get('/api/parcels')
          .set('Authorization', `Bearer ${agentToken}`);

        expect(res.statusCode).toBe(200); // Assuming API returns 200 for agents
        expect(res.body).toBeInstanceOf(Array);
        // Further assertions here would depend on the agent assignment implementation
      });


    it('should require authentication to get parcels', async () => {
      const res = await request(app)
        .get('/api/parcels');

      expect(res.statusCode).toBe(401); // Unauthorized
    });
  });

  // Test Get Parcel by ID
  describe('GET /api/parcels/:id', () => {
    let createdParcelId;
    beforeEach(async () => {
      // Create a parcel for testing
      const res = await request(app)
        .post('/api/parcels')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          pickupAddress: 'Parcel for details',
          deliveryAddress: 'Details delivery',
          size: 'Small',
          type: 'Doc',
          paymentMethod: 'Prepaid',
        });
      createdParcelId = res.body._id;
    });

    it('should allow a customer to get their parcel by ID', async () => {
      const res = await request(app)
        .get(`/api/parcels/${createdParcelId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('_id', createdParcelId);
      expect(res.body.pickupAddress).toBe('Parcel for details');
    });

    it('should allow an admin to get any parcel by ID', async () => {
        const res = await request(app)
          .get(`/api/parcels/${createdParcelId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('_id', createdParcelId);
        expect(res.body.pickupAddress).toBe('Parcel for details');
      });

    it('should not allow a customer to get a parcel they do not own', async () => {
        // Create a parcel by another user
        const anotherUser = await User.create({
          username: 'anotheruser2',
          email: 'another2@example.com',
          password: 'password123',
          role: 'Customer',
        });
        const anotherUserToken = jwt.sign({ id: anotherUser._id, role: anotherUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const resOther = await request(app)
          .post('/api/parcels')
          .set('Authorization', `Bearer ${anotherUserToken}`)
          .send({
            pickupAddress: 'Other User Parcel',
            deliveryAddress: 'Other Delivery',
            size: 'Medium',
            type: 'Box',
            paymentMethod: 'COD',
          });
        const otherParcelId = resOther.body._id;


      const res = await request(app)
        .get(`/api/parcels/${otherParcelId}`)
        .set('Authorization', `Bearer ${customerToken}`); // customerToken belongs to the first customer

      expect(res.statusCode).toBe(403); // Forbidden
    });

    it('should not allow an agent to get a parcel they are not assigned to', async () => {
        // This test requires prior agent assignment logic to be tested correctly.
        // For now, we'll assume an agent cannot get a parcel they are not assigned.
        const res = await request(app)
          .get(`/api/parcels/${createdParcelId}`) // createdParcelId belongs to the customer
          .set('Authorization', `Bearer ${agentToken}`);

        expect(res.statusCode).toBe(403); // Assuming forbidden for unassigned parcels
      });


    it('should return 404 if parcel not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/parcels/${nonExistentId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(404);
    });

    it('should require authentication to get a parcel by ID', async () => {
      const res = await request(app)
        .get(`/api/parcels/${createdParcelId}`);

      expect(res.statusCode).toBe(401); // Unauthorized
    });
  });

  // Test Update Parcel
  describe('PUT /api/parcels/:id', () => {
    let createdParcelId;
    beforeEach(async () => {
      // Create a parcel for testing
      const res = await request(app)
        .post('/api/parcels')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          pickupAddress: 'Parcel to update',
          deliveryAddress: 'Update delivery',
          size: 'Small',
          type: 'Doc',
          paymentMethod: 'Prepaid',
        });
      createdParcelId = res.body._id;
    });

    it('should allow a customer to update their parcel', async () => {
      const updatedData = {
        size: 'Medium',
        paymentMethod: 'COD',
      };
      const res = await request(app)
        .put(`/api/parcels/${createdParcelId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updatedData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('size', 'Medium');
      expect(res.body).toHaveProperty('paymentMethod', 'COD');
    });

    it('should allow an admin to update any parcel', async () => {
        const updatedData = {
          status: 'Picked Up', // Admin can update status
          assignedAgent: (await User.findOne({ role: 'Delivery Agent' }))._id, // Admin can assign agent
        };
        const res = await request(app)
          .put(`/api/parcels/${createdParcelId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updatedData);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status', 'Picked Up');
        expect(res.body.assignedAgent).toBeDefined();
      });


    it('should not allow a customer to update a parcel they do not own', async () => {
        // Create a parcel by another user
        const anotherUser = await User.create({
          username: 'anotheruser3',
          email: 'another3@example.com',
          password: 'password123',
          role: 'Customer',
        });
        const anotherUserToken = jwt.sign({ id: anotherUser._id, role: anotherUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const resOther = await request(app)
          .post('/api/parcels')
          .set('Authorization', `Bearer ${anotherUserToken}`)
          .send({
            pickupAddress: 'Other User Parcel Update',
            deliveryAddress: 'Other Delivery Update',
            size: 'Medium',
            type: 'Box',
            paymentMethod: 'COD',
          });
        const otherParcelId = resOther.body._id;

      const updatedData = {
        size: 'Large',
      };
      const res = await request(app)
        .put(`/api/parcels/${otherParcelId}`)
        .set('Authorization', `Bearer ${customerToken}`) // customerToken belongs to the first customer
        .send(updatedData);

      expect(res.statusCode).toBe(403); // Forbidden
    });

    it('should not allow an agent to update a parcel they are not assigned to (excluding status)', async () => {
        // This test requires prior agent assignment logic to be tested correctly.
        // Agents can update status, but not other fields of unassigned parcels.
        const updatedData = {
          size: 'XL',
        };
        const res = await request(app)
          .put(`/api/parcels/${createdParcelId}`) // createdParcelId belongs to the customer
          .set('Authorization', `Bearer ${agentToken}`)
          .send(updatedData);

        expect(res.statusCode).toBe(403); // Assuming forbidden for unassigned parcels (non-status update)
      });


    it('should return 404 if parcel not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updatedData = { size: 'Medium' };
      const res = await request(app)
        .put(`/api/parcels/${nonExistentId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updatedData);

      expect(res.statusCode).toBe(404);
    });

    it('should require authentication to update a parcel', async () => {
      const updatedData = { size: 'Medium' };
      const res = await request(app)
        .put(`/api/parcels/${createdParcelId}`)
        .send(updatedData);

      expect(res.statusCode).toBe(401); // Unauthorized
    });
  });

  // Test Delete Parcel
  describe('DELETE /api/parcels/:id', () => {
    let createdParcelId;
    beforeEach(async () => {
      // Create a parcel for testing
      const res = await request(app)
        .post('/api/parcels')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          pickupAddress: 'Parcel to delete',
          deliveryAddress: 'Delete delivery',
          size: 'Small',
          type: 'Doc',
          paymentMethod: 'Prepaid',
        });
      createdParcelId = res.body._id;
    });

    it('should allow a customer to delete their parcel', async () => {
      const res = await request(app)
        .delete(`/api/parcels/${createdParcelId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200); // Or 204 No Content, depending on implementation
      // Verify the parcel is deleted
      const deletedParcel = await Parcel.findById(createdParcelId);
      expect(deletedParcel).toBeNull();
    });

    it('should allow an admin to delete any parcel', async () => {
        const res = await request(app)
          .delete(`/api/parcels/${createdParcelId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200); // Or 204 No Content
        // Verify the parcel is deleted
        const deletedParcel = await Parcel.findById(createdParcelId);
        expect(deletedParcel).toBeNull();
      });


    it('should not allow a customer to delete a parcel they do not own', async () => {
        // Create a parcel by another user
        const anotherUser = await User.create({
          username: 'anotheruser4',
          email: 'another4@example.com',
          password: 'password123',
          role: 'Customer',
        });
        const anotherUserToken = jwt.sign({ id: anotherUser._id, role: anotherUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const resOther = await request(app)
          .post('/api/parcels')
          .set('Authorization', `Bearer ${anotherUserToken}`)
          .send({
            pickupAddress: 'Other User Parcel Delete',
            deliveryAddress: 'Other Delivery Delete',
            size: 'Medium',
            type: 'Box',
            paymentMethod: 'COD',
          });
        const otherParcelId = resOther.body._id;

      const res = await request(app)
        .delete(`/api/parcels/${otherParcelId}`)
        .set('Authorization', `Bearer ${customerToken}`); // customerToken belongs to the first customer

      expect(res.statusCode).toBe(403); // Forbidden
      // Verify the parcel is NOT deleted
      const existingParcel = await Parcel.findById(otherParcelId);
      expect(existingParcel).not.toBeNull();
    });

    it('should not allow an agent to delete a parcel', async () => {
      const res = await request(app)
        .delete(`/api/parcels/${createdParcelId}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(403); // Forbidden
      // Verify the parcel is NOT deleted
      const existingParcel = await Parcel.findById(createdParcelId);
      expect(existingParcel).not.toBeNull();
    });


    it('should return 404 if parcel not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/parcels/${nonExistentId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(404);
    });

    it('should require authentication to delete a parcel', async () => {
      const res = await request(app)
        .delete(`/api/parcels/${createdParcelId}`);

      expect(res.statusCode).toBe(401); // Unauthorized
    });
  });

  // Test Update Parcel Status (Agent/Admin specific)
  describe('PUT /api/parcels/:id/status', () => {
    let createdParcelId;
    beforeEach(async () => {
      // Create a parcel for testing status updates
      const res = await request(app)
        .post('/api/parcels')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          pickupAddress: 'Parcel for status update',
          deliveryAddress: 'Status delivery',
          size: 'Small',
          type: 'Doc',
          paymentMethod: 'Prepaid',
          status: 'Pending', // Start with pending status
        });
      createdParcelId = res.body._id;
    });

    it('should allow an admin to update parcel status', async () => {
      const res = await request(app)
        .put(`/api/parcels/${createdParcelId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Picked Up' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'Picked Up');
    });

    it('should allow an assigned agent to update parcel status', async () => {
        // Assign the agent to the parcel first (requires a separate update)
        await request(app)
          .put(`/api/parcels/${createdParcelId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ assignedAgent: (await User.findOne({ role: 'Delivery Agent' }))._id });

        const res = await request(app)
          .put(`/api/parcels/${createdParcelId}/status`)
          .set('Authorization', `Bearer ${agentToken}`)
          .send({ status: 'In Transit' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status', 'In Transit');
      });


    it('should not allow a customer to update parcel status', async () => {
      const res = await request(app)
        .put(`/api/parcels/${createdParcelId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'Delivered' });

      expect(res.statusCode).toBe(403); // Forbidden
    });

    it('should not allow an unassigned agent to update parcel status', async () => {
      const res = await request(app)
        .put(`/api/parcels/${createdParcelId}/status`)
        .set('Authorization', `Bearer ${agentToken}`) // Agent not assigned to this parcel
        .send({ status: 'Delivered' });

      expect(res.statusCode).toBe(403); // Forbidden
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app)
        .put(`/api/parcels/${createdParcelId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Invalid Status' });

      expect(res.statusCode).toBe(400); // Bad Request (due to validation)
    });

    it('should return 404 if parcel not found for status update', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const res = await request(app)
          .put(`/api/parcels/${nonExistentId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'Delivered' });

        expect(res.statusCode).toBe(404);
      });

    it('should require authentication to update parcel status', async () => {
      const res = await request(app)
        .put(`/api/parcels/${createdParcelId}/status`)
        .send({ status: 'Delivered' });

      expect(res.statusCode).toBe(401); // Unauthorized
    });
  });
});