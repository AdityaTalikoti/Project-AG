import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import http from 'http';
import { getTrustedOrigins, originVerification, setCsrfCookie } from '../middleware/csrfProtection.js';

async function runTests() {
  console.log('--- ScholarSync Phase 1: Comprehensive Anti-CSRF & CORS Test Suite ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`PASS: ${testName}`);
      passed++;
    } else {
      console.error(`FAIL: ${testName}`);
      failed++;
    }
  }

  // Unit Test 1: getTrustedOrigins
  const origins = getTrustedOrigins();
  assert(origins.has('http://localhost:5173'), 'Trusted origins contains http://localhost:5173');
  assert(origins.has('http://localhost:5174'), 'Trusted origins contains http://localhost:5174');
  assert(origins.has('http://127.0.0.1:5173'), 'Trusted origins contains http://127.0.0.1:5173');
  assert(origins.has('http://127.0.0.1:5174'), 'Trusted origins contains http://127.0.0.1:5174');

  // Set up Express test app
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // CORS matching backend/index.js
  const trustedOrigins = getTrustedOrigins();
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (trustedOrigins.has(origin.toLowerCase())) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }));

  // CSRF middleware
  app.use(originVerification);

  // Test endpoints
  app.get('/api/auth/csrf-token', (req, res) => {
    const csrfToken = setCsrfCookie(req, res);
    res.json({ success: true, csrfToken });
  });

  app.post('/api/auth/login-simulated', (req, res) => {
    // Simulates auth rotation
    const rotatedToken = setCsrfCookie(req, res, true);
    res.json({ success: true, rotatedToken });
  });

  app.post('/api/auth/logout-simulated', (req, res) => {
    // Simulates logout cleanup
    res.clearCookie('_csrf', { path: '/', httpOnly: false });
    res.json({ success: true, message: 'Logged out' });
  });

  app.post('/api/auth/google/callback', (req, res) => {
    res.json({ success: true, message: 'OAuth callback reached without CSRF header' });
  });

  app.get('/api/test-safe-get', (req, res) => {
    res.json({ success: true, message: 'GET safe endpoint reached' });
  });

  app.post('/api/test-mutation', (req, res) => {
    res.json({ success: true, message: 'Mutation authorized' });
  });

  // Error handler for CORS
  app.use((err, req, res, next) => {
    if (err.message && err.message.includes('CORS blocked')) {
      return res.status(403).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(8999, resolve));
  const baseUrl = 'http://localhost:8999';

  try {
    // Test 2: Safe GET request without Origin or CSRF headers
    const getRes = await fetch(`${baseUrl}/api/test-safe-get`);
    const getJson = await getRes.json();
    assert(getRes.status === 200 && getJson.success === true, 'Safe GET request bypasses CSRF checks');

    // Test 3: Safe HEAD request bypasses CSRF checks
    const headRes = await fetch(`${baseUrl}/api/test-safe-get`, { method: 'HEAD' });
    assert(headRes.status === 200, 'Safe HEAD request bypasses CSRF checks');

    // Test 4: Safe OPTIONS preflight request bypasses CSRF checks
    const optionsRes = await fetch(`${baseUrl}/api/test-mutation`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5174',
        'Access-Control-Request-Method': 'POST',
      },
    });
    assert(optionsRes.status === 204 || optionsRes.status === 200, 'Safe OPTIONS preflight bypasses CSRF checks');

    // Test 5: GET /api/auth/csrf-token returns token and sets _csrf cookie
    const tokenRes = await fetch(`${baseUrl}/api/auth/csrf-token`);
    const tokenJson = await tokenRes.json();
    const setCookieHeader = tokenRes.headers.get('set-cookie') || '';
    assert(
      tokenRes.status === 200 && 
      tokenJson.success === true && 
      typeof tokenJson.csrfToken === 'string' &&
      tokenJson.csrfToken.length >= 32,
      'GET /api/auth/csrf-token returns 64-char hex CSRF token'
    );
    assert(setCookieHeader.includes('_csrf='), 'GET /api/auth/csrf-token sets _csrf cookie header');

    const validToken = tokenJson.csrfToken;
    const cookieHeader = `_csrf=${validToken}`;

    // Test 6: Untrusted origin blocked
    const untrustedRes = await fetch(`${baseUrl}/api/test-mutation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://malicious-site.com',
        'X-CSRF-Token': validToken,
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({ action: 'transfer' }),
    });
    assert(untrustedRes.status === 403, 'Mutating request from untrusted origin is rejected with 403');

    // Test 7: Missing X-CSRF-Token header
    const missingHeaderRes = await fetch(`${baseUrl}/api/test-mutation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5174',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({ action: 'save' }),
    });
    const missingHeaderJson = await missingHeaderRes.json();
    assert(
      missingHeaderRes.status === 403 && missingHeaderJson.message.includes('Missing anti-CSRF token header'),
      'Missing X-CSRF-Token header returns 403 with descriptive message'
    );

    // Test 8: Missing _csrf cookie
    const missingCookieRes = await fetch(`${baseUrl}/api/test-mutation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5174',
        'X-CSRF-Token': validToken,
      },
      body: JSON.stringify({ action: 'save' }),
    });
    const missingCookieJson = await missingCookieRes.json();
    assert(
      missingCookieRes.status === 403 && missingCookieJson.message.includes('Missing anti-CSRF token cookie'),
      'Missing _csrf cookie returns 403 with descriptive message'
    );

    // Test 9: Mismatched X-CSRF-Token header vs _csrf cookie
    const mismatchRes = await fetch(`${baseUrl}/api/test-mutation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5174',
        'X-CSRF-Token': 'attacker_supplied_token_1234567890abcdef',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({ action: 'save' }),
    });
    const mismatchJson = await mismatchRes.json();
    assert(
      mismatchRes.status === 403 && mismatchJson.message.includes('Anti-CSRF token mismatch'),
      'Mismatched CSRF token header vs cookie returns 403 with descriptive message'
    );

    // Test 10: Valid Trusted Origin + Matching CSRF header and cookie
    const successRes = await fetch(`${baseUrl}/api/test-mutation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5174',
        'X-CSRF-Token': validToken,
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({ action: 'save' }),
    });
    const successJson = await successRes.json();
    assert(
      successRes.status === 200 && successJson.message === 'Mutation authorized',
      'Valid request with matching CSRF header and cookie succeeds with 200 OK'
    );

    // Test 11: Alternate allowed origin http://localhost:5173 succeeds
    const altOriginRes = await fetch(`${baseUrl}/api/test-mutation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173',
        'X-CSRF-Token': validToken,
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({ action: 'save' }),
    });
    const altOriginJson = await altOriginRes.json();
    assert(
      altOriginRes.status === 200 && altOriginJson.message === 'Mutation authorized',
      'Alternate trusted origin (5173) also succeeds with 200 OK'
    );

    // Test 12: Google OAuth callback bypasses double-submit header requirement
    const oauthRes = await fetch(`${baseUrl}/api/auth/google/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'fake_code' }),
    });
    const oauthJson = await oauthRes.json();
    assert(
      oauthRes.status === 200 && oauthJson.success === true,
      'Google OAuth callback is exempt from anti-CSRF header requirement'
    );

    // Test 13: Token Rotation on Authentication (forceNew = true)
    const rotateRes = await fetch(`${baseUrl}/api/auth/login-simulated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5174',
        'X-CSRF-Token': validToken,
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({}),
    });
    const rotateJson = await rotateRes.json();
    const rotateCookieHeader = rotateRes.headers.get('set-cookie') || '';
    assert(
      rotateRes.status === 200 && 
      rotateJson.rotatedToken !== validToken &&
      rotateCookieHeader.includes('_csrf='),
      'Authentication rotation issues a new distinct token even if cookie was present'
    );

    // Test 14: Logout clears _csrf cookie
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout-simulated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5174',
        'X-CSRF-Token': validToken,
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({}),
    });
    const logoutCookieHeader = logoutRes.headers.get('set-cookie') || '';
    assert(
      logoutRes.status === 200 && 
      (logoutCookieHeader.includes('_csrf=;') || logoutCookieHeader.includes('Expires=') || logoutCookieHeader.includes('Max-Age=0')),
      'Logout clears _csrf cookie'
    );

    // Test 15: Concurrent token requests
    const [cRes1, cRes2, cRes3] = await Promise.all([
      fetch(`${baseUrl}/api/auth/csrf-token`),
      fetch(`${baseUrl}/api/auth/csrf-token`),
      fetch(`${baseUrl}/api/auth/csrf-token`),
    ]);
    const [cJson1, cJson2, cJson3] = await Promise.all([cRes1.json(), cRes2.json(), cRes3.json()]);
    assert(
      cRes1.status === 200 && cRes2.status === 200 && cRes3.status === 200 &&
      cJson1.success && cJson2.success && cJson3.success,
      'Concurrent token requests all succeed reliably'
    );

  } finally {
    server.close();
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
