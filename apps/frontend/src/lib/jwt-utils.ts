/**
 * JWT Parsing & Expiration Validation Utilities for VerifyFlow
 */

export interface DecodedJwtPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  email?: string;
  role?: string;
  businessId?: string;
  [key: string]: any;
}

/**
 * Decodes the payload portion of a JWT token string.
 */
export function parseJwtPayload(token: string | null): DecodedJwtPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

/**
 * Checks if a JWT token string is expired or invalid.
 * Returns true if token is null, malformed, or past its `exp` timestamp.
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;

  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    // If token exists but has no exp field, check basic validity
    return false;
  }

  // Compare `exp` (in seconds) against current time (in seconds) with 5-second buffer
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds + 5;
}
