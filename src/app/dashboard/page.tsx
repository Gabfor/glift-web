import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("pages")
    .select("surtitre, titre, description, url")
    .eq("id", "59822297-b8b2-4041-bfa6-03793221fcf6")
    .single();

  if (data && data.url && data.url !== "dashboard") {
    redirect(`/${data.url}`);
  }

  const initialPageContent = {
    surtitre: data?.surtitre ?? (data === null ? "Dashboard" : ""),
    titre: data?.titre || "Tableau de bord",
    description: data?.description ?? (data === null ? "Votre espace personnalisé de suivi." : ""),
  };

  return <DashboardClient initialPageContent={initialPageContent} />;
}
