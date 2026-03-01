import express from 'express';
import { getDashboardStats, getAllRequestsReport, updateRequest, deleteRequest } from '../controllers/adminController.js';
import { authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', authorize(['admin']), getDashboardStats);
router.get('/report', authorize(['admin']), getAllRequestsReport);
router.put('/requests/:type/:id', authorize(['admin']), updateRequest);
router.delete('/requests/:type/:id', authorize(['admin']), deleteRequest);

export default router;
