/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracing: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  webpack: (config, { dev }) => {
    // Next.js 14's persistent webpack cache races on Windows and throws
    // ENOENT on *.pack.gz, which crashes `next dev` via unhandledRejection.
    // Use an in-memory cache in development to avoid the crash.
    if (dev) {
      config.cache = { type: 'memory' };
    }
    return config;
  },
};

export default nextConfig;
