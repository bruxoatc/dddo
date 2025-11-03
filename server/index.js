import './config/env.js';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import pinoHttp from 'pino-http';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { router as apiRouter } from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';
import { prisma } from './config/prisma.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const app = express();

app.set('trust proxy', 1);

const corsOptions = {
  origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
  credentials: true
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(pinoHttp({ logger }));
const jsonParser = express.json({ limit: '1mb' });
const urlencodedParser = express.urlencoded({ extended: true });

app.use('/api/webhooks', express.raw({ type: '*/*' }));
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/webhooks')) {
    return next();
  }
  jsonParser(req, res, next);
});
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/webhooks')) {
    return next();
  }
  urlencodedParser(req, res, next);
});
app.use(cookieParser(env.SESSION_COOKIE_SECRET));
app.use('/uploads', express.static(join(rootDir, 'server', 'uploads')));


const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/webhooks')) {
    return next();
  }
  return limiter(req, res, next);
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.APP_PORT, () => {
  logger.info({ port: env.APP_PORT }, 'API pronta');
});

const shutdown = async () => {
  logger.info('Encerrando servidor...');
  server.close(async () => {
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);






