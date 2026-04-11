import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../index.js';
import RepairRequest from '../../models/RepairRequest.js';
import ProviderProfile from '../../models/providerProfile.js';
import { generateTestToken } from '../testHelper.js';

// Mock the models
jest.mock('../../models/RepairRequest.js');
jest.mock('../../models/providerProfile.js');

describe('Repair API Integration Tests', () => {
    let mockUserToken;
    let mockProviderToken;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUserToken = generateTestToken('user-123', 'customer');
        mockProviderToken = generateTestToken('provider-456', 'provider');

        // Explicitly spy on methods that need mocking behavior
        jest.spyOn(RepairRequest, 'find');
        jest.spyOn(RepairRequest, 'findById');
        jest.spyOn(ProviderProfile, 'findById');
    });

    describe('POST /api/repairs', () => {
        it('should create a new repair request successfully', async () => {
            const mockProviderProfile = { _id: 'provider-id', userId: 'provider-userId' };
            ProviderProfile.findById.mockResolvedValue(mockProviderProfile);
            
            RepairRequest.prototype.save = jest.fn().mockResolvedValue({
                _id: 'request-123',
                productName: 'Laptop',
                status: 'Pending'
            });

            const response = await request(app)
                .post('/api/repairs')
                .set('Authorization', `Bearer ${mockUserToken}`)
                .send({
                    productName: 'Laptop',
                    category: 'Electronics',
                    description: 'Screen broken',
                    quantity: 1,
                    provider: 'provider-id'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('productName', 'Laptop');
        });

        it('should return 400 if provider is invalid', async () => {
            ProviderProfile.findById.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/repairs')
                .set('Authorization', `Bearer ${mockUserToken}`)
                .send({ provider: 'invalid-id' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid provider ID');
        });
    });

    describe('GET /api/repairs', () => {
        it('should list repair requests for a customer', async () => {
            RepairRequest.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([{ productName: 'Laptop' }])
            });

            const response = await request(app)
                .get('/api/repairs')
                .set('Authorization', `Bearer ${mockUserToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(RepairRequest.find).toHaveBeenCalledWith(expect.objectContaining({ user: 'user-123' }));
        });
    });

    describe('PATCH /api/repairs/:id/status', () => {
        it('should update repair status', async () => {
            const mockRequest = {
                _id: 'req-123',
                status: 'Pending',
                lifecycle: [],
                save: jest.fn().mockResolvedValue(true)
            };
            RepairRequest.findById.mockResolvedValue(mockRequest);

            const response = await request(app)
                .patch('/api/repairs/req-123/status')
                .set('Authorization', `Bearer ${mockProviderToken}`)
                .send({ status: 'Accepted', note: 'Will fix it' });

            expect(response.status).toBe(200);
            expect(mockRequest.status).toBe('Accepted');
            expect(mockRequest.lifecycle.length).toBe(0);
        });
    });
});
