import CreateBlogArticlePageClient from "./CreateBlogArticlePageClient";

export const dynamic = "force-dynamic";

export default async function CreateBlogArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const idParam = resolvedSearchParams?.id;
  const articleId = typeof idParam === "string" && idParam.trim() !== "" ? idParam : null;

  // In a real application, you would fetch the initial article data here if articleId is present.
  
  return <CreateBlogArticlePageClient articleId={articleId} />;
}
