/**
 * Centralized Anti-CSRF Token Management Utility for ScholarSync
 * 
 * Handles double-submit anti-CSRF token lifecycle:
 * - Synchronously reads existing non-HttpOnly `_csrf` cookie
 * - Prefetches a new CSRF token from /api/auth/csrf-token if cookie is missing
 * - Caches in-flight prefetch promises to prevent duplicate requests
 * - Assembles required state-changing request headers (X-CSRF-Token + X-Requested-With)
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

let prefetchPromise = null;

/**
 * Reads the raw CSRF token from document.cookie.
 * @returns {string|null} Decoded CSRF token or null if not found.
 */
export const getCsrfTokenFromCookie = () => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )_csrf=([^;]*)/);
  return match && match[1] ? decodeURIComponent(match[1]) : null;
};

/**
 * Ensures a valid CSRF token is available in cookies, fetching from server if absent.
 * Deduplicates concurrent calls via a singleton Promise.
 * @returns {Promise<string>} Resolves to the valid CSRF token string.
 */
export const fetchCsrfToken = async () => {
  const existing = getCsrfTokenFromCookie();
  if (existing) return existing;

  if (prefetchPromise) return prefetchPromise;

  prefetchPromise = fetch(`${API_BASE}/api/auth/csrf-token`, {
    credentials: 'include',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  })
    .then(async (res) => {
      prefetchPromise = null;
      if (!res.ok) {
        console.warn('Failed to fetch CSRF token:', res.status);
        return getCsrfTokenFromCookie() || '';
      }
      const data = await res.json();
      return data.csrfToken || getCsrfTokenFromCookie() || '';
    })
    .catch((err) => {
      prefetchPromise = null;
      console.warn('Network error prefetching CSRF token:', err.message);
      return getCsrfTokenFromCookie() || '';
    });

  return prefetchPromise;
};

/**
 * Returns an object with standard state-changing headers including the CSRF token.
 * @param {Record<string, string>} [extraHeaders={}] Extra headers to merge.
 * @returns {Promise<Record<string, string>>} Merged headers object with X-CSRF-Token and X-Requested-With.
 */
export const getCsrfHeaders = async (extraHeaders = {}) => {
  let token = getCsrfTokenFromCookie();
  if (!token) {
    token = await fetchCsrfToken();
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...extraHeaders,
  };

  if (token) {
    headers['X-CSRF-Token'] = token;
  }

  return headers;
};

