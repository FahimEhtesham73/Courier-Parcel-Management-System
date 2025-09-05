const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRoutes = require('../../routes/auth');
const User = require('../../models/User');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

let mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/testdb';
let server;

beforeAll(async () => {
  // Connect to a test database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  server = app.listen(5001); // Use a different port for testing
});

afterEach(async () => {
  // Clean up the database after each test
  await User.deleteMany();
});

afterAll(async () => {
  // Disconnect from the database and close the server
  await mongoose.connection.close();
  server.close();
});

describe('Auth Integration Tests', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'Customer',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('_id');

    const user = await User.findOne({ email: 'test@example.com' });
    expect(user).toBeDefined();
    expect(user.username).toBe('testuser');
    expect(await bcrypt.compare('password123', user.password)).toBe(true);
    expect(user.role).toBe('Customer');
  });

  it('should not register a user with an existing email', async () => {
    // Register the first user
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'user1',
        email: 'duplicate@example.com',
        password: 'password123',
        role: 'Customer',
      });

    // Try to register with the same email
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'user2',
        email: 'duplicate@example.com',
        password: 'password456',
        role: 'Customer',
      });

    expect(res.statusCode).toEqual(400); // Assuming 400 for validation/duplicate errors
    expect(res.body).toHaveProperty('message', 'User already exists'); // Adjust message based on your controller's error response
  });

  it('should login an existing user successfully', async () => {
    // Register a user first
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = new User({
      username: 'loginuser',
      email: 'login@example.com',
      password: hashedPassword,
      role: 'Customer',
    });
    await user.save();

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('_id');

    // Optionally verify the token
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(user._id.toString());
    expect(decoded.role).toBe(user.role);
  });

  it('should not login with invalid credentials', async () => {
    // Register a user first
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = new User({
      username: 'invalidloginuser',
      email: 'invalidlogin@example.com',
      password: hashedPassword,
      role: 'Customer',
    });
    await user.save();

    // Try to login with wrong password
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'invalidlogin@example.com',
        password: 'wrongpassword',
      });

    expect(res.statusCode).toEqual(401); // Assuming 401 for invalid credentials
    expect(res.body).toHaveProperty('message', 'Invalid credentials'); // Adjust message based on your controller's error response

    // Try to login with non-existent email
    const resNonExistent = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'anypassword',
      });

    expect(resNonExistent.statusCode).toEqual(401);
    expect(resNonExistent.body).toHaveProperty('message', 'Invalid credentials'); // Adjust message based on your controller's error response
  });
});