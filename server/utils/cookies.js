import { URL } from 'url';
import { env } from '../config/env.js';

const BASE_APP_URL = (() => {
  try {
    return new URL(env.APP_URL);
  } catch {
    return null;
  }
})();

const extractOrigin = (req) => req.get?.('origin') ?? req.get?.('referer') ?? null;

const isSameOrigin = (req) => {
  if (!BASE_APP_URL) {
    return true;
  }
  const headerOrigin = extractOrigin(req);
  if (!headerOrigin) {
    return true;
  }
  try {
    const requestUrl = new URL(headerOrigin);
    return (
      requestUrl.protocol === BASE_APP_URL.protocol &&
      requestUrl.hostname === BASE_APP_URL.hostname &&
      (requestUrl.port || '') === (BASE_APP_URL.port || '')
    );
  } catch {
    return false;
  }
};

const buildCookieOptions = (req, base) => {
  const sameOrigin = isSameOrigin(req);
  return {
    ...base,
    sameSite: sameOrigin ? 'strict' : 'lax'
  };
};

export const getAuthCookieOptions = (req) => {
  const baseSecure = env.NODE_ENV === 'production';

  const access = buildCookieOptions(req, {
    httpOnly: true,
    secure: baseSecure,
    path: '/',
    maxAge: 15 * 60 * 1000
  });

  const refresh = buildCookieOptions(req, {
    httpOnly: true,
    secure: baseSecure,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return { access, refresh };
};

export const clearAuthCookies = (req, res) => {
  const { access, refresh } = getAuthCookieOptions(req);
  res.clearCookie('accessToken', {
    path: access.path,
    sameSite: access.sameSite,
    secure: access.secure
  });
  res.clearCookie('refreshToken', {
    path: refresh.path,
    sameSite: refresh.sameSite,
    secure: refresh.secure
  });
};
