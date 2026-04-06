import { createServerClient } from "@/lib/supabaseServer";
import BlogListClient from "./BlogListClient";

export const revalidate = 60; // Mise à jour auto toutes les minutes

export default async function BlogPage() {
  const supabase = await createServerClient();
  
  const { data: articles, error } = await (supabase.from("blog_articles") as any)
    .select("id, url, titre, description, image_url, image_alt, type, categorie")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#FBFCFE] pt-[140px] pb-[100px]">
      <div className="max-w-[1152px] mx-auto text-center mb-16 px-4">
        <h1 className="text-[30px] sm:text-[40px] font-bold text-[#2E3271] mb-4 uppercase tracking-tight">
          Blog
        </h1>
        <p className="text-[16px] sm:text-[18px] font-semibold text-[#5D6494] mb-8">
          Découvrez nos conseils, programmes et astuces pour progresser
          <br className="hidden sm:block" />
          et atteindre vos objectifs, quel que soit votre niveau.
        </p>
        <div className="max-w-[800px] mx-auto bg-[#F4F5FE] rounded-[15px] p-[25px] text-[#A1A5FD] text-[14px] font-semibold text-left border border-[#E6E6FF] shadow-sm">
          Que votre objectif soit la prise de masse musculaire, la perte de gras (sèche) ou le développement de votre force, vous êtes au bon endroit. Découvrez nos conseils d'entraînement, ainsi que nos programmes de musculation complets et détaillés, adaptés aux débutants comme aux pratiquants confirmés. Ne laissez plus vos résultats au hasard, passez au niveau supérieur.
        </div>
      </div>

      <BlogListClient initialArticles={articles || []} />
    </main>
  );
}
