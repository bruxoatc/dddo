import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createOrderFromCart, listOrders, getOrder, cancelOrder } from '../controllers/order.controller.js';

export const ordersRouter = Router();

ordersRouter.use(authenticate);

ordersRouter.get('/', listOrders);
ordersRouter.post('/', createOrderFromCart);
ordersRouter.get('/:id', getOrder);
ordersRouter.post('/:id/cancel', cancelOrder);
