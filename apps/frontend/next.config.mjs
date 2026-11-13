/**
 * Each deploy gets its own version label. The installed app compares it with the
 * version it is running and offers "Update now" when they differ. On Vercel this is
 * the commit being deployed; elsewhere it is the build time.
 */
const appVersion = (process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now())).slice(0, 12);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
};

export default nextConfig;
