import { Router } from 'express';
import { hasRole, isOwner } from '@/middlewares/authentication';
import {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendorRating,
  toggleVendorStatus,
} from '@/controllers/vendorHandler';

const vendorRoute = Router();

// Public routes
vendorRoute.get('/', getAllVendors);
vendorRoute.get('/:id', getVendorById);

// Protected routes - requiring base authentication
vendorRoute.post('/', hasRole('user'), createVendor);
vendorRoute.patch('/:id/rating', hasRole('user'), updateVendorRating);
vendorRoute.patch('/:id/toggle-status', isOwner, toggleVendorStatus);

export default vendorRoute;
