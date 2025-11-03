import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { addCartItemSchema, updateCartItemSchema } from '../validation/cart.schema.js';
import { addToCart, getCart, updateCartItem, removeCartItem, clearCart } from '../controllers/cart.controller.js';

export const cartRouter = Router();

cartRouter.use(authenticate);

cartRouter.get('/', getCart);
cartRouter.post('/', validateBody(addCartItemSchema), addToCart);
cartRouter.patch('/:id', validateBody(updateCartItemSchema), updateCartItem);
cartRouter.delete('/:id', removeCartItem);
cartRouter.delete('/', clearCart);
