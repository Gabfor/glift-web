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
};

module.exports = nextConfig;
