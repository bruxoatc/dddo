import { Router } from 'express';
import { optionalAuth } from '../middleware/optional-auth.js';
import { authenticate } from '../middleware/auth.js';
import { createSupportTicket, listUserTickets } from '../controllers/support.controller.js';

export const supportRouter = Router();

supportRouter.post('/tickets', optionalAuth, createSupportTicket);
supportRouter.get('/tickets', authenticate, listUserTickets);
