import CreateBlogArticlePageClient from "./CreateBlogArticlePageClient";
import { createServerClient } from "@/lib/supabaseServer";
import { mapDbArticleToFormState, BlogArticleFormState } from "./blogArticleForm";

export const dynamic = "force-dynamic";

export default async function CreateBlogArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const idParam = resolvedSearchParams?.id;
  const articleId = typeof idParam === "string" && idParam.trim() !== "" ? idParam : null;

  const supabase = await createServerClient();

  const [authorsRes, articleRes] = await Promise.all([
    supabase
      .from("auteurs")
      .select("prenom, nom")
      .order("prenom", { ascending: true }),
    articleId
      ? (supabase.from("blog_articles") as any)
          .select("*")
          .eq("id", articleId)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const initialAuthors = authorsRes.data || [];
  const initialArticle: BlogArticleFormState | null =
    articleRes.data && !articleRes.error ? mapDbArticleToFormState(articleRes.data) : null;

  return (
    <CreateBlogArticlePageClient
      articleId={articleId}
      initialArticle={initialArticle}
      initialAuthors={initialAuthors}
    />
  );
}
