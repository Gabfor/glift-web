"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { notifyTrainingChange } from "@/components/ProgramEditor";
import type { Program, Training } from "@/types/training";

type ProgramWithTrainings = Program & {
  position?: number;
};

export default function usePrograms() {
  const [programs, setPrograms] = useState<ProgramWithTrainings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useSupabaseClient();

  const fetchProgramsWithTrainings = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.id) {
        setPrograms([]);
        return;
      }

      let { data: programsData } = await supabase
        .from("programs")
        .select(`id, name, position, trainings(id, name, program_id, position, app, dashboard)`)
        .eq("user_id", user.id)
        .order("position", { ascending: true });

      if (!programsData || programsData.length === 0) {
        const { data: newProgram } = await supabase
          .from("programs")
          .insert({ name: "Nom du programme", user_id: user.id })
          .select()
          .single();
        if (newProgram) {
          programsData = [{ ...newProgram, trainings: [] }];
        }
      }

      const existingPrograms = (programsData || []).map((p) => ({
        ...p,
        trainings: (p.trainings || []).sort((a, b) => a.position - b.position),
      }));

      let result = [...existingPrograms];
      const hasEmpty = result.some(p => p.trainings.length === 0);
      if (!hasEmpty) {
        const { data: { user: refreshedUser } } = await supabase.auth.getUser();
        if (refreshedUser?.id) {
          const { data: newProgram } = await supabase
            .from("programs")
            .insert({ name: "Nom du programme", user_id: refreshedUser.id })
            .select()
            .single();

          if (newProgram) {
            result.push({ ...newProgram, trainings: [] });
          }
        }
      } else {
        const nonEmpty = result.filter(p => p.trainings.length > 0);
        const emptyPrograms = result.filter(p => p.trainings.length === 0);
        result = [...nonEmpty, ...emptyPrograms];
      }

      setPrograms(result);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProgramsWithTrainings();
  }, [fetchProgramsWithTrainings]);

  const handleReorderTrainings = async (programId: string | null, ids: string[]) => {

    const currentTrainings =
      programs.find((p) => p.id === programId)?.trainings.map((t: Training) => t.id) || [];

    const isSameOrder =
      ids.length === currentTrainings.length && ids.every((id, idx) => id === currentTrainings[idx]);

    if (isSameOrder) return;

    await Promise.all(
      ids.map((id, index) =>
        supabase.from("trainings").update({ position: index }).eq("id", id)
      )
    );

    const updated = [...programs];
    const target = updated.find((p) => p.id === programId);
    if (target) {
      target.trainings = ids
        .map((id) => target.trainings.find((t: Training) => t.id === id))
        .filter((training): training is Training => Boolean(training));
      setPrograms(updated);
    }
  };

  const handleDuplicateTraining = async (programId: string, trainingId: string) => {
    const { data: original, error: originalError } = await supabase
      .from("trainings")
      .select("*")
      .eq("id", trainingId)
      .single();

    if (originalError || !original) {
      return;
    }

    const originalPosition = original.position;
    const { data: trainingsToShift, error: fetchToShiftError } = await supabase
      .from("trainings")
      .select("*")
      .eq("program_id", programId)
      .gt("position", originalPosition);

    if (fetchToShiftError) {
      return;
    }

    if (trainingsToShift && trainingsToShift.length > 0) {
      for (const training of trainingsToShift) {
        await supabase
          .from("trainings")
          .update({ position: training.position + 1 })
          .eq("id", training.id);
      }
    }
    const { data: duplicated, error: duplicateError } = await supabase
      .from("trainings")
      .insert({
        ...original,
        id: undefined,
        name: `${original.name} (copie)`,
        position: originalPosition + 1,
      })
      .select()
      .single();

    if (duplicateError || !duplicated) {
      return;
    }
    const { data: originalRows, error: rowsError } = await supabase
      .from("training_rows")
      .select("*")
      .eq("training_id", trainingId)
      .order("order", { ascending: true });

    if (rowsError) {
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
        .from("training_rows")
        .insert(rowsToInsert);

      if (insertError) {
        return;
      }
    }
    const updatedPrograms = programs.map((p) => {
      if (p.id === programId) {
        const index = p.trainings.findIndex((t: Training) => t.id === trainingId);
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

  const handleSubmit = async (index: number) => {
    const name = programs[index]?.name?.trim();
    if (!name) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;

    const existingProgram = programs[index];
    if (!existingProgram) return null;

    const orphanTrainings = existingProgram.trainings || [];
    const safeName = name || "Nom du programme";

    let result;
    if (existingProgram?.id) {
      const { data } = await supabase
        .from("programs")
        .update({ name })
        .eq("id", existingProgram.id)
        .eq("user_id", user.id)
        .select()
        .single();
      result = data;
    } else {
      const { data } = await supabase
        .from("programs")
        .insert({ name: safeName, user_id: user.id })
        .select()
        .single();
      result = data;
    }

    if (result?.id && orphanTrainings.length > 0) {
      const orphanIds = orphanTrainings.map((t: { id: string }) => t.id);
      await supabase.from("trainings").update({ program_id: result.id }).in("id", orphanIds);
    }

    const updatedPrograms = [...programs];
    updatedPrograms[index] = { id: result.id, name: result.name, trainings: updatedPrograms[index]?.trainings || [] };

    setPrograms(updatedPrograms);
    return updatedPrograms[index];
  };

  const handleAddTraining = async (programId: string | null = null) => {
    let targetId = programId && programId !== '' ? programId : null;

    if (!targetId || targetId === '') {
      const newIndex = programs.findIndex(p => !p.id);
      if (newIndex !== -1) {
        const submitted = await handleSubmit(newIndex);
        targetId = submitted?.id ?? null;
      }
    }

    if (!targetId) {
      alert("Erreur : impossible de déterminer un programme pour cet entraînement.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;

    const { data } = await supabase
      .from("trainings")
      .insert({
        user_id: user.id,
        name: "Nom de l'entraînement",
        program_id: targetId,
        position: programs.find(p => p.id === targetId)?.trainings.length ?? 0,
      })
      .select()
      .single();

    if (!data) return;

    const defaultRow = {
      training_id: data.id,
      user_id: user.id,
      order: 0,
      series: 4,
      repetitions: Array(4).fill(""),
      poids: Array(4).fill(""),
      repos: "",
      effort: Array(4).fill("parfait"),
      checked: false,
      exercice: "",
      materiel: "",
      superset_id: null,
      link: "",
      note: "",
    };

    const { error: firstRowError } = await supabase
      .from("training_rows")
      .insert(defaultRow);

    if (firstRowError) {
      console.error("❌ Erreur création première ligne entraînement :", firstRowError);
    }

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
          .from("programs")
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
    const { error } = await supabase.from("trainings").delete().eq("id", trainingId);
    if (error) {
      return;
    }

    let updated = [...programs];
    const idx = updated.findIndex(p => p.id === programId);
    if (idx !== -1) {
      updated[idx].trainings = updated[idx].trainings.filter((t: Training) => t.id !== trainingId);

      const isEmpty = updated[idx].trainings.length === 0;
      const hasOtherPrograms = updated.filter(p => p.id !== programId).length > 0;

      if (isEmpty && hasOtherPrograms) {
        await supabase.from("programs").delete().eq("id", programId);
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
    const removedProgramPosition = programs.find(p => p.id === programId)?.position ?? null;

    await supabase.from("trainings").delete().eq("program_id", programId);
    await supabase.from("programs").delete().eq("id", programId);
    const { data: refreshed, error } = await supabase
      .from("programs")
      .select("id, name, position, user_id")
      .order("position", { ascending: true });

    if (error) {
      return;
    }

    if (!refreshed) return;
    const cleaned = refreshed.filter(p => p.id !== programId);
    const corrected = cleaned.map((p, index) => ({
      ...p,
      position: index
    }));
    await Promise.all(corrected.map(p =>
      supabase
        .from("programs")
        .update({ position: p.position })
        .eq("id", p.id)
    ));
    setPrograms(prev =>
      prev
        .filter(p => p.id !== programId)
        .map(p => {
          if (removedProgramPosition === null || typeof p.position !== "number") {
            return p;
          }

          return p.position > removedProgramPosition
            ? { ...p, position: p.position - 1 }
            : p;
        })
    );
    await fetchProgramsWithTrainings();
  };

  const handleDuplicateProgram = async (index: number) => {
    if (index < 0 || index >= programs.length) return;

    const programToDuplicate = programs[index];
    if (!programToDuplicate) return;

    const programsToShift = programs.slice(index + 1);
    for (const program of programsToShift) {
      const nextPosition = (program.position ?? 0) + 1;
      await supabase
        .from("programs")
        .update({ position: nextPosition })
        .eq("id", program.id);
    }

    const {
      data: newProgram,
      error: insertError,
    } = await supabase
      .from("programs")
      .insert({
        name: `${programToDuplicate.name} (copie)`,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        position: (programToDuplicate.position ?? index) + 1,
      })
      .select()
      .single();

    if (insertError || !newProgram) {
      return;
    }

    if (programToDuplicate.trainings.length > 0) {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const duplicatedTrainings = programToDuplicate.trainings.map((training: Training) => ({
        ...training,
        id: undefined,
        program_id: newProgram.id,
        user_id: userId,
      }));

      await supabase
        .from("trainings")
        .insert(duplicatedTrainings);
    }

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
    const { data: training, error: fetchError } = await supabase
      .from("trainings")
      .select("*")
      .eq("id", trainingId)
      .single();

    if (fetchError || !training) {
      return;
    }
    await supabase
      .from("trainings")
      .update({ program_id: targetProgramId, position: newPosition })
      .eq("id", trainingId);
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
    const newIds = updatedPrograms
      .find(p => p.id === targetProgramId)?.trainings.map((t: Training) => t.id) ?? [];

    const updates = newIds.map((id: string, index: number) => ({ id, position: index }));
    for (const update of updates) {
      await supabase.from("trainings").update({ position: update.position }).eq("id", update.id);
    }
    const cleaned = updatedPrograms.filter((p, index, arr) => {
      const isEmpty = p.trainings.length === 0;
      const isLast = index === arr.length - 1;
      return !isEmpty || isLast;
    });
    setPrograms(cleaned);
    const toDelete = updatedPrograms.filter((p, index, arr) => {
      const isEmpty = p.trainings.length === 0;
      const isLast = index === arr.length - 1;
      return isEmpty && !isLast;
    });

    if (toDelete.length > 0) {
      await supabase.from("programs").delete().in("id", toDelete.map(p => p.id));
    }
    if (wasEmpty && isLastProgram) {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;

      const { data: newProgram, error } = await supabase
        .from("programs")
        .insert({ name: "Nom du programme", user_id: userId })
        .select()
        .single();

      if (error) {
        return;
      }

      setPrograms(prev =>
        prev.concat({ ...newProgram, trainings: [] })
      );
    }
    reorderTrainingsLocally(targetProgramId, newIds);
  };

  const handleUpdateTrainingVisibility = async (
    trainingId: string,
    updates: Partial<{ app: boolean; dashboard: boolean }>
  ) => {
    const { error } = await supabase
      .from("trainings")
      .update(updates)
      .eq("id", trainingId)
      .select()
      .single();

    if (error) {
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
    setPrograms((prev: ProgramWithTrainings[]) => {
      const alreadyInTarget = prev
        .find((p: ProgramWithTrainings) => p.id === toProgramId)
        ?.trainings.some((t: Training) => t.id === training.id);

      return prev.map((program: ProgramWithTrainings): ProgramWithTrainings => {
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

  const updateAllProgramPositionsInSupabase = async (programList: ProgramWithTrainings[]) => {
    await Promise.all(
      programList.map((p, idx) =>
        supabase
          .from("programs")
          .update({ position: idx })
          .eq("id", p.id)
      )
    );
  };

  const moveProgramUp = async (index: number) => {
    if (index <= 0) return;
    const updated = [...programs];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    const reindexed = updated.map((p, i) => ({ ...p, position: i }));
    setPrograms(reindexed);
    await updateAllProgramPositionsInSupabase(reindexed);
  };

  const moveProgramDown = async (index: number) => {
    if (index >= programs.length - 1) return;
    const updated = [...programs];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    const reindexed = updated.map((p, i) => ({ ...p, position: i }));
    setPrograms(reindexed);
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
    isLoading,
  };
}
