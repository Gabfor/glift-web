import CreateAuteurClient, { AuthorFormInitialState } from "./CreateAuteurClient";
import { createServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function CreateAuteurPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const idParam = resolvedSearchParams?.id;
  const auteurId = typeof idParam === "string" && idParam.trim() !== "" ? idParam : null;

  let initialAuteur: AuthorFormInitialState | null = null;
  if (auteurId) {
    const supabase = await createServerClient();
    const { data, error } = await (supabase as any)
      .from("auteurs")
      .select("*")
      .eq("id", auteurId)
      .maybeSingle();

    if (data && !error) {
      initialAuteur = {
        prenom: data.prenom || "",
        nom: data.nom || "",
        poste_actuel: data.poste_actuel || "",
        image_url: data.image_url || "",
        image_mobile: data.image_mobile || "",
        image_alt: data.image_alt || "",
        experience: data.experience || "",
        expertise: data.expertise || "",
        description_courte: data.description_courte || "",
        description: data.description || "",
        liens_sociaux:
          Array.isArray(data.liens_sociaux) && data.liens_sociaux.length > 0
            ? data.liens_sociaux
            : [{ platform: "", url: "" }],
        statut: data.statut !== undefined ? data.statut : true,
        langue: data.langue || "Français",
        is_shiny: Boolean(data.is_shiny),
      };
    }
  }

  return <CreateAuteurClient auteurId={auteurId} initialAuteur={initialAuteur} />;
}
