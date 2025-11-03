import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';

export const notFoundHandler = (_req, _res, next) => {
  next(new AppError('Recurso não encontrado', 404));
};

export const errorHandler = (err, _req, res, _next) => {
  const status = err instanceof AppError ? err.statusCode : 500;
  logger.error({ err }, 'Unhandled error');
  const response = {
    success: false,
    message: err.message || 'Erro interno no servidor'
  };

  if (err.details) {
    response.details = err.details;
  }

  if (env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};


