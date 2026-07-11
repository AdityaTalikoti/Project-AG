/**
 * Centralized error handling middleware.
 * Ensures error responses conform to a unified standard JSON structure.
 */
export const errorHandler = (err, req, res, next) => {
  console.error('AI Centralized Error Handler:', err);

  const status = err.status || 500;
  const message = err.message || 'An internal server error occurred';

  res.status(status).json({
    success: false,
    message
  });
};
