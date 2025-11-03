import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { serializeUser } from '../utils/serializers.js';
import { getAuthCookieOptions, clearAuthCookies } from '../utils/cookies.js';

const issueTokens = async (user, req, res) => {
  const { access: accessCookie, refresh: refreshCookie } = getAuthCookieOptions(req);
  const sessionId = randomUUID();
  const accessToken = generateAccessToken(user, sessionId);
  const refreshToken = generateRefreshToken(user, sessionId);
  const hashedRefresh = await bcrypt.hash(refreshToken, 10);

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      refreshToken: hashedRefresh,
      userAgent: req.get('user-agent') ?? null,
      ipAddress: req.ip ?? null,
      expiresAt: new Date(Date.now() + refreshCookie.maxAge)
    }
  });

  res.cookie('accessToken', accessToken, accessCookie);
  res.cookie('refreshToken', refreshToken, refreshCookie);

  return { accessToken, refreshToken, sessionId };
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.validatedBody;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('Ja existe uma conta com este e-mail.', 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash
      }
    });

    const tokens = await issueTokens(user, req, res);

    res.status(201).json({
      success: true,
      user: serializeUser(user),
      accessToken: tokens.accessToken
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Credenciais invalidas', 401);
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      throw new AppError('Credenciais invalidas', 401);
    }

    const tokens = await issueTokens(user, req, res);

    res.json({
      success: true,
      user: serializeUser(user),
      accessToken: tokens.accessToken
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res) => {
  res.json({
    success: true,
    user: serializeUser(req.user)
  });
};

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await prisma.session.deleteMany({ where: { id: payload.sid } });
      } catch {
        // token invalido ou expirado - ignorar
      }
    }

    clearAuthCookies(req, res);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    return next(new AppError('Refresh token ausente', 401));
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const { access: accessCookie, refresh: refreshCookie } = getAuthCookieOptions(req);

    const session = await prisma.session.findUnique({
      where: { id: payload.sid },
      include: { user: true }
    });

    if (!session || !session.user) {
      throw new AppError('Sessao expirada, faca login novamente', 401);
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      throw new AppError('Sessao expirada, faca login novamente', 401);
    }

    const requestUserAgent = req.get('user-agent') ?? null;
    const requestIp = req.ip ?? null;

    if (session.userAgent && requestUserAgent && session.userAgent !== requestUserAgent) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      throw new AppError('Detectamos acesso de outro dispositivo, faca login novamente.', 401);
    }

    if (session.ipAddress && requestIp && session.ipAddress !== requestIp) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      throw new AppError('Sessao revogada por alteracao de rede, faca login novamente.', 401);
    }

    const isSameToken = await bcrypt.compare(refreshToken, session.refreshToken);
    if (!isSameToken) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      throw new AppError('Sessao invalida, faca login novamente', 401);
    }

    const user = session.user;
    const newSessionId = randomUUID();
    const accessToken = generateAccessToken(user, newSessionId);
    const newRefreshToken = generateRefreshToken(user, newSessionId);
    const hashedRefresh = await bcrypt.hash(newRefreshToken, 10);
    const sessionExpiresAt = new Date(Date.now() + refreshCookie.maxAge);
    const persistedUserAgent = requestUserAgent ?? session.userAgent ?? null;
    const persistedIp = requestIp ?? session.ipAddress ?? null;

    await prisma.$transaction(async (tx) => {
      await tx.session.delete({ where: { id: session.id } });
      await tx.session.create({
        data: {
          id: newSessionId,
          userId: user.id,
          refreshToken: hashedRefresh,
          userAgent: persistedUserAgent,
          ipAddress: persistedIp,
          expiresAt: sessionExpiresAt
        }
      });
    });

    res.cookie('accessToken', accessToken, accessCookie);
    res.cookie('refreshToken', newRefreshToken, refreshCookie);

    res.json({
      success: true,
      accessToken,
      user: serializeUser(user)
    });
  } catch (error) {
    next(error);
  }
};
