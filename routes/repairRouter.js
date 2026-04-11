import express from 'express';
import { 
    createRepairRequest, 
    getRepairRequestById, 
    getRepairRequests, 
    deleteRepairRequest, 
    updateRepairStatus,
    updateRepairRequest
} from '../controllers/repairController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, createRepairRequest);
router.get('/', authenticate, getRepairRequests);
router.get('/:id', authenticate, getRepairRequestById);
router.patch('/:id/status', authenticate, updateRepairStatus);
router.delete('/:id', authenticate, deleteRepairRequest);
router.patch('/:id', authenticate, updateRepairRequest);

export default router;
