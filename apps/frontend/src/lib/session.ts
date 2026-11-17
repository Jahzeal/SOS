/**
 * Sign-in session helpers ("Keep me signed in").
 *
 * - `vf_access_token`  short-lived login token sent with every request.
 * - `vf_refresh_token` only when "Keep me signed in" was ticked. Traded for a new access
 *   token (and a new refresh token) before the old one runs out, so the person stays
 *   signed in for 30 days after their last use.
 */
import { isTokenExpired, parseJwtPayload } from './jwt-utils';

const ACCESS_KEY = 'vf_access_token';
const REFRESH_KEY = 'vf_refresh_token';
const USER_KEY = 'vf_user';

const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const API_BASE_URL =
  rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
    ? rawUrl.replace(/\/$/, '')
    : `https://${rawUrl.replace(/\/$/, '')}`;

function read(key: string): string | null {
  try {
    return typeof window === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  return read(REFRESH_KEY);
}

/** Saves what a sign-in (or a renewal) returned. No refresh token = "Keep me signed in" was off. */
export function saveSession(data: { accessToken: string; refreshToken?: string | null; user?: any }) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACCESS_KEY, data.accessToken);
    if (data.refreshToken) localStorage.setItem(REFRESH_KEY, data.refreshToken);
    else localStorage.removeItem(REFRESH_KEY);
    if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  } catch {
    // Storage blocked (private mode): the person simply signs in again next time.
  }
}

export function clearSessionTokens() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

/** True when the saved sign-in can still be used: a live token, or a way to renew it. */
export function hasUsableSession(token: string | null = read(ACCESS_KEY)): boolean {
  return !isTokenExpired(token) || !!getRefreshToken();
}

/** True when the access token ends within `seconds` (or already has). */
export function expiresSoon(token: string | null, seconds = 60): boolean {
  const exp = parseJwtPayload(token)?.exp;
  if (typeof exp !== 'number') return isTokenExpired(token);
  return exp - Math.floor(Date.now() / 1000) <= seconds;
}

let inFlight: Promise<string | null> | null = null;

/**
 * Renews the sign-in with the refresh token. Returns the new access token, or null when the
 * session has ended (signed out elsewhere, password changed, 30 days unused).
 * Only one renewal runs at a time; other tabs are respected (a token they already renewed wins).
 */
export function refreshSession(): Promise<string | null> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const used = getRefreshToken();
    if (!used) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: used }),
      });
      if (res.ok) {
        const data = await res.json();
        saveSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
        return data.accessToken as string;
      }
      // Another tab may have renewed with this same token a moment ago.
      const now = getRefreshToken();
      if (now && now !== used && !isTokenExpired(read(ACCESS_KEY))) return read(ACCESS_KEY);
      if (res.status === 401 || res.status === 403) clearSessionTokens();
      return null;
    } catch {
      // No network: keep the tokens so renewal can be tried again later.
      return null;
    } finally {
      setTimeout(() => {
        inFlight = null;
      }, 0);
    }
  })();
  return inFlight;
}

/** Ends this sign-in on the server (best effort; never blocks signing out). */
export function endServerSession() {
  const access = read(ACCESS_KEY);
  const refresh = getRefreshToken();
  if (!access && !refresh) return;
  try {
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
      },
      body: JSON.stringify(refresh ? { refreshToken: refresh } : {}),
    }).catch(() => undefined);
  } catch {}
}
