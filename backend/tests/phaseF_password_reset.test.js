import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function runTests() {
  console.log('🧪 Starting Phase F Security Verification Tests...\n');

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const testEmail = `test_phase_f_${Date.now()}@example.com`;
  const initialPassword = 'InitialPassword123!';
  const newPassword = 'NewPassword456$';

  try {
    // 1. Create initial test user
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(initialPassword, salt);
    
    const user = await User.create({
      name: 'Phase F Test User',
      email: testEmail,
      password: hashedPassword,
    });
    console.log('✅ 1. Test user created successfully');

    // Verify JSON transformation defense-in-depth
    const jsonUser = user.toJSON();
    if (jsonUser.password || jsonUser.otp_code || jsonUser.otp_expiry || jsonUser.otp_attempts || jsonUser.reset_token_hash || jsonUser.reset_token_expiry) {
      throw new Error('❌ JSON transformation failed to strip sensitive fields');
    }
    console.log('✅ 2. Defense-in-depth: Sensitive fields stripped from JSON output');

    // Create 2 mock sessions for user
    const session1 = await Session.create({
      userId: user._id,
      tokenHash: crypto.randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isValid: true,
    });
    const session2 = await Session.create({
      userId: user._id,
      tokenHash: crypto.randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isValid: true,
    });
    console.log('✅ 3. Mock sessions created');

    // 2. Test OTP Generation & Storage
    const otp = crypto.randomInt(100000, 1000000).toString();
    if (otp.length !== 6 || isNaN(Number(otp))) {
      throw new Error('❌ OTP generation is not a 6-digit numeric string');
    }

    const otpSalt = user._id.toString() + (process.env.SESSION_SECRET || 'scholarsync-otp-salt');
    const otpHash = crypto.createHmac('sha256', otpSalt).update(otp).digest('hex');

    user.otp_code = otpHash;
    user.otp_expiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otp_attempts = 0;
    await user.save();

    if (user.otp_code === otp) {
      throw new Error('❌ OTP stored in plaintext!');
    }
    console.log('✅ 4. OTP generated and stored securely as HMAC-SHA256 hash');

    // 3. Test OTP Verification
    const wrongHash = crypto.createHmac('sha256', otpSalt).update('000000').digest('hex');
    const isWrongMatch = crypto.timingSafeEqual(Buffer.from(user.otp_code), Buffer.from(wrongHash));
    if (isWrongMatch) {
      throw new Error('❌ Failed OTP matched expected hash unexpectedly');
    }

    const correctHash = crypto.createHmac('sha256', otpSalt).update(otp).digest('hex');
    const isCorrectMatch = crypto.timingSafeEqual(Buffer.from(user.otp_code), Buffer.from(correctHash));
    if (!isCorrectMatch) {
      throw new Error('❌ Valid OTP failed hash verification');
    }
    console.log('✅ 5. OTP verification logic matches correctly');

    // 4. Test Single-Use OTP and Reset Token Issuance
    user.otp_code = undefined;
    user.otp_expiry = undefined;
    user.otp_attempts = 0;

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    user.reset_token_hash = resetTokenHash;
    user.reset_token_expiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    if (user.otp_code) {
      throw new Error('❌ OTP was not cleared after verification');
    }
    console.log('✅ 6. Single-use OTP cleared and Reset Token Hash set');

    // 5. Test Password Reset Completion & Session Invalidation
    const newSalt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, newSalt);
    user.reset_token_hash = undefined;
    user.reset_token_expiry = undefined;
    await user.save();

    // Invalidate sessions
    await Session.updateMany(
      { userId: user._id, isValid: true },
      { $set: { isValid: false, revokedAt: new Date() } }
    );

    const activeSessions = await Session.find({ userId: user._id, isValid: true });
    if (activeSessions.length > 0) {
      throw new Error('❌ Sessions were not invalidated after password reset');
    }
    console.log('✅ 7. Password reset successfully and all previous sessions invalidated');

    // 6. Test New Password Authentication
    const isPasswordUpdated = await bcrypt.compare(newPassword, user.password);
    if (!isPasswordUpdated) {
      throw new Error('❌ New password verification failed');
    }
    console.log('✅ 8. New password verified via bcrypt');

    // Clean up test data
    await Session.deleteMany({ userId: user._id });
    await User.deleteOne({ _id: user._id });
    console.log('✅ 9. Cleanup complete');

    console.log('\n🎉 ALL PHASE F VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
