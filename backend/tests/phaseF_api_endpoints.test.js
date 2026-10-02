import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

import authRoutes from '../routes/auth.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { originVerification } from '../middleware/csrfProtection.js';
import { mongoSanitizerMiddleware } from '../validation/sanitizer.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(originVerification);
app.use(mongoSanitizerMiddleware);
app.use('/api/auth', authRoutes);

const PORT = 8089;
const API_URL = `http://localhost:${PORT}`;

async function runApiTests() {
  console.log('🧪 Starting Phase F HTTP API Verification Tests...\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const server = app.listen(PORT, '127.0.0.1');

  const testEmail = `api_test_phase_f_${Date.now()}@example.com`;
  const initialPassword = 'InitialPassword123!';
  const newPassword = 'NewPassword789$';

  let csrfToken = '';
  let csrfCookie = '';
  let resetCookie = '';

  try {
    // 1. Fetch CSRF token
    const csrfRes = await fetch(`${API_URL}/api/auth/csrf-token`);
    const csrfData = await csrfRes.json();
    csrfToken = csrfData.csrfToken;
    const cookieHeader = csrfRes.headers.get('set-cookie');
    csrfCookie = cookieHeader ? cookieHeader.split(';')[0] : '';

    if (!csrfToken || !csrfCookie) {
      throw new Error('❌ Failed to obtain anti-CSRF token');
    }
    console.log('✅ 1. Anti-CSRF token & cookie obtained');

    // Helper for making CSRF-protected POST requests
    const postJson = async (endpoint, body, customCookies = '') => {
      const combinedCookies = [csrfCookie, customCookies].filter(Boolean).join('; ');
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': csrfToken,
          Cookie: combinedCookies,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return { status: res.status, data, headers: res.headers };
    };

    // 2. Create target user in DB
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(initialPassword, salt);
    const user = await User.create({
      name: 'API Test User',
      email: testEmail,
      password: hashedPassword,
    });
    console.log('✅ 2. Target user created in database');

    // Create session for user
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    const session = await Session.create({
      userId: user._id,
      tokenHash: sessionTokenHash,
      isValid: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    console.log('✅ 3. User session created');

    // 3. Test Forgot Password (Known Email)
    const forgotRes = await postJson('/api/auth/forgot-password', { email: testEmail });
    if (forgotRes.status !== 200 || !forgotRes.data.success) {
      throw new Error(`❌ Forgot password failed for known email: ${JSON.stringify(forgotRes.data)}`);
    }
    console.log('✅ 4. Forgot password request succeeded for known email');

    // Check DB that OTP was stored as HMAC hash (not plaintext)
    const updatedUser = await User.findById(user._id);
    if (!updatedUser.otp_code || updatedUser.otp_code.length !== 64) {
      throw new Error('❌ OTP was not stored as 64-char HMAC hash in database');
    }
    console.log('✅ 5. Verified OTP stored in DB as HMAC-SHA256 hash');

    // 4. Test Account Enumeration Defense (Unknown Email)
    const unknownRes = await postJson('/api/auth/forgot-password', { email: 'unknown_nonexistent_user_999@example.com' });
    if (unknownRes.status !== 200 || unknownRes.data.message !== forgotRes.data.message) {
      throw new Error('❌ Account enumeration response mismatch for unknown email');
    }
    console.log('✅ 6. Account enumeration protection: identical response for unknown email');

    // 5. Test Invalid OTP Verification
    const invalidOtpRes = await postJson('/api/auth/verify-otp', { email: testEmail, otp: '000000' });
    if (invalidOtpRes.status !== 400 || invalidOtpRes.data.message !== 'Invalid or expired verification code') {
      throw new Error('❌ Invalid OTP was not properly rejected');
    }
    console.log('✅ 7. Invalid OTP properly rejected with generic error');

    // 6. Generate valid OTP hash manually to test verify-otp endpoint
    const validOtp = '123456';
    const otpSalt = user._id.toString() + (process.env.SESSION_SECRET || 'scholarsync-otp-salt');
    const validOtpHash = crypto.createHmac('sha256', otpSalt).update(validOtp).digest('hex');
    updatedUser.otp_code = validOtpHash;
    updatedUser.otp_expiry = new Date(Date.now() + 10 * 60 * 1000);
    updatedUser.otp_attempts = 0;
    await updatedUser.save();

    // Verify OTP
    const verifyRes = await postJson('/api/auth/verify-otp', { email: testEmail, otp: validOtp });
    if (verifyRes.status !== 200 || !verifyRes.data.success) {
      throw new Error(`❌ OTP verification failed for valid OTP: ${JSON.stringify(verifyRes.data)}`);
    }
    console.log('✅ 8. OTP verification succeeded for valid OTP');

    // Extract reset_token cookie
    const setCookieHeader = verifyRes.headers.get('set-cookie');
    if (setCookieHeader && setCookieHeader.includes('reset_token=')) {
      const match = setCookieHeader.match(/reset_token=([^;]+)/);
      if (match) resetCookie = `reset_token=${match[1]}`;
    }
    if (!resetCookie) {
      throw new Error('❌ reset_token HttpOnly cookie was not set upon OTP verification');
    }
    console.log('✅ 9. reset_token HttpOnly cookie received');

    // Check single-use OTP
    const postVerifyUser = await User.findById(user._id);
    if (postVerifyUser.otp_code) {
      throw new Error('❌ OTP code was not cleared from DB after verification');
    }
    console.log('✅ 10. OTP code cleared immediately after successful verification (single-use)');

    // 7. Test Weak Password Rejection in Reset Password
    const weakResetRes = await postJson('/api/auth/reset-password', { newPassword: 'weak' }, resetCookie);
    if (weakResetRes.status !== 400) {
      throw new Error('❌ Weak password was not rejected during password reset');
    }
    console.log('✅ 11. Weak password rejected by password reset endpoint');

    // 8. Test Successful Password Reset
    const resetRes = await postJson('/api/auth/reset-password', { newPassword: newPassword }, resetCookie);
    if (resetRes.status !== 200 || !resetRes.data.success) {
      throw new Error(`❌ Password reset failed: ${JSON.stringify(resetRes.data)}`);
    }
    console.log('✅ 12. Password reset completed successfully');

    // Check session invalidation
    const checkSession = await Session.findById(session._id);
    if (checkSession.isValid) {
      throw new Error('❌ User session was not invalidated after password reset');
    }
    console.log('✅ 13. Previous user session invalidated in MongoDB after password reset');

    // 9. Test Re-using Reset Token
    const reuseResetRes = await postJson('/api/auth/reset-password', { newPassword: 'AnotherPassword123!' }, resetCookie);
    if (reuseResetRes.status !== 400) {
      throw new Error('❌ Reusing reset token was not rejected');
    }
    console.log('✅ 14. Reset credential reuse prevented (single-use reset token)');

    // 10. Test Authenticated Password Change
    const rawAuthToken = crypto.randomBytes(32).toString('hex');
    const authSessionHash = crypto.createHash('sha256').update(rawAuthToken).digest('hex');
    const authSession = await Session.create({
      userId: user._id,
      tokenHash: authSessionHash,
      isValid: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    const authCookie = `token=${rawAuthToken}`;

    // Test invalid current password
    const wrongChangeRes = await postJson(
      '/api/auth/change-password',
      { currentPassword: 'WrongPassword123!', newPassword: 'BrandNewPassword999$' },
      authCookie
    );
    if (wrongChangeRes.status !== 401) {
      throw new Error('❌ Incorrect current password was not rejected with 401');
    }
    console.log('✅ 15. Change password rejected incorrect current password');

    // Test valid password change
    const validChangeRes = await postJson(
      '/api/auth/change-password',
      { currentPassword: newPassword, newPassword: 'BrandNewPassword999$' },
      authCookie
    );
    if (validChangeRes.status !== 200 || !validChangeRes.data.success) {
      throw new Error(`❌ Authenticated password change failed: ${JSON.stringify(validChangeRes.data)}`);
    }
    console.log('✅ 16. Authenticated password change succeeded');

    // Clean up
    await Session.deleteMany({ userId: user._id });
    await User.deleteOne({ _id: user._id });
    console.log('✅ 17. Test user and sessions cleaned up');

    console.log('\n🎉 ALL PHASE F HTTP API VERIFICATION TESTS PASSED!');
  } catch (err) {
    console.error('\n❌ API TEST FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runApiTests();
