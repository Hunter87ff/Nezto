import { Router } from 'express';
import authRoute from '@/routes/authRoute';
import laundryRoute from './vendorRoutes';
import orderRoute from './orderRoute';
import userRoute from './userRoute';
import serviceRoute from './serviceRoute';
import { set_cookie } from '../utils/helpers';
import { google_auth_url } from '@/config';

export const allRoutes = Router();

allRoutes.get('/', (req, res) => {
  if (req.query.test === '1') {
    set_cookie(req, res, 'token', 'test-secure');
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ message: google_auth_url(req) });
});

allRoutes.use('/auth', authRoute);
allRoutes.use('/vendors', laundryRoute);
allRoutes.use('/orders', orderRoute);
allRoutes.use('/users', userRoute);
allRoutes.use('/services', serviceRoute);
