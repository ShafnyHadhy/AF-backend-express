import express from 'express';
import { createRecycleRequest, getRecycleRequestById, getRecycleRequests, updateRecycleStatus } from '../controllers/recycleController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, createRecycleRequest);
router.get('/', authenticate, getRecycleRequests);
router.patch('/:id/status', authenticate, updateRecycleStatus);
router.get('/:id', authenticate, getRecycleRequestById);

export default router;
