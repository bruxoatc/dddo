import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';

const extractToken = (req) => {
  const authHeader = req.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  return null;
};

export const authenticate = async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) {
    return next(new AppError('Autenticacao necessaria', 401));
  }

  try {
    const payload = verifyAccessToken(token);
    if (!payload.sid) {
      return next(new AppError('Sessao invalida, faca login novamente', 401));
    }

    const session = await prisma.session.findUnique({
      where: { id: payload.sid },
      include: { user: true }
    });

    if (!session || !session.user) {
      await prisma.session.deleteMany({ where: { id: payload.sid } }).catch(() => {});
      return next(new AppError('Sessao expirada, faca login novamente', 401));
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return next(new AppError('Sessao expirada, faca login novamente', 401));
    }

    const requestUserAgent = req.get('user-agent') ?? null;
    const requestIp = req.ip ?? null;

    if (session.userAgent && requestUserAgent && session.userAgent !== requestUserAgent) {
      await prisma.session.deleteMany({ where: { id: session.id } }).catch(() => {});
      return next(new AppError('Sessao revogada por outro dispositivo.', 401));
    }

    if (session.ipAddress && requestIp && session.ipAddress !== requestIp) {
      await prisma.session.deleteMany({ where: { id: session.id } }).catch(() => {});
      return next(new AppError('Sessao revogada por alteracao de rede.', 401));
    }

    req.user = session.user;
    req.session = session;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Autenticacao necessaria', 401));
  }
  if (!roles.includes(req.user.role)) {
    return next(new AppError('Voce nao tem permissao para executar esta acao', 403));
  }
  next();
};
