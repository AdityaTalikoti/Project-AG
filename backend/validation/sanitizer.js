import mongoose from 'mongoose';

/**
 * Validates whether a string is a valid 24-character hexadecimal MongoDB ObjectId.
 */
export function isValidObjectId(id) {
  if (!id || typeof id !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

/**
 * Middleware to validate req.params.id (or specified parameter) as a valid Mongoose ObjectId.
 */
export function validateParamObjectId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (id && !isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid identifier format for parameter '${paramName}'`,
      });
    }
    next();
  };
}

/**
 * Recursively strips keys starting with '$' or containing '.' from object inputs to prevent MongoDB query operator injection.
 */
export function sanitizeMongoInput(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeMongoInput);
  }

  const sanitized = {};
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      continue; // Skip operator injection keys
    }
    sanitized[key] = sanitizeMongoInput(obj[key]);
  }
  return sanitized;
}

/**
 * Express middleware to sanitize req.body, req.query, and req.params against Mongo query injection operators.
 */
export const mongoSanitizerMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeMongoInput(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeMongoInput(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeMongoInput(req.params);
  }
  next();
};
