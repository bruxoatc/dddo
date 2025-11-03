import multer from 'multer';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const avatarsDir = join(__dirname, '..', 'uploads', 'avatars');

const ensureDir = async (dir) => {
  await mkdir(dir, { recursive: true });
};

const imageFilter = (_req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Envie um arquivo de imagem válido.'));
  } else {
    cb(null, true);
  }
};

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

export const processAndStoreAvatar = async (buffer) => {
  await ensureDir(avatarsDir);
  const filename = `${randomUUID()}.webp`;
  const filepath = join(avatarsDir, filename);

  const optimized = await sharp(buffer)
    .resize(256, 256, { fit: 'cover' })
    .webp({ quality: 85 })
    .toBuffer();

  await writeFile(filepath, optimized);

  return {
    filename,
    relativePath: `uploads/avatars/${filename}`
  };
};
