import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";
import AideClient from "./AideClient";

export const dynamic = "force-dynamic";

export default async function AidePage() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("pages")
    .select("surtitre, titre, description, url, is_published")
    .eq("id", "eb40db10-0d10-47af-b102-62e2763bef86")
    .single();

  if (data) {
    if (data.is_published === false) {
      notFound();
    }
    if (data.url && data.url !== "aide") {
      redirect(`/${data.url}`);
    }
  }

  const initialPageContent = {
    surtitre: data?.surtitre ?? "",
    titre: data?.titre || "Aide",
    description: data?.description ?? "Retrouvez les questions les plus fréquemment posées par nos utilisateurs.",
  };

  return <AideClient initialPageContent={initialPageContent} />;
}
