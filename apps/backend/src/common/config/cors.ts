/**
 * Which websites may call this API from a browser.
 *
 * Add your own domains with the CORS_ORIGIN environment variable
 * (comma separated), e.g. CORS_ORIGIN="https://noxguarda.com,https://www.noxguarda.com"
 */
const BUILT_IN_ORIGINS = [
  'https://sos-frontend-indol.vercel.app',
  'https://noxguarda.com',
  'https://www.noxguarda.com',
];

// Vercel preview deployments of the frontend project.
const PREVIEW_PATTERN = /^https:\/\/sos-frontend-[a-z0-9-]+\.vercel\.app$/i;
const LOCAL_PATTERN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function configuredOrigins(): string[] {
  return [process.env.CORS_ORIGIN, process.env.FRONTEND_URL]
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

export function isAllowedOrigin(origin?: string | null): boolean {
  // Requests with no Origin header are not browser cross-site calls
  // (server-to-server, curl, the Paystack webhook).
  if (!origin) return true;

  const clean = origin.trim().replace(/\/$/, '');
  if (BUILT_IN_ORIGINS.includes(clean)) return true;
  if (configuredOrigins().includes(clean)) return true;
  if (PREVIEW_PATTERN.test(clean)) return true;
  // A developer's own machine, including when pointed at the deployed API.
  if (LOCAL_PATTERN.test(clean)) return true;
  return false;
}

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    callback(null, isAllowedOrigin(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};
