import express from 'express';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import Session from '../models/Session.js';
import authMiddleware from '../middleware/auth.js';
import { authLimiter, sensitiveOpsLimiter } from '../middleware/rateLimiter.js';
import { setCsrfCookie } from '../middleware/csrfProtection.js';

const router = express.Router();

// ── Cookie config ──
const isProduction =
  process.env.NODE_ENV === 'production' || !!process.env.RENDER;

const resolvedSameSite = isProduction
  ? (process.env.COOKIE_DOMAIN ? 'lax' : 'none')
  : 'lax';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: resolvedSameSite,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

if (isProduction && process.env.COOKIE_DOMAIN) {
  cookieOptions.domain = process.env.COOKIE_DOMAIN;
}

// ── Session Helpers ──
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createServerSession(user, req, remember = false) {
  const rawToken = generateSessionToken();
  const tokenHash = hashToken(rawToken);

  const durationDays = remember ? 30 : 1;
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  const userAgent = (req.get('User-Agent') || '').substring(0, 255);
  const ipAddress = req.ip || req.socket?.remoteAddress || '';

  await Session.create({
    userId: user._id,
    tokenHash,
    userAgent,
    ipAddress,
    isValid: true,
    expiresAt,
    lastActivityAt: new Date(),
  });

  return { rawToken, durationDays };
}

// ==============================
// CSRF Token Endpoint
// ==============================
router.get('/csrf-token', (req, res) => {
  const csrfToken = setCsrfCookie(req, res);
  res.json({ success: true, csrfToken });
});

// ==============================
// Email/Password Signup
// ==============================
router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const pwRegex = /^(?=.*[A-Z])(?=.*[$@!%*?&]).{8,}$/;
    if (!pwRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter and one special character ($@!%*?&)',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      // If existing user signed up via Google and has no password, allow setting a password
      if (existingUser.googleId && !existingUser.password) {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        existingUser.password = hashedPassword;
        if (name.trim()) existingUser.name = name.trim();
        await existingUser.save();

        const { rawToken, durationDays } = await createServerSession(existingUser, req, true);
        const loginCookieOptions = { ...cookieOptions, maxAge: durationDays * 24 * 60 * 60 * 1000 };
        res.cookie('token', rawToken, loginCookieOptions);
        setCsrfCookie(req, res);
        return res.status(200).json({
          user: { _id: existingUser._id, name: existingUser.name, email: existingUser.email, picture: existingUser.picture },
        });
      }
      return res.status(409).json({ message: 'User already exists. Please sign in instead.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone ? phone.trim() : undefined,
    });

    // Create server session & set HTTP-only cookie
    const { rawToken, durationDays } = await createServerSession(user, req, true);
    const loginCookieOptions = { ...cookieOptions, maxAge: durationDays * 24 * 60 * 60 * 1000 };
    res.cookie('token', rawToken, loginCookieOptions);
    setCsrfCookie(req, res);

    res.status(201).json({
      user: { _id: user._id, name: user.name, email: user.email, picture: user.picture, phone: user.phone },
    });

  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// ==============================
// Email/Password Login
// ==============================
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password, remember } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email. Please sign up first.' });
    }

    if (!user.password) {
      return res.status(400).json({
        message: 'No password set for this account. Please use the Sign Up tab to create a password, or continue with Google.',
        code: 'NO_PASSWORD_SET',
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create server-side session
    const { rawToken, durationDays } = await createServerSession(user, req, remember);

    const loginCookieOptions = { ...cookieOptions };
    if (!remember) {
      delete loginCookieOptions.maxAge; // Session cookie cleared on browser exit
    } else {
      loginCookieOptions.maxAge = durationDays * 24 * 60 * 60 * 1000;
    }

    res.cookie('token', rawToken, loginCookieOptions);
    setCsrfCookie(req, res);
    res.json({
      user: { _id: user._id, name: user.name, email: user.email, picture: user.picture },
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ==============================
// Google OAuth Initiation
// ==============================
router.get('/google', authLimiter, (req, res) => {
  try {
    // 1. Generate cryptographically secure state token (256 bits entropy)
    const state = crypto.randomBytes(32).toString('hex');

    // 2. Store state token in short-lived HTTP-only cookie
    const stateCookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: resolvedSameSite,
      maxAge: 10 * 60 * 1000, // 10 minutes
    };
    if (isProduction && process.env.COOKIE_DOMAIN) {
      stateCookieOptions.domain = process.env.COOKIE_DOMAIN;
    }
    res.cookie('oauth_state', state, stateCookieOptions);

    // 3. Construct Google authorization URL
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error('Google OAuth Error: GOOGLE_CLIENT_ID environment variable is missing');
      return res.status(500).json({ message: 'Google OAuth configuration error' });
    }

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&state=${encodeURIComponent(state)}` +
      `&prompt=select_account`;

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ success: true, url: googleAuthUrl });
    }

    res.redirect(googleAuthUrl);
  } catch (error) {
    console.error('Google OAuth initiation error:', error.message);
    res.status(500).json({ message: 'Failed to initiate Google OAuth' });
  }
});

// ==============================
// Google OAuth Callback
// ==============================
router.get('/google/callback', async (req, res) => {
  const { code, state, error: providerError } = req.query;
  const savedState = req.cookies?.oauth_state;

  let targetFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  targetFrontendUrl = targetFrontendUrl.replace(/\/$/, '').replace(/\/auth$/, '');

  // Clear oauth_state cookie immediately after reading to prevent replay
  const clearStateCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: resolvedSameSite,
  };
  if (isProduction && process.env.COOKIE_DOMAIN) {
    clearStateCookieOptions.domain = process.env.COOKIE_DOMAIN;
  }
  res.clearCookie('oauth_state', clearStateCookieOptions);

  // Handle provider errors or cancellations
  if (providerError) {
    return res.redirect(`${targetFrontendUrl}/auth?error=access_denied`);
  }

  if (!code) {
    return res.redirect(`${targetFrontendUrl}/auth?error=missing_code`);
  }

  // Validate cryptographic OAuth state
  if (!state || !savedState) {
    console.error('OAuth Callback Error: Missing state or savedState');
    return res.redirect(`${targetFrontendUrl}/auth?error=invalid_state`);
  }

  const isStateValid =
    state.length === savedState.length &&
    crypto.timingSafeEqual(Buffer.from(state), Buffer.from(savedState));

  if (!isStateValid) {
    console.error('OAuth Callback Error: State mismatch');
    return res.redirect(`${targetFrontendUrl}/auth?error=state_mismatch`);
  }

  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

  try {
    // 1. Code exchange for access token
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const accessToken = tokenRes.data.access_token;

    // 2. Fetch user profile from Google
    const profileRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { id: googleId, email, name, picture, verified_email } = profileRes.data;

    if (!email) {
      return res.redirect(`${targetFrontendUrl}/auth?error=no_email_provided`);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 3. Account Lookup & Safe Account Linking
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if account with same email already exists
      user = await User.findOne({ email: normalizedEmail });

      if (user) {
        // Safe account linking: Link googleId to existing account if Google email is verified
        if (verified_email !== false) {
          user.googleId = googleId;
          if (name && !user.name) user.name = name;
          if (picture && !user.picture) user.picture = picture;
          await user.save();
        } else {
          console.error('OAuth Safety Warning: Unverified Google email attempted account linking');
          return res.redirect(`${targetFrontendUrl}/auth?error=unverified_email`);
        }
      } else {
        // Create new user account
        user = await User.create({
          googleId,
          email: normalizedEmail,
          name: name || 'Google User',
          picture: picture || '',
        });
      }
    } else {
      // Update existing Google user profile metadata
      if (name) user.name = name;
      user.email = normalizedEmail;
      if (picture) user.picture = picture;
      await user.save();
    }

    // 4. Create MongoDB server-side session & set HTTP-only cookie
    const { rawToken, durationDays } = await createServerSession(user, req, true);
    const loginCookieOptions = { ...cookieOptions, maxAge: durationDays * 24 * 60 * 60 * 1000 };
    res.cookie('token', rawToken, loginCookieOptions);
    setCsrfCookie(req, res);

    res.redirect(targetFrontendUrl);

  } catch (error) {
    console.error('Google OAuth callback error:', error.message);
    res.redirect(`${targetFrontendUrl}/auth?error=oauth_failed`);
  }
});

// ==============================
// Update daily target (protected)
// ==============================
router.put('/daily-target', authMiddleware, async (req, res) => {
  try {
    const { dailyTarget } = req.body;
    if (dailyTarget === undefined || typeof dailyTarget !== 'number' || dailyTarget <= 0) {
      return res.status(400).json({ message: 'Invalid daily target. Must be a positive number of minutes.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.dailyTarget = dailyTarget;
    await user.save();

    const sanitizedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      phone: user.phone,
      role: user.role,
      dailyTarget: user.dailyTarget,
    };

    res.json({ success: true, message: 'Daily target updated successfully', user: sanitizedUser });
  } catch (error) {
    console.error('Daily target update error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==============================
// Get current user (protected)
// ==============================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp_code -otp_expiry -__v');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==============================
// Logout — revoke server-side session & clear cookie
// ==============================
router.post('/logout', async (req, res) => {
  try {
    const rawToken = req.cookies?.token;
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await Session.updateOne(
        { tokenHash },
        { $set: { isValid: false, revokedAt: new Date() } }
      );
    }
  } catch (error) {
    console.error('Logout revocation error:', error.message);
  }

  const clearCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: resolvedSameSite,
  };
  if (isProduction && process.env.COOKIE_DOMAIN) {
    clearCookieOptions.domain = process.env.COOKIE_DOMAIN;
  }
  res.clearCookie('token', clearCookieOptions);
  res.json({ message: 'Logged out' });
});

// ==============================
// Logout from all devices (protected)
// ==============================
router.post('/logout-all', authMiddleware, sensitiveOpsLimiter, async (req, res) => {
  try {
    await Session.updateMany(
      { userId: req.user.id, isValid: true },
      { $set: { isValid: false, revokedAt: new Date() } }
    );

    const clearCookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: resolvedSameSite,
    };
    if (isProduction && process.env.COOKIE_DOMAIN) {
      clearCookieOptions.domain = process.env.COOKIE_DOMAIN;
    }
    res.clearCookie('token', clearCookieOptions);

    res.json({ success: true, message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error('Logout-all error:', error.message);
    res.status(500).json({ message: 'Server error during logout-all' });
  }
});

export default router;