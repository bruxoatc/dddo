import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../config/prisma.js';

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

export const optionalAuth = async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token);
    if (!payload.sid) {
      return next();
    }

    const session = await prisma.session.findUnique({
      where: { id: payload.sid },
      include: { user: true }
    });

    if (!session || !session.user) {
      await prisma.session.deleteMany({ where: { id: payload.sid } }).catch(() => {});
      return next();
    }

    const requestUserAgent = req.get('user-agent') ?? null;
    const requestIp = req.ip ?? null;

    if (session.userAgent && requestUserAgent && session.userAgent !== requestUserAgent) {
      await prisma.session.deleteMany({ where: { id: session.id } }).catch(() => {});
      return next();
    }

    if (session.ipAddress && requestIp && session.ipAddress !== requestIp) {
      await prisma.session.deleteMany({ where: { id: session.id } }).catch(() => {});
      return next();
    }

    req.user = session.user;
    req.session = session;
  } catch {
    // ignorar erros para optional auth
  }

  next();
};
