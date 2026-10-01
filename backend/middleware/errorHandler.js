/**
 * Centralized error handling middleware.
 * Ensures error responses conform to a unified standard JSON structure without exposing internal details in production.
 */
export const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;

  // Log error message safely on server
  console.error('Centralized Error Handler:', err.message || err);

  const status = err.status || err.statusCode || 500;
  let message = err.message || 'An internal server error occurred';

  // Sanitize 500 internal errors in production to avoid leaking database or stack details
  if (isProduction && status === 500) {
    message = 'An internal server error occurred';
  }

  res.status(status).json({
    success: false,
    message,
  });
};
