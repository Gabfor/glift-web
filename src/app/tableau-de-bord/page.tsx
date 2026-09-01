import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";
import DashboardClient from "@/app/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function TableauDeBordPage() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("pages")
    .select("surtitre, titre, description, url, is_published")
    .eq("id", "59822297-b8b2-4041-bfa6-03793221fcf6")
    .single();

  if (data) {
    if (data.is_published === false) {
      notFound();
    }
    if (data.url && data.url !== "tableau-de-bord") {
      redirect(`/${data.url}`);
    }
  }

  const initialPageContent = {
    surtitre: data?.surtitre ?? (data === null ? "Tableau de bord" : ""),
    titre: data?.titre || "Tableau de bord",
    description: data?.description ?? (data === null ? "Votre espace personnalisé de suivi." : ""),
  };

  return <DashboardClient initialPageContent={initialPageContent} />;
}
