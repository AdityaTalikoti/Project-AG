import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// ── Cookie config ──
// NODE_ENV must be manually set to 'production' in your host's env vars — Railway does not
// auto-inject it. RAILWAY_ENVIRONMENT_NAME is provided automatically as a fallback.
const isProduction =
  process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT_NAME;

// SameSite must be 'none' (+ secure) when frontend and backend are on different registrable
// domains (e.g. Vercel frontend -> Railway backend), since 'lax' cookies are not sent on
// cross-site fetch/XHR calls. Only use 'lax' if both apps share a domain via COOKIE_DOMAIN.
const resolvedSameSite = isProduction
  ? (process.env.COOKIE_DOMAIN ? 'lax' : 'none')
  : 'lax';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction, // required whenever sameSite is 'none'; 'none' only occurs when isProduction is true
  sameSite: resolvedSameSite,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days default (overridden per-login below)
};

// If custom domains share same registrable domain (e.g. app.domain.com and api.domain.com),
// set COOKIE_DOMAIN=.domain.com in environment variables.
if (isProduction && process.env.COOKIE_DOMAIN) {
  cookieOptions.domain = process.env.COOKIE_DOMAIN;
}

// ── Helper: generate JWT ──
function signToken(user, expiresIn = '7d') {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name, picture: user.picture },
    process.env.JWT_SECRET,
    { expiresIn }
  );
}

// ==============================
// Email/Password Signup
// ==============================
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      // If the existing user signed up via Google and has no password,
      // allow them to add a password to enable manual login
      if (existingUser.googleId && !existingUser.password) {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        existingUser.password = hashedPassword;
        if (name.trim()) existingUser.name = name.trim();
        await existingUser.save();

        const token = signToken(existingUser);
        res.cookie('token', token, cookieOptions);
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

    // Set JWT cookie and return user
    const token = signToken(user);
    res.cookie('token', token, cookieOptions);
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
router.post('/login', async (req, res) => {
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

    // If user signed up via Google and hasn't set a password yet,
    // guide them to create one via the Sign Up tab
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

    // Set JWT cookie and return user — token expiry must match cookie maxAge
    const expiresIn = remember ? '30d' : '1d';
    const token = signToken(user, expiresIn);

    // Customize cookie options based on remember checkbox
    const loginCookieOptions = { ...cookieOptions };
    if (!remember) {
      delete loginCookieOptions.maxAge; // session cookie, cleared on browser close (JWT still caps at 1d)
    } else {
      loginCookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    res.cookie('token', token, loginCookieOptions);
    res.json({
      user: { _id: user._id, name: user.name, email: user.email, picture: user.picture },
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ==============================
// Google OAuth Callback
// ==============================
router.get('/google/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).json({ message: 'No authorization code received' });

  // 1. Determine redirect URI for code exchange dynamically or from env
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

  // 2. Determine target frontend URL for browser redirect
  let targetFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  if (state) {
    try {
      const decodedState = decodeURIComponent(state);
      const parsedStateUrl = new URL(decodedState);
      const stateHost = parsedStateUrl.hostname;
      const allowedHosts = ['localhost', '127.0.0.1'];
      if (process.env.FRONTEND_URL) {
        try {
          allowedHosts.push(new URL(process.env.FRONTEND_URL).hostname);
        } catch (_) {}
      }
      // Allow localhost, the configured FRONTEND_URL host, or any vercel.app domains
      const isAllowed = allowedHosts.includes(stateHost) || stateHost.endsWith('.vercel.app');
      if (isAllowed) {
        targetFrontendUrl = parsedStateUrl.origin;
      }
    } catch (e) {
      console.error('Invalid state URL in OAuth callback:', e.message);
    }
  }

  // Clean up targetFrontendUrl to prevent path double-redirects
  targetFrontendUrl = targetFrontendUrl.replace(/\/$/, '').replace(/\/auth$/, '');

  try {
    // 1️⃣ Exchange code → access token
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const accessToken = tokenRes.data.access_token;

    // 2️⃣ Fetch Google profile
    const profileRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { id: googleId, email, name, picture } = profileRes.data;

    // 3️⃣ Find or create user in MongoDB
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.create({ googleId, email, name, picture });
    } else {
      // Update profile data on each login
      user.name = name;
      user.email = email;
      user.picture = picture;
      await user.save();
    }

    // 4️⃣ Set JWT cookie directly and redirect to frontend home
    const token = signToken(user);
    res.cookie('token', token, cookieOptions);
    res.redirect(targetFrontendUrl);

  } catch (error) {
    console.error('Google OAuth error:', error.response?.data || error.message);
    res.redirect(`${targetFrontendUrl}/auth?error=oauth_failed`);
  }
});

// ==============================
// Set Cookie (for Google OAuth callback redirection via AJAX)
// ==============================
router.post('/set-cookie', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Verify token validity
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-__v');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Safely write HTTP-only cookie in direct AJAX POST context
    res.cookie('token', token, cookieOptions);
    res.json({
      success: true,
      user: { _id: user._id, name: user.name, email: user.email, picture: user.picture, phone: user.phone }
    });
  } catch (error) {
    console.error('Set cookie error:', error.message);
    res.status(401).json({ message: 'Invalid or expired token' });
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

    res.json({ success: true, message: 'Daily target updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ==============================
// Get current user (protected)
// ==============================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-__v');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ==============================
// Logout — clear cookie
// ==============================
router.post('/logout', (req, res) => {
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

export default router;