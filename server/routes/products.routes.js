import { Router } from 'express';
import { listProducts, getProduct, getProductOptions, getCategories, getHighlights } from '../controllers/product.controller.js';
import { validateQuery } from '../middleware/validate.js';
import { listProductsQuerySchema } from '../validation/product.schema.js';

export const productsRouter = Router();

productsRouter.get('/', validateQuery(listProductsQuerySchema), listProducts);
productsRouter.get('/highlights', getHighlights);
productsRouter.get('/categories', getCategories);
productsRouter.get('/:id', getProduct);
productsRouter.get('/:id/options', getProductOptions);
