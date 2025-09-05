const { createParcel, getParcelById } = require('../controllers/parcelController');
const Parcel = require('../models/Parcel');
const User = require('../models/User'); // Assuming User model is needed for population or checks
const httpMocks = require('node-mocks-http');

// Mock the Parcel and User models
jest.mock('../models/Parcel');
jest.mock('../models/User');

describe('Parcel Controller', () => {
  let req, res, next;

  beforeEach(() => {
    // Create mock request and response objects before each test
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createParcel', () => {
    it('should create a new parcel successfully', async () => {
      const mockUserId = 'user123';
      const mockParcelData = {
        pickupAddress: '123 Pickup St',
        deliveryAddress: '456 Delivery Ave',
        size: 'Medium',
        type: 'Electronics',
        paymentMethod: 'Prepaid',
        pickupLocation: { latitude: 10, longitude: 20 },
        deliveryLocation: { latitude: 30, longitude: 40 },
      };

      req.user = { id: mockUserId }; // Mock logged-in user
      req.body = mockParcelData;

      // Mock the Parcel.create method to return a created parcel object
      Parcel.create.mockResolvedValue({ _id: 'parcel123', customer: mockUserId, ...mockParcelData });

      await createParcel(req, res, next);

      // Assert that Parcel.create was called with the correct data
      expect(Parcel.create).toHaveBeenCalledWith({
        ...mockParcelData,
        customer: mockUserId,
      });

      // Assert the response status and JSON
      expect(res.statusCode).toBe(201);
      expect(res._getJSONData()).toEqual({
        _id: 'parcel123',
        customer: mockUserId,
        ...mockParcelData
      });
    });

    it('should return 400 if required fields are missing', async () => {
      req.user = { id: 'user123' };
      req.body = { // Missing required fields
        deliveryAddress: '456 Delivery Ave',
      };

      // In a real scenario, validation middleware would handle this,
      // but for unit testing the controller in isolation, we can simulate it
      // or test how the controller handles missing data if no validation middleware exists.
      // For this test, we'll assume some basic checks or rely on the database schema.
      // A more robust test would involve mocking validation errors if middleware is used.

      // Here we'll test if the controller throws an error or handles the missing data.
      // Depending on implementation, you might expect a throw or a specific response.
      // Let's assume it might throw a Mongoose validation error or similar.
      Parcel.create.mockRejectedValue(new Error('Validation failed: pickupAddress: Path `pickupAddress` is required.'));

      await createParcel(req, res, next);

      // Assert that an error was passed to the next middleware
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      // You might also check for specific error properties if your error handling middleware
      // sets them, or if the controller explicitly sends an error response for this case.
    });

    // Add more tests for invalid data types, edge cases, etc.
  });

  describe('getParcelById', () => {
    it('should return the parcel if found and user is authorized', async () => {
      const mockParcelId = 'parcel123';
      const mockUserId = 'user123';
      const mockParcel = {
        _id: mockParcelId,
        customer: mockUserId,
        pickupAddress: '123 Pickup St',
        deliveryAddress: '456 Delivery Ave',
        assignedAgent: 'agent456',
      };

      req.params.id = mockParcelId;
      req.user = { id: mockUserId, role: 'Customer' }; // Mock logged-in customer

      // Mock Parcel.findById and its populate method
      Parcel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockParcel)
      });

      await getParcelById(req, res, next);

      // Assert that Parcel.findById was called with the correct ID
      expect(Parcel.findById).toHaveBeenCalledWith(mockParcelId);
      // Assert that populate was called (if applicable in your controller)
      expect(Parcel.findById().populate).toHaveBeenCalled();

      // Assert the response status and JSON
      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual(mockParcel);
    });

    it('should return 404 if parcel is not found', async () => {
      const mockParcelId = 'nonexistentparcel';
      req.params.id = mockParcelId;
      req.user = { id: 'user123', role: 'Customer' };

      // Mock Parcel.findById to return null (parcel not found)
      Parcel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await getParcelById(req, res, next);

      // Assert that an error with status code 404 was passed to the next middleware
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].statusCode).toBe(404); // Assuming your error handling sets statusCode
    });

    it('should return 403 if user is not authorized to view the parcel', async () => {
      const mockParcelId = 'parcel123';
      const mockParcel = {
        _id: mockParcelId,
        customer: 'otheruser', // Owned by a different user
      };

      req.params.id = mockParcelId;
      req.user = { id: 'user123', role: 'Customer' }; // Logged-in user is not the owner

      Parcel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockParcel)
      });

      await getParcelById(req, res, next);

      // Assert that an error with status code 403 was passed to the next middleware
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].statusCode).toBe(403); // Assuming your error handling sets statusCode
    });

    it('should allow Admin to view any parcel', async () => {
      const mockParcelId = 'parcel123';
      const mockParcel = {
        _id: mockParcelId,
        customer: 'otheruser',
      };

      req.params.id = mockParcelId;
      req.user = { id: 'adminuser', role: 'Admin' }; // Logged-in user is Admin

      Parcel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockParcel)
      });

      await getParcelById(req, res, next);

      // Assert that the parcel was returned successfully
      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual(mockParcel);
    });

    // Add more tests for other roles (Delivery Agent viewing assigned parcels)
  });

  // Add tests for getAllParcels, updateParcel, deleteParcel, updateParcelStatus, generateParcelQRCode
});