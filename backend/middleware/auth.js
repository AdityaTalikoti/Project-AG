import crypto from 'crypto';
import Session from '../models/Session.js';
import User from '../models/User.js';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Server-Side Session Auth Middleware.
 * Reads session token from HTTP-only cookie, verifies session validity & expiration in MongoDB,
 * re-verifies user existence, updates activity metadata, and attaches req.user.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const rawToken = req.cookies?.token;

    if (!rawToken) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const tokenHash = hashToken(rawToken);

    // 1. Query server-side session
    const session = await Session.findOne({ tokenHash });

    if (!session || !session.isValid || session.revokedAt) {
      return res.status(401).json({ message: 'Session expired or invalid' });
    }

    // 2. Server-side expiration check
    if (new Date(session.expiresAt) < new Date()) {
      session.isValid = false;
      await session.save().catch(() => {});
      return res.status(401).json({ message: 'Session expired' });
    }

    // 3. User existence and status re-verification
    const user = await User.findById(session.userId).select('-password -otp_code -otp_expiry -__v');

    if (!user) {
      session.isValid = false;
      await session.save().catch(() => {});
      return res.status(401).json({ message: 'User account no longer exists' });
    }

    // 4. Update lastActivityAt metadata (throttled to 5 min intervals)
    const now = new Date();
    if (now - new Date(session.lastActivityAt || 0) > 5 * 60 * 1000) {
      session.lastActivityAt = now;
      await session.save().catch(() => {});
    }

    // 5. Attach user identity to req.user (preserving req.user.id contract)
    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
    };
    req.session = session;

    next();
  } catch (err) {
    console.error('Session authentication error:', err.message);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

export default authMiddleware;
