import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../index.js';
import RecycleRequest from '../../models/RecycleRequest.js';
import ProviderProfile from '../../models/providerProfile.js';
import { generateTestToken } from '../testHelper.js';

// Mock the models
jest.mock('../../models/RecycleRequest.js');
jest.mock('../../models/providerProfile.js');

describe('Recycle API Integration Tests', () => {
    let mockUserToken;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUserToken = generateTestToken('user-123', 'customer');
    });

    describe('POST /api/recycling', () => {
        it('should create a new recycling request', async () => {
            const mockProviderProfile = { _id: 'provider-id', userId: 'provider-userId' };
            ProviderProfile.findById.mockResolvedValue(mockProviderProfile);
            
            RecycleRequest.prototype.save = jest.fn().mockResolvedValue({
                _id: 'recycle-123',
                productName: 'Old Phone',
                status: 'Pending'
            });

            const response = await request(app)
                .post('/api/recycling')
                .set('Authorization', `Bearer ${mockUserToken}`)
                .send({
                    productName: 'Old Phone',
                    category: 'Mobiles',
                    description: 'E-waste',
                    quantity: 1,
                    provider: 'provider-id'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('productName', 'Old Phone');
        });
    });

    describe('GET /api/recycling', () => {
        it('should list recycling requests for the logged in user', async () => {
            RecycleRequest.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([{ productName: 'Old Phone' }])
            });

            const response = await request(app)
                .get('/api/recycling')
                .set('Authorization', `Bearer ${mockUserToken}`);

            expect(response.status).toBe(200);
            expect(RecycleRequest.find).toHaveBeenCalledWith(expect.objectContaining({ user: 'user-123' }));
        });
    });

    describe('DELETE /api/recycling/:id', () => {
        it('should allow user to delete their own request', async () => {
            const mockRequest = { 
                _id: 'recycle-123', 
                user: { toString: () => 'user-123' } 
            };
            RecycleRequest.findById.mockResolvedValue(mockRequest);
            RecycleRequest.findByIdAndDelete.mockResolvedValue(true);

            const response = await request(app)
                .delete('/api/recycling/recycle-123')
                .set('Authorization', `Bearer ${mockUserToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('deleted successfully');
        });

        it('should block user from deleting others requests', async () => {
            const mockRequest = { 
                _id: 'recycle-123', 
                user: { toString: () => 'other-user' } 
            };
            RecycleRequest.findById.mockResolvedValue(mockRequest);

            const response = await request(app)
                .delete('/api/recycling/recycle-123')
                .set('Authorization', `Bearer ${mockUserToken}`);

            expect(response.status).toBe(403);
        });
    });
});
