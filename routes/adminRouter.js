import express from 'express';
import { getDashboardStats, getAllRequestsReport, updateRequest, deleteRequest } from '../controllers/adminController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticate, isAdmin, getDashboardStats);
router.get('/report', authenticate, isAdmin, getAllRequestsReport);
router.put('/requests/:type/:id', authenticate, isAdmin, updateRequest);
router.delete('/requests/:type/:id', authenticate, isAdmin, deleteRequest);

export default router;
