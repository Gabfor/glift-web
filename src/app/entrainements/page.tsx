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
      redirect("/");
    }
    if (data.url && data.url !== "entrainements") {
      redirect(`/${data.url}`);
    }
  }

  const initialPageContent = {
    surtitre: data?.surtitre ?? "",
    titre: data?.titre || "Entraînements",
    description: data?.description ?? "Organise tes entraînements et choisis les séances que tu souhaites synchroniser dans ton app ou sur ton tableau de bord.",
  };

  let initialStructure: { trainingCount: number }[] | undefined = undefined;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      const { data: programsData } = await supabase
        .from("programs")
        .select("id, position, trainings(id)")
        .eq("user_id", user.id)
        .order("position", { ascending: true });

      if (programsData && programsData.length > 0) {
        const filtered = programsData.filter((p, index) => {
          const count = Array.isArray(p.trainings) ? p.trainings.length : 0;
          const isLast = index === programsData.length - 1;
          return count > 0 || isLast;
        });

        if (filtered.length > 0) {
          initialStructure = filtered.map((p) => ({
            trainingCount: Array.isArray(p.trainings) ? p.trainings.length : 0,
          }));
        }
      }
    }
  } catch (err) {
    // Fallback silencieux vers le cache client
  }

  return (
    <EntrainementsClient
      initialPageContent={initialPageContent}
      initialStructure={initialStructure}
    />
  );
}
