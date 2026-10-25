/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    // Retire les console.log/info/debug du bundle de production (garde error et warn).
    removeConsole:
      process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wzdkuqxjcqrwrouobpxo.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },
  allowedDevOrigins: [
    'localhost:3000',
    'admin.localhost:3000',
    'app.localhost:3000',
    '*.localhost:3000',
    'localhost',
    'admin.localhost',
    'app.localhost',
  ],
};

export default nextConfig;

