import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://glift.io';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/dashboard/',
        '/compte/',
        '/suivi/',
        '/visualisation/',
        '/notation/',
        '/entrainements/',
        '/post-inscription/',
        '/api/',
        '/deconnexion/',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
