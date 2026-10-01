import crypto from 'crypto';

/**
 * Phase C.1 Anti-CSRF & Strict Trusted-Origin Verification Middleware.
 * Enforces exact-match origin validation (no broad *.vercel.app wildcards) and
 * double-submit CSRF cookie/header token validation for state-changing HTTP requests.
 */

function parseExactOrigin(urlStr) {
  if (!urlStr) return null;
  try {
    return new URL(urlStr).origin.toLowerCase();
  } catch (_) {
    return null;
  }
}

/**
 * Compares two strings in constant time to prevent timing attacks.
 */
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Compiles exact set of trusted origins from environment and defaults.
 */
export function getTrustedOrigins() {
  const origins = new Set([
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ]);

  if (process.env.FRONTEND_URL) {
    const configuredOrigin = parseExactOrigin(process.env.FRONTEND_URL);
    if (configuredOrigin) {
      origins.add(configuredOrigin);
    }
  }

  // Explicitly configured preview origins (comma-separated exact origins if needed)
  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',')
      .map((item) => parseExactOrigin(item.trim()))
      .filter(Boolean)
      .forEach((origin) => origins.add(origin));
  }

  return origins;
}

export const originVerification = (req, res, next) => {
  // 1. Read-only methods (GET, HEAD, OPTIONS) do not alter server state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // 2. Exempt Google OAuth callback from header anti-CSRF check (Google browser redirect)
  const isOAuthCallback =
    req.path === '/api/auth/google/callback' ||
    req.path === '/google/callback' ||
    (req.originalUrl && req.originalUrl.includes('/google/callback'));

  if (isOAuthCallback) {
    return next();
  }

  // 3. Strict Origin & Referer Validation (NO WILDCARDS)
  const originHeader = req.get('Origin');
  const refererHeader = req.get('Referer');
  const requestOrigin = originHeader
    ? parseExactOrigin(originHeader)
    : refererHeader
    ? parseExactOrigin(refererHeader)
    : null;

  const trustedOrigins = getTrustedOrigins();

  if (requestOrigin) {
    if (!trustedOrigins.has(requestOrigin)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Invalid request origin',
      });
    }
  } else if (process.env.NODE_ENV === 'production') {
    // In production, state-changing requests without Origin or Referer require custom header
    const customHeader = req.get('X-Requested-With') || req.get('X-CSRF-Token');
    if (!customHeader) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Missing origin or anti-CSRF request header',
      });
    }
  }

  // 4. Double-Submit CSRF Token Verification for state-changing requests
  const headerToken = req.get('X-CSRF-Token') || req.get('x-csrf-token');
  const cookieToken = req.cookies?._csrf;

  if (!headerToken) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Missing anti-CSRF token header',
    });
  }

  if (!cookieToken) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Missing anti-CSRF token cookie',
    });
  }

  if (!safeCompare(headerToken, cookieToken)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Anti-CSRF token mismatch',
    });
  }

  next();
};

/**
 * CSRF Token Generator & Cookie Setter helper.
 * Sets double-submit _csrf cookie and returns raw CSRF token.
 */
export const setCsrfCookie = (req, res) => {
  let token = req.cookies?._csrf;
  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
  }
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
  const resolvedSameSite = isProduction
    ? (process.env.COOKIE_DOMAIN ? 'lax' : 'none')
    : 'lax';

  res.cookie('_csrf', token, {
    httpOnly: false, // Non-httpOnly so frontend can read and send in X-CSRF-Token header
    secure: isProduction,
    sameSite: resolvedSameSite,
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  });
  return token;
};
