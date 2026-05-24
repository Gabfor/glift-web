import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 3600; // Cache le sitemap pendant 1 heure en production

// Utilitaire pour mapper la langue de la DB au format ISO 639-1
function mapDbLanguageToIso(dbLang: string | null): string {
  if (!dbLang) return 'fr';
  const langLower = dbLang.toLowerCase();
  if (langLower.includes('ang') || langLower.includes('eng')) return 'en';
  if (langLower.includes('esp')) return 'es';
  return 'fr'; // Français par défaut
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://glift.io';

  // Client Supabase léger anonyme (sans cookies) pour le sitemap
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. URLs structurelles statiques de base
  const staticUrls = [
    { url: `${siteUrl}`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${siteUrl}/shop`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${siteUrl}/store`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${siteUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${siteUrl}/aide`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.5 },
    { url: `${siteUrl}/connexion`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${siteUrl}/inscription`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
  ];

  // 2. Récupération des pages personnalisées de la table "pages"
  const { data: dbPages } = await supabase
    .from('pages')
    .select('url, updated_at, langue')
    .eq('is_published', true);

  const dbPageUrls = (dbPages || [])
    .filter(page => page.url && !['concept', 'blog', 'shop', 'store', 'contact', 'aide'].includes(page.url))
    .map(page => {
      const isoLang = mapDbLanguageToIso(page.langue);
      // Pour les futures routes multilingues (ex: /en/boutique)
      const path = isoLang === 'fr' ? `/${page.url}` : `/${isoLang}/${page.url}`;
      return {
        url: `${siteUrl}${path}`,
        lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });

  // 3. Récupération des mentions légales de la table "legal_pages"
  const { data: dbLegalPages } = await supabase
    .from('legal_pages')
    .select('url, updated_at, langue')
    .eq('is_published', true);

  const dbLegalPageUrls = (dbLegalPages || []).map(page => {
    const isoLang = mapDbLanguageToIso(page.langue);
    const path = isoLang === 'fr' ? `/${page.url}` : `/${isoLang}/${page.url}`;
    return {
      url: `${siteUrl}${path}`,
      lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    };
  });

  // 4. Récupération et indexation des articles de blog
  const { data: dbArticles } = await supabase
    .from('blog_articles')
    .select('url, created_at, updated_at, langue')
    .eq('is_published', true);

  const blogBaseUrl = 'blog';
  const articleUrls = (dbArticles || []).map(article => {
    const isoLang = mapDbLanguageToIso(article.langue);
    const path = isoLang === 'fr' ? `/${blogBaseUrl}/${article.url}` : `/${isoLang}/${blogBaseUrl}/${article.url}`;
    return {
      url: `${siteUrl}${path}`,
      lastModified: article.updated_at ? new Date(article.updated_at) : article.created_at ? new Date(article.created_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    };
  });

  // Catégories du blog
  const categories = ['nutrition', 'entrainement', 'sante', 'motivation', 'lifestyle'];
  const categoryUrls = categories.map(cat => ({
    url: `${siteUrl}/${blogBaseUrl}/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [...staticUrls, ...dbPageUrls, ...dbLegalPageUrls, ...articleUrls, ...categoryUrls];
}
