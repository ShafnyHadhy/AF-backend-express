import express from 'express';
import {
    getDashboardStats,
    getAllRequestsReport,
    updateRequest,
    deleteRequest,
    getUsers,
    updateUserRole,
    toggleBlockUser,
    getProviders,
    getActivityLogs,
    getSettings,
    updateSettings
} from '../controllers/adminController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticate, isAdmin, getDashboardStats);
router.get('/report', authenticate, isAdmin, getAllRequestsReport);
router.put('/requests/:type/:id', authenticate, isAdmin, updateRequest);
router.delete('/requests/:type/:id', authenticate, isAdmin, deleteRequest);

// Users
router.get('/users', authenticate, isAdmin, getUsers);
router.put('/users/:id/role', authenticate, isAdmin, updateUserRole);
router.put('/users/:id/block', authenticate, isAdmin, toggleBlockUser);

// Providers
router.get('/providers', authenticate, isAdmin, getProviders);

// Activity Logs
router.get('/logs', authenticate, isAdmin, getActivityLogs);

// Settings
router.get('/settings', authenticate, isAdmin, getSettings);
router.put('/settings', authenticate, isAdmin, updateSettings);

export default router;
