import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";
import EntrainementsClient from "./EntrainementsClient";

export const dynamic = "force-dynamic";

export default async function EntrainementsPage() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("pages")
    .select("surtitre, titre, description, url, is_published")
    .eq("id", "90c6b3f6-1b46-4711-8882-28177874b51d")
    .single();

  if (data) {
    if (data.is_published === false) {
      notFound();
    }
    if (data.url && data.url !== "entrainements") {
      redirect(`/${data.url}`);
    }
  }

  const initialPageContent = {
    surtitre: data?.surtitre ?? "",
    titre: data?.titre || "Entraînements",
    description: data?.description ?? "Gérez vos programmes et vos entraînements.",
  };

  return <EntrainementsClient initialPageContent={initialPageContent} />;
}
