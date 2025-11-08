"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardProgramFilters from "@/components/dashboard/DashboardProgramFilters";
import DashboardExercisesSkeleton from "@/components/dashboard/DashboardExercisesSkeleton";
import DashboardFiltersSkeleton from "@/components/dashboard/DashboardFiltersSkeleton";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabaseClient";
import { CURVE_OPTIONS, type CurveOptionValue } from "@/constants/curveOptions";
import DashboardExerciseBlock from "@/app/dashboard/DashboardExerciseBlock";
import type { Database } from "@/lib/supabase/types";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";

const SESSION_OPTIONS = [
  { value: "5", label: "5 dernières séances" },
  { value: "10", label: "10 dernières séances" },
  { value: "15", label: "15 dernières séances" },
] as const;

type SessionValue = (typeof SESSION_OPTIONS)[number]["value"];

const DEFAULT_SESSION_VALUE: SessionValue = SESSION_OPTIONS[2].value;
const FALLBACK_CURVE_VALUE: CurveOptionValue = CURVE_OPTIONS[0].value;

type TrainingExercise = {
  id: string;
  exercice: string | null;
};

const FALLBACK_EXERCISE_LABEL = "Exercice sans titre";

type ExerciseDisplaySettings = Record<
  string,
  { sessionCount: SessionValue; curveType: CurveOptionValue }
>;

type ParsedExercisePreferences = {
  settings: ExerciseDisplaySettings;
  selectedExerciseId: string;
};

type DashboardPreferencesRow =
  Database["public"]["Tables"]["dashboard_preferences"]["Row"];
type DashboardPreferencesInsert =
  Database["public"]["Tables"]["dashboard_preferences"]["Insert"];
type PreferencesRow = Database["public"]["Tables"]["preferences"]["Row"];

const CURVE_FROM_DB: Record<PreferencesRow["curve"], CurveOptionValue> = {
  maximum_weight: "poids-maximum",
  average_weight: "poids-moyen",
  total_weight: "poids-total",
  maximum_rep: "repetition-maximum",
  average_rep: "repetition-moyenne",
  total_rep: "repetitions-totales",
};

const isSessionValue = (value: unknown): value is SessionValue =>
  typeof value === "string" &&
  SESSION_OPTIONS.some((option) => option.value === value);

const isCurveValue = (value: unknown): value is CurveOptionValue =>
  typeof value === "string" &&
  CURVE_OPTIONS.some((option) => option.value === value);

const parseExerciseSettings = (value: unknown): ParsedExercisePreferences => {
  const empty: ParsedExercisePreferences = { settings: {}, selectedExerciseId: "" };

  const parseSettingsRecord = (input: unknown): ExerciseDisplaySettings => {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return {};
    }

    return Object.entries(input as Record<string, unknown>).reduce<
      ExerciseDisplaySettings
    >((accumulator, [exerciseId, rawSettings]) => {
      if (!rawSettings || typeof rawSettings !== "object" || Array.isArray(rawSettings)) {
        return accumulator;
      }

      const { sessionCount, curveType } = rawSettings as {
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

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return empty;
  }

  const rawValue = value as Record<string, unknown>;
  const maybeSelectedExercise = rawValue.selectedExerciseId;
  const maybeExercises = rawValue.exercises;

  if (
    typeof maybeSelectedExercise === "string" ||
    typeof maybeSelectedExercise === "number" ||
    maybeSelectedExercise === null
  ) {
    return {
      settings: parseSettingsRecord(maybeExercises ?? {}),
      selectedExerciseId:
        typeof maybeSelectedExercise === "number"
          ? String(maybeSelectedExercise)
          : typeof maybeSelectedExercise === "string"
            ? maybeSelectedExercise
            : "",
    };
  }

  return {
    settings: parseSettingsRecord(rawValue),
    selectedExerciseId: "",
  };
};

const buildExerciseSettingsPayload = (
  settings: ExerciseDisplaySettings,
  selectedExerciseId: string,
) => ({
  selectedExerciseId: selectedExerciseId || null,
  exercises: settings,
});

export default function DashboardPage() {
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);

  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedTraining, setSelectedTraining] = useState("");
  const [trainingExercises, setTrainingExercises] = useState<TrainingExercise[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [hasFetchedExercises, setHasFetchedExercises] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [exerciseDisplaySettings, setExerciseDisplaySettings] = useState<ExerciseDisplaySettings>({});
  const [defaultCurveValue, setDefaultCurveValue] =
    useState<CurveOptionValue>(FALLBACK_CURVE_VALUE);
  const [showStats, setShowStats] = useState(false);
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [hasProgramOptions, setHasProgramOptions] = useState(false);
  const [areFiltersLoading, setAreFiltersLoading] = useState(false);
  const [hasLoadedProgramList, setHasLoadedProgramList] = useState(false);

  const handleProgramOptionsChange = useCallback(
    (options: Array<{ value: string; label: string }>) => {
      setHasProgramOptions(options.length > 0);
      setHasLoadedProgramList(true);
    },
    [],
  );

  const exerciseOptions = useMemo(
    () =>
      trainingExercises.map((exercise) => ({
        value: exercise.id,
        label: exercise.exercice?.trim() || FALLBACK_EXERCISE_LABEL,
      })),
    [trainingExercises],
  );

  const filteredExercises = useMemo(
    () =>
      selectedExercise
        ? trainingExercises.filter((exercise) => exercise.id === selectedExercise)
        : trainingExercises,
    [selectedExercise, trainingExercises],
  );

  const shouldShowFiltersSkeleton = useMinimumVisibility(
    areFiltersLoading || !hasLoadedPreferences,
  );
  const shouldShowExercisesSkeleton = useMinimumVisibility(
    !areFiltersLoading && isLoadingExercises,
  );

  useEffect(() => {
    if (isLoadingExercises || !hasFetchedExercises) {
      return;
    }

    if (
      selectedExercise &&
      !trainingExercises.some((exercise) => exercise.id === selectedExercise)
    ) {
      setSelectedExercise("");
    }
  }, [
    hasFetchedExercises,
    isLoadingExercises,
    selectedExercise,
    trainingExercises,
  ]);

  const getExerciseSettings = (exerciseId: string) =>
    exerciseDisplaySettings[exerciseId] ?? {
      sessionCount: DEFAULT_SESSION_VALUE,
      curveType: defaultCurveValue,
    };

  const updateExerciseSettings = (
    exerciseId: string,
    partial: Partial<{ sessionCount: SessionValue; curveType: CurveOptionValue }>
  ) => {
    setExerciseDisplaySettings((previous) => {
      const current = previous[exerciseId] ?? {
        sessionCount: DEFAULT_SESSION_VALUE,
        curveType: defaultCurveValue,
      };
      return {
        ...previous,
        [exerciseId]: { ...current, ...partial },
      };
    });
  };

  // Charger préférences utilisateur
  useEffect(() => {
    setHasLoadedProgramList(false);
    if (!user?.id) {
      setSelectedProgram("");
      setSelectedTraining("");
      setSelectedExercise("");
      setExerciseDisplaySettings({});
      setShowStats(false);
      setHasLoadedPreferences(false);
      setAreFiltersLoading(false);
      setHasLoadedProgramList(false);
      setDefaultCurveValue(FALLBACK_CURVE_VALUE);
      return;
    }

    let isMounted = true;
    const fetchPreferences = async () => {
      setHasLoadedPreferences(false);
      const [dashboardResponse, userPreferencesResponse] = await Promise.all([
        supabase
          .from("dashboard_preferences")
          .select("*")
          .eq("user_id", user.id)
          .limit(1)
          .returns<DashboardPreferencesRow[]>(),
        supabase
          .from("preferences")
          .select("curve")
          .eq("id", user.id)
          .maybeSingle<Pick<PreferencesRow, "curve">>(),
      ]);

      if (!isMounted) return;

      if (userPreferencesResponse.error) {
        console.error(
          "Erreur lors du chargement des préférences utilisateur :",
          userPreferencesResponse.error.message,
        );
        setDefaultCurveValue(FALLBACK_CURVE_VALUE);
      } else {
        const rawCurve = userPreferencesResponse.data?.curve ?? null;
        setDefaultCurveValue(
          rawCurve ? CURVE_FROM_DB[rawCurve] ?? FALLBACK_CURVE_VALUE : FALLBACK_CURVE_VALUE,
        );
      }

      const { data, error } = dashboardResponse;

      if (error) {
        console.error(
          "Erreur lors du chargement des préférences du tableau de bord :",
          error.message,
        );
        setSelectedProgram("");
        setSelectedTraining("");
        setSelectedExercise("");
        setExerciseDisplaySettings({});
        setShowStats(false);
        setAreFiltersLoading(false);
      } else {
        const preferences = data?.[0] as DashboardPreferencesRow | undefined;

        const nextSelectedProgram = preferences?.selected_program_id ?? "";
        const nextSelectedTraining = preferences?.selected_training_id ?? "";
        const parsedPreferences = parseExerciseSettings(preferences?.exercise_settings);
        const persistedExerciseId =
          typeof preferences?.selected_exercise_id === "string"
            ? preferences.selected_exercise_id
            : "";
        const nextSelectedExercise =
          persistedExerciseId || parsedPreferences.selectedExerciseId;

        setSelectedProgram(nextSelectedProgram);
        setSelectedTraining(nextSelectedTraining);
        setSelectedExercise(nextSelectedExercise);
        setExerciseDisplaySettings(parsedPreferences.settings);
        setShowStats(Boolean(preferences?.show_stats));

        setAreFiltersLoading(
          Boolean(
            nextSelectedProgram ||
              nextSelectedTraining ||
              nextSelectedExercise,
          ),
        );
      }

      setHasLoadedPreferences(true);
    };

    void fetchPreferences();
    return () => {
      isMounted = false;
    };
  }, [supabase, user?.id]);

  // Sauvegarder préférences
  useEffect(() => {
    if (!user?.id || !hasLoadedPreferences) return;

    const persistPreferences = async () => {
      const payload: DashboardPreferencesInsert = {
        user_id: user.id,
        selected_program_id: selectedProgram || null,
        selected_training_id: selectedTraining || null,
        selected_exercise_id: selectedExercise || null,
        exercise_settings: buildExerciseSettingsPayload(
          exerciseDisplaySettings,
          selectedExercise,
        ),
        show_stats: showStats,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("dashboard_preferences")
        .upsert(payload, { onConflict: "user_id" });

      if (error) {
        console.error("Erreur lors de l'enregistrement des préférences du tableau de bord :", error.message);
      }
    };

    void persistPreferences();
  }, [
    exerciseDisplaySettings,
    hasLoadedPreferences,
    selectedProgram,
    selectedTraining,
    selectedExercise,
    showStats,
    supabase,
    user?.id,
  ]);

  // Charger les exercices d’un entraînement
  useEffect(() => {
    if (!selectedTraining || !user?.id) {
      setTrainingExercises([]);
      setIsLoadingExercises(false);
      setFetchError(null);
      setHasFetchedExercises(false);
      return;
    }

    let isMounted = true;
    const fetchExercises = async () => {
      setIsLoadingExercises(true);
      setFetchError(null);
      setTrainingExercises([]);
      setHasFetchedExercises(false);

      const { data, error } = await supabase
        .from("training_rows")
        .select("id, exercice")
        .eq("training_id", selectedTraining)
        .eq("user_id", user.id)
        .order("order", { ascending: true });

      if (!isMounted) return;

      if (error) {
        console.error("Erreur lors du chargement des exercices :", error.message);
        setTrainingExercises([]);
        setFetchError("Une erreur est survenue lors du chargement des exercices.");
      } else {
        setTrainingExercises(
          (data ?? []).map((row) => ({
            id: String(row.id),
            exercice: typeof row.exercice === "string" ? row.exercice : null,
          }))
        );
      }

      setIsLoadingExercises(false);
      setHasFetchedExercises(true);
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
          <h1 className="text-[30px] font-bold text-[#2E3271] mb-2">Tableau de bord</h1>
          <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494]">
            Sélectionnez un programme et un entraînement pour suivre
            <br />
            votre progression par exercice et vous fixer des objectifs.
          </p>
        </div>
        <div className="relative">
          <div
            className={`transition-opacity duration-200 ${shouldShowFiltersSkeleton ? "pointer-events-none opacity-0" : "opacity-100"}`}
            aria-hidden={shouldShowFiltersSkeleton}
          >
            <DashboardProgramFilters
              onProgramChange={(programId) => {
                setSelectedProgram(programId);
                setSelectedTraining("");
                setSelectedExercise("");
              }}
              onTrainingChange={(trainingId) => {
                setSelectedTraining(trainingId);
                setSelectedExercise("");
              }}
              onExerciseChange={(exerciseId) => {
                setSelectedExercise(exerciseId);
              }}
              selectedProgramId={selectedProgram}
              selectedTrainingId={selectedTraining}
              selectedExerciseId={selectedExercise}
              exerciseOptions={exerciseOptions}
              loadingExercises={isLoadingExercises}
              hasFetchedExercises={hasFetchedExercises}
              showStats={showStats}
              onShowStatsChange={setShowStats}
              onProgramOptionsChange={handleProgramOptionsChange}
              onFiltersLoadingChange={setAreFiltersLoading}
            />
          </div>

          {shouldShowFiltersSkeleton && (
            <div className="pointer-events-none absolute inset-0">
              <div className="animate-pulse">
                <DashboardFiltersSkeleton />
              </div>
            </div>
          )}
        </div>

        {!shouldShowFiltersSkeleton && (
          <>
            {hasLoadedPreferences && hasLoadedProgramList && !hasProgramOptions && (
              <p className="mt-8 text-center text-[#5D6494] font-semibold">Aucun programme trouvé.</p>
            )}

{hasLoadedPreferences && hasProgramOptions && !selectedProgram && (
  <p className="mt-8 text-center text-[#5D6494] font-semibold">
    Aucun programme sélectionné.
  </p>
)}

            {selectedProgram !== "" && selectedTraining === "" && (
              <p className="mt-8 text-center text-[#5D6494] font-semibold">Aucun entraînement sélectionné.</p>
            )}

            <div className="relative">
              <div
                className={`transition-opacity duration-200 ${shouldShowExercisesSkeleton ? "pointer-events-none opacity-0" : "opacity-100"}`}
                aria-hidden={shouldShowExercisesSkeleton}
              >
                {selectedTraining !== "" && (
                  <div className="mt-[30px]">
                    {fetchError ? (
                      <p className="text-center text-[#E53E3E] font-semibold">{fetchError}</p>
                    ) : trainingExercises.length === 0 ? (
                      <p className="text-center text-[#5D6494] font-semibold">
                        Aucun exercice n&apos;a été trouvé pour cet entraînement.
                      </p>
                    ) : selectedExercise !== "" && filteredExercises.length === 0 ? (
                      <p className="text-center text-[#5D6494] font-semibold">
                        Aucun exercice ne correspond à votre sélection.
                      </p>
                    ) : (
                      <div className="space-y-[30px]">
                        {filteredExercises.map((exercise) => {
                          const settings = getExerciseSettings(exercise.id);
                          return (
                            <DashboardExerciseBlock
                              key={exercise.id}
                              id={exercise.id}
                              name={exercise.exercice?.trim() || FALLBACK_EXERCISE_LABEL}
                              sessionCount={settings.sessionCount}
                              curveType={settings.curveType}
                              onSessionChange={(nextValue) => {
                                if (SESSION_OPTIONS.some((o) => o.value === nextValue)) {
                                  updateExerciseSettings(exercise.id, {
                                    sessionCount: nextValue as SessionValue,
                                  });
                                }
                              }}
                              onCurveChange={(nextValue) => {
                                if (CURVE_OPTIONS.some((o) => o.value === nextValue)) {
                                  updateExerciseSettings(exercise.id, {
                                    curveType: nextValue as CurveOptionValue,
                                  });
                                }
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {shouldShowExercisesSkeleton && (
                <div className="pointer-events-none absolute inset-0">
                  <div className="mt-[30px]">
                    <DashboardExercisesSkeleton showFilters={false} />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
