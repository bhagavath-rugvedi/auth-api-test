const authMiddleware = require('../../src/middleware/auth');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../src/models/User');

describe('Auth Middleware', () => {
  let req;
  let res;
  let next;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up request, response, and next function
    req = {
      header: jest.fn()
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
  });
  
  test('should add user to request object and call next if token is valid', async () => {
    // Mock authorization header
    req.header.mockReturnValue('Bearer valid-token');
    
    // Mock jwt.verify
    jwt.verify.mockReturnValue({ id: 'user-id' });
    
    // Mock User.findById
    const mockUser = { _id: 'user-id', username: 'testuser' };
    User.findById.mockResolvedValue(mockUser);
    
    // Call middleware
    await authMiddleware(req, res, next);
    
    // Assertions
    expect(req.header).toHaveBeenCalledWith('Authorization');
    expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
    expect(User.findById).toHaveBeenCalledWith('user-id');
    expect(req.user).toEqual(mockUser);
    expect(req.userId).toBe('user-id');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
  
  test('should return 401 if no token is provided', async () => {
    // Mock missing authorization header
    req.header.mockReturnValue(undefined);
    
    // Call middleware
    await authMiddleware(req, res, next);
    
    // Assertions
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ 
      message: 'No authentication token, access denied' 
    });
    expect(next).not.toHaveBeenCalled();
  });
  
  test('should return 401 if token is invalid', async () => {
    // Mock authorization header
    req.header.mockReturnValue('Bearer invalid-token');
    
    // Mock jwt.verify to throw an error
    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });
    
    // Call middleware
    await authMiddleware(req, res, next);
    
    // Assertions
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token is not valid' });
    expect(next).not.toHaveBeenCalled();
  });
  
  test('should return 401 if user not found', async () => {
    // Mock authorization header
    req.header.mockReturnValue('Bearer valid-token');
    
    // Mock jwt.verify
    jwt.verify.mockReturnValue({ id: 'nonexistent-user-id' });
    
    // Mock User.findById to return null
    User.findById.mockResolvedValue(null);
    
    // Call middleware
    await authMiddleware(req, res, next);
    
    // Assertions
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    expect(next).not.toHaveBeenCalled();
  });
});