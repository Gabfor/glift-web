import CreatePageClient from "./CreatePageClient";
import { createServerClient } from "@/lib/supabaseServer";
import { PageFormState, mapPageRowToForm } from "./pageForm";

export const dynamic = "force-dynamic";

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const idParam = resolvedSearchParams?.id;
  const pageId = typeof idParam === "string" && idParam.trim() !== "" ? idParam : null;

  let initialPage: PageFormState | null = null;
  if (pageId) {
    const supabase = await createServerClient();
    const { data, error } = await (supabase as any)
      .from("pages")
      .select("*")
      .eq("id", pageId)
      .maybeSingle();
    if (data && !error) {
      initialPage = mapPageRowToForm(data);
    }
  }

  return <CreatePageClient pageId={pageId} initialPage={initialPage} />;
}
