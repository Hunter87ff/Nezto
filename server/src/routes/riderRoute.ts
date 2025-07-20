import { Router } from 'express';
import {
    createRider,
    getRiders,
    getRiderById,
    updateRiderById,
    deleteRiderById,
    addPayoutToRider,
    updateRiderPayout,
    deleteRiderPayout,
    getRiderStats
} from '@/controllers/riderHandler';
import { hasRole, isAuthenticated } from '@/middlewares/authentication';

const riderRouter = Router();

// Administrative operations - Admin only
riderRouter.post('/', hasRole('admin'), createRider);
riderRouter.get('/', hasRole('admin'), getRiders);
riderRouter.delete('/:id', hasRole('admin'), deleteRiderById);

// Admin or Rider level operations
riderRouter.get('/:id', hasRole(), getRiderById);
riderRouter.patch('/:id', hasRole('admin'), updateRiderById);
riderRouter.get('/:id/stats', hasRole(), getRiderStats);

export default riderRouter;
