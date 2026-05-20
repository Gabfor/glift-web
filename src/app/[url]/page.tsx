import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";
import BlogArticleBlocksRenderer from "@/app/blog/[url]/BlogArticleBlocksRenderer";
import DashboardClient from "@/app/dashboard/DashboardClient";

export const revalidate = 60;

export default async function LegalPage({ params }: { params: Promise<{ url: string }> }) {
  const resolvedParams = await params;
  const supabase = await createServerClient();
  
  // 1. Fetch legal page
  let isGenericPage = false;
  let { data: pages, error } = await (supabase as any)
    .from("legal_pages")
    .select("*")
    .eq("url", resolvedParams.url)
    .eq("is_published", true)
    .limit(1);

  if (error || !pages || pages.length === 0) {
    // 2. Fallback to generic page
    const { data: genericPages, error: genericError } = await (supabase as any)
      .from("pages")
      .select("*")
      .eq("url", resolvedParams.url)
      .eq("is_published", true)
      .limit(1);

    if (genericError || !genericPages || genericPages.length === 0) {
      notFound();
    }

    pages = genericPages;
    isGenericPage = true;
  }

  const page = pages[0];

  if (page.id === "59822297-b8b2-4041-bfa6-03793221fcf6") {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/connexion");
    }

    return (
      <DashboardClient
        initialPageContent={{
          surtitre: page.surtitre || "",
          titre: page.titre || "",
          description: page.description || "",
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] pt-[140px]">
      <div className="max-w-[1152px] mx-auto px-4 md:px-0">
        {page.surtitre && (
          <div className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide text-center">
            {page.surtitre}
          </div>
        )}
        <div 
          className={`text-[30px] font-bold text-[#2E3271] leading-tight text-center max-w-[760px] mx-auto ${isGenericPage && page.description ? "mb-[10px]" : !isGenericPage && page.updated_at ? "mb-[20px]" : "mb-[50px]"} prose-titles`}
          dangerouslySetInnerHTML={{ __html: page.titre }}
        />

        {page.description && (
          <div 
            className="text-[15px] sm:text-[16px] text-[#5D6494] font-semibold leading-relaxed max-w-[700px] mx-auto mb-[30px] text-center"
            dangerouslySetInnerHTML={{ __html: page.description }}
          />
        )}

        {!isGenericPage && page.updated_at && (
          <div className="text-[14px] text-[#5D6494] font-semibold text-center mb-[40px]">
            Dernière mise à jour : {new Date(page.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        )}

        <article className="w-full">
          <BlogArticleBlocksRenderer 
            blocks={page.content_blocks || []} 
            articleMeta={{}}
          />
        </article>
      </div>
    </main>
  );
}
