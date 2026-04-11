import { createClient } from "@/lib/supabaseClient";
import type { Database } from "@/lib/supabase/types";

type ProgramStoreRow = Database["public"]["Tables"]["program_store"]["Row"];
type ProgramsAdminRow = Database["public"]["Tables"]["programs_admin"]["Row"];
type TrainingsAdminRow = Database["public"]["Tables"]["trainings_admin"]["Row"];
type TrainingRowsAdminRow =
  Database["public"]["Tables"]["training_rows_admin"]["Row"];
type UserProgramPositionRow = { position: number | null };
type InsertedProgramRow = { id: string };
type InsertedTrainingRow = { id: string };

/**
 * Télécharge un programme depuis `program_store` en copiant les données sources
 * de `programs_admin`, `trainings_admin`, et `training_rows_admin` vers
 * `programs`, `trainings`, et `training_rows` de l'utilisateur.
 */
export async function downloadProgram(rawId: string): Promise<string | null> {
  const supabase = createClient();
  const storeProgramId = rawId.trim();

  // 1. Récupérer l'utilisateur connecté
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    console.error("Utilisateur non authentifié :", userError);
    return null;
  }

  let linkedProgramId: string | null = null;
  let shortName: string | null = null;
  let isFromStore = false;

  // 2. Obtenir le linked_program_id depuis program_store
  const { data: storeProgram } = await supabase
    .from("program_store")
    .select("linked_program_id, name_short")
    .eq("id", storeProgramId)
    .single<Pick<ProgramStoreRow, "linked_program_id" | "name_short">>();

  if (storeProgram?.linked_program_id) {
    linkedProgramId = storeProgram.linked_program_id;
    shortName = storeProgram.name_short ?? null;
    isFromStore = true;
    console.log("✅ ID trouvé dans program_store. linked_program_id :", linkedProgramId);
  } else {
    // Fallback: Check if it's a direct admin programs ID
    console.log("ℹ️ ID non trouvé dans program_store, vérification dans programs_admin...");
    const { data: adminProgram } = await supabase
      .from("programs_admin")
      .select("id, name")
      .eq("id", storeProgramId)
      .single();

    if (adminProgram) {
      linkedProgramId = adminProgram.id;
      shortName = adminProgram.name ?? null;
      console.log("✅ ID trouvé directement dans programs_admin.");
    }
  }

  if (!linkedProgramId) {
    console.error("❌ Impossible de retrouver le programme source (n'existe ni dans le store ni dans l'admin) pour l'ID :", storeProgramId);
    return null;
  }

  // 3. Récupérer le programme source dans programs_admin
  const { data: programToCopy, error: programError } = await supabase
    .from("programs_admin")
    .select("*")
    .eq("id", linkedProgramId)
    .single<ProgramsAdminRow>();

  if (programError || !programToCopy) {
    console.error("Erreur programme admin :", programError);
    return null;
  }

  console.log("✅ Programme admin récupéré :", programToCopy);

  // 4. Créer le programme utilisateur dans `programs`
    // 🔢 Récupérer la position max des programmes de l'utilisateur
    const { data: userPrograms, error: userProgramsError } = await supabase
    .from("programs")
    .select("position")
    .eq("user_id", user.id)
    .returns<UserProgramPositionRow[]>();

    if (userProgramsError) {
      console.error("Erreur récupération programmes utilisateur :", userProgramsError);
      return null;
    }

    const positions = (userPrograms ?? [])
      .map((p) => (typeof p.position === "number" ? p.position : 0));
    const nextPosition = positions.length > 0
        ? Math.max(...positions) + 1
        : 0;

    const insertObject = {
      name: shortName ?? programToCopy.name ?? "Programme copié",
      user_id: user.id,
      position: nextPosition,
      dashboard: true,
      app: true,
      created_at: new Date().toISOString(),
    };
    console.log("🛠️ Tentative insertion programme (minimaliste) :", insertObject);

    // ✅ Insertion du nouveau programme avec position
    const { data: insertedProgram, error: insertProgramError } = await supabase
    .from("programs")
    .insert([insertObject])
    .select()
    .single<InsertedProgramRow>();


  if (insertProgramError || !insertedProgram) {
    console.error("❌ Erreur insertion programme utilisateur :", JSON.stringify(insertProgramError, null, 2));
    return null;
  }

  const newProgramId = insertedProgram.id;
  console.log("✅ Nouveau programme utilisateur créé :", newProgramId);

  // 5. Récupérer les trainings_admin liés
  const { data: adminTrainings, error: trainingsError } = await supabase
    .from("trainings_admin")
    .select("*")
    .eq("program_id", linkedProgramId)
    .returns<TrainingsAdminRow[]>();

  if (trainingsError || !adminTrainings) {
    console.error("Erreur trainings_admin :", trainingsError);
    return newProgramId;
  }

  console.log(`✅ ${adminTrainings.length} trainings récupérés depuis trainings_admin.`);

  // 6. Copier les trainings dans `trainings`
  const trainingMapping: Record<string, string> = {}; // id admin ➜ id utilisateur

  for (const training of adminTrainings) {
    const { data: insertedTraining, error: insertTrainingError } = await supabase
      .from("trainings")
      .insert([
        {
          name: training.name,
          user_id: user.id,
          program_id: newProgramId,
          position: training.position ?? null,
          columns_settings: training.columns_settings ?? null,
          app: training.app ?? true,
        },
      ])
      .select()
      .single<InsertedTrainingRow>();

    if (insertTrainingError || !insertedTraining) {
      console.error("Erreur insertion training :", insertTrainingError);
      continue;
    }

    trainingMapping[training.id] = insertedTraining.id;
  }

  // 7. Récupérer les training_rows_admin
  const adminTrainingIds = Object.keys(trainingMapping);
  console.log("🧩 TrainingMapping (admin ➜ user) :", trainingMapping);
  console.log("🔍 IDs à chercher dans training_rows_admin :", adminTrainingIds);

  let rowsToCopy: TrainingRowsAdminRow[] = [];

  if (adminTrainingIds.length > 0) {
    const { data, error } = await supabase
      .from("training_rows_admin")
      .select("*")
      .in("training_id", adminTrainingIds)
      .returns<TrainingRowsAdminRow[]>();

    if (error) {
      console.error("❌ Erreur récupération training_rows_admin :", error);
    } else {
      rowsToCopy = data;
      console.log(`✅ ${rowsToCopy.length} lignes récupérées depuis training_rows_admin.`);
    }
  } else {
    console.warn("⚠️ Aucun training copié : pas de lignes à récupérer.");
  }

  // 8. Copier les lignes dans `training_rows`
  if (rowsToCopy.length > 0) {
    const rowsToInsert = rowsToCopy.map((row) => ({
      training_id: trainingMapping[row.training_id],
      user_id: user.id,
      order: row.order,
      series: row.series,
      repetitions: row.repetitions,
      poids: row.poids,
      repos: row.repos,
      effort: row.effort,
      checked: row.checked ?? false,
      created_at: row.created_at ?? new Date().toISOString(),
      updated_at: row.updated_at ?? new Date().toISOString(),
      exercice: row.exercice ?? "",
      materiel: row.materiel ?? "",
      superset_id: row.superset_id ?? null,
      link: row.link ?? null,
      note: row.note ?? null,
      position: row.position ?? null,
    }));

    const { error: insertRowsError } = await supabase
      .from("training_rows")
      .insert(rowsToInsert);

    if (insertRowsError) {
      console.error("❌ Erreur insertion training_rows :", insertRowsError);
    } else {
      console.log(`✅ ${rowsToInsert.length} lignes insérées dans training_rows.`);
    }
  }

  // 9. Incrémenter manuellement le champ `downloads` (uniquement si issu du store)
  if (isFromStore) {
    const { error: downloadsError } = await supabase.rpc("increment_downloads", {
      store_program_id: storeProgramId,
    });

    if (downloadsError) {
      console.error("❌ Erreur incrémentation téléchargements :", downloadsError);
    } else {
      console.log("✅ Nombre de téléchargements mis à jour.");
    }
  }

  return newProgramId;
}
