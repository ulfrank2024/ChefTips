const request = require('supertest');
let app;

// Mock dependencies
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));
jest.mock('jsonwebtoken');

let UserModel;
let MembershipModel;
let bcrypt;
let jwt;




describe('API Auth Endpoints', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // Re-mock modules after resetting
    jest.doMock('../models/userModel', () => ({
      UserModel: {
        findUserByEmail: jest.fn(),
        findUserById: jest.fn(),
        updateUserName: jest.fn(),
        updatePassword: jest.fn(),
        validateUserEmail: jest.fn(),
        updateUserLanguage: jest.fn(),
      },
    }));
    jest.doMock('../models/membershipModel', () => ({
      MembershipModel: {
        createMembership: jest.fn(),
        getMembershipsByUserId: jest.fn(),
        getMembershipById: jest.fn(),
        deleteMembership: jest.fn(),
        updateMembership: jest.fn(),
        getCompanyEmployees: jest.fn(),
      },
    }));
    // Import the mocked modules
    UserModel = require('../models/userModel').UserModel;
    MembershipModel = require('../models/membershipModel').MembershipModel;
    bcrypt = require('bcrypt');
    jwt = require('jsonwebtoken');
    app = require('../server');
  });

  // Test for a non-existent route (already created)
  it('should return 404 for a non-existent route', async () => {
    const response = await request(app).get('/a-route-that-does-not-exist');
    expect(response.statusCode).toBe(404);
  });

  // Test suite for the LOGIN endpoint
  describe('POST /api/auth/login', () => {

    it('should login successfully with correct credentials', async () => {
      // Arrange: Mock a user and the password check
      const fakeUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        email_validated: true,
        role: 'manager',
        company_id: 123
      };
      UserModel.findUserByEmail.mockResolvedValue(fakeUser);
      MembershipModel.getMembershipsByUserId.mockResolvedValue([{ company_id: 123, company_name: 'Fake Company', role: 'manager', can_cash_out: true }]);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('fake-jwt-token');

      // Act: Make the request
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      // Assert: Check the response
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('token', 'fake-jwt-token');
      expect(response.body.success_code).toBe('LOGIN_SUCCESSFUL');
    });

    it('should fail with wrong password', async () => {
      // Arrange: Mock a user but a failed password check
      const fakeUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        email_validated: true,
        preferred_language: 'en',
      };
      UserModel.findUserByEmail.mockResolvedValue(fakeUser);

      // Act: Make the request
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      // Assert: Check the response
      expect(response.statusCode).toBe(401);
      expect(response.body.error).toBe('INVALID_CREDENTIALS');
    });

    it('should fail if user does not exist', async () => {
      UserModel.findUserByEmail.mockResolvedValue(null);

      // Act: Make the request
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nouser@example.com', password: 'password123' });

      // Assert: Check the response
      expect(response.statusCode).toBe(401);
      expect(response.body.error).toBe('INVALID_CREDENTIALS_OR_UNVERIFIED');
    });

    it('should fail if email is not validated', async () => {
      // Arrange: Mock a user whose email is not validated
      const fakeUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        email_validated: false,
        preferred_language: 'en',
      };
      UserModel.findUserByEmail.mockResolvedValue(fakeUser);

      // Act: Make the request
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      // Assert: Check the response
      expect(response.statusCode).toBe(401);
      expect(response.body.error).toBe('INVALID_CREDENTIALS_OR_UNVERIFIED');
    });

  });

});