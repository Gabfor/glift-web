/** @type {import('next').NextConfig} */
const nextConfig = {
  // Autres options ici
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wzdkuqxjcqrwrouobpxo.supabase.co',
      },
    ], // ✅ domaine Supabase autorisé
  },
  experimental: {
    allowedDevOrigins: [
      'localhost:3000',
      'admin.localhost:3000',
      'app.localhost:3000',
    ],
  },
};

module.exports = nextConfig;
