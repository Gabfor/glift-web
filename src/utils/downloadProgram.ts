import { createClient } from "@/lib/supabaseClient";

/**
 * Télécharge un programme depuis `program_store` en copiant les données sources
 * de `programs_admin`, `trainings_admin`, et `training_rows_admin` vers
 * `programs`, `trainings`, et `training_rows` de l'utilisateur.
 */
export async function downloadProgram(storeProgramId: number): Promise<string | null> {
  const supabase = createClient();

  // 1. Récupérer l'utilisateur connecté
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    console.error("Utilisateur non authentifié :", userError);
    return null;
  }

  // 2. Obtenir le linked_program_id depuis program_store
  const { data: storeProgram, error: storeError } = await supabase
    .from("program_store")
    .select("linked_program_id")
    .eq("id", storeProgramId)
    .single();

  if (storeError || !storeProgram?.linked_program_id) {
    console.error("Impossible de retrouver le linked_program_id :", storeError);
    return null;
  }

  const linkedProgramId = storeProgram.linked_program_id;
  console.log("✅ linked_program_id récupéré :", linkedProgramId);

  // 3. Récupérer le programme source dans programs_admin
  const { data: programToCopy, error: programError } = await supabase
    .from("programs_admin")
    .select("*")
    .eq("id", linkedProgramId)
    .single();

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
    .eq("user_id", user.id);

    if (userProgramsError) {
      console.error("Erreur récupération programmes utilisateur :", userProgramsError);
      return null;
    }

    const nextPosition =
    userPrograms && userPrograms.length > 0
        ? Math.max(...userPrograms.map((p) => p.position ?? 0)) + 1
        : 0;

    // ✅ Insertion du nouveau programme avec position
    const { data: insertedProgram, error: insertProgramError } = await supabase
    .from("programs")
    .insert([
        {
        name: programToCopy.name || programToCopy.title || "Programme copié",
        user_id: user.id,
        created_at: new Date().toISOString(),
        position: nextPosition,
        is_new: true,
        source_store_id: storeProgramId,
        },
    ])
    .select()
    .single();


  if (insertProgramError || !insertedProgram) {
    console.error("Erreur insertion programme utilisateur :", insertProgramError);
    return null;
  }

  const newProgramId = insertedProgram.id;
  console.log("✅ Nouveau programme utilisateur créé :", newProgramId);

  // 5. Récupérer les trainings_admin liés
  const { data: adminTrainings, error: trainingsError } = await supabase
    .from("trainings_admin")
    .select("*")
    .eq("program_id", linkedProgramId);

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
          dashboard: training.dashboard ?? true,
        },
      ])
      .select()
      .single();

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

  let rowsToCopy = [];

  if (adminTrainingIds.length > 0) {
    const { data, error } = await supabase
      .from("training_rows_admin")
      .select("*")
      .in("training_id", adminTrainingIds);

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

  // 9. Incrémenter manuellement le champ `downloads`
  const { error: downloadsError } = await supabase.rpc('increment_downloads', {
    store_program_id: storeProgramId,
  });

  if (downloadsError) {
    console.error("❌ Erreur incrémentation téléchargements :", downloadsError);
  } else {
    console.log("✅ Nombre de téléchargements mis à jour.");
  }

  return newProgramId;
}
