import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../index.js';
import RepairRequest from '../../models/RepairRequest.js';
import RecycleRequest from '../../models/RecycleRequest.js';
import { generateTestToken } from '../testHelper.js';

// Mock the models
jest.mock('../../models/RepairRequest.js');
jest.mock('../../models/RecycleRequest.js');

describe('Admin Report API Integration Tests', () => {
    let mockAdminToken;

    beforeEach(() => {
        jest.clearAllMocks();
        mockAdminToken = generateTestToken('admin-123', 'admin');
    });

    describe('GET /api/admin/stats', () => {
        it('should return system-wide statistics for admin', async () => {
            RepairRequest.countDocuments.mockResolvedValue(10);
            RecycleRequest.countDocuments.mockResolvedValue(5);
            
            RepairRequest.aggregate.mockResolvedValue([
                { _id: 1, count: 2 }, // Jan
            ]);
            RecycleRequest.aggregate.mockResolvedValue([]);

            const response = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${mockAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.kpis).toHaveProperty('totalRepairs', 10);
            expect(response.body.kpis).toHaveProperty('totalRecycling', 5);
            expect(response.body).toHaveProperty('trendData');
            expect(Array.isArray(response.body.trendData)).toBe(true);
        });

        it('should block non-admin users from stats', async () => {
            const customerToken = generateTestToken('user-123', 'customer');
            
            const response = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('Admin');
        });
    });

    describe('GET /api/admin/report', () => {
        it('should generate a combined report with chart data', async () => {
            RepairRequest.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([{ productName: 'Repair Item', _doc: { status: 'Pending' } }])
            });
            RecycleRequest.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([{ productName: 'Recycle Item', _doc: { status: 'Pending' } }])
            });

            const response = await request(app)
                .get('/api/admin/report')
                .set('Authorization', `Bearer ${mockAdminToken}`)
                .query({ startDate: '2026-01-01', endDate: '2026-12-31' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('list');
            expect(response.body).toHaveProperty('charts');
            expect(response.body.charts).toHaveProperty('barChart');
            expect(response.body.charts).toHaveProperty('pieChartRepairs');
        });
    });
});
