const { register, login } = require('../../src/controllers/authController');
const User = require('../../src/models/User');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../../src/models/User');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
  let req;
  let res;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup req and res objects
    req = {
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });
  
  describe('register', () => {
    test('should register a new user and return a token', async () => {
      // Mock User.findOne to return null (user doesn't exist)
      User.findOne.mockResolvedValue(null);
      
      // Mock user save
      const mockUser = {
        _id: 'mock-user-id',
        save: jest.fn().mockResolvedValue(true)
      };
      User.mockImplementation(() => mockUser);
      
      // Mock jwt.sign
      jwt.sign.mockReturnValue('mock-jwt-token');
      
      // Call the function
      await register(req, res);
      
      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ 
        $or: [{ email: 'test@example.com' }, { username: 'testuser' }] 
      });
      expect(mockUser.save).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'mock-user-id' },
        expect.any(String),
        { expiresIn: '1h' }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User registered successfully',
        token: 'mock-jwt-token'
      });
    });
    
    test('should return 400 if user already exists', async () => {
      // Mock User.findOne to return an existing user
      User.findOne.mockResolvedValue({ _id: 'existing-user-id' });
      
      // Call the function
      await register(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User already exists' });
    });
    
    test('should return 500 if server error occurs', async () => {
      // Mock User.findOne to throw an error
      User.findOne.mockRejectedValue(new Error('Database error'));
      
      // Call the function
      await register(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Server error', 
        error: 'Database error' 
      });
    });
  });
  
  describe('login', () => {
    test('should login user and return a token', async () => {
      // Create mock user with comparePassword method
      const mockUser = {
        _id: 'mock-user-id',
        comparePassword: jest.fn().mockResolvedValue(true)
      };
      
      // Mock User.findOne to return the mock user
      User.findOne.mockResolvedValue(mockUser);
      
      // Mock jwt.sign
      jwt.sign.mockReturnValue('mock-jwt-token');
      
      // Call the function
      await login(req, res);
      
      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'mock-user-id' },
        expect.any(String),
        { expiresIn: '1h' }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login successful',
        token: 'mock-jwt-token'
      });
    });
    
    test('should return 400 if user not found', async () => {
      // Mock User.findOne to return null (user doesn't exist)
      User.findOne.mockResolvedValue(null);
      
      // Call the function
      await login(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });
    
    test('should return 400 if password is incorrect', async () => {
      // Create mock user with comparePassword method returning false
      const mockUser = {
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      
      // Mock User.findOne to return the mock user
      User.findOne.mockResolvedValue(mockUser);
      
      // Call the function
      await login(req, res);
      
      // Assertions
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });
    
    test('should return 500 if server error occurs', async () => {
      // Mock User.findOne to throw an error
      User.findOne.mockRejectedValue(new Error('Database error'));
      
      // Call the function
      await login(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Server error', 
        error: 'Database error' 
      });
    });
  });
});