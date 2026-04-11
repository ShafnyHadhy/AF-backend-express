import express from 'express';
import { 
    createRepairRequest, 
    getRepairRequestById, 
    getRepairRequests, 
    updateRepairRequest, 
    deleteRepairRequest 
} from '../controllers/repairController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, createRepairRequest);
router.get('/', authenticate, getRepairRequests);
router.get('/:id', authenticate, getRepairRequestById);
router.patch('/:id', authenticate, updateRepairRequest);
router.delete('/:id', authenticate, deleteRepairRequest);

export default router;
