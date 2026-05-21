import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";
import BlogListClient from "./BlogListClient";

export const revalidate = 60; // Mise à jour auto toutes les minutes

const BLOG_PAGE_ID = "f9709b0b-b513-4d53-a6ef-d9cda3f0a706";
const DEFAULT_BLOG_TEXT = "Que votre objectif soit la <strong>prise de masse musculaire</strong>, la <strong>perte de gras (sèche)</strong> ou le <strong>développement de votre force</strong>, vous êtes au bon endroit. Découvrez nos conseils d'entraînement, ainsi que nos programmes de musculation complets et détaillés, adaptés aux débutants comme aux pratiquants confirmés. Ne laissez plus vos résultats au hasard, <strong>passez au niveau supérieur</strong>.";

export default async function BlogPage() {
  const supabase = await createServerClient();
  
  // 1. Fetch page configuration
  const { data: pageConfig } = await supabase
    .from("pages")
    .select("is_published, surtitre, titre, description, url, content_blocks")
    .eq("id", BLOG_PAGE_ID)
    .single();

  if (pageConfig) {
    if (!pageConfig.is_published) {
      notFound();
    }
    if (pageConfig.url && pageConfig.url !== "blog") {
      redirect(`/${pageConfig.url}`);
    }
  }

  // 2. Fetch blog articles
  const { data: articles } = await (supabase.from("blog_articles") as any)
    .select("id, url, titre, description, image_url, image_alt, type, categorie, sexe, is_featured, niveau, nombre_seances, duree_moyenne")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  // 3. Extract extra text from content_blocks
  let extraText = DEFAULT_BLOG_TEXT;
  if (pageConfig?.content_blocks) {
    const blocks = pageConfig.content_blocks as any || [];
    const textBlock = Array.isArray(blocks) ? blocks.find((b: any) => b.type === "texte") : null;
    if (textBlock && textBlock.texte) {
      extraText = textBlock.texte;
    }
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] pt-[140px] px-4">
      <div className="max-w-[1152px] mx-auto text-center flex flex-col items-center">
        {pageConfig?.surtitre && (
          <div className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide text-center">
            {pageConfig.surtitre}
          </div>
        )}
        <h1 
          className="text-[30px] font-bold text-[#2E3271] mb-2 text-center prose-titles [&_p]:m-0"
          dangerouslySetInnerHTML={{ __html: pageConfig?.titre || "Blog" }}
        />
        {pageConfig?.description && (
          <div 
            className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] mb-8 text-center max-w-[700px] mx-auto leading-relaxed [&_p]:m-0"
            dangerouslySetInnerHTML={{ __html: pageConfig.description }}
          />
        )}
        {extraText && (
          <div 
            className="w-full max-w-[1152px] mx-auto bg-[#F7F7FF] rounded-[10px] p-[25px] text-[#5D6494] text-[14px] font-semibold text-left [&_strong]:text-[#3A416F] [&_b]:text-[#3A416F] [&_p]:mt-0 [&_p]:mb-4 last:[&_p]:mb-0"
            dangerouslySetInnerHTML={{ __html: extraText }}
          />
        )}
      </div>

      <BlogListClient initialArticles={articles || []} />
    </main>
  );
}
