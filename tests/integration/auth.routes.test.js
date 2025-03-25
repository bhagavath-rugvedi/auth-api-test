const request = require('supertest');
const app = require('../../src/server');
const User = require('../../src/models/User');
const dbHandler = require('../utils/db');

describe('Auth Routes', () => {
  // Connect to test database before tests
  beforeAll(async () => {
    await dbHandler.connect();
  });
  
  // Clear database after each test
  afterEach(async () => {
    await dbHandler.clearDatabase();
  });
  
  // Disconnect after all tests
  afterAll(async () => {
    await dbHandler.closeDatabase();
  });
  
  describe('POST /api/auth/register', () => {
    test('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });
      
      // Assertions
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.message).toBe('User registered successfully');
      
      // Verify user was created in the database
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeTruthy();
      expect(user.username).toBe('testuser');
    });
    
    test('should not register a user with existing email', async () => {
      // Create a user first
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser1',
          email: 'test@example.com',
          password: 'password123'
        });
      
      // Try to register another user with the same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'password123'
        });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User already exists');
      
      // Verify only one user exists
      const users = await User.find({ email: 'test@example.com' });
      expect(users.length).toBe(1);
    });
    
    test('should not register a user with existing username', async () => {
      // Create a user first
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test1@example.com',
          password: 'password123'
        });
      
      // Try to register another user with the same username
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test2@example.com',
          password: 'password123'
        });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User already exists');
    });
    
    test('should not register a user with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser'
          // Missing email and password
        });
      
      // Since we're using Mongoose validation, this should fail
      expect(response.status).toBe(500);
    });
  });
  
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each test
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });
    });
    
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.message).toBe('Login successful');
    });
    
    test('should not login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid credentials');
      expect(response.body).not.toHaveProperty('token');
    });
    
    test('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid credentials');
      expect(response.body).not.toHaveProperty('token');
    });
  });
});