import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const SESSION_COUNT = 8;
const SESSION_GAP_DAYS = 4;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const roundToNearest = (value: number, step = 1) =>
  Math.round(value / step) * step;

type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T];

type ProgramRow = Tables<"programs">["Row"];
type TrainingInsert = Tables<"trainings">["Insert"];
type TrainingRowInsert = Tables<"training_rows">["Insert"];
type TrainingSessionInsert = Tables<"training_sessions">["Insert"];
type SessionExerciseInsert = Tables<"training_session_exercises">["Insert"];
type SessionSetInsert = Tables<"training_session_sets">["Insert"];

type ExerciseDefinition = {
  name: string;
  material: string;
  series: number;
  repetitionRange: [number, number];
  weightRange: [number, number];
  rest: string;
};

type TrainingDefinition = {
  name: string;
  exercises: ExerciseDefinition[];
};

const PROGRAM_DEFINITION: { name: string; trainings: TrainingDefinition[] } = {
  name: "Prise de masse",
  trainings: [
    {
      name: "Biceps & Triceps",
      exercises: [
        {
          name: "Curl debout",
          material: "Barre droite",
          series: 4,
          repetitionRange: [10, 12],
          weightRange: [20, 28],
          rest: "90s",
        },
        {
          name: "Kick back",
          material: "Haltère",
          series: 4,
          repetitionRange: [10, 12],
          weightRange: [10, 15],
          rest: "75s",
        },
        {
          name: "Curl alterné assis",
          material: "Haltères",
          series: 4,
          repetitionRange: [10, 12],
          weightRange: [15, 20],
          rest: "75s",
        },
        {
          name: "Dips",
          material: "Poids du corps",
          series: 4,
          repetitionRange: [12, 15],
          weightRange: [0, 0],
          rest: "60s",
        },
        {
          name: "Curl pupitre",
          material: "Barre EZ",
          series: 4,
          repetitionRange: [8, 10],
          weightRange: [15, 20],
          rest: "90s",
        },
        {
          name: "Extension poulie haute",
          material: "Poulie",
          series: 4,
          repetitionRange: [10, 12],
          weightRange: [25, 35],
          rest: "90s",
        },
      ],
    },
    {
      name: "Pectoraux",
      exercises: [
        {
          name: "Développé couché",
          material: "Barre",
          series: 4,
          repetitionRange: [10, 12],
          weightRange: [40, 55],
          rest: "120s",
        },
        {
          name: "Développé incliné",
          material: "Haltères",
          series: 4,
          repetitionRange: [10, 12],
          weightRange: [15, 20],
          rest: "105s",
        },
        {
          name: "Développé décliné",
          material: "Barre",
          series: 4,
          repetitionRange: [10, 12],
          weightRange: [15, 20],
          rest: "105s",
        },
        {
          name: "Écartés couchés",
          material: "Haltères",
          series: 4,
          repetitionRange: [12, 15],
          weightRange: [10, 15],
          rest: "75s",
        },
        {
          name: "Pull over",
          material: "Haltère",
          series: 4,
          repetitionRange: [8, 10],
          weightRange: [20, 25],
          rest: "90s",
        },
      ],
    },
  ],
};

const createBaselineRepetitions = (
  range: [number, number],
  series: number,
): string[] => {
  const [minRep, maxRep] = range;
  if (series <= 0) return [];
  const step = series > 1 ? (maxRep - minRep) / (series - 1) : 0;
  return Array.from({ length: series }, (_, index) =>
    Math.round(maxRep - step * index).toString(),
  );
};

const createBaselineWeights = (
  range: [number, number],
  series: number,
): string[] => {
  const [minWeight, maxWeight] = range;
  if (series <= 0) return [];
  const step = series > 1 ? (maxWeight - minWeight) / (series - 1) : 0;
  return Array.from({ length: series }, (_, index) =>
    Math.round(minWeight + step * index).toString(),
  );
};

const computeSessionValue = (
  range: [number, number],
  sessionIndex: number,
  totalSessions: number,
  seed: number,
) => {
  const [minValue, maxValue] = range;
  if (minValue === maxValue) {
    return minValue;
  }

  const span = maxValue - minValue;
  const linear = totalSessions > 1 ? sessionIndex / (totalSessions - 1) : 0.5;
  const wave = Math.sin((sessionIndex + 1 + seed) * 1.2) * 0.25;
  const secondary = Math.sin((sessionIndex + 1 + seed) * 0.6) * 0.1;
  const normalized = clamp(linear + wave + secondary, 0, 1);

  return minValue + normalized * span;
};

const createSessionDates = (trainingIndex: number) => {
  const baseDate = new Date();
  baseDate.setHours(11 - trainingIndex, 0, 0, 0);

  return Array.from({ length: SESSION_COUNT }, (_, index) => {
    const daysAgo =
      (SESSION_COUNT - 1 - index) * SESSION_GAP_DAYS + trainingIndex * 2;
    const sessionDate = new Date(baseDate);
    sessionDate.setDate(baseDate.getDate() - daysAgo);
    return sessionDate.toISOString();
  });
};

const createSetWeights = (
  baseWeight: number,
  series: number,
  range: [number, number],
): string[] => {
  if (series <= 0) return [];
  const [min, max] = range;
  return Array.from({ length: series }, (_, idx) => {
    const offset = (idx - Math.floor(series / 2)) * 0.75;
    const nextValue = clamp(baseWeight + offset, min, max);
    return roundToNearest(nextValue).toString();
  });
};

const createSetRepetitions = (
  baseReps: number,
  series: number,
  range: [number, number],
): number[] => {
  if (series <= 0) return [];
  const [min, max] = range;
  return Array.from({ length: series }, (_, idx) => {
    const variation = idx % 2 === 0 ? 0 : -1;
    const nextValue = clamp(Math.round(baseReps + variation), min, max);
    return nextValue;
  });
};

const deleteExistingData = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) => {
  const { data: sessions, error: sessionsError } = await supabase
    .from("training_sessions")
    .select("id")
    .eq("user_id", userId);

  if (sessionsError) {
    throw sessionsError;
  }

  const sessionIds = (sessions ?? []).map((row) => row.id);

  if (sessionIds.length > 0) {
    const { data: exercises, error: exercisesError } = await supabase
      .from("training_session_exercises")
      .select("id")
      .in("session_id", sessionIds);

    if (exercisesError) {
      throw exercisesError;
    }

    const exerciseIds = (exercises ?? []).map((row) => row.id);

    if (exerciseIds.length > 0) {
      const { error: setsError } = await supabase
        .from("training_session_sets")
        .delete()
        .in("session_exercise_id", exerciseIds);

      if (setsError) {
        throw setsError;
      }
    }

    const { error: deleteExercisesError } = await supabase
      .from("training_session_exercises")
      .delete()
      .in("session_id", sessionIds);

    if (deleteExercisesError) {
      throw deleteExercisesError;
    }
  }

  if (sessionIds.length > 0) {
    const { error: deleteSessionsError } = await supabase
      .from("training_sessions")
      .delete()
      .eq("user_id", userId);

    if (deleteSessionsError) {
      throw deleteSessionsError;
    }
  }

  const { error: deleteRowsError } = await supabase
    .from("training_rows")
    .delete()
    .eq("user_id", userId);

  if (deleteRowsError) {
    throw deleteRowsError;
  }

  const { error: deleteTrainingsError } = await supabase
    .from("trainings")
    .delete()
    .eq("user_id", userId);

  if (deleteTrainingsError) {
    throw deleteTrainingsError;
  }

  const { error: deleteProgramsError } = await supabase
    .from("programs")
    .delete()
    .eq("user_id", userId);

  if (deleteProgramsError) {
    throw deleteProgramsError;
  }
};

type InsertedExercise = {
  definition: ExerciseDefinition;
  trainingRowId: string;
};

type InsertedTraining = {
  id: string;
  definition: TrainingDefinition;
  exercises: InsertedExercise[];
};

const insertProgramWithTrainings = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ program: ProgramRow; trainings: InsertedTraining[] }> => {
  const { data: program, error: programError } = await supabase
    .from("programs")
    .insert({
      name: PROGRAM_DEFINITION.name,
      user_id: userId,
      position: 0,
      is_new: false,
    })
    .select()
    .single();

  if (programError || !program) {
    throw programError ?? new Error("program-insert-failed");
  }

  const insertedTrainings: InsertedTraining[] = [];

  for (const [trainingIndex, trainingDefinition] of PROGRAM_DEFINITION.trainings.entries()) {
    const payload: TrainingInsert = {
      name: trainingDefinition.name,
      user_id: userId,
      program_id: program.id,
      position: trainingIndex,
    };

    const { data: training, error: trainingError } = await supabase
      .from("trainings")
      .insert(payload)
      .select()
      .single();

    if (trainingError || !training) {
      throw trainingError ?? new Error("training-insert-failed");
    }

    const exercises: InsertedExercise[] = [];

    for (const [exerciseIndex, exerciseDefinition] of trainingDefinition.exercises.entries()) {
      const rowPayload: TrainingRowInsert = {
        training_id: training.id,
        user_id: userId,
        order: exerciseIndex,
        series: exerciseDefinition.series,
        repetitions: createBaselineRepetitions(
          exerciseDefinition.repetitionRange,
          exerciseDefinition.series,
        ),
        poids: createBaselineWeights(
          exerciseDefinition.weightRange,
          exerciseDefinition.series,
        ),
        repos: exerciseDefinition.rest,
        effort: Array(exerciseDefinition.series).fill("parfait"),
        checked: false,
        exercice: exerciseDefinition.name,
        materiel: exerciseDefinition.material,
        superset_id: null,
        link: null,
        note: null,
        position: exerciseIndex,
      };

      const { data: trainingRow, error: rowError } = await supabase
        .from("training_rows")
        .insert(rowPayload)
        .select()
        .single();

      if (rowError || !trainingRow) {
        throw rowError ?? new Error("training-row-insert-failed");
      }

      exercises.push({ definition: exerciseDefinition, trainingRowId: trainingRow.id });
    }

    insertedTrainings.push({ id: training.id, definition: trainingDefinition, exercises });
  }

  return { program, trainings: insertedTrainings };
};

const insertSessions = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  programId: string,
  trainings: InsertedTraining[],
) => {
  for (const [trainingIndex, training] of trainings.entries()) {
    const sessionDates = createSessionDates(trainingIndex);

    for (const [sessionIndex, performedAt] of sessionDates.entries()) {
      const sessionPayload: TrainingSessionInsert = {
        user_id: userId,
        program_id: programId,
        training_id: training.id,
        performed_at: performedAt,
      };

      const { data: session, error: sessionError } = await supabase
        .from("training_sessions")
        .insert(sessionPayload)
        .select()
        .single();

      if (sessionError || !session) {
        throw sessionError ?? new Error("session-insert-failed");
      }

      for (const [exerciseIndex, exercise] of training.exercises.entries()) {
        const sessionExercisePayload: SessionExerciseInsert = {
          session_id: session.id,
          training_row_id: exercise.trainingRowId,
          exercise_name: exercise.definition.name,
          position: exerciseIndex,
        };

        const { data: sessionExercise, error: exerciseInsertError } = await supabase
          .from("training_session_exercises")
          .insert(sessionExercisePayload)
          .select()
          .single();

        if (exerciseInsertError || !sessionExercise) {
          throw exerciseInsertError ?? new Error("session-exercise-insert-failed");
        }

        const baseWeight = computeSessionValue(
          exercise.definition.weightRange,
          sessionIndex,
          SESSION_COUNT,
          exerciseIndex + trainingIndex,
        );

        const baseReps = computeSessionValue(
          exercise.definition.repetitionRange,
          sessionIndex,
          SESSION_COUNT,
          exerciseIndex + 1.5 + trainingIndex,
        );

        const weights = createSetWeights(
          baseWeight,
          exercise.definition.series,
          exercise.definition.weightRange,
        );

        const repetitions = createSetRepetitions(
          baseReps,
          exercise.definition.series,
          exercise.definition.repetitionRange,
        );

        const sets: SessionSetInsert[] = weights.map((weight, idx) => ({
          session_exercise_id: sessionExercise.id,
          set_number: idx + 1,
          repetitions: repetitions[idx] ?? repetitions[repetitions.length - 1] ?? 0,
          weights: [weight],
        }));

        const { error: setsError } = await supabase
          .from("training_session_sets")
          .insert(sets);

        if (setsError) {
          throw setsError;
        }
      }
    }
  }
};

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return NextResponse.json({ error: "unable-to-fetch-user" }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "not-authenticated" }, { status: 401 });
  }

  try {
    await deleteExistingData(supabase, user.id);
    const { program, trainings } = await insertProgramWithTrainings(
      supabase,
      user.id,
    );
    await insertSessions(supabase, user.id, program.id, trainings);

    const firstTraining = trainings[0];
    const firstExercise = firstTraining?.exercises[0];

    if (firstTraining && firstExercise) {
      await supabase
        .from("dashboard_preferences")
        .upsert(
          {
            user_id: user.id,
            selected_program_id: program.id,
            selected_training_id: firstTraining.id,
            selected_exercise_id: firstExercise.trainingRowId,
            exercise_settings: {
              [firstExercise.trainingRowId]: {
                sessionCount: "8",
                curveType: "poids-total",
                recordCurveType: "poids-maximum",
                goal: null,
              },
            },
            show_stats: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
    }

    return NextResponse.json({
      success: true,
      programId: program.id,
      trainingIds: trainings.map((training) => training.id),
    });
  } catch (error) {
    console.error("[dashboard/simulate-data] failed", error);
    return NextResponse.json({ error: "simulation-failed" }, { status: 500 });
  }
}
