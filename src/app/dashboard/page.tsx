"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardProgramFilters from "@/components/dashboard/DashboardProgramFilters";
import DashboardExerciseDropdown from "@/components/dashboard/DashboardExerciseDropdown";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabaseClient";
import {
  CURVE_OPTIONS,
  type CurveOptionValue,
} from "@/constants/curveOptions";

const SESSION_OPTIONS = [
  { value: "5", label: "5 dernières séances" },
  { value: "10", label: "10 dernières séances" },
  { value: "15", label: "15 dernières séances" },
] as const;

type SessionValue = (typeof SESSION_OPTIONS)[number]["value"];

const DEFAULT_SESSION_VALUE: SessionValue = SESSION_OPTIONS[2].value;
const DEFAULT_CURVE_VALUE: CurveOptionValue = CURVE_OPTIONS[0].value;

type TrainingExercise = {
  id: string;
  exercice: string | null;
};

const FALLBACK_EXERCISE_LABEL = "Exercice sans titre";

type ExerciseDisplaySettings = Record<
  string,
  { sessionCount: SessionValue; curveType: CurveOptionValue }
>;

const isSessionValue = (value: unknown): value is SessionValue =>
  typeof value === "string" &&
  SESSION_OPTIONS.some((option) => option.value === value);

const isCurveValue = (value: unknown): value is CurveOptionValue =>
  typeof value === "string" &&
  CURVE_OPTIONS.some((option) => option.value === value);

const parseExerciseSettings = (value: unknown): ExerciseDisplaySettings => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<
    ExerciseDisplaySettings
  >((accumulator, [exerciseId, settings]) => {
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      return accumulator;
    }

    const { sessionCount, curveType } = settings as {
      sessionCount?: unknown;
      curveType?: unknown;
    };

    if (!isSessionValue(sessionCount) || !isCurveValue(curveType)) {
      return accumulator;
    }

    return {
      ...accumulator,
      [exerciseId]: {
        sessionCount,
        curveType,
      },
    };
  }, {});
};

export default function DashboardPage() {
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);

  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedTraining, setSelectedTraining] = useState("");
  const [trainingExercises, setTrainingExercises] = useState<TrainingExercise[]>(
    [],
  );
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [exerciseDisplaySettings, setExerciseDisplaySettings] = useState<
    ExerciseDisplaySettings
  >({});
  const [showStats, setShowStats] = useState(false);
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false);

  const getExerciseSettings = (exerciseId: string) =>
    exerciseDisplaySettings[exerciseId] ?? {
      sessionCount: DEFAULT_SESSION_VALUE,
      curveType: DEFAULT_CURVE_VALUE,
    };

  const updateExerciseSettings = (
    exerciseId: string,
    partial: Partial<{ sessionCount: SessionValue; curveType: CurveOptionValue }>,
  ) => {
    setExerciseDisplaySettings((previous) => {
      const current = previous[exerciseId] ?? {
        sessionCount: DEFAULT_SESSION_VALUE,
        curveType: DEFAULT_CURVE_VALUE,
      };

      return {
        ...previous,
        [exerciseId]: { ...current, ...partial },
      };
    });
  };

  useEffect(() => {
    if (!user?.id) {
      setSelectedProgram("");
      setSelectedTraining("");
      setExerciseDisplaySettings({});
      setShowStats(false);
      setHasLoadedPreferences(false);
      return;
    }

    let isMounted = true;

    const fetchPreferences = async () => {
      setHasLoadedPreferences(false);

      const { data, error } = await supabase
        .from("dashboard_preferences")
        .select(
          "selected_program_id, selected_training_id, exercise_settings, show_stats",
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error(
          "Erreur lors du chargement des préférences du tableau de bord :",
          error.message,
        );
        setSelectedProgram("");
        setSelectedTraining("");
        setExerciseDisplaySettings({});
        setShowStats(false);
      } else if (data) {
        setSelectedProgram(data.selected_program_id ?? "");
        setSelectedTraining(data.selected_training_id ?? "");
        setExerciseDisplaySettings(parseExerciseSettings(data.exercise_settings));
        setShowStats(Boolean(data.show_stats));
      } else {
        setSelectedProgram("");
        setSelectedTraining("");
        setExerciseDisplaySettings({});
        setShowStats(false);
      }

      setHasLoadedPreferences(true);
    };

    void fetchPreferences();

    return () => {
      isMounted = false;
    };
  }, [supabase, user?.id]);

  useEffect(() => {
    if (!user?.id || !hasLoadedPreferences) {
      return;
    }

    const persistPreferences = async () => {
      const { error } = await supabase
        .from("dashboard_preferences")
        .upsert(
          {
            user_id: user.id,
            selected_program_id: selectedProgram || null,
            selected_training_id: selectedTraining || null,
            exercise_settings: exerciseDisplaySettings,
            show_stats: showStats,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

      if (error) {
        console.error(
          "Erreur lors de l'enregistrement des préférences du tableau de bord :",
          error.message,
        );
      }
    };

    void persistPreferences();
  }, [
    exerciseDisplaySettings,
    hasLoadedPreferences,
    selectedProgram,
    selectedTraining,
    showStats,
    supabase,
    user?.id,
  ]);

  useEffect(() => {
    if (!selectedTraining || !user?.id) {
      setTrainingExercises([]);
      setIsLoadingExercises(false);
      setFetchError(null);
      return;
    }

    let isMounted = true;

    const fetchExercises = async () => {
      setIsLoadingExercises(true);
      setFetchError(null);

      const { data, error } = await supabase
        .from("training_rows")
        .select("id, exercice")
        .eq("training_id", selectedTraining)
        .eq("user_id", user.id)
        .order("order", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error(
          "Erreur lors du chargement des exercices :",
          error.message,
        );
        setTrainingExercises([]);
        setFetchError(
          "Une erreur est survenue lors du chargement des exercices.",
        );
      } else {
        setTrainingExercises(
          (data ?? []).map((row) => ({
            id: String(row.id),
            exercice:
              typeof row.exercice === "string" ? row.exercice : null,
          })),
        );
      }

      setIsLoadingExercises(false);
    };

    void fetchExercises();

    return () => {
      isMounted = false;
    };
  }, [selectedTraining, supabase, user?.id]);

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[60px]">
      <div className="max-w-[1152px] mx-auto">
        <div className="text-center">
          <h1 className="text-[30px] font-bold text-[#2E3271] mb-2">
            Tableau de bord
          </h1>
          <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494]">
            Sélectionnez un programme et un entraînement pour suivre
            <br />
            votre progression par exercice et vous fixer des objectifs.
          </p>
        </div>
        <DashboardProgramFilters
          onProgramChange={setSelectedProgram}
          onTrainingChange={setSelectedTraining}
          selectedProgramId={selectedProgram}
          selectedTrainingId={selectedTraining}
          showStats={showStats}
          onShowStatsChange={setShowStats}
        />
        {selectedProgram === "" && (
          <p className="mt-8 text-center text-[#5D6494] font-semibold">
            Aucun programme trouvé.
          </p>
        )}
        {selectedTraining !== "" && (
          <div className="mt-[30px]">
            {isLoadingExercises ? (
              <p className="text-center text-[#5D6494] font-semibold">
                Chargement des exercices...
              </p>
            ) : fetchError ? (
              <p className="text-center text-[#E53E3E] font-semibold">
                {fetchError}
              </p>
            ) : trainingExercises.length === 0 ? (
              <p className="text-center text-[#5D6494] font-semibold">
                Aucun exercice n&apos;a été trouvé pour cet entraînement.
              </p>
            ) : (
              <div className="space-y-[30px]">
                {trainingExercises.map((exercise) => {
                  const settings = getExerciseSettings(exercise.id);

                  return (
                    <div
                      key={exercise.id}
                      className="w-full shadow-glift border border-[#ECE9F1] bg-white rounded-[5px]"
                    >
                      <div className="h-[60px] flex items-center justify-between px-[30px]">
                        <p className="text-[16px] font-bold text-[#3A416F]">
                          {exercise.exercice?.trim() || FALLBACK_EXERCISE_LABEL}
                        </p>
                        <div className="flex items-center gap-[30px]">
                          <DashboardExerciseDropdown
                            value={settings.sessionCount}
                            onChange={(nextValue) => {
                              if (
                                SESSION_OPTIONS.some(
                                  (option) => option.value === nextValue,
                                )
                              ) {
                                updateExerciseSettings(exercise.id, {
                                  sessionCount: nextValue as SessionValue,
                                });
                              }
                            }}
                            options={SESSION_OPTIONS}
                            iconSrc="/icons/tableau.svg"
                            iconHoverSrc="/icons/tableau_hover.svg"
                          />
                          <DashboardExerciseDropdown
                            value={settings.curveType}
                            onChange={(nextValue) => {
                              if (
                                CURVE_OPTIONS.some(
                                  (option) => option.value === nextValue,
                                )
                              ) {
                                updateExerciseSettings(exercise.id, {
                                  curveType: nextValue as CurveOptionValue,
                                });
                              }
                            }}
                            options={CURVE_OPTIONS}
                            iconSrc="/icons/courbe.svg"
                            iconHoverSrc="/icons/courbe_hover.svg"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
