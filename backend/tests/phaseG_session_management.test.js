import express from 'express';
import mongoose from 'mongoose';
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

const PORT = 8091;
const API_URL = `http://localhost:${PORT}`;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function runPhaseGTests() {
  console.log('🧪 Starting Phase G Session Management Security & API Tests...\n');

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const server = app.listen(PORT, '127.0.0.1');

  const testUser1Email = `phase_g_user1_${Date.now()}@example.com`;
  const testUser2Email = `phase_g_user2_${Date.now()}@example.com`;
  const password = 'Password123!@#';

  let user1;
  let user2;

  let csrfToken = '';
  let csrfCookie = '';

  let sessionToken1 = crypto.randomBytes(32).toString('hex');
  let sessionToken2 = crypto.randomBytes(32).toString('hex');
  let sessionToken3 = crypto.randomBytes(32).toString('hex');
  let sessionTokenUser2 = crypto.randomBytes(32).toString('hex');

  let session1Doc;
  let session2Doc;
  let session3Doc;
  let sessionUser2Doc;

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

    // 2. Create test users in DB
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    user1 = await User.create({
      name: 'Phase G User 1',
      email: testUser1Email,
      password: hashedPassword,
    });

    user2 = await User.create({
      name: 'Phase G User 2',
      email: testUser2Email,
      password: hashedPassword,
    });
    console.log('✅ 2. Test users created in DB');

    // 3. Create active sessions for User 1 and User 2
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    session1Doc = await Session.create({
      userId: user1._id,
      tokenHash: hashToken(sessionToken1),
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ipAddress: '192.168.1.100',
      isValid: true,
      expiresAt,
      lastActivityAt: new Date(),
    });

    session2Doc = await Session.create({
      userId: user1._id,
      tokenHash: hashToken(sessionToken2),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
      ipAddress: '192.168.1.101',
      isValid: true,
      expiresAt,
      lastActivityAt: new Date(Date.now() - 3600000), // 1 hour ago
    });

    session3Doc = await Session.create({
      userId: user1._id,
      tokenHash: hashToken(sessionToken3),
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
      ipAddress: '192.168.1.102',
      isValid: true,
      expiresAt,
      lastActivityAt: new Date(Date.now() - 7200000), // 2 hours ago
    });

    sessionUser2Doc = await Session.create({
      userId: user2._id,
      tokenHash: hashToken(sessionTokenUser2),
      userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36',
      ipAddress: '10.0.0.5',
      isValid: true,
      expiresAt,
      lastActivityAt: new Date(),
    });

    console.log('✅ 3. Multiple test sessions created in DB');

    const authHeaderCookieUser1Session1 = `token=${sessionToken1}; ${csrfCookie}`;

    // Helper for CSRF/Auth fetch requests
    const fetchApi = async (endpoint, options = {}) => {
      const headers = {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'Cookie': authHeaderCookieUser1Session1,
        ...(options.headers || {}),
      };
      return fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
    };

    // 4. Test GET /api/auth/sessions
    const listRes = await fetchApi('/api/auth/sessions', { method: 'GET' });
    const listData = await listRes.json();

    if (!listData.success || !Array.isArray(listData.sessions) || listData.sessions.length !== 3) {
      throw new Error(`❌ List sessions failed: expected 3 sessions, got ${listData.sessions?.length}`);
    }

    const currentSess = listData.sessions.find(s => s.id === session1Doc._id.toString());
    const sess2 = listData.sessions.find(s => s.id === session2Doc._id.toString());
    const sess3 = listData.sessions.find(s => s.id === session3Doc._id.toString());

    if (!currentSess || !currentSess.isCurrent) {
      throw new Error('❌ Session 1 was not marked as isCurrent: true');
    }
    if (sess2.isCurrent || sess3.isCurrent) {
      throw new Error('❌ Other sessions were incorrectly marked as isCurrent');
    }

    // Verify tokenHash is NOT exposed in response
    if (listData.sessions.some(s => s.tokenHash || s.rawToken)) {
      throw new Error('❌ CRITICAL: tokenHash or rawToken was exposed in GET /api/auth/sessions response!');
    }

    // Verify parsed User Agent display values
    if (currentSess.browser !== 'Chrome' || currentSess.os !== 'macOS') {
      throw new Error(`❌ User agent parsing failed for Mac Chrome: ${JSON.stringify(currentSess)}`);
    }
    if (sess2.browser !== 'Microsoft Edge' || sess2.os !== 'Windows 10/11') {
      throw new Error(`❌ User agent parsing failed for Windows Edge: ${JSON.stringify(sess2)}`);
    }
    if (sess3.deviceType !== 'Mobile' || sess3.os !== 'iOS') {
      throw new Error(`❌ User agent parsing failed for iPhone: ${JSON.stringify(sess3)}`);
    }

    console.log('✅ 4. GET /api/auth/sessions succeeded with safe user agent parsing & isCurrent detection');

    // 5. Test IDOR Protection on DELETE /api/auth/sessions/:sessionId
    const idorRes = await fetchApi(`/api/auth/sessions/${sessionUser2Doc._id}`, { method: 'DELETE' });
    if (idorRes.status !== 404) {
      throw new Error(`❌ IDOR vulnerability! User 1 was able to access User 2 session status: ${idorRes.status}`);
    }
    const checkUser2Session = await Session.findById(sessionUser2Doc._id);
    if (!checkUser2Session.isValid || checkUser2Session.revokedAt) {
      throw new Error('❌ CRITICAL: IDOR vulnerability! User 1 revoked User 2 session in DB!');
    }
    console.log('✅ 5. IDOR Protection verified: User 1 cannot revoke User 2 session');

    // 6. Test invalid ObjectId validation on DELETE /api/auth/sessions/:sessionId
    const invalidIdRes = await fetchApi('/api/auth/sessions/invalid-id-123', { method: 'DELETE' });
    if (invalidIdRes.status !== 400) {
      throw new Error(`❌ Invalid session ID did not return 400 status: ${invalidIdRes.status}`);
    }
    console.log('✅ 6. Invalid ObjectId parameter rejected with 400 status');

    // 7. Revoke Session 2 (Windows Edge) via DELETE /api/auth/sessions/:sessionId
    const revokeRes = await fetchApi(`/api/auth/sessions/${session2Doc._id}`, { method: 'DELETE' });
    const revokeData = await revokeRes.json();
    if (!revokeData.success) {
      throw new Error(`❌ Failed to revoke session 2: ${revokeData.message}`);
    }
    const dbSession2 = await Session.findById(session2Doc._id);
    if (dbSession2.isValid || !dbSession2.revokedAt) {
      throw new Error('❌ Session 2 was not updated to isValid: false and revokedAt set in DB');
    }
    console.log('✅ 7. Single session revoked successfully');

    // 8. Verify GET /api/auth/sessions returns only 2 active sessions now
    const listRes2 = await fetchApi('/api/auth/sessions', { method: 'GET' });
    const listData2 = await listRes2.json();
    if (listData2.sessions.length !== 2) {
      throw new Error(`❌ Expected 2 active sessions, found ${listData2.sessions.length}`);
    }
    console.log('✅ 8. Revoked session excluded from active sessions list');

    // 9. Revoke all other sessions via POST /api/auth/sessions/revoke-others
    const revokeOthersRes = await fetchApi('/api/auth/sessions/revoke-others', { method: 'POST' });
    const revokeOthersData = await revokeOthersRes.json();
    if (!revokeOthersData.success) {
      throw new Error(`❌ Failed to revoke other sessions: ${revokeOthersData.message}`);
    }

    const dbSession1 = await Session.findById(session1Doc._id);
    const dbSession3 = await Session.findById(session3Doc._id);

    if (!dbSession1.isValid || dbSession1.revokedAt !== null) {
      throw new Error('❌ Current session (Session 1) was incorrectly revoked during revoke-others');
    }
    if (dbSession3.isValid || !dbSession3.revokedAt) {
      throw new Error('❌ Session 3 was not revoked during revoke-others');
    }
    console.log('✅ 9. POST /api/auth/sessions/revoke-others succeeded: all other sessions revoked, current session preserved');

    // 10. Revoke current session and verify cookie clearing
    const revokeSelfRes = await fetchApi(`/api/auth/sessions/${session1Doc._id}`, { method: 'DELETE' });
    const setCookieHeaders = revokeSelfRes.headers.get('set-cookie') || '';
    if (!setCookieHeaders.includes('token=;') && !setCookieHeaders.includes('token=;')) {
      throw new Error(`❌ Revoking current session did not clear token cookie: ${setCookieHeaders}`);
    }
    console.log('✅ 10. Revoking current session clears HttpOnly token auth cookie');

    // 11. Cleanup test data
    await User.deleteMany({ _id: { $in: [user1._id, user2._id] } });
    await Session.deleteMany({ _id: { $in: [session1Doc._id, session2Doc._id, session3Doc._id, sessionUser2Doc._id] } });
    console.log('✅ 11. Test data cleaned up successfully');

  } catch (error) {
    console.error('\n❌ Phase G Verification Test Failed:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('\n🎉 PHASE G SESSION MANAGEMENT VERIFICATION COMPLETE!');
  }
}

runPhaseGTests();
