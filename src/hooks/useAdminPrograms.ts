"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { notifyTrainingChange } from "@/components/ProgramEditor";
import type { Program, Training } from "@/types/training";

export default function useAdminPrograms() {
  const [programs, setPrograms] = useState<any[]>([]);
  const supabase = useSupabaseClient();

  const fetchProgramsWithTrainings = useCallback(async () => {
    console.log("🟣 [fetchProgramsWithTrainings] Démarrage");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log("👤 user =", user, "error =", userError);

    if (userError || !user?.id) {
      console.error("❌ Erreur ou pas de user");
      return;
    }

    // ✅ Charger tous les programmes
    const { data: programsData, error: programsError } = await supabase
      .from("programs_admin")
      .select("id, name, position, user_id")
      .eq("user_id", user.id)
      .order("position", { ascending: true });

    console.log("📦 programsData =", programsData, "error =", programsError);

    if (programsError) {
      console.error("❌ Erreur récupération programs_admin :", programsError);
      return;
    }

    // ✅ Charger tous les trainings
    const { data: trainingsData, error: trainingsError } = await supabase
      .from("trainings_admin")
      .select("id, name, program_id, position, app, dashboard, user_id")
      .eq("user_id", user.id);

    console.log("📦 trainingsData =", trainingsData, "error =", trainingsError);

    if (trainingsError) {
      console.error("❌ Erreur récupération trainings_admin :", trainingsError);
      return;
    }

    // ✅ Associer côté client
    const trainingsByProgramId: Record<string, Training[]> = {};
    (trainingsData ?? []).forEach(t => {
      if (t.program_id) {
        if (!trainingsByProgramId[t.program_id]) {
          trainingsByProgramId[t.program_id] = [];
        }
        trainingsByProgramId[t.program_id].push(t);
      }
    });

    let result = (programsData ?? []).map((p) => ({
      ...p,
      trainings: (trainingsByProgramId[p.id] ?? []).sort((a, b) => a.position - b.position)
    }));

    // ✅ Ajouter les orphelins
    const orphanTrainings = (trainingsData ?? []).filter(t => !t.program_id);
    console.log("🧭 orphanTrainings =", orphanTrainings);

    if (orphanTrainings.length > 0) {
    result.push({
      id: null,
      user_id: user.id,
      name: "Non assignés",
      position: result.length,
      trainings: orphanTrainings.sort((a, b) => a.position - b.position),
    });
    }

  // ✅ On ne rajoute jamais de programme vide automatiquement
  result = result.filter(p => p.trainings.length > 0);

    console.log("✅ Résultat final des programs =", result);
    setPrograms(result);
  }, [supabase]);

  useEffect(() => {
    fetchProgramsWithTrainings();
  }, [fetchProgramsWithTrainings]);

  const cleanEmptyPrograms = async () => {
    const emptyPrograms = programs.filter(p => p.trainings.length === 0);
    const nonEmptyPrograms = programs.filter(p => p.trainings.length > 0);

    if (emptyPrograms.length === 0) return;

    // 🟣 on garde un seul programme vide, de préférence le dernier
    const programsToKeep = new Set<string>();
    const lastProgram = programs[programs.length - 1];
    if (lastProgram && lastProgram.trainings.length === 0) {
      programsToKeep.add(lastProgram.id);
    } else {
      const lastEmpty = emptyPrograms[emptyPrograms.length - 1];
      if (lastEmpty) programsToKeep.add(lastEmpty.id);
    }

    const toDelete = emptyPrograms.filter(p => !programsToKeep.has(p.id));
    if (toDelete.length === 0) return;

    await supabase
      .from("programs_admin")
      .delete()
      .in("id", toDelete.map(p => p.id));

    // ✅ on met à jour le state en une seule fois
    setPrograms(prev =>
      prev.filter(p => !toDelete.some(d => d.id === p.id))
    );
  };

  const handleReorderTrainings = async (programId: string | null, ids: string[]) => {
    console.log("📥 handleReorderTrainings appelé", programId, ids);

    const currentTrainings = programs.find((p) => p.id === programId)?.trainings.map((t: any) => t.id) || [];

    const isSameOrder = ids.length === currentTrainings.length && ids.every((id, idx) => id === currentTrainings[idx]);

    console.log("🧪 currentTrainings =", currentTrainings);
    console.log("🧪 ids à sauvegarder =", ids);
    console.log("🔍 DONNÉES ENVOYÉES À SUPABASE :", ids);

    if (isSameOrder) return;

    await Promise.all(
      ids.map((id, index) => {
        console.log("🔄 Mise à jour Supabase :", id, "→ position", index);
        return supabase.from("trainings_admin").update({ position: index }).eq("id", id);
      })
    );

    const updated = [...programs];
    const target = updated.find((p) => p.id === programId);
    if (target) {
      target.trainings = ids.map((id) =>
        target.trainings.find((t: any) => t.id === id)!
      );
      setPrograms(updated);
    }
  };

  const handleDuplicateTraining = async (programId: string, trainingId: string) => {
    const { data: original, error: originalError } = await supabase
      .from("trainings_admin")
      .select("*")
      .eq("id", trainingId)
      .single();

    if (originalError || !original) {
      console.error("Erreur récupération training original:", originalError);
      return;
    }

    const originalPosition = original.position;

    // ✅ 1️⃣ Décaler en BDD les autres trainings après la position dupliquée
    const { data: trainingsToShift, error: fetchToShiftError } = await supabase
      .from("trainings_admin")
      .select("*")
      .eq("program_id", programId)
      .gt("position", originalPosition);

    if (fetchToShiftError) {
      console.error("Erreur récupération des trainings à décaler :", fetchToShiftError);
      return;
    }

    if (trainingsToShift && trainingsToShift.length > 0) {
      for (const training of trainingsToShift) {
        await supabase
          .from("trainings_admin")
          .update({ position: training.position + 1 })
          .eq("id", training.id);
      }
    }

    // ✅ 2️⃣ Créer la copie en BDD
    const { data: duplicated, error: duplicateError } = await supabase
      .from("trainings_admin")
      .insert({
        ...original,
        id: undefined,
        name: `${original.name} (copie)`,
        position: originalPosition + 1,
      })
      .select()
      .single();

    if (duplicateError || !duplicated) {
      console.error("Erreur duplication training:", duplicateError);
      return;
    }

    // ✅ 3️⃣ Copier aussi les training_rows
    const { data: originalRows, error: rowsError } = await supabase
      .from("trainings_rows_admin")
      .select("*")
      .eq("training_id", trainingId)
      .order("order", { ascending: true });

    if (rowsError) {
      console.error("Erreur récupération training_rows:", rowsError);
      return;
    }

    if (originalRows && originalRows.length > 0) {
      const rowsToInsert = originalRows.map((row, index) => ({
        training_id: duplicated.id,
        user_id: row.user_id,
        order: index + 1,
        series: row.series,
        repetitions: row.repetitions,
        poids: row.poids,
        repos: row.repos,
        effort: row.effort,
        checked: row.checked,
        exercice: row.exercice,
        materiel: row.materiel,
        superset_id: row.superset_id,
        link: row.link,
        note: row.note,
      }));

      const { error: insertError } = await supabase
        .from("trainings_rows_admin")
        .insert(rowsToInsert);

      if (insertError) {
        console.error("Erreur insertion training_rows copiées:", insertError);
      }
    }

    // ✅ 4️⃣ Mise à jour locale du state avec décalage
    const updatedPrograms = programs.map((p) => {
      if (p.id === programId) {
        const index = p.trainings.findIndex((t: any) => t.id === trainingId);
        const newTrainings = p.trainings.map((t: Training, i: number) => {
          if (i > index) {
            return { ...t, position: t.position + 1 };
          }
          return t;
        });
        newTrainings.splice(index + 1, 0, duplicated);
        return {
          ...p,
          trainings: newTrainings,
        };
      }
      return p;
    });
    setPrograms(updatedPrograms);
  };

async function handleSubmit(index: number) {
  const program = programs[index];

  if (!program || !program.id) {
    const { data, error } = await supabase
      .from("programs_admin")
      .insert({ name: "Nouveau programme" })
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de la création d’un programme :", error);
      return;
    }

    const newProgram: Program = {
      ...data,
      trainings: [],
    };

    setPrograms((prev) => {
      const newPrograms = [...prev];
      newPrograms.splice(index, 0, newProgram); // insère au bon index
      return newPrograms;
    });

    return newProgram;
  }

  // Met à jour un programme existant
  const { error } = await supabase
    .from("programs_admin")
    .update({ name: program.name })
    .eq("id", program.id);

  if (error) {
    console.error("Erreur lors de la mise à jour du programme :", error);
  }

  return program;
}

  const handleAddTraining = async (programId: string | null = null) => {
    let targetId = programId && programId !== '' ? programId : null;
    const index = programs.findIndex(p => p.id === programId);
    console.log("📦 handleAddTraining — reçu :", programId);

    if (!targetId || targetId === '') {
      const newIndex = programs.findIndex(p => !p.id);
      if (newIndex !== -1) {
        const submitted = await handleSubmit(newIndex);
        targetId = submitted?.id;
      }
    }

    if (!targetId) {
      alert("Erreur : impossible de déterminer un programme pour cet entraînement.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;

    const { data } = await supabase
      .from("trainings_admin")
      .insert({
        user_id: user.id,
        name: "Nom de l’entraînement",
        program_id: targetId,
        position: programs.find(p => p.id === targetId)?.trainings.length ?? 0,
      })
      .select()
      .single();

    if (!data) return;

    const updatedPrograms = [...programs];
    const programIdx = updatedPrograms.findIndex(p => p.id === targetId);

    if (programIdx !== -1) {
      updatedPrograms[programIdx] = {
        ...updatedPrograms[programIdx],
        trainings: [
          ...updatedPrograms[programIdx].trainings,
          {
            id: data.id,
            name: data.name,
            program_id: data.program_id,
            position: data.position,
            app: data.app,
            dashboard: data.dashboard,
          },
        ],
      };

      if (programIdx === updatedPrograms.length - 1) {
        const { data: newProgram } = await supabase
          .from("programs_admin")
          .insert({
            name: "Nom du programme",
            user_id: user.id,
            position: updatedPrograms.length
          })
          .select()
          .single();

        if (newProgram) {
          updatedPrograms.push({ id: newProgram.id, name: newProgram.name, position: newProgram.position, trainings: [] });
        }
      }
    }

    setPrograms(updatedPrograms);
    notifyTrainingChange(targetId);
    return data ?? null;
  };

  const handleDeleteTraining = async (programId: string, trainingId: string) => {
    const { error } = await supabase.from("trainings_admin").delete().eq("id", trainingId);
    if (error) {
      console.error("Erreur lors de la suppression :", error);
      return;
    }

    let updated = [...programs];
    const idx = updated.findIndex(p => p.id === programId);
    if (idx !== -1) {
      updated[idx].trainings = updated[idx].trainings.filter((t: Training) => t.id !== trainingId);

      const isEmpty = updated[idx].trainings.length === 0;
      const hasOtherPrograms = updated.filter(p => p.id !== programId).length > 0;

      if (isEmpty && hasOtherPrograms) {
        await supabase.from("programs_admin").delete().eq("id", programId);
        updated = updated.filter((p) => p.id !== programId);
      }

      setPrograms(updated);
      notifyTrainingChange(programId);
    }
  };

  const handleChangeName = (index: number, newName: string) => {
    const updated = [...programs];
    updated[index].name = newName;
    setPrograms(updated);
  };

  const handleDeleteProgram = async (programId: string) => {
    // 1️⃣ Supprimer tous les trainings du programme
    await supabase.from("trainings_admin").delete().eq("program_id", programId);

    // 2️⃣ Supprimer le programme lui-même
    await supabase.from("programs_admin").delete().eq("id", programId);

    console.log("✅ Programme supprimé :", programId);

    // 3️⃣ Rafraîchir la liste complète
    const { data: refreshed, error } = await supabase
      .from("programs_admin")
      .select("id, name, position, user_id")
      .order("position", { ascending: true });

    if (error) {
      console.error("Erreur fetch après suppression :", error);
      return;
    }

    if (!refreshed) return;

    // 4️⃣ Filtrer la liste sans le programme supprimé
    const cleaned = refreshed.filter(p => p.id !== programId);

    // 5️⃣ Ré-assigner les positions de 0 à n-1
    const corrected = cleaned.map((p, index) => ({
      ...p,
      position: index
    }));

    // 6️⃣ Sauvegarder en BDD toutes les nouvelles positions
    await Promise.all(corrected.map(p =>
      supabase
        .from("programs_admin")
        .update({ position: p.position })
        .eq("id", p.id)
    ));

    console.log("✅ Positions corrigées en BDD");

    // 7️⃣ Mettre à jour le state local
    setPrograms(prev =>
      prev
        .filter(p => p.id !== programId)
        .map(p =>
          p.position > cleaned.find(cp => cp.id === programId)?.position
            ? { ...p, position: p.position - 1 }
            : p
        )
    );

    // 8️⃣ Optionnel : re-fetch pour être 100% synchro
    await fetchProgramsWithTrainings();
  };

  const handleDuplicateProgram = async (index: number) => {
  if (index < 0 || index >= programs.length) return;

  const programToDuplicate = programs[index];
  if (!programToDuplicate) return;

  // 1️⃣ Décaler les positions des programmes suivants
  const programsToShift = programs.slice(index + 1);

  for (const p of programsToShift) {
    await supabase
      .from("programs_admin")
      .update({ position: p.position + 1 })
      .eq("id", p.id);
  }

  // 2️⃣ Créer le programme dupliqué en BDD avec la bonne position
  const { data: newProgram, error: insertError } = await supabase
    .from("programs_admin")
    .insert({
      name: `${programToDuplicate.name} (copie)`,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      position: programToDuplicate.position + 1,
    })
    .select()
    .single();

  if (insertError || !newProgram) {
    console.error("Erreur duplication programme :", insertError);
    return;
  }

  // 3️⃣ Copier les trainings associés
  if (programToDuplicate.trainings.length > 0) {
    // ✅ Récupère l'userId UNE FOIS avant le map
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const duplicatedTrainings = programToDuplicate.trainings.map((t: Training) => {
      const { id, program_id, ...rest } = t;
      return {
        ...rest,
        program_id: newProgram.id,
        user_id: userId,
      };
    });

    await supabase
      .from("trainings_admin")
      .insert(duplicatedTrainings);
  }

  // 4️⃣ Rafraîchir localement la liste des programmes
  await fetchProgramsWithTrainings();
};

  const moveTrainingToAnotherProgram = async (
    trainingId: string,
    sourceProgramId: string,
    targetProgramId: string,
    newPosition: number
  ) => {
    const targetProgram = programs.find(p => p.id === targetProgramId);
    const wasEmpty = (targetProgram?.trainings.filter((t: Training) => t.id !== trainingId).length ?? 0) === 0;
    const isLastProgram = programs[programs.length - 1]?.id === targetProgramId;

    console.log("🧪 PROGRAMME CIBLE :", targetProgram);
    console.log("🔍 Était vide :", wasEmpty);
    console.log("🔍 Était dernier :", isLastProgram);

    // 👉 Récupération du training déplacé
    const { data: training, error: fetchError } = await supabase
      .from("trainings_admin")
      .select("*")
      .eq("id", trainingId)
      .single();

    if (fetchError || !training) {
      console.error("Erreur récupération training", fetchError);
      return;
    }

    // 👉 Mise à jour program_id et position en BDD
    await supabase
      .from("trainings_admin")
      .update({ program_id: targetProgramId, position: newPosition })
      .eq("id", trainingId);

    // 👉 Mise à jour locale immédiate
    const updatedPrograms = programs.map((program) => {
      if (program.id === sourceProgramId) {
        return {
          ...program,
          trainings: program.trainings.filter((t: Training) => t.id !== trainingId),
        };
      }
      if (program.id === targetProgramId) {
        const filtered = program.trainings.filter((t: Training) => t.id !== training.id);
        return {
          ...program,
          trainings: [
            ...filtered.slice(0, newPosition),
            training,
            ...filtered.slice(newPosition),
          ],
        };
      }
      return program;
    });

    console.log("[DEBUG] ✅ updatedPrograms après insertion locale =", updatedPrograms);

    // 👉 Calcul des nouvelles positions à sauvegarder en BDD
    const newIds = updatedPrograms
      .find(p => p.id === targetProgramId)?.trainings.map((t: Training) => t.id) ?? [];

    const updates = newIds.map((id: string, index: number) => ({ id, position: index }));

    console.log("[DEBUG] ✅ updates à envoyer en BDD =", updates);
    for (const update of updates) {
      await supabase.from("trainings_admin").update({ position: update.position }).eq("id", update.id);
    }

    // ✅ Nettoyage des programmes vides (en mémoire)
    const cleaned = updatedPrograms.filter((p, index, arr) => {
      const isEmpty = p.trainings.length === 0;
      const isLast = index === arr.length - 1;
      return !isEmpty || isLast;
    });

    console.log("[DEBUG] ✅ cleaned prêt à afficher =", cleaned);
    setPrograms(cleaned);

    // ✅ Supprime physiquement en BDD les programmes vides intermédiaires
    const toDelete = updatedPrograms.filter((p, index, arr) => {
      const isEmpty = p.trainings.length === 0;
      const isLast = index === arr.length - 1;
      return isEmpty && !isLast;
    });

    if (toDelete.length > 0) {
      await supabase.from("programs_admin").delete().in("id", toDelete.map(p => p.id));
      console.log("🗑️ Programmes supprimés :", toDelete.map(p => p.id));
    }

    // ✅ Ajoute un programme vide automatique si besoin
    if (wasEmpty && isLastProgram) {
      console.log("🧪 AJOUT D'UN PROGRAMME vide car wasEmpty && isLastProgram sont vrais");
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;

      const { data: newProgram, error } = await supabase
        .from("programs_admin")
        .insert({ name: "Nom du programme", user_id: userId })
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur lors de la création du programme vide :", error);
        return;
      }

      setPrograms(prev =>
        prev.concat({ ...newProgram, trainings: [] })
      );

      console.log("✅ Nouveau programme vide ajouté automatiquement :", newProgram.id);
    }

    // ✅ Réordonne localement uniquement (pas de refetch)
    reorderTrainingsLocally(targetProgramId, newIds);

    // ✅ Important : plus d'appel inutile à handleReorderTrainings qui causait le va-et-vient visuel
    // await handleReorderTrainings(targetProgramId, newIds);

    console.log("✅ Sauvegarde terminée pour", targetProgramId, newIds);
  };

  const handleUpdateTrainingVisibility = async (
    trainingId: string,
    updates: Partial<{ app: boolean; dashboard: boolean }>
  ) => {
    const { data, error } = await supabase
      .from("trainings_admin")
      .update(updates)
      .eq("id", trainingId)
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de la mise à jour de la visibilité :", error);
      return;
    }

    setPrograms((prev) =>
      prev.map((program) => ({
        ...program,
        trainings: program.trainings.map((t: Training) =>
          t.id === trainingId ? { ...t, ...updates } : t
        ),
      }))
    );
  };

  const reorderTrainingsLocally = (programId: string, orderedIds: string[]) => {
    setPrograms((prev) =>
      prev.map((program) =>
        program.id === programId
          ? {
              ...program,
              trainings: orderedIds
                .map((id) =>
                  program.trainings.find((t: typeof program.trainings[number]) => t.id === id)
                )
                .filter((t): t is typeof program.trainings[number] => !!t),
            }
          : program
      )
    );
  };

  const moveTrainingLocally = (
    training: Training,
    fromProgramId: string,
    toProgramId: string,
    position: number
  ) => {
    setPrograms((prev: Program[]) => {
      const alreadyInTarget = prev
        .find((p: Program) => p.id === toProgramId)
        ?.trainings.some((t: Training) => t.id === training.id);

      return prev.map((program: Program): Program => {
        if (program.id === fromProgramId) {
          return {
            ...program,
            trainings: program.trainings.filter((t: Training) => t.id !== training.id),
          };
        }
        if (program.id === toProgramId) {
          let newTrainings: Training[] = [...program.trainings];

          if (!alreadyInTarget) {
            newTrainings.splice(position, 0, training);
          } else {
            newTrainings = newTrainings.filter((t: Training) => t.id !== training.id);
            newTrainings.splice(position, 0, training);
          }

          return {
            ...program,
            trainings: newTrainings,
          };
        }
        return program;
      });
    });
  };

  const updateAllProgramPositionsInSupabase = async (programList: Program[]) => {
    // Met à jour en BDD toutes les positions d'un coup
    await Promise.all(
      programList.map((p, idx) =>
        supabase
          .from("programs_admin")
          .update({ position: idx })
          .eq("id", p.id)
      )
    );
  };

  const moveProgramUp = async (index: number) => {
    if (index <= 0) return;

    // Échange localement
    const updated = [...programs];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];

    // Réattribue les positions cohérentes
    const reindexed = updated.map((p, i) => ({ ...p, position: i }));
    setPrograms(reindexed);

    // Sauvegarde en BDD
    await updateAllProgramPositionsInSupabase(reindexed);
  };

  const moveProgramDown = async (index: number) => {
    if (index >= programs.length - 1) return;

    // Échange localement
    const updated = [...programs];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];

    // Réattribue les positions cohérentes
    const reindexed = updated.map((p, i) => ({ ...p, position: i }));
    setPrograms(reindexed);

    // Sauvegarde en BDD
    await updateAllProgramPositionsInSupabase(reindexed);
  };

  return {
    programs,
    setPrograms,
    fetchProgramsWithTrainings,
    handleReorderTrainings,
    handleDuplicateTraining,
    handleSubmit,
    handleAddTraining,
    handleDeleteTraining,
    handleChangeName,
    handleDeleteProgram,
    moveTrainingToAnotherProgram,
    handleUpdateTrainingVisibility,
    reorderTrainingsLocally,
    moveTrainingLocally,
    moveProgramUp,
    moveProgramDown,
    handleDuplicateProgram,
  };
}
