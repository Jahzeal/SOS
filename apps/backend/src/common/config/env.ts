/**
 * Central access to secrets. There are deliberately no fallback values:
 * a missing secret must stop the server, never silently fall back to a
 * value that is readable in the source code.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable ${name}. Set it in apps/backend/.env (local) or in your hosting provider's environment settings.`,
    );
  }
  return value.trim();
}

/** Called once at startup so a misconfigured deployment fails immediately. */
export function assertRequiredEnv(): void {
  requireEnv('JWT_SECRET');
  requireEnv('DATABASE_URL');
  if (process.env.NODE_ENV === 'production') {
    requireEnv('PAYSTACK_SECRET_KEY');
    requireEnv('GOOGLE_CLIENT_ID');
  }
}

export function frontendUrl(): string {
  return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
}
