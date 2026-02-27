import express from 'express';
import { createRecycleRequest, getRecycleRequests, updateRecycleStatus } from '../controllers/recycleController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticate, createRecycleRequest);
router.get('/', authenticate, getRecycleRequests);
router.patch('/:id/status', authenticate, updateRecycleStatus);

export default router;
