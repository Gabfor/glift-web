import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";
import BlogArticleBlocksRenderer from "@/app/blog/[url]/BlogArticleBlocksRenderer";

export const revalidate = 60;

export default async function LegalPage({ params }: { params: { url: string } }) {
  const supabase = await createServerClient();
  
  // 1. Fetch legal page
  const { data: pages, error } = await (supabase as any)
    .from("legal_pages")
    .select("*")
    .eq("url", params.url)
    .eq("is_published", true)
    .limit(1);

  if (error || !pages || pages.length === 0) {
    notFound();
  }

  const page = pages[0];

  return (
    <main className="min-h-screen bg-[#FBFCFE] pt-[140px]">
      <div className="max-w-[760px] mx-auto px-4 md:px-0">
        <h1 className={`text-[30px] font-bold text-[#2E3271] leading-tight text-center ${page.updated_at ? "mb-[20px]" : "mb-[50px]"}`}>
          {page.titre}
        </h1>

        {page.updated_at && (
          <p className="text-[14px] text-[#5D6494] font-semibold text-center mb-[40px]">
            Dernière mise à jour : {new Date(page.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}

        <article>
          <BlogArticleBlocksRenderer 
            blocks={page.content_blocks || []} 
            articleMeta={{}}
          />
        </article>
      </div>
    </main>
  );
}
