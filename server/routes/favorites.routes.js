import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { listFavorites, addFavorite, removeFavorite } from '../controllers/favorite.controller.js';

export const favoritesRouter = Router();

favoritesRouter.use(authenticate);

favoritesRouter.get('/', listFavorites);
favoritesRouter.post('/', addFavorite);
favoritesRouter.delete('/:productId', removeFavorite);
