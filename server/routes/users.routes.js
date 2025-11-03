import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { updateProfileSchema } from '../validation/user.schema.js';
import { updateProfile, uploadAvatar } from '../controllers/user.controller.js';
import { avatarUpload } from '../config/storage.js';

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.patch('/me', validateBody(updateProfileSchema), updateProfile);
usersRouter.post('/me/avatar', avatarUpload.single('avatar'), uploadAvatar);
