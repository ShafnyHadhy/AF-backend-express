import express from 'express';
import { createRepairRequest, getRepairRequestById, getRepairRequests, updateRepairStatus } from '../controllers/repairController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, createRepairRequest);
router.get('/', authenticate, getRepairRequests);
router.patch('/:id/status', authenticate, updateRepairStatus);
router.get('/:id', authenticate, getRepairRequestById);

export default router;
