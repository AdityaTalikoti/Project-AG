import jwt from 'jsonwebtoken';

/**
 * JWT auth middleware — verifies token from HTTP-only cookie.
 * Attaches decoded user to req.user.
 */
const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('Authentication Error: JWT_SECRET environment variable is missing');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token expired or invalid' });
  }
};

export default authMiddleware;
