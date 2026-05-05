import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// ── Cookie config ──
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ── Helper: generate JWT ──
function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name, picture: user.picture },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ==============================
// Google OAuth Callback
// ==============================
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ message: 'No authorization code received' });

  try {
    // 1️⃣ Exchange code → access token
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
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

    // 4️⃣ Set JWT in HTTP-only cookie and redirect
    const token = signToken(user);
    res.cookie('token', token, cookieOptions);
    res.redirect(process.env.FRONTEND_URL + '/dashboard');

  } catch (error) {
    console.error('Google OAuth error:', error.response?.data || error.message);
    res.redirect(process.env.FRONTEND_URL + '/auth?error=oauth_failed');
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
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.json({ message: 'Logged out' });
});

export default router;