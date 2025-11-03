import { Router } from 'express';
import { validateBody } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validation/auth.schema.js';
import { register, login, logout, refresh, me } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), register);
authRouter.post('/login', validateBody(loginSchema), login);
authRouter.post('/logout', logout);
authRouter.post('/refresh', refresh);
authRouter.get('/me', authenticate, me);
