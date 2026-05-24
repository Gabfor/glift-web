import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BlogArticleBlocksRenderer from "./blog/[url]/BlogArticleBlocksRenderer";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data: page } = await supabase
    .from("pages")
    .select("titre, description, seo_title, seo_description, noindex, nofollow, canonical_override")
    .eq("url", "concept")
    .single();

  if (!page) return {};

  const title = page.seo_title || page.titre || "Accueil";
  const plainTitle = title.replace(/<[^>]*>/g, "").trim();
  const description = page.seo_description || page.description || "";
  const plainDescription = description.replace(/<[^>]*>/g, "").trim();

  const robots: any = {};
  if (page.noindex) robots.index = false;
  if (page.nofollow) robots.follow = false;

  return {
    title: plainTitle,
    description: plainDescription,
    robots: Object.keys(robots).length > 0 ? robots : undefined,
    alternates: {
      canonical: page.canonical_override || "/",
    },
  };
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/entrainements");
  }

  // Fetch the page designated as the homepage (url: 'concept')
  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("url", "concept")
    .single();

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#5D6494]">Page d'accueil en cours de configuration...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] pt-[140px]">
      <div className="max-w-[1152px] mx-auto px-4 md:px-0">
        {/* Hero Section from Page Data */}
        <section className="text-center mb-[20px]">
          {page.surtitre && (
            <div className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide">
              {page.surtitre}
            </div>
          )}

          <div 
            className="text-[24px] sm:text-[32px] md:text-[30px] font-bold leading-snug text-[#2E3271] mb-[10px]"
            dangerouslySetInnerHTML={{ __html: page.titre }}
          />

          {page.description && (
            <div 
              className="text-[15px] sm:text-[16px] text-[#5D6494] font-semibold leading-relaxed max-w-[700px] mx-auto mb-[20px] prose prose-sm max-w-none [&_p]:mb-0"
              dangerouslySetInnerHTML={{ __html: page.description }}
            />
          )}
        </section>

        {/* Dynamic Blocks */}
        <BlogArticleBlocksRenderer blocks={page.content_blocks as any[]} />
      </div>
      
    </main>
  );
}