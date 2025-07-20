import { Router } from 'express';
import {
    createOrder,
    getOrders,
    getOrderById,
} from '@/controllers/orderHandler';


const orderRoute = Router();


orderRoute.post('/', createOrder);
orderRoute.get('/', getOrders);
orderRoute.get('/:id', getOrderById);


export default orderRoute;
