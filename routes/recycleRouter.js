import express from 'express';
import { 
    createRecycleRequest, 
    getRecycleRequests, 
    getRecycleRequestById, 
    updateRecycleRequest, 
    deleteRecycleRequest, 
    updateRecycleStatus
} from '../controllers/recycleController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, createRecycleRequest);
router.get('/', authenticate, getRecycleRequests);
router.get('/:id', authenticate, getRecycleRequestById);
router.patch('/:id/status', authenticate, updateRecycleStatus);
router.patch('/:id', authenticate, updateRecycleRequest);
router.delete('/:id', authenticate, deleteRecycleRequest);

export default router;
