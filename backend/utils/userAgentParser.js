/**
 * Safe, dependency-free User-Agent parser utility for ScholarSync.
 * Extracts approximate Browser, Operating System, and Device Type metadata
 * without introducing heavy third-party parsing dependencies or ReDoS risks.
 */
export function parseUserAgent(uaString = '') {
  if (!uaString || typeof uaString !== 'string') {
    return {
      browser: 'Unknown Browser',
      os: 'Unknown OS',
      deviceType: 'Desktop',
      display: 'Unknown Device',
    };
  }

  const ua = uaString.trim();

  // 1. Parse Operating System
  let os = 'Unknown OS';
  if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
  else if (/windows nt 6\.3/i.test(ua)) os = 'Windows 8.1';
  else if (/windows nt 6\.1/i.test(ua)) os = 'Windows 7';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/cros/i.test(ua)) os = 'Chrome OS';
  else if (/linux/i.test(ua)) os = 'Linux';

  // 2. Parse Browser
  let browser = 'Unknown Browser';
  if (/edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/chrome|crios/i.test(ua) && !/opr|opera|edg/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) browser = 'Safari';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  // 3. Parse Device Type
  let deviceType = 'Desktop';
  if (/iphone|ipod|android.*mobile|windows phone/i.test(ua)) {
    deviceType = 'Mobile';
  } else if (/ipad|tablet|android(?!.*mobile)/i.test(ua)) {
    deviceType = 'Tablet';
  }

  const display = `${browser} on ${os}`;

  return {
    browser,
    os,
    deviceType,
    display,
  };
}
