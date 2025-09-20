import type { SupabaseClient } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";

export async function fetchProgramsWithTrainings(
  supabase: SupabaseClient,
  pathname?: string
) {
  const isAdmin = pathname?.includes("/admin");
  const programsTable = isAdmin ? "programs_admin" : "programs";
  const trainingsTable = isAdmin ? "trainings_admin" : "trainings";

  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  const user = userData?.user ?? null;
  if (!isAdmin && (userError || !user?.id)) {
    return { programs: [], programNames: [] };
  }

  const query = supabase
    .from(programsTable)
    .select(`id, name, ${trainingsTable}(id, name, program_id)`);

  if (!isAdmin && user?.id) {
    query.eq("user_id", user.id);
  }

  const { data, error } = await query;

  const orphanQuery = supabase
    .from(trainingsTable)
    .select("id, name")
    .is("program_id", null);

  if (!isAdmin && user?.id) {
    orphanQuery.eq("user_id", user.id);
  }

  const { data: orphanTrainings, error: orphanError } = await orphanQuery;

  if (error || orphanError) {
    console.error("❌ Erreur Supabase (fetch programs or orphans) :", error || orphanError);
    return { programs: [], programNames: [] };
  }

  const existingPrograms = (data || []).map((p: any) => {
    const trainings = p[trainingsTable] ?? [];
    return {
      id: p.id,
      name: p.name,
      trainings,
    };
  });

  if (existingPrograms.length === 0 && (!orphanTrainings || orphanTrainings.length === 0)) {
    const insertData: any = { name: "" };
    if (!isAdmin && user?.id) insertData.user_id = user.id;

    const { data: newProgram, error: insertError } = await supabase
      .from(programsTable)
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error("❌ Erreur création automatique du programme :", insertError);
      return { programs: [], programNames: [] };
    }

    existingPrograms.push({ id: newProgram.id, name: newProgram.name, trainings: [] });
  }

  const result = [...existingPrograms];

  if (orphanTrainings && orphanTrainings.length > 0) {
    const enriched = orphanTrainings.map((t: any) => ({ ...t, program_id: null }));
    result.push({ id: "temp", name: "", trainings: enriched });
  }

  const storedOrder = localStorage.getItem("glift_program_order");
  if (storedOrder) {
    const order = JSON.parse(storedOrder);
    result.sort((a, b) => {
      const indexA = order.indexOf(a.id);
      const indexB = order.indexOf(b.id);
      return (indexA === -1 ? 9999 : indexA) - (indexB === -1 ? 9999 : indexB);
    });
  }

  const lastProgram = result[result.length - 1];
  if (lastProgram?.id && lastProgram.trainings.length > 0) {
    result.push({ id: "", name: "", trainings: [] });
  }

  return {
    programs: result,
    programNames: result.map((p) => p.name || "Nom du programme"),
  };
}