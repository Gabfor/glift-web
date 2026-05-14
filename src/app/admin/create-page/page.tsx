import CreatePageClient from "./CreatePageClient";

export const dynamic = "force-dynamic";

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const idParam = resolvedSearchParams?.id;
  const pageId = typeof idParam === "string" && idParam.trim() !== "" ? idParam : null;

  return <CreatePageClient pageId={pageId} />;
}
