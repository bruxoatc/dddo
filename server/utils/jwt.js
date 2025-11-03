import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './app-error.js';

const signToken = (payload, secret, options) =>
  jwt.sign(payload, secret, options);

export const generateAccessToken = (user, sessionId) => {
  return signToken(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      sid: sessionId
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

export const generateRefreshToken = (user, sessionId) => {
  return signToken(
    {
      sub: user.id,
      sid: sessionId
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch {
    throw new AppError('Sessão inválida ou expirada', 401);
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Sessão expirada, faça login novamente', 401);
  }
};
