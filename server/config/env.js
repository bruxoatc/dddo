import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_PORT: z.coerce.number().default(4000),
  APP_URL: z.string().default('http://localhost:4000'),
  CORS_ORIGIN: z.string().default('*'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET deve ter ao menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET deve ter ao menos 32 caracteres'),
  SESSION_COOKIE_SECRET: z.string().min(16, 'SESSION_COOKIE_SECRET deve ter ao menos 16 caracteres'),
  AVATAR_STORAGE_BUCKET: z.string().optional(),
  AVATAR_STORAGE_REGION: z.string().optional(),
  AVATAR_STORAGE_ACCESS_KEY: z.string().optional(),
  AVATAR_STORAGE_SECRET_KEY: z.string().optional(),
  PIX_WEBHOOK_SECRET: z.string().optional(),
  PAGSEGURO_WEBHOOK_SECRET: z.string().optional()
});

export const env = envSchema.parse(process.env);
