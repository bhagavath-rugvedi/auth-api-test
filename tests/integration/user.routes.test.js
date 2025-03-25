const request = require('supertest');
const app = require('../../src/server');
const User = require('../../src/models/User');
const dbHandler = require('../utils/db');

describe('User Routes', () => {
  let authToken;
  let userId;
  
  // Connect to test database before tests
  beforeAll(async () => {
    await dbHandler.connect();
  });
  
  // Create a test user and get auth token before tests
  beforeEach(async () => {
    // Register a new user
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    
    // Save the token
    authToken = response.body.token;
    
    // Get user ID
    const user = await User.findOne({ email: 'test@example.com' });
    userId = user._id;
  });
  
  // Clear database after each test
  afterEach(async () => {
    await dbHandler.clearDatabase();
  });
  
  // Disconnect after all tests
  afterAll(async () => {
    await dbHandler.closeDatabase();
  });
  
  describe('GET /api/user/profile', () => {
    test('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'testuser');
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(response.body).not.toHaveProperty('password');
    });
    
    test('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalid-token');
      
      // Assertions
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Token is not valid');
    });
    
    test('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/user/profile');
      
      // Assertions
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No authentication token, access denied');
    });
    
    test('should not get profile if user no longer exists', async () => {
      // Delete the user manually
      await User.findByIdAndDelete(userId);
      
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assertions
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('User not found');
    });
  });
});