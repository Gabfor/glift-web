import CreateHelpClient, { HelpFormInitialState } from "./CreateHelpClient";
import { createServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function CreateHelpPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const idParam = resolvedSearchParams?.id;
  const helpId = typeof idParam === "string" && idParam.trim() !== "" ? idParam : null;

  let initialHelp: HelpFormInitialState | null = null;
  if (helpId) {
    const supabase = await createServerClient();
    const { data, error } = await (supabase.from("help_questions") as any)
      .select("*")
      .eq("id", helpId)
      .maybeSingle();

    if (data && !error) {
      initialHelp = {
        question: data.question || "",
        answer: data.answer || "",
        categories: data.categories || [],
        status: data.status || "ON",
        langue: data.langue || "Français",
        display: data.display || "Les deux",
      };
    }
  }

  return <CreateHelpClient helpId={helpId} initialHelp={initialHelp} />;
}
