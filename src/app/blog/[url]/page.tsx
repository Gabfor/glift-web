import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createServerClient } from "@/lib/supabaseServer";
import BlogArticleBlocksRenderer from "./BlogArticleBlocksRenderer";
import RelatedArticles from "./RelatedArticles";

// Next.js Route Cache & revalidation (opt-in)
export const revalidate = 60;

export default async function BlogArticlePage({ params }: { params: { url: string } }) {
  const supabase = await createServerClient();

  // Fetch article
  const { data: articles, error } = await (supabase.from("blog_articles") as any)
    .select("*")
    .eq("url", params.url)
    .eq("is_published", true)
    .limit(1);

  if (error || !articles || articles.length === 0) {
    notFound();
  }

  const article = articles[0];

  return (
    <>
      <main className="min-h-screen bg-[#FBFCFE] pt-[140px] pb-[40px]">
        {/* Container pour le fil d'ariane aligné à gauche */}
        <div className="max-w-[1152px] mx-auto px-4 mb-[20px]">
          <div className="flex items-center gap-[10px] text-[12px] font-semibold text-[#5D6494]">
            <Link href="/blog" className="hover:text-[#2E3271] transition-colors">Blog</Link>
            <span>›</span>
            <span>{article.categorie || "Conseils"}</span>
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

          <div className="flex justify-start items-center gap-[10px] mb-[20px]">
            <div className="bg-[#F4F5FE] text-[#A1A5FD] text-[12px] font-semibold px-[12px] h-[30px] rounded-[5px] inline-flex items-center">
              <span>{article.categorie || "Lifestyle"}</span>
            </div>
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
          <article className="mb-[60px]">
            <BlogArticleBlocksRenderer blocks={article.content_blocks || []} />
          </article>

        </div>

        {/* Section pleine largeur / ou max-w-1152px pour les articles liés */}
        <div className="bg-white">
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
