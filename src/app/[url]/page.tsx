import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";
import BlogArticleBlocksRenderer from "@/app/blog/[url]/BlogArticleBlocksRenderer";

export const revalidate = 60;

export default async function LegalPage({ params }: { params: { url: string } }) {
  const supabase = await createServerClient();
  
  // 1. Fetch legal page
  let isGenericPage = false;
  let { data: pages, error } = await (supabase as any)
    .from("legal_pages")
    .select("*")
    .eq("url", params.url)
    .eq("is_published", true)
    .limit(1);

  if (error || !pages || pages.length === 0) {
    // 2. Fallback to generic page
    const { data: genericPages, error: genericError } = await (supabase as any)
      .from("pages")
      .select("*")
      .eq("url", params.url)
      .eq("is_published", true)
      .limit(1);

    if (genericError || !genericPages || genericPages.length === 0) {
      notFound();
    }

    pages = genericPages;
    isGenericPage = true;
  }

  const page = pages[0];

  return (
    <main className="min-h-screen bg-[#FBFCFE] pt-[140px]">
      <div className="max-w-[760px] mx-auto px-4 md:px-0">
        {page.surtitre && (
          <p className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide text-center">
            {page.surtitre}
          </p>
        )}
        <h1 
          className={`text-[30px] font-bold text-[#2E3271] leading-tight text-center ${!isGenericPage && page.updated_at ? "mb-[20px]" : "mb-[50px]"}`}
          dangerouslySetInnerHTML={{ __html: page.titre }}
        />

        {!isGenericPage && page.updated_at && (
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
