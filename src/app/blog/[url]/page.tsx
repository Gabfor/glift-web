import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createServerClient } from "@/lib/supabaseServer";
import BlogArticleBlocksRenderer from "./BlogArticleBlocksRenderer";
import RelatedArticles from "./RelatedArticles";
import Tooltip from "@/components/Tooltip";
import BlogListClient from "../BlogListClient";
import type { Metadata } from "next";

// Next.js Route Cache & revalidation (opt-in)
export const revalidate = 60;

const categoryMapping: Record<string, string> = {
  "nutrition": "Nutrition",
  "entrainement": "Entraînement",
  "entraînement": "Entraînement",
  "sante": "Santé",
  "santé": "Santé",
  "motivation": "Motivation",
  "lifestyle": "Lifestyle"
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ url: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const { url } = resolvedParams;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://glift.io';
  const slug = decodeURIComponent(url).toLowerCase();

  const supabase = await createServerClient();

  // 1. Tente de récupérer un article de blog
  const { data: articles } = await (supabase.from("blog_articles") as any)
    .select("titre, description, image_url, image_alt, langue, seo_title, seo_description, noindex, nofollow, canonical_override, auteur")
    .eq("url", url)
    .eq("is_published", true)
    .limit(1);

  if (articles && articles.length > 0) {
    const article = articles[0];
    const isoLang = article.langue && article.langue.toLowerCase().includes('ang') ? 'en' : 'fr';
    
    const languages: Record<string, string> = {};
    if (isoLang === 'fr') {
      languages['fr'] = `${siteUrl}/blog/${url}`;
      languages['en'] = `${siteUrl}/en/blog/${url}`;
    } else {
      languages['en'] = `${siteUrl}/blog/${url}`;
      languages['fr'] = `${siteUrl}/fr/blog/${url}`;
    }

    const title = article.seo_title || article.titre || "";
    const plainTitle = title.replace(/<[^>]*>/g, "").trim();
    const description = article.seo_description || article.description || "";
    const plainDescription = description.replace(/<[^>]*>/g, "").trim();

    const robots: any = {};
    if (article.noindex) robots.index = false;
    if (article.nofollow) robots.follow = false;

    const authorName = (article as any).auteur || "Glift";

    return {
      title: plainTitle,
      description: plainDescription,
      authors: [{ name: authorName }],
      publisher: "Glift",
      robots: Object.keys(robots).length > 0 ? robots : undefined,
      alternates: {
        canonical: article.canonical_override || `/blog/${url}`,
        languages: languages,
      },
      openGraph: article.image_url ? {
        images: [{ url: article.image_url, alt: article.image_alt || article.titre }],
      } : undefined,
    };
  }

  // 2. Tente de voir si c'est une catégorie
  const categoryName = categoryMapping[slug];
  if (categoryName) {
    return {
      title: `Conseils & Programmes ${categoryName}`,
      description: `Découvrez tous nos articles et programmes de musculation dédiés à la catégorie ${categoryName}.`,
      alternates: {
        canonical: `/blog/${url}`,
      },
    };
  }

  return {};
}

export default async function BlogArticlePage({ params }: { params: Promise<{ url: string }> }) {
  const resolvedParams = await params;
  const { url } = resolvedParams;
  const supabase = await createServerClient();
  const slug = decodeURIComponent(url).toLowerCase();

  // Fetch blog dynamic URL
  const { data: blogConfig } = await supabase
    .from("pages")
    .select("url")
    .eq("id", "f9709b0b-b513-4d53-a6ef-d9cda3f0a706")
    .single();

  if (blogConfig?.url && blogConfig.url !== "blog") {
    redirect(`/${blogConfig.url}/${url}`);
  }

  const blogUrl = blogConfig?.url ? `/${blogConfig.url}` : "/blog";

  // 1. Fetch article
  const { data: articles, error } = await (supabase.from("blog_articles") as any)
    .select("*")
    .eq("url", url) // Use original param for article lookup
    .eq("is_published", true)
    .limit(1);

  if (!error && articles && articles.length > 0) {
    const article = articles[0];
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://glift.io';
    const isoLang = article.langue && article.langue.toLowerCase().includes('ang') ? 'en-US' : 'fr-FR';
    const authorName = (article as any).auteur || "Glift";

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              "headline": article.titre,
              "description": article.description,
              "inLanguage": isoLang,
              "image": article.image_url ? [article.image_url] : [],
              "datePublished": article.created_at,
              "dateModified": article.updated_at || article.created_at,
              "author": {
                "@type": "Organization",
                "name": authorName,
                "url": siteUrl
              },
              "publisher": {
                "@type": "Organization",
                "name": "Glift",
                "logo": {
                  "@type": "ImageObject",
                  "url": `${siteUrl}/logo-glift.svg`
                }
              },
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `${siteUrl}/blog/${url}`
              }
            })
          }}
        />
        <main className="min-h-screen bg-[#FBFCFE] pt-[140px]">
          {/* Container pour le fil d'ariane aligné à gauche */}
          <div className="max-w-[1152px] mx-auto px-4 mb-[20px]">
            <div className="flex items-center gap-[10px] text-[12px] font-semibold text-[#5D6494]">
              <Link href={blogUrl} className="hover:text-[#2E3271] transition-colors">Blog</Link>
              <span>›</span>
              <Link href={`${blogUrl}/${(article.categorie || "Conseils").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} className="hover:text-[#2E3271] transition-colors">
                {article.categorie || "Conseils"}
              </Link>
              <span>›</span>
              <span className="text-[#3A416F] truncate max-w-[200px] sm:max-w-none">{article.titre}</span>
            </div>
          </div>

          <div className="max-w-[760px] mx-auto px-4 md:px-0">
            <h1 className="text-[30px] font-bold text-[#2E3271] leading-tight mb-[15px] text-center">
              {article.titre}
            </h1>

            <p className="text-[16px] text-[#5D6494] font-semibold mb-[20px] text-left">
              {article.description}
            </p>

            <div className="flex justify-between items-center mb-[20px] gap-[10px]">
              <div className="flex justify-start items-center gap-[5px] flex-wrap">
                {article.type === "Programme" ? (
                  <>
                    {article.niveau && (
                      <div className="bg-[#F4F5FE] text-[#A1A5FD] text-[12px] font-semibold px-[12px] h-[30px] rounded-[5px] inline-flex items-center">
                        <span>{article.niveau}</span>
                      </div>
                    )}
                    {article.nombre_seances && (
                      <div className="bg-[#F4F5FE] text-[#A1A5FD] text-[12px] font-semibold px-[12px] h-[30px] rounded-[5px] inline-flex items-center">
                        <span>{article.nombre_seances} {Number(article.nombre_seances) <= 1 ? "séance" : "séances"}</span>
                      </div>
                    )}
                    {article.duree_moyenne && (
                      <div className="bg-[#F4F5FE] text-[#A1A5FD] text-[12px] font-semibold px-[12px] h-[30px] rounded-[5px] inline-flex items-center">
                        <span>{article.duree_moyenne} min</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-[#F4F5FE] text-[#A1A5FD] text-[12px] font-semibold px-[12px] h-[30px] rounded-[5px] inline-flex items-center">
                    <span>{article.categorie || "Lifestyle"}</span>
                  </div>
                )}

                {(article.sexe === "Homme" || article.sexe === "Femme" || article.sexe === "Tous") && (
                  <div className="bg-[#F4F5FE] w-[30px] h-[30px] rounded-[5px] flex items-center justify-center">
                    <Image 
                      src={article.sexe === "Homme" ? "/icons/homme.svg" : article.sexe === "Femme" ? "/icons/femme.svg" : "/icons/mixte.svg"} 
                      alt={article.sexe} 
                      width={16} 
                      height={16} 
                    />
                  </div>
                )}
              </div>

              {article.is_ai_generated && (
                <Tooltip 
                  content={article.type === "Programme" ? "Programme généré avec l'aide de l'IA" : "Article généré avec l'aide de l'IA"}
                  placement="top"
                  delay={0}
                  offset={20}
                  asChild={true}
                >
                  <div className="w-[30px] h-[30px] flex items-center justify-center">
                    <Image 
                      src="/icons/IA.svg" 
                      alt="IA" 
                      width={30} 
                      height={30} 
                    />
                  </div>
                </Tooltip>
              )}
            </div>

            {/* Image principale */}
            {article.image_url && (
              <div className="w-full relative aspect-video bg-[#F4F5FE] rounded-[15px] overflow-hidden mb-[40px] shadow-[0_4px_12px_rgba(93,100,148,0.05)]">
                <Image
                  src={article.image_url}
                  alt={article.image_alt || article.titre}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
            )}

            {/* Contenu dynamique */}
            <article className="mb-[50px]">
              <BlogArticleBlocksRenderer 
                blocks={article.content_blocks || []} 
                articleMeta={{
                  objectif: article.objectif,
                  nombre_seances: article.nombre_seances,
                  duree_moyenne: article.duree_moyenne,
                  nombre_semaines: article.nombre_semaines,
                  lieu: article.lieu,
                  intensite: article.intensite,
                  sexe: article.sexe,
                  niveau: article.niveau,
                }}
              />
            </article>

          </div>

          {/* Section pleine largeur / ou max-w-1152px pour les articles liés */}
          <div className="bg-[#FBFCFE]">
            <div className="max-w-[760px] mx-auto px-4 md:px-0">
              <RelatedArticles
                articleLie1Id={article.article_lie_1_id}
                articleLie2Id={article.article_lie_2_id}
              />
            </div>
          </div>
        </main>
      </>
    );
  }

  // 2. Check if it's a category
  const categoryName = categoryMapping[slug];
  if (categoryName) {
    const { data: allArticles } = await (supabase.from("blog_articles") as any)
      .select("id, url, titre, description, image_url, image_alt, type, categorie, sexe, is_featured, niveau, nombre_seances, duree_moyenne")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    return (
      <main className="min-h-screen bg-[#FBFCFE] pt-[140px] px-4">
        <div className="max-w-[1152px] mx-auto text-center flex flex-col items-center">
          <h1 className="text-[30px] font-bold text-[#2E3271] mb-2 text-center prose-titles [&_p]:m-0 uppercase">
            {categoryName}
          </h1>
          <div className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] text-center max-w-[700px] mx-auto leading-relaxed mb-8 [&_p]:m-0">
            <p>
              Découvrez tous nos articles sur le thème <strong>{categoryName}</strong>.
            </p>
          </div>
        </div>

        <BlogListClient initialArticles={allArticles || []} initialCategory={categoryName} />
      </main>
    );
  }

  notFound();
}
