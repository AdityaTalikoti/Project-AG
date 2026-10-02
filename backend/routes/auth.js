import express from 'express';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import Session from '../models/Session.js';
import authMiddleware from '../middleware/auth.js';
import {
  authLimiter,
  sensitiveOpsLimiter,
  forgotPasswordLimiter,
  otpVerifyLimiter,
  passwordResetLimiter,
} from '../middleware/rateLimiter.js';
import { setCsrfCookie } from '../middleware/csrfProtection.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { parseUserAgent } from '../utils/userAgentParser.js';
import { isValidObjectId } from '../validation/sanitizer.js';

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

// ==============================
// 1. Request Password Reset OTP
// ==============================
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // Generate 6-digit cryptographically secure OTP
      const otp = crypto.randomInt(100000, 1000000).toString();

      // Salted HMAC-SHA256 hash of OTP for storage (never store plaintext OTP)
      const otpSalt = user._id.toString() + (process.env.SESSION_SECRET || 'scholarsync-otp-salt');
      const otpHash = crypto.createHmac('sha256', otpSalt).update(otp).digest('hex');

      user.otp_code = otpHash;
      user.otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      user.otp_attempts = 0;
      await user.save();

      // Dispatch verification email (never logs or returns OTP code)
      await sendPasswordResetEmail(user.email, otp);
    } else {
      // Account enumeration defense: safe timing delay
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Always return safe, consistent response (account enumeration protection)
    setCsrfCookie(req, res);
    res.json({
      success: true,
      message: 'If an account exists with this email, a verification code has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ message: 'Server error processing password reset request' });
  }
});

// ==============================
// 2. Verify Password Reset OTP
// ==============================
router.post('/verify-otp', otpVerifyLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp || typeof otp !== 'string' || otp.trim().length !== 6) {
      return res.status(400).json({ message: 'Valid email and 6-digit verification code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    const safeErrorResponse = () =>
      res.status(400).json({ message: 'Invalid or expired verification code' });

    if (!user || !user.otp_code || !user.otp_expiry) {
      return safeErrorResponse();
    }

    // Check expiration
    if (new Date(user.otp_expiry) < new Date()) {
      user.otp_code = undefined;
      user.otp_expiry = undefined;
      user.otp_attempts = 0;
      await user.save();
      return safeErrorResponse();
    }

    // Check brute-force attempts
    if ((user.otp_attempts || 0) >= 5) {
      user.otp_code = undefined;
      user.otp_expiry = undefined;
      user.otp_attempts = 0;
      await user.save();
      return res.status(400).json({
        message: 'Too many invalid attempts. Please request a new verification code.',
      });
    }

    // Verify OTP hash with constant-time comparison
    const otpSalt = user._id.toString() + (process.env.SESSION_SECRET || 'scholarsync-otp-salt');
    const expectedHash = crypto.createHmac('sha256', otpSalt).update(otp.trim()).digest('hex');

    const isMatch =
      user.otp_code.length === expectedHash.length &&
      crypto.timingSafeEqual(Buffer.from(user.otp_code), Buffer.from(expectedHash));

    if (!isMatch) {
      user.otp_attempts = (user.otp_attempts || 0) + 1;
      if (user.otp_attempts >= 5) {
        user.otp_code = undefined;
        user.otp_expiry = undefined;
        user.otp_attempts = 0;
      }
      await user.save();
      return safeErrorResponse();
    }

    // Single-use OTP: Invalidate OTP immediately upon successful verification
    user.otp_code = undefined;
    user.otp_expiry = undefined;
    user.otp_attempts = 0;

    // Generate single-use reset token (32 random bytes)
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    user.reset_token_hash = resetTokenHash;
    user.reset_token_expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // Store reset token in HttpOnly, Secure cookie (never in localStorage/URLs)
    const resetCookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: resolvedSameSite,
      maxAge: 15 * 60 * 1000, // 15 minutes
    };
    if (isProduction && process.env.COOKIE_DOMAIN) {
      resetCookieOptions.domain = process.env.COOKIE_DOMAIN;
    }
    res.cookie('reset_token', rawResetToken, resetCookieOptions);
    setCsrfCookie(req, res);

    res.json({
      success: true,
      message: 'Verification code confirmed. You may now reset your password.',
    });
  } catch (error) {
    console.error('OTP verification error:', error.message);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// ==============================
// 3. Complete Password Reset
// ==============================
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const rawResetToken = req.cookies?.reset_token || req.body?.resetToken;

    const clearResetCookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: resolvedSameSite,
    };
    if (isProduction && process.env.COOKIE_DOMAIN) {
      clearResetCookieOptions.domain = process.env.COOKIE_DOMAIN;
    }

    if (!rawResetToken || typeof rawResetToken !== 'string') {
      res.clearCookie('reset_token', clearResetCookieOptions);
      return res.status(400).json({
        message: 'Invalid or expired password reset session. Please request a new verification code.',
      });
    }

    // Password strength validation
    const pwRegex = /^(?=.*[A-Z])(?=.*[$@!%*?&]).{8,}$/;
    if (!newPassword || !pwRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters long and contain at least one uppercase letter and one special character ($@!%*?&)',
      });
    }

    // Query user by reset token hash
    const resetTokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');
    const user = await User.findOne({ reset_token_hash: resetTokenHash });

    if (!user || !user.reset_token_expiry || new Date(user.reset_token_expiry) < new Date()) {
      res.clearCookie('reset_token', clearResetCookieOptions);
      if (user) {
        user.reset_token_hash = undefined;
        user.reset_token_expiry = undefined;
        await user.save();
      }
      return res.status(400).json({
        message: 'Invalid or expired password reset session. Please request a new verification code.',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;

    // Single-use token: invalidate reset token immediately
    user.reset_token_hash = undefined;
    user.reset_token_expiry = undefined;
    await user.save();

    // Clear reset token cookie
    res.clearCookie('reset_token', clearResetCookieOptions);

    // SESSION INVALIDATION: Invalidate all previous server-side sessions for this user
    await Session.updateMany(
      { userId: user._id, isValid: true },
      { $set: { isValid: false, revokedAt: new Date() } }
    );

    setCsrfCookie(req, res);
    res.json({
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.',
    });
  } catch (error) {
    console.error('Password reset error:', error.message);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// ==============================
// 4. Authenticated Password Change (Protected)
// ==============================
router.post('/change-password', authMiddleware, sensitiveOpsLimiter, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.password) {
      return res.status(400).json({
        message: 'This account was created with Google OAuth and has no password set.',
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Validate new password strength
    const pwRegex = /^(?=.*[A-Z])(?=.*[$@!%*?&]).{8,}$/;
    if (!pwRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters long and contain at least one uppercase letter and one special character ($@!%*?&)',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // SESSION INVALIDATION: Invalidate all OTHER sessions for this user, keeping current active
    if (req.session?.tokenHash) {
      await Session.updateMany(
        { userId: user._id, tokenHash: { $ne: req.session.tokenHash }, isValid: true },
        { $set: { isValid: false, revokedAt: new Date() } }
      );
    }

    setCsrfCookie(req, res);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

// ==============================
// Session Management: List Active Sessions (Protected)
// ==============================
router.get('/sessions', authMiddleware, sensitiveOpsLimiter, async (req, res) => {
  try {
    const activeSessions = await Session.find({
      userId: req.user.id,
      isValid: true,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ lastActivityAt: -1 });

    const currentSessionId = req.session?._id?.toString();

    const safeSessions = activeSessions.map((s) => {
      const isCurrent = s._id.toString() === currentSessionId;
      const parsed = parseUserAgent(s.userAgent);
      return {
        id: s._id.toString(),
        userAgent: s.userAgent,
        deviceDisplay: parsed.display,
        browser: parsed.browser,
        os: parsed.os,
        deviceType: parsed.deviceType,
        ipAddress: s.ipAddress || 'Unknown IP',
        isCurrent,
        createdAt: s.createdAt,
        lastActivityAt: s.lastActivityAt,
        expiresAt: s.expiresAt,
      };
    });

    setCsrfCookie(req, res);
    res.json({ success: true, sessions: safeSessions });
  } catch (error) {
    console.error('List sessions error:', error.message);
    res.status(500).json({ message: 'Server error listing active sessions' });
  }
});

// ==============================
// Session Management: Revoke One Session (Protected)
// ==============================
router.delete('/sessions/:sessionId', authMiddleware, sensitiveOpsLimiter, async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId || !isValidObjectId(sessionId)) {
      return res.status(400).json({ message: 'Invalid session identifier' });
    }

    // IDOR Protection: Query by _id AND userId to prevent revoking another user's session
    const sessionToRevoke = await Session.findOne({
      _id: sessionId,
      userId: req.user.id,
      isValid: true,
    });

    if (!sessionToRevoke) {
      return res.status(404).json({ message: 'Session not found or already revoked' });
    }

    sessionToRevoke.isValid = false;
    sessionToRevoke.revokedAt = new Date();
    await sessionToRevoke.save();

    // If user is revoking their own current session, clear auth cookie
    const currentSessionId = req.session?._id?.toString();
    if (sessionId === currentSessionId) {
      const clearCookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: resolvedSameSite,
      };
      if (isProduction && process.env.COOKIE_DOMAIN) {
        clearCookieOptions.domain = process.env.COOKIE_DOMAIN;
      }
      res.clearCookie('token', clearCookieOptions);
    }

    setCsrfCookie(req, res);
    res.json({ success: true, message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Revoke session error:', error.message);
    res.status(500).json({ message: 'Server error revoking session' });
  }
});

// ==============================
// Session Management: Revoke Other Sessions (Protected)
// ==============================
router.post('/sessions/revoke-others', authMiddleware, sensitiveOpsLimiter, async (req, res) => {
  try {
    const currentSessionId = req.session?._id;

    if (!currentSessionId) {
      return res.status(400).json({ message: 'Current session context not found' });
    }

    await Session.updateMany(
      {
        userId: req.user.id,
        _id: { $ne: currentSessionId },
        isValid: true,
      },
      {
        $set: { isValid: false, revokedAt: new Date() },
      }
    );

    setCsrfCookie(req, res);
    res.json({ success: true, message: 'All other sessions revoked successfully' });
  } catch (error) {
    console.error('Revoke other sessions error:', error.message);
    res.status(500).json({ message: 'Server error revoking other sessions' });
  }
});

export default router;