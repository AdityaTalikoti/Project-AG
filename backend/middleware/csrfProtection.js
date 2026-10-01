import crypto from 'crypto';

/**
 * Origin / Referer & CSRF Token Protection Middleware.
 * Validates request origin against trusted frontend origins on state-changing requests (POST, PUT, PATCH, DELETE).
 * Protects against cross-site request forgery without breaking cross-origin Vercel -> Render deployments or OAuth callbacks.
 */

function getDomainOrigin(urlStr) {
  try {
    return new URL(urlStr).origin;
  } catch (_) {
    return null;
  }
}

export const originVerification = (req, res, next) => {
  // Read-only methods (GET, HEAD, OPTIONS) do not alter server state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Exempt Google OAuth callback from origin header check (redirected by Google browser navigation)
  if (req.path === '/api/auth/google/callback' || req.path === '/google/callback' || req.originalUrl?.includes('/google/callback')) {
    return next();
  }

  const origin = req.get('Origin');
  const referer = req.get('Referer');
  const requestOrigin = origin || (referer ? getDomainOrigin(referer) : null);

  // Check for custom CSRF / AJAX header as additional validation
  const customHeader = req.get('X-Requested-With') || req.get('X-CSRF-Token');

  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ];

  if (process.env.FRONTEND_URL) {
    const configuredOrigin = getDomainOrigin(process.env.FRONTEND_URL);
    if (configuredOrigin) {
      allowedOrigins.push(configuredOrigin);
    }
  }

  if (requestOrigin) {
    const isAllowed =
      allowedOrigins.includes(requestOrigin) ||
      requestOrigin.endsWith('.vercel.app');

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Invalid request origin',
      });
    }
  } else if (!customHeader && process.env.NODE_ENV === 'production') {
    // In production, require either Origin/Referer or custom X-Requested-With/X-CSRF-Token header for state-changing requests
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Missing origin or anti-CSRF request header',
    });
  }

  next();
};

/**
 * CSRF Token Generator & Cookie Setter helper
 */
export const setCsrfCookie = (req, res) => {
  let token = req.cookies?._csrf;
  if (!token) {
    token = crypto.randomBytes(16).toString('hex');
  }
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
  const resolvedSameSite = isProduction
    ? (process.env.COOKIE_DOMAIN ? 'lax' : 'none')
    : 'lax';

  res.cookie('_csrf', token, {
    httpOnly: false, // Non-httpOnly so client JS can read and send in X-CSRF-Token header if needed
    secure: isProduction,
    sameSite: resolvedSameSite,
    maxAge: 24 * 60 * 60 * 1000,
  });
  return token;
};
