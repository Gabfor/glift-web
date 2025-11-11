"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
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

const STATS_CARD_METADATA = [
  {
    id: "sessions",
    icon: "/icons/dashboard-sessions.svg",
    label: "Séances terminées",
  },
  {
    id: "goals",
    icon: "/icons/dashboard-goals.svg",
    label: "Objectifs atteints",
  },
  {
    id: "time",
    icon: "/icons/dashboard-time.svg",
    label: "Minutes en moyenne",
  },
  {
    id: "weight",
    icon: "/icons/dashboard-weight.svg",
    label: "Kg soulevés",
  },
] as const;

type StatsCardMetadata = (typeof STATS_CARD_METADATA)[number];

type StatsCard = StatsCardMetadata & {
  value: number;
  format: (value: number) => string;
  precision: number;
};

type StatsValueProps = {
  value: number;
  format: (value: number) => string;
  precision: number;
  isLoading: boolean;
};

const easeOutCubic = (progress: number) => 1 - Math.pow(1 - progress, 3);

const StatsValue = ({ value, format, precision, isLoading }: StatsValueProps) => {
  const clampAndRound = useCallback(
    (input: number) => {
      if (!Number.isFinite(input)) {
        return 0;
      }

      const positiveValue = Math.max(0, input);
      if (precision <= 0) {
        return Math.round(positiveValue);
      }

      const factor = 10 ** precision;
      return Math.round(positiveValue * factor) / factor;
    },
    [precision],
  );

  const [displayValue, setDisplayValue] = useState(() => clampAndRound(value));
  const displayValueRef = useRef(displayValue);
  const stableValueRef = useRef(clampAndRound(value));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    displayValueRef.current = displayValue;
  }, [displayValue]);

  useEffect(() => {
    if (!isLoading) {
      stableValueRef.current = clampAndRound(value);
    }
  }, [clampAndRound, isLoading, value]);

  useEffect(() => {
    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const stopAnimation = () => {
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };

    const targetValue = clampAndRound(value);

    if (isLoading) {
      stopAnimation();

      if (targetValue === 0) {
        setDisplayValue(0);
        stableValueRef.current = 0;

        return () => {
          stopInterval();
          stopAnimation();
        };
      }

      const randomRange = Math.max(stableValueRef.current * 1.2, 100);
      intervalRef.current = setInterval(() => {
        const randomValue = clampAndRound(Math.random() * randomRange);
        setDisplayValue(randomValue);
      }, 100);

      return () => {
        stopInterval();
        stopAnimation();
      };
    }

    stopInterval();

    if (targetValue === 0) {
      stopAnimation();
      setDisplayValue(0);
      stableValueRef.current = 0;

      return () => {
        stopAnimation();
      };
    }

    const startValue = displayValueRef.current;

    if (startValue === targetValue) {
      setDisplayValue(targetValue);
      return () => {
        stopAnimation();
      };
    }

    const duration = 600;
    const startTimestamp = performance.now();

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      const nextValue = clampAndRound(
        startValue + (targetValue - startValue) * eased,
      );
      setDisplayValue(nextValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = undefined;
        stableValueRef.current = targetValue;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      stopAnimation();
    };
  }, [clampAndRound, isLoading, value]);

  useEffect(() => () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (animationFrameRef.current != null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  return <span aria-live="polite">{format(displayValue)}</span>;
};

type DashboardStats = {
  sessionsCompleted: number;
  goalsAchieved: number;
  averageDurationMinutes: number;
  totalWeight: number;
};

const createEmptyStats = (): DashboardStats => ({
  sessionsCompleted: 0,
  goalsAchieved: 0,
  averageDurationMinutes: 0,
  totalWeight: 0,
});

const MIN_FAKE_DURATION_MINUTES = 30;
const MAX_FAKE_DURATION_MINUTES = 90;

const createDeterministicDuration = (sessionId: string, performedAt: string) => {
  const source = `${sessionId}-${performedAt}`;
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(index);
    hash |= 0;
  }

  const range = MAX_FAKE_DURATION_MINUTES - MIN_FAKE_DURATION_MINUTES;
  const normalized = Math.abs(hash) % (range + 1);
  const duration = MIN_FAKE_DURATION_MINUTES + normalized;

  return duration - (duration % 5);
};

const parseNumericValue = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/,/g, ".").trim();
    if (!normalized) {
      return null;
    }

    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

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
  const [exerciseDisplaySettings, setExerciseDisplaySettings] =
    useState<ExerciseDisplaySettings>({});
  const [defaultCurveValue, setDefaultCurveValue] =
    useState<CurveOptionValue>(FALLBACK_CURVE_VALUE);
  const [showStats, setShowStats] = useState(false);
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [hasProgramOptions, setHasProgramOptions] = useState(false);
  const [areFiltersLoading, setAreFiltersLoading] = useState(false);
  const [hasLoadedProgramList, setHasLoadedProgramList] = useState(false);
  const [stats, setStats] = useState<DashboardStats>(() => createEmptyStats());
  const [isLoadingStats, setIsLoadingStats] = useState(false);

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

  const integerFormatter = useMemo(
    () => new Intl.NumberFormat("fr-FR"),
    [],
  );
  const weightFormatter = useMemo(
    () => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }),
    [],
  );

  const statsCards = useMemo<StatsCard[]>(() => {
    const formatInteger = (input: number) =>
      integerFormatter.format(Math.max(0, Math.round(input)));
    const formatWeight = (input: number) =>
      weightFormatter.format(Math.max(0, input));

    return STATS_CARD_METADATA.map((metadata) => {
      switch (metadata.id) {
        case "sessions":
          return {
            ...metadata,
            value: stats.sessionsCompleted,
            format: formatInteger,
            precision: 0,
          } satisfies StatsCard;
        case "goals":
          return {
            ...metadata,
            value: stats.goalsAchieved,
            format: formatInteger,
            precision: 0,
          } satisfies StatsCard;
        case "time":
          return {
            ...metadata,
            value: stats.averageDurationMinutes,
            format: formatInteger,
            precision: 0,
          } satisfies StatsCard;
        case "weight":
        default:
          return {
            ...metadata,
            value: stats.totalWeight,
            format: formatWeight,
            precision: 1,
          } satisfies StatsCard;
      }
    });
  }, [
    integerFormatter,
    stats.averageDurationMinutes,
    stats.goalsAchieved,
    stats.sessionsCompleted,
    stats.totalWeight,
    weightFormatter,
  ]);

  const shouldShowFiltersSkeleton = useMinimumVisibility(
    areFiltersLoading || !hasLoadedPreferences,
  );
  const shouldShowExercisesSkeleton = useMinimumVisibility(
    !areFiltersLoading && isLoadingExercises,
  );

  useEffect(() => {
    if (isLoadingExercises || !hasFetchedExercises) return;
    if (
      selectedExercise &&
      !trainingExercises.some((exercise) => exercise.id === selectedExercise)
    ) {
      setSelectedExercise("");
    }
  }, [hasFetchedExercises, isLoadingExercises, selectedExercise, trainingExercises]);

  const getExerciseSettings = (exerciseId: string) =>
    exerciseDisplaySettings[exerciseId] ?? {
      sessionCount: DEFAULT_SESSION_VALUE,
      curveType: defaultCurveValue,
    };

  const updateExerciseSettings = (
    exerciseId: string,
    partial: Partial<{ sessionCount: SessionValue; curveType: CurveOptionValue }>,
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
        setDefaultCurveValue(FALLBACK_CURVE_VALUE);
      } else {
        const rawCurve = userPreferencesResponse.data?.curve ?? null;
        setDefaultCurveValue(
          rawCurve ? CURVE_FROM_DB[rawCurve] ?? FALLBACK_CURVE_VALUE : FALLBACK_CURVE_VALUE,
        );
      }

      const { data, error } = dashboardResponse;

      if (error) {
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
          Boolean(nextSelectedProgram || nextSelectedTraining || nextSelectedExercise),
        );
      }

      setHasLoadedPreferences(true);
    };

    void fetchPreferences();
    return () => {
      isMounted = false;
    };
  }, [supabase, user?.id]);

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
      await supabase.from("dashboard_preferences").upsert(payload, { onConflict: "user_id" });
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

  useEffect(() => {
    if (!user?.id || !showStats) {
      setStats(createEmptyStats());
      setIsLoadingStats(false);
      return;
    }

    let isMounted = true;

    const fetchStats = async () => {
      setIsLoadingStats(true);

      const { data, error } = await supabase
        .from("training_session_exercises")
        .select(
          `
            session_id,
            session:training_sessions!inner (
              performed_at
            ),
            sets:training_session_sets (
              repetitions,
              weights
            )
          `,
        )
        .eq("training_sessions.user_id", user.id);

      if (!isMounted) {
        return;
      }

      if (error) {
        setStats(createEmptyStats());
        setIsLoadingStats(false);
        return;
      }

      type SessionExerciseRow = {
        session_id: string | null;
        session: { performed_at?: string | null } | null;
        sets: Array<{ repetitions?: unknown; weights?: unknown }> | null;
      };

      const rows = (data ?? []) as SessionExerciseRow[];

      const sessionsMap = new Map<string, string>();
      let totalWeight = 0;

      for (const row of rows) {
        const sessionId = typeof row.session_id === "string" ? row.session_id : null;
        const performedAt =
          row.session && typeof row.session === "object" && typeof row.session.performed_at === "string"
            ? row.session.performed_at
            : "";

        if (sessionId) {
          sessionsMap.set(sessionId, performedAt);
        }

        const sets = Array.isArray(row.sets) ? row.sets : [];
        for (const set of sets) {
          const repetitions =
            typeof set?.repetitions === "number" && Number.isFinite(set.repetitions)
              ? set.repetitions
              : null;
          const weights = Array.isArray(set?.weights) ? set.weights : [];
          const numericWeights = weights
            .map((weight) => parseNumericValue(weight))
            .filter((weight): weight is number => weight != null);

          if (numericWeights.length === 0) {
            continue;
          }

          if (numericWeights.length === 1) {
            const repCount = repetitions ?? 1;
            totalWeight += numericWeights[0] * repCount;
          } else {
            totalWeight += numericWeights.reduce((sum, weight) => sum + weight, 0);
          }
        }
      }

      const sessionCount = sessionsMap.size;
      const durations = Array.from(sessionsMap.entries()).map(([sessionId, performedAt]) =>
        createDeterministicDuration(sessionId, performedAt),
      );
      const averageDuration =
        durations.length === 0
          ? 0
          : Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length);

      setStats({
        sessionsCompleted: sessionCount,
        goalsAchieved: 0,
        averageDurationMinutes: averageDuration,
        totalWeight,
      });
      setIsLoadingStats(false);
    };

    void fetchStats();

    return () => {
      isMounted = false;
    };
  }, [showStats, supabase, user?.id]);

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
        setTrainingExercises([]);
        setFetchError("Une erreur est survenue lors du chargement des exercices.");
      } else {
        setTrainingExercises(
          (data ?? []).map((row) => ({
            id: String(row.id),
            exercice: typeof row.exercice === "string" ? row.exercice : null,
          })),
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
            className={`transition-opacity duration-200 ${
              shouldShowFiltersSkeleton ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
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
              onExerciseChange={setSelectedExercise}
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
            {showStats && (
              <div className="mt-[30px] mb-[30px] flex flex-wrap gap-[24px]">
                {statsCards.map((card) => (
                  <div
                    key={card.id}
                    className="flex w-[270px] flex-col items-center justify-center gap-3 rounded-[20px] border border-[#D7D4DC] bg-white px-6 py-6 text-center"
                  >
                    <div className="flex h-7 w-7 items-center justify-center">
                      <Image
                        src={card.icon}
                        alt=""
                        width={28}
                        height={28}
                        className="h-7 w-7"
                      />
                    </div>
                    <p className="text-[35px] font-bold leading-none text-[#3A416F]">
                      <StatsValue
                        value={card.value}
                        format={card.format}
                        precision={card.precision}
                        isLoading={isLoadingStats}
                      />
                    </p>
                    <p className="text-[14px] font-bold text-[#3A416F]">
                      {card.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {hasLoadedPreferences && hasLoadedProgramList && !hasProgramOptions && (
              <p className="mt-8 text-center text-[#5D6494] font-semibold">
                Aucun programme trouvé.
              </p>
            )}

            {hasLoadedPreferences && hasProgramOptions && !selectedProgram && (
              <p className="mt-8 text-center text-[#5D6494] font-semibold">
                Aucun programme sélectionné.
              </p>
            )}

            {selectedProgram !== "" && selectedTraining === "" && (
              <p className="mt-8 text-center text-[#5D6494] font-semibold">
                Aucun entraînement sélectionné.
              </p>
            )}

            {selectedTraining !== "" && (
              <div className={`relative ${showStats ? "" : "mt-[30px]"}`}>
                <div
                  className={`transition-opacity duration-200 ${
                    shouldShowExercisesSkeleton ? "pointer-events-none opacity-0" : "opacity-100"
                  }`}
                  aria-hidden={shouldShowExercisesSkeleton}
                >
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

                {shouldShowExercisesSkeleton && (
                  <div className="pointer-events-none absolute inset-0">
                    <DashboardExercisesSkeleton showFilters={false} />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
