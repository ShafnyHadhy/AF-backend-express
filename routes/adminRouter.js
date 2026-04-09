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
import { authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', authorize(['admin']), getDashboardStats);
router.get('/report', authorize(['admin']), getAllRequestsReport);
router.put('/requests/:type/:id', authorize(['admin']), updateRequest);
router.delete('/requests/:type/:id', authorize(['admin']), deleteRequest);

// Users
router.get('/users', authorize(['admin']), getUsers);
router.put('/users/:id/role', authorize(['admin']), updateUserRole);
router.put('/users/:id/block', authorize(['admin']), toggleBlockUser);

// Providers
router.get('/providers', authorize(['admin']), getProviders);

// Activity Logs
router.get('/logs', authorize(['admin']), getActivityLogs);

// Settings
router.get('/settings', authorize(['admin']), getSettings);
router.put('/settings', authorize(['admin']), updateSettings);

export default router;
