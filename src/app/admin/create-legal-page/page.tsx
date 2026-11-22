import CreateLegalPageClient from "./CreateLegalPageClient";
import { createServerClient } from "@/lib/supabaseServer";
import { LegalPageFormState, mapLegalPageRowToForm } from "./legalPageForm";

export const dynamic = "force-dynamic";

export default async function CreateLegalPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const idParam = resolvedSearchParams?.id;
  const pageId = typeof idParam === "string" && idParam.trim() !== "" ? idParam : null;

  let initialPage: LegalPageFormState | null = null;
  if (pageId) {
    const supabase = await createServerClient();
    const { data, error } = await (supabase as any)
      .from("legal_pages")
      .select("*")
      .eq("id", pageId)
      .maybeSingle();
    if (data && !error) {
      initialPage = mapLegalPageRowToForm(data);
    }
  }

  return <CreateLegalPageClient pageId={pageId} initialPage={initialPage} />;
}
