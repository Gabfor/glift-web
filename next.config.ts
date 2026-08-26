/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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

