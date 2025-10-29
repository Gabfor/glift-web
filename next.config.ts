/** @type {import('next').NextConfig} */
const nextConfig = {
  // Autres options ici
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wzdkuqxjcqrwrouobpxo.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        pathname: '/npm/@flagpack/core@*/svg/**',
      },
    ], // ✅ domaine Supabase autorisé
  },
};

module.exports = nextConfig;
