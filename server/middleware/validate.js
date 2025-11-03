import { AppError } from '../utils/app-error.js';

export const validateBody = (schema) => (req, _res, next) => {
  try {
    req.validatedBody = schema.parse(req.body);
    next();
  } catch (error) {
    next(new AppError('Dados inválidos', 422, error.flatten ? error.flatten() : error));
  }
};

export const validateQuery = (schema) => (req, _res, next) => {
  try {
    req.validatedQuery = schema.parse(req.query);
    next();
  } catch (error) {
    next(new AppError('Parâmetros inválidos', 400, error.flatten ? error.flatten() : error));
  }
};
