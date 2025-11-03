import { unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import { serializeUser } from '../utils/serializers.js';
import { updateProfileSchema } from '../validation/user.schema.js';
import { processAndStoreAvatar } from '../config/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

export const updateProfile = async (req, res, next) => {
  try {
    const payload = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: payload
    });

    res.json({
      success: true,
      user: serializeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Envie um arquivo de imagem', 400);
    }

    const { relativePath } = await processAndStoreAvatar(req.file.buffer);

    if (req.user.avatarUrl?.startsWith('/uploads/')) {
      const previousRelative = req.user.avatarUrl.replace(/^\/+/, '');
      const previous = join(projectRoot, previousRelative);
      await unlink(previous).catch(() => {});
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: `/${relativePath}` }
    });

    res.json({
      success: true,
      user: serializeUser(updated)
    });
  } catch (error) {
    next(error);
  }
};
