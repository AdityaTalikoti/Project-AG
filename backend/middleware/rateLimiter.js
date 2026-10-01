import rateLimit from 'express-rate-limit';

/**
 * Authentication Attempt Rate Limiter.
 * Protects login and signup endpoints against brute-force attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 authentication requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
  statusCode: 429,
});

/**
 * Sensitive Operations Rate Limiter.
 * Protects operations like logout-all and profile updates against abuse.
 */
export const sensitiveOpsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests for this operation. Please try again later.',
  },
  statusCode: 429,
});

/**
 * General API Rate Limiter.
 * Applied globally to /api/ endpoints to prevent DoS attacks while permitting legitimate user traffic.
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Permissive limit for regular application browsing
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many API requests from this IP. Please slow down.',
  },
  statusCode: 429,
});
