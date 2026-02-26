import express from 'express';
import { createRepairRequest, getRepairRequests, updateRepairStatus } from '../controllers/repairController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticate, createRepairRequest);
router.get('/', authenticate, getRepairRequests);
router.patch('/:id/status', authenticate, updateRepairStatus);

export default router;
