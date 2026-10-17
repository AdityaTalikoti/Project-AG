/**
 * Phase 3 — Task Authorization Integration Tests
 *
 * Tests cover:
 *  1. Student cannot create a task with source:'mentor'
 *  2. Mentor cannot assign task to a student not in their roster (cross-mentor)
 *  3. Mentor can assign task to their own student
 *  4. Student cannot PATCH a mentor-assigned task
 *  5. Student cannot DELETE a mentor-assigned task
 *  6. Mentor B cannot view submissions for Mentor A's task (guessed ID)
 *  7. GET /tasks/mentor/submissions scopes to authenticated mentor's tasks only
 *
 * Run from project root: node backend/tests/phase3_task_authorization.test.js
 *
 * CSRF strategy: the double-submit pattern is satisfied by calling the
 * application's own GET /api/auth/csrf-token endpoint (which sets the _csrf
 * cookie and returns the raw token in the body), then forwarding both the
 * _csrf cookie and the X-CSRF-Token header on every state-changing request.
 * No production middleware is weakened or bypassed.
 */

import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

import authRoutes from '../routes/auth.js';
import taskRoutes from '../routes/tasks.js';
import taskSubmissionRoutes from '../routes/taskSubmissions.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Session from '../models/Session.js';
import { originVerification } from '../middleware/csrfProtection.js';
import { mongoSanitizerMiddleware } from '../validation/sanitizer.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(originVerification);
app.use(mongoSanitizerMiddleware);
// Mount auth routes so /api/auth/csrf-token is reachable for token issuance
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tasks', taskSubmissionRoutes);

const PORT = 8092;
const API_URL = `http://localhost:${PORT}`;

/**
 * Obtain a real CSRF token from the application's legitimate issuance
 * endpoint.  Returns { csrfToken, csrfCookie } where csrfCookie is the
 * raw "_csrf=<value>" string extracted from the Set-Cookie header.
 */
async function fetchCsrfToken() {
  const res = await fetch(`${API_URL}/api/auth/csrf-token`);
  const data = await res.json();
  const csrfToken = data.csrfToken;
  const rawSetCookie = res.headers.get('set-cookie') || '';
  // Keep only the key=value part (everything before the first ';')
  const csrfCookie = rawSetCookie.split(';')[0].trim();
  if (!csrfToken || !csrfCookie) {
    throw new Error('Failed to obtain anti-CSRF token from /api/auth/csrf-token');
  }
  return { csrfToken, csrfCookie };
}

async function createUserAndSession(overrides = {}) {
  const user = await User.create({
    name: overrides.name || 'Test User',
    email: `phase3_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`,
    password: 'hashed_not_used',
    role: overrides.role || 'Student',
    ...overrides,
  });
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await Session.create({
    userId: user._id,
    tokenHash,
    isValid: true,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  return { user, cookie: `token=${rawToken}` };
}

/**
 * apiFetch — general request helper.
 *
 * For state-changing requests (POST/PATCH/DELETE) pass { csrfToken, csrfCookie }
 * so that the double-submit CSRF check is satisfied.  GET/HEAD/OPTIONS are
 * exempt from CSRF validation by the middleware and need neither.
 */
async function apiFetch(method, path, { cookie = '', body, csrfToken = '', csrfCookie = '' } = {}) {
  // Combine session cookie and _csrf cookie (the latter only matters for mutations)
  const cookieParts = [cookie, csrfCookie].filter(Boolean);
  const cookieHeader = cookieParts.join('; ');

  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Cookie: cookieHeader,
    },
  };

  // Attach the CSRF header on state-changing requests
  if (csrfToken) {
    opts.headers['X-CSRF-Token'] = csrfToken;
  }

  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_URL}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  console.log('Phase 3 - Task Authorization Tests\n');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const server = app.listen(PORT, '127.0.0.1');
  const cleanupUserIds = [];
  const cleanupTaskIds = [];
  let passed = 0;
  let failed = 0;

  function assert(label, condition, detail = '') {
    if (condition) {
      console.log(`  PASS: ${label}`);
      passed++;
    } else {
      console.error(`  FAIL: ${label}${detail ? ' -- ' + detail : ''}`);
      failed++;
    }
  }

  try {
    // Obtain a real CSRF token via the application's legitimate issuance endpoint
    const { csrfToken, csrfCookie } = await fetchCsrfToken();
    // Spread into mutating apiFetch calls as { ...csrf }
    const csrf = { csrfToken, csrfCookie };

    const { user: mentorA, cookie: cookieMentorA } = await createUserAndSession({ name: 'Mentor A', role: 'Mentor' });
    const { user: mentorB, cookie: cookieMentorB } = await createUserAndSession({ name: 'Mentor B', role: 'Mentor' });
    const { user: studentOfA, cookie: cookieStudentOfA } = await createUserAndSession({
      name: 'Student of A', role: 'Student', mentorId: mentorA._id,
    });
    const { user: studentOfB } = await createUserAndSession({
      name: 'Student of B', role: 'Student', mentorId: mentorB._id,
    });
    const { user: unassignedStudent, cookie: cookieUnassignedStudent } = await createUserAndSession({
      name: 'Unassigned Student', role: 'Student',
    });
    cleanupUserIds.push(mentorA._id, mentorB._id, studentOfA._id, studentOfB._id, unassignedStudent._id);

    // ----------------------------------------------------------------
    // Test 1: Student cannot create source:mentor task
    // ----------------------------------------------------------------
    console.log('Test 1: Student cannot create source:mentor task');
    const res1 = await apiFetch('POST', '/api/tasks', {
      cookie: cookieStudentOfA,
      body: { title: 'Hacked task', source: 'mentor', assignedTo: studentOfA._id.toString() },
      ...csrf,
    });
    assert('Status 403', res1.status === 403, `got ${res1.status}`);
    assert('Only mentors message', res1.data?.message?.toLowerCase().includes('only mentors'), res1.data?.message);

    // ----------------------------------------------------------------
    // Test 2: Mentor B cannot assign task to Mentor A's student
    // ----------------------------------------------------------------
    console.log('\nTest 2: Cross-mentor assignment rejected');
    const res2 = await apiFetch('POST', '/api/tasks', {
      cookie: cookieMentorB,
      body: { title: 'Cross-mentor attack', source: 'mentor', assignedTo: studentOfA._id.toString() },
      ...csrf,
    });
    assert('Status 403', res2.status === 403, `got ${res2.status}`);
    assert('Ownership error message', res2.data?.message?.includes('not assigned to you'), res2.data?.message);

    // ----------------------------------------------------------------
    // Test 3: Mentor A can assign task to their own student
    // ----------------------------------------------------------------
    console.log('\nTest 3: Valid mentor assignment succeeds');
    const res3 = await apiFetch('POST', '/api/tasks', {
      cookie: cookieMentorA,
      body: { title: 'Legit task', source: 'mentor', assignedTo: studentOfA._id.toString() },
      ...csrf,
    });
    assert('Status 201', res3.status === 201, `got ${res3.status}`);
    assert('source is mentor', res3.data?.data?.source === 'mentor', String(res3.data?.data?.source));
    const createdTaskId = res3.data?.data?._id;
    if (createdTaskId) cleanupTaskIds.push(createdTaskId);

    // ----------------------------------------------------------------
    // Test 4: Student cannot PATCH mentor-assigned task
    // ----------------------------------------------------------------
    console.log('\nTest 4: Student cannot PATCH mentor-assigned task');
    if (createdTaskId) {
      const res4 = await apiFetch('PATCH', `/api/tasks/${createdTaskId}`, {
        cookie: cookieStudentOfA,
        body: { title: 'Hacked title' },
        ...csrf,
      });
      assert('Status 403', res4.status === 403, `got ${res4.status}`);
      assert('Mentor approval message', res4.data?.message?.toLowerCase().includes('mentor approval'), res4.data?.message);
    } else {
      // Explicitly count skipped assertions as failures — do not silently pass
      console.error('  FAIL: Status 403 -- Test 4 skipped: no task was created in Test 3');
      console.error('  FAIL: Mentor approval message -- Test 4 skipped: no task was created in Test 3');
      failed += 2;
    }

    // ----------------------------------------------------------------
    // Test 5: Student cannot DELETE mentor-assigned task
    // ----------------------------------------------------------------
    console.log('\nTest 5: Student cannot DELETE mentor-assigned task');
    if (createdTaskId) {
      const res5 = await apiFetch('DELETE', `/api/tasks/${createdTaskId}`, {
        cookie: cookieStudentOfA,
        ...csrf,
      });
      assert('Status 403', res5.status === 403, `got ${res5.status}`);
    } else {
      console.error('  FAIL: Status 403 -- Test 5 skipped: no task was created in Test 3');
      failed += 1;
    }

    // ----------------------------------------------------------------
    // Test 6: Mentor B cannot view submissions for Mentor A's task
    // (GET is CSRF-exempt — no CSRF headers required)
    // ----------------------------------------------------------------
    console.log('\nTest 6: Mentor B cannot access submissions for Mentor A task');
    if (createdTaskId) {
      const res6 = await apiFetch('GET', `/api/tasks/${createdTaskId}/submissions`, { cookie: cookieMentorB });
      assert('Status 403', res6.status === 403, `got ${res6.status}`);
    } else {
      console.error('  FAIL: Status 403 -- Test 6 skipped: no task was created in Test 3');
      failed += 1;
    }

    // ----------------------------------------------------------------
    // Test 7: GET /mentor/submissions scoped correctly (all GETs, CSRF-exempt)
    // ----------------------------------------------------------------
    console.log('\nTest 7: /tasks/mentor/submissions is scoped to authenticated mentor');
    const res7a = await apiFetch('GET', '/api/tasks/mentor/submissions', { cookie: cookieMentorA });
    assert('Mentor A gets 200', res7a.status === 200, `got ${res7a.status}`);
    assert('success envelope', res7a.data?.success === true, JSON.stringify(res7a.data));
    assert('data is array', Array.isArray(res7a.data?.data), typeof res7a.data?.data);

    const res7b = await apiFetch('GET', '/api/tasks/mentor/submissions', { cookie: cookieStudentOfA });
    assert('Student gets 403', res7b.status === 403, `got ${res7b.status}`);

    const res7c = await apiFetch('GET', '/api/tasks/mentor/submissions', { cookie: cookieUnassignedStudent });
    assert('Unassigned student gets 403', res7c.status === 403, `got ${res7c.status}`);

    const res7d = await apiFetch('GET', '/api/tasks/mentor/submissions', { cookie: cookieMentorB });
    assert('Mentor B gets 200', res7d.status === 200, `got ${res7d.status}`);
    const mentorBData = Array.isArray(res7d.data?.data) ? res7d.data.data : [];
    const hasLeak = mentorBData.some((s) => String(s.task?._id ?? s.task) === String(createdTaskId));
    assert('No cross-mentor data leak in /mentor/submissions', !hasLeak, 'Mentor A task visible to Mentor B');

    // ----------------------------------------------------------------
    // Test 8: Unauthenticated request rejected
    // ----------------------------------------------------------------
    console.log('\nTest 8: Unauthenticated request rejected');
    const res8 = await apiFetch('GET', '/api/tasks');
    assert('Status 401', res8.status === 401, `got ${res8.status}`);

  } finally {
    if (cleanupTaskIds.length) await Task.deleteMany({ _id: { $in: cleanupTaskIds } });
    if (cleanupUserIds.length) {
      await Session.deleteMany({ userId: { $in: cleanupUserIds } });
      await User.deleteMany({ _id: { $in: cleanupUserIds } });
    }
    console.log('\nTest data cleaned up');
    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    if (failed === 0) console.log('ALL PHASE 3 AUTHORIZATION TESTS PASSED');
    else {
      console.error(`${failed} test(s) failed`);
      process.exitCode = 1;
    }
    server.close();
    await mongoose.disconnect();
  }
}

runTests();
