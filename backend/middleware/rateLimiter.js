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

/**
 * Forgot Password Request Rate Limiter.
 * Prevents reset-request abuse and email flooding.
 */
export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests from this IP. Please try again after 15 minutes.',
  },
  statusCode: 429,
});

/**
 * OTP Verification Rate Limiter.
 * Protects against OTP brute-force attacks.
 */
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP verification attempts from this IP. Please try again after 15 minutes.',
  },
  statusCode: 429,
});

/**
 * Password Reset Completion Rate Limiter.
 * Protects reset submission endpoint against brute force or replay.
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset attempts from this IP. Please try again after 15 minutes.',
  },
  statusCode: 429,
});
