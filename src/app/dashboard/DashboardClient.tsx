"use client";

import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CTAButton from "@/components/CTAButton";
import { useDashboardUrl } from "@/hooks/useDashboardUrl";
import DashboardProgramFilters from "@/components/dashboard/DashboardProgramFilters";
import DashboardExercisesSkeleton from "@/components/dashboard/DashboardExercisesSkeleton";
import DashboardFiltersSkeleton from "@/components/dashboard/DashboardFiltersSkeleton";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabaseClient";
import { CURVE_OPTIONS, type CurveOptionValue } from "@/constants/curveOptions";
import DashboardExerciseBlock from "@/app/dashboard/DashboardExerciseBlock";
import type { DashboardExerciseGoal } from "@/app/dashboard/types";
import type { Database } from "@/lib/supabase/types";
import StatsRedIcon from "/public/icons/stats_red.svg";
import StatsGreenIcon from "/public/icons/stats_green.svg";
import SettingDashboardIcon from "/public/icons/setting_dashboard.svg";
import StatVignettesModal from "@/components/dashboard/StatVignettesModal";
import Tooltip from "@/components/Tooltip";
import GliftSpinner from "@/components/ui/GliftSpinner";
import {
  DEFAULT_STAT_VIGNETTES,
  sanitizeStatVignettes,
  type StatVignetteKey,
} from "@/constants/statVignettes";

const SESSION_OPTIONS = [
  { value: "5", label: "5 dernières séances" },
  { value: "7", label: "7 dernières séances" },
  { value: "10", label: "10 dernières séances" },
] as const;

type SessionValue = (typeof SESSION_OPTIONS)[number]["value"];

const DEFAULT_SESSION_VALUE: SessionValue = "7";
const FALLBACK_CURVE_VALUE: CurveOptionValue = CURVE_OPTIONS[0].value;

type TrainingExercise = {
  id: string;
  exercice: string | null;
};

const FALLBACK_EXERCISE_LABEL = "Exercice sans nom";

type StatsCard = {
  id: string;
  icon: string;
  label: string;
  value: number;
  previousValue: number;
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
  const animationFrameRef = useRef<number | null>(null);

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
        animationFrameRef.current = null;
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
        animationFrameRef.current = null;
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
      animationFrameRef.current = null;
    }
  }, []);

  return <span aria-live="polite">{format(displayValue)}</span>;
};

type StatMetric = {
  current: number;
  previous: number;
};

type DashboardStats = {
  sessions: StatMetric;
  time: StatMetric;
  weight: StatMetric;
  reps: StatMetric;
  volume: StatMetric;
  sets: StatMetric;
  totalReps: StatMetric;
  totalTime: StatMetric;
};

const createEmptyStats = (): DashboardStats => ({
  sessions: { current: 0, previous: 0 },
  time: { current: 0, previous: 0 },
  weight: { current: 0, previous: 0 },
  reps: { current: 0, previous: 0 },
  volume: { current: 0, previous: 0 },
  sets: { current: 0, previous: 0 },
  totalReps: { current: 0, previous: 0 },
  totalTime: { current: 0, previous: 0 },
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

type ExerciseDisplaySetting = {
  sessionCount: SessionValue;
  curveType: CurveOptionValue;
  recordCurveType: CurveOptionValue;
  goal: DashboardExerciseGoal | null;
};

type ExerciseDisplaySettings = Record<string, ExerciseDisplaySetting>;

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

const normalizeSessionValue = (value: unknown): SessionValue => {
  if (isSessionValue(value)) {
    return value;
  }
  return DEFAULT_SESSION_VALUE;
};

const isCurveValue = (value: unknown): value is CurveOptionValue =>
  typeof value === "string" &&
  CURVE_OPTIONS.some((option) => option.value === value);

const parseExerciseSettings = (value: unknown): ParsedExercisePreferences => {
  const empty: ParsedExercisePreferences = { settings: {}, selectedExerciseId: "" };

  const parseGoalSetting = (input: unknown): DashboardExerciseGoal | null => {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return null;
    }

    const { type, target } = input as { type?: unknown; target?: unknown };
    if (!isCurveValue(type)) {
      return null;
    }

    const parsedTarget = parseNumericValue(target);
    if (parsedTarget == null || parsedTarget <= 0) {
      return null;
    }

    return { type, target: parsedTarget } satisfies DashboardExerciseGoal;
  };

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

      const { sessionCount, curveType, recordCurveType, goal } = rawSettings as {
        sessionCount?: unknown;
        curveType?: unknown;
        recordCurveType?: unknown;
        goal?: unknown;
      };

      if (!isCurveValue(curveType)) {
        return accumulator;
      }

      const validSessionCount = normalizeSessionValue(sessionCount);
      const parsedRecordCurveType = isCurveValue(recordCurveType)
        ? recordCurveType
        : curveType;

      const parsedGoal = parseGoalSetting(goal);

      return {
        ...accumulator,
        [exerciseId]: {
          sessionCount: validSessionCount,
          curveType,
          recordCurveType: parsedRecordCurveType,
          goal: parsedGoal,
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
  statVignettes?: [StatVignetteKey, StatVignetteKey, StatVignetteKey, StatVignetteKey],
) => {
  const normalizedSettings = Object.entries(settings).reduce<ExerciseDisplaySettings>(
    (accumulator, [exerciseId, exerciseSettings]) => {
      const { sessionCount, curveType, recordCurveType, goal } = exerciseSettings;

      return {
        ...accumulator,
        [exerciseId]: {
          sessionCount,
          curveType,
          recordCurveType,
          goal: goal ?? null,
        },
      };
    },
    {},
  );

  return {
    selectedExerciseId: selectedExerciseId || null,
    exercises: normalizedSettings,
    ...(statVignettes ? { statVignettes } : {}),
  };
};

export default function DashboardClient({
  initialPageContent,
}: {
  initialPageContent: { surtitre: string; titre: string; description: string };
}) {
  const { user } = useUser();
  const { storeUrl, trainingsUrl } = useDashboardUrl();
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
  const [defaultSessionCount, setDefaultSessionCount] = useState<SessionValue>(DEFAULT_SESSION_VALUE);
  const [weightUnit, setWeightUnit] = useState<"kg" | "lb">("kg");
  const [showStats, setShowStats] = useState<boolean>(false);
  const isHydratedRef = useRef(false);

  const [activeVignettes, setActiveVignettes] = useState<
    [StatVignetteKey, StatVignetteKey, StatVignetteKey, StatVignetteKey]
  >(DEFAULT_STAT_VIGNETTES);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("glift_dashboard_show_stats");
      if (saved !== null) {
        setShowStats(saved === "true");
      }
      const cached = localStorage.getItem("dashboard_stat_vignettes");
      if (cached) {
        setActiveVignettes(sanitizeStatVignettes(JSON.parse(cached)));
      }
    } catch {}
    isHydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      localStorage.setItem("glift_dashboard_show_stats", String(showStats));
    } catch {}
  }, [showStats]);
  const [showVignettesModal, setShowVignettesModal] = useState(false);
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [hasProgramOptions, setHasProgramOptions] = useState(false);
  const [areFiltersLoading, setAreFiltersLoading] = useState(false);
  const [hasLoadedProgramList, setHasLoadedProgramList] = useState(false);
  const [stats, setStats] = useState<DashboardStats>(() => createEmptyStats());
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [goalCompletionMap, setGoalCompletionMap] = useState<Record<string, boolean>>({});
  const [hasLoadedDisplaySettings, setHasLoadedDisplaySettings] = useState(false);
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0);
  const pageContent = initialPageContent;

  const statsSliderRef = useRef<HTMLDivElement>(null);
  const isDraggingStatsRef = useRef(false);
  const startXStatsRef = useRef(0);
  const scrollLeftStatsRef = useRef(0);

  const handleStatsMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!statsSliderRef.current) return;
    isDraggingStatsRef.current = true;
    startXStatsRef.current = e.pageX - statsSliderRef.current.offsetLeft;
    scrollLeftStatsRef.current = statsSliderRef.current.scrollLeft;
  };

  const handleStatsMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingStatsRef.current || !statsSliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - statsSliderRef.current.offsetLeft;
    const walk = (x - startXStatsRef.current) * 1.5;
    statsSliderRef.current.scrollLeft = scrollLeftStatsRef.current - walk;
  };

  const handleStatsMouseUpOrLeave = () => {
    isDraggingStatsRef.current = false;
  };

  // Load display settings from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("glift_dashboard_exercise_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setExerciseDisplaySettings((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse saved settings", e);
      }
    }
    setHasLoadedDisplaySettings(true);
  }, []);

  // Save display settings to LocalStorage
  useEffect(() => {
    if (hasLoadedDisplaySettings) {
      localStorage.setItem("glift_dashboard_exercise_settings", JSON.stringify(exerciseDisplaySettings));
    }
  }, [exerciseDisplaySettings, hasLoadedDisplaySettings]);

  const completedGoalsCount = useMemo(
    () => Object.values(goalCompletionMap).filter(Boolean).length,
    [goalCompletionMap],
  );

  const handleProgramOptionsChange = useCallback(
    (options: Array<{ value: string; label: string }>) => {
      setHasProgramOptions(options.length > 0);
      setHasLoadedProgramList(true);
    },
    [],
  );

  const handleGoalCompletionChange = useCallback((exerciseId: string, isCompleted: boolean) => {
    setGoalCompletionMap((previous) => {
      const currentValue = previous[exerciseId] ?? false;
      if (currentValue === isCompleted) {
        return previous;
      }

      const nextState = { ...previous };

      if (isCompleted) {
        nextState[exerciseId] = true;
        return nextState;
      }

      delete nextState[exerciseId];
      return nextState;
    });
  }, []);

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

  useEffect(() => {
    setGoalCompletionMap({});
  }, [selectedTraining]);

  const integerFormatter = useMemo(
    () => new Intl.NumberFormat("fr-FR"),
    [],
  );
  const weightFormatter = useMemo(
    () => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }),
    [],
  );

  const statsCards = useMemo<StatsCard[]>(() => {
    const formatInteger = (input: number) =>
      integerFormatter.format(Math.max(0, Math.round(input)));

    return activeVignettes.map((vignetteKey) => {
      const isLb = weightUnit === "lb";

      switch (vignetteKey) {
        case "sessions":
          return {
            id: "sessions",
            icon: "/icons/stat_seance.svg",
            label: "Séances d'entraînement",
            value: stats.sessions.current,
            previousValue: stats.sessions.previous,
            format: formatInteger,
            precision: 0,
          };
        case "time":
          return {
            id: "time",
            icon: "/icons/stat_temps.svg",
            label: "Minutes par séance en moyenne",
            value: stats.time.current,
            previousValue: stats.time.previous,
            format: formatInteger,
            precision: 0,
          };
        case "weight":
          return {
            id: "weight",
            icon: "/icons/stat_poids.svg",
            label: isLb ? "Lb soulevés en moyenne" : "Kg soulevés en moyenne",
            value: stats.weight.current,
            previousValue: stats.weight.previous,
            format: formatInteger,
            precision: 0,
          };
        case "reps":
          return {
            id: "reps",
            icon: "/icons/stat_rep.svg",
            label: "Répétitions par série en moyenne",
            value: stats.reps.current,
            previousValue: stats.reps.previous,
            format: formatInteger,
            precision: 0,
          };
        case "volume":
          return {
            id: "volume",
            icon: "/icons/stat_poids.svg",
            label: isLb ? "Volume total soulevé (lb)" : "Volume total soulevé (kg)",
            value: stats.volume.current,
            previousValue: stats.volume.previous,
            format: formatInteger,
            precision: 0,
          };
        case "sets":
          return {
            id: "sets",
            icon: "/icons/stat_seance.svg",
            label: "Séries effectuées au total",
            value: stats.sets.current,
            previousValue: stats.sets.previous,
            format: formatInteger,
            precision: 0,
          };
        case "totalReps":
          return {
            id: "totalReps",
            icon: "/icons/stat_rep.svg",
            label: "Répétitions effectuées au total",
            value: stats.totalReps.current,
            previousValue: stats.totalReps.previous,
            format: formatInteger,
            precision: 0,
          };
        case "totalTime":
        default:
          return {
            id: "totalTime",
            icon: "/icons/stat_temps.svg",
            label: "Minutes d'entraînement au total",
            value: stats.totalTime.current,
            previousValue: stats.totalTime.previous,
            format: formatInteger,
            precision: 0,
          };
      }
    });
  }, [
    activeVignettes,
    integerFormatter,
    stats,
    weightUnit,
  ]);

  const [responsiveCardWidth, setResponsiveCardWidth] = useState<number>(205);
  const measureLabelsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (!measureLabelsRef.current) return;
      const elements = measureLabelsRef.current.children;
      let maxWidth = 0;
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement;
        const width = el.getBoundingClientRect().width;
        if (width > maxWidth) {
          maxWidth = width;
        }
      }
      if (maxWidth > 0) {
        // Marge à gauche = 20px (px-5), même marge à droite = 20px -> + 40px
        const totalWidth = Math.ceil(maxWidth + 40);
        setResponsiveCardWidth(totalWidth);
      }
    };

    updateWidth();

    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(updateWidth);
    }

    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [statsCards]);

  const hasInitiallyLoadedRef = useRef(false);

  if (hasLoadedPreferences && !areFiltersLoading && !isLoadingExercises) {
    hasInitiallyLoadedRef.current = true;
  }

  const isGlobalLoading =
    !hasInitiallyLoadedRef.current &&
    (!hasLoadedPreferences || areFiltersLoading || isLoadingExercises);

  const showSkeleton = useMinimumVisibility(isGlobalLoading, 400);

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
      sessionCount: defaultSessionCount,
      curveType: defaultCurveValue,
      recordCurveType: defaultCurveValue,
      goal: null,
    };

  const updateExerciseSettings = (
    exerciseId: string,
    partial: Partial<{
      sessionCount: SessionValue;
      curveType: CurveOptionValue;
      recordCurveType: CurveOptionValue;
      goal: DashboardExerciseGoal | null;
    }>,
  ) => {
    setExerciseDisplaySettings((previous) => {
      const current = previous[exerciseId] ?? {
        sessionCount: defaultSessionCount,
        curveType: defaultCurveValue,
        recordCurveType: defaultCurveValue,
        goal: null,
      };
      const { goal, ...restPartial } = partial;
      const nextSettings = { ...current, ...restPartial } as ExerciseDisplaySetting;
      if (goal !== undefined) {
        nextSettings.goal = goal;
      }

      if (nextSettings.goal === undefined) {
        nextSettings.goal = current.goal ?? null;
      }

      return {
        ...previous,
        [exerciseId]: nextSettings,
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
          .select("curve, weight_unit, default_session_count")
          .eq("id", user.id)
          .maybeSingle<Pick<PreferencesRow, "curve" | "weight_unit" | "default_session_count">>(),
      ]);

      if (!isMounted) return;

      if (userPreferencesResponse.error) {
        setDefaultCurveValue(FALLBACK_CURVE_VALUE);
        setWeightUnit("kg");
      } else {
        const rawCurve = userPreferencesResponse.data?.curve ?? null;
        setDefaultCurveValue(
          rawCurve ? CURVE_FROM_DB[rawCurve] ?? FALLBACK_CURVE_VALUE : FALLBACK_CURVE_VALUE,
        );
        const rawUnit = userPreferencesResponse.data?.weight_unit;
        // Assuming "imperial" -> "lb", "metric" -> "kg" or if it stores "kg"/"lb" directly.
        // Looking at PreferencesSection, it likely stores direct values or we have a map.
        // Let's verify what PreferencesSection saves.
        setWeightUnit(rawUnit === "lb" ? "lb" : "kg");
        const rawSessionCount = userPreferencesResponse.data?.default_session_count;
        if (rawSessionCount) {
          const stringVal = String(rawSessionCount);
          if (SESSION_OPTIONS.some((o) => o.value === stringVal)) {
            setDefaultSessionCount(stringVal as SessionValue);
          } else {
            setDefaultSessionCount(DEFAULT_SESSION_VALUE);
          }
        }
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
        const rawVignettes = (preferences?.exercise_settings as any)?.statVignettes;
        if (rawVignettes) {
          const sanitized = sanitizeStatVignettes(rawVignettes);
          setActiveVignettes(sanitized);
          try {
            localStorage.setItem("dashboard_stat_vignettes", JSON.stringify(sanitized));
          } catch {}
        }
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

  // Realtime subscription for global stats
  useEffect(() => {
    if (!user?.id) return;

    // Listen to changes in training_sessions to update stats
    const channel = supabase
      .channel(`dashboard-stats-updates-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "training_sessions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          setStatsRefreshTrigger((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
          activeVignettes,
        ),
        show_stats: showStats,
        updated_at: new Date().toISOString(),
      };
      await supabase.from("dashboard_preferences").upsert(payload, { onConflict: "user_id" });
    };
    void persistPreferences();
  }, [
    activeVignettes,
    exerciseDisplaySettings,
    hasLoadedPreferences,
    selectedProgram,
    selectedTraining,
    selectedExercise,
    showStats,
    supabase,
    user?.id,
  ]);

  const handleSaveVignettes = async (
    newVignettes: [StatVignetteKey, StatVignetteKey, StatVignetteKey, StatVignetteKey],
  ) => {
    setActiveVignettes(newVignettes);
    try {
      localStorage.setItem("dashboard_stat_vignettes", JSON.stringify(newVignettes));
    } catch {}

    if (!user?.id) return;

    const { data: currentPrefs } = await supabase
      .from("dashboard_preferences")
      .select("exercise_settings")
      .eq("user_id", user.id)
      .maybeSingle();

    const currentSettings = (currentPrefs?.exercise_settings as any) || {};

    const payload: DashboardPreferencesInsert = {
      user_id: user.id,
      selected_program_id: selectedProgram || null,
      selected_training_id: selectedTraining || null,
      selected_exercise_id: selectedExercise || null,
      exercise_settings: {
        ...currentSettings,
        statVignettes: newVignettes,
      },
      show_stats: showStats,
      updated_at: new Date().toISOString(),
    };

    await supabase.from("dashboard_preferences").upsert(payload, { onConflict: "user_id" });
  };

  useEffect(() => {
    if (!user?.id || !showStats) {
      setStats(createEmptyStats());
      setIsLoadingStats(false);
      return;
    }

    let isMounted = true;

    const fetchStats = async () => {
      setIsLoadingStats(true);

      const now = new Date();
      const day7 = new Date();
      day7.setDate(now.getDate() - 7);
      const day14 = new Date();
      day14.setDate(now.getDate() - 14);

      // Les vignettes comparent uniquement J-7→J et J-14→J-7 : inutile de charger l'historique complet.
      const { data, error } = await supabase
        .from("training_session_exercises")
        .select(
          `
            session_id,
            session:training_sessions!inner (
              performed_at,
              program_id,
              program:programs (
                id,
                dashboard
              ),
              training:trainings (
                program_id
              )
            ),
            sets:training_session_sets (
              repetitions,
              weights
            )
          `,
        )
        .eq("training_sessions.user_id", user.id)
        .gte("training_sessions.performed_at", day14.toISOString());

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
        session: {
          performed_at?: string | null;
          program_id?: string | null;
          program?: { id?: string | null; dashboard?: boolean | null } | null;
          training?: { program_id?: string | null } | null;
        } | null;
        sets: Array<{ repetitions?: unknown; weights?: unknown }> | null;
      };

      const rows = (data ?? []) as SessionExerciseRow[];

      // Metrics accumulators for Current (Last 7 days) and Previous (7-14 days ago)
      let currentSessions = new Set<string>();
      let previousSessions = new Set<string>();

      let currentDurationSum = 0;
      let previousDurationSum = 0;

      let currentWeightSum = 0;
      let currentWeightCount = 0;
      let previousWeightSum = 0;
      let previousWeightCount = 0;

      let currentRepSum = 0;
      let currentRepCount = 0;
      let previousRepSum = 0;
      let previousRepCount = 0;

      let currentVolumeSum = 0;
      let previousVolumeSum = 0;

      let currentSetsCount = 0;
      let previousSetsCount = 0;

      let currentTotalRepsSum = 0;
      let previousTotalRepsSum = 0;

      // Map to store calculated durations per session to avoid re-calculating
      const sessionDurations = new Map<string, number>();

      for (const row of rows) {
        // Filter by visible program
        const programDashboard = row.session?.program?.dashboard;
        let programId = row.session?.program?.id;

        if (!programId && row.session?.program_id) {
          programId = row.session.program_id;
        }

        // Secondary Fallback: use program_id from training if link to program is missing on session
        if (!programId && row.session?.training?.program_id) {
          programId = row.session.training.program_id;
        }

        // 1. If global stats (no selection), exclude hidden programs
        if (!selectedProgram && programDashboard === false) {
          continue;
        }

        // 2. If a specific program is selected, exclude all others
        // Ensure both IDs are treated as strings for comparison
        if (selectedProgram && String(programId) !== String(selectedProgram)) {
          continue;
        }

        const sessionId = typeof row.session_id === "string" ? row.session_id : null;
        const performedAtStr =
          row.session && typeof row.session === "object" && typeof row.session.performed_at === "string"
            ? row.session.performed_at
            : null;

        if (!sessionId || !performedAtStr) continue;

        const performedAt = new Date(performedAtStr);
        // Relax date check to effectively remove strict upper bound in case of clock skew
        // If it's in the future, we still count it as 'Current' usually, or we should.
        // Let's just say isCurrent = performedAt >= day7.
        const isCurrent = performedAt >= day7;
        const isPrevious = performedAt >= day14 && performedAt < day7;

        if (!isCurrent && !isPrevious) continue;

        // Process Session & Duration
        if (isCurrent) {
          if (!currentSessions.has(sessionId)) {
            currentSessions.add(sessionId);
            const duration = createDeterministicDuration(sessionId, performedAtStr);
            sessionDurations.set(sessionId, duration);
            currentDurationSum += duration;
          }
        } else {
          if (!previousSessions.has(sessionId)) {
            previousSessions.add(sessionId);
            const duration = createDeterministicDuration(sessionId, performedAtStr);
            sessionDurations.set(sessionId, duration);
            previousDurationSum += duration;
          }
        }

        // Process Sets (Weight & Reps)
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

          if (isCurrent) {
            currentSetsCount += 1;
          } else {
            previousSetsCount += 1;
          }

          if (repetitions !== null) {
            if (isCurrent) {
              currentRepSum += repetitions;
              currentRepCount += 1;
              currentTotalRepsSum += repetitions;
            } else {
              previousRepSum += repetitions;
              previousRepCount += 1;
              previousTotalRepsSum += repetitions;
            }
          }

          if (numericWeights.length > 0) {
            const avgSetWeight = numericWeights.reduce((a, b) => a + b, 0) / numericWeights.length;
            // Exclure les séries au poids du corps ou sans charge (0 kg) pour ne pas fausser la moyenne des charges soulevées
            if (avgSetWeight > 0) {
              if (isCurrent) {
                currentWeightSum += avgSetWeight;
                currentWeightCount += 1;
                if (repetitions !== null && repetitions > 0) {
                  currentVolumeSum += avgSetWeight * repetitions;
                }
              } else {
                previousWeightSum += avgSetWeight;
                previousWeightCount += 1;
                if (repetitions !== null && repetitions > 0) {
                  previousVolumeSum += avgSetWeight * repetitions;
                }
              }
            }
          }
        }
      }

      setStats({
        sessions: {
          current: currentSessions.size,
          previous: previousSessions.size
        },
        time: {
          current: currentSessions.size > 0 ? currentDurationSum / currentSessions.size : 0,
          previous: previousSessions.size > 0 ? previousDurationSum / previousSessions.size : 0
        },
        weight: {
          current: currentWeightCount > 0 ? currentWeightSum / currentWeightCount : 0,
          previous: previousWeightCount > 0 ? previousWeightSum / previousWeightCount : 0
        },
        reps: {
          current: currentRepCount > 0 ? currentRepSum / currentRepCount : 0,
          previous: previousRepCount > 0 ? previousRepSum / previousRepCount : 0
        },
        volume: {
          current: currentVolumeSum,
          previous: previousVolumeSum,
        },
        sets: {
          current: currentSetsCount,
          previous: previousSetsCount,
        },
        totalReps: {
          current: currentTotalRepsSum,
          previous: previousTotalRepsSum,
        },
        totalTime: {
          current: currentDurationSum,
          previous: previousDurationSum,
        },
      } as any);
      setIsLoadingStats(false);
    };

    void fetchStats();

    return () => {
      isMounted = false;
    };
  }, [showStats, supabase, user?.id, selectedProgram, statsRefreshTrigger]);

  useEffect(() => {
    if (isLoadingStats) {
      setShowTrends(false);
    } else {
      const timer = setTimeout(() => {
        setShowTrends(true);
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [isLoadingStats]);

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
    <main className="flex-1 bg-[#FBFCFE] px-5 pt-[100px] md:pt-[140px] pb-[60px] md:pb-[80px]">
      <div className="max-w-[1152px] mx-auto w-full">
        <div className="text-center">
          {pageContent && (
            <>
              {pageContent.surtitre && (
                <div className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide text-center">
                  {pageContent.surtitre}
                </div>
              )}
              <h1 
                className="text-[24px] sm:text-[30px] font-bold text-[#2E3271] mb-2 text-center prose-titles [&_p]:m-0" 
                dangerouslySetInnerHTML={{ __html: pageContent.titre }} 
              />
              <div 
                className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] text-center max-w-[500px] mx-auto leading-relaxed mb-8 [&_p]:m-0" 
                dangerouslySetInnerHTML={{ __html: pageContent.description }} 
              />
            </>
          )}
        </div>

        <div className="relative w-full">
          {/* SKELETON (in-flow to reserve height and keep layout stable) */}
          {showSkeleton && (
            <div className="w-full animate-pulse space-y-[30px]">
              <DashboardFiltersSkeleton showStats={showStats} />
              <DashboardExercisesSkeleton showFilters={false} />
            </div>
          )}

          {/* CONTENT (mounted to allow data fetching but hidden if loading) */}
          <div
            className={`transition-opacity duration-200 ${
              showSkeleton ? "pointer-events-none opacity-0 h-0 overflow-hidden" : "opacity-100"
            }`}
            aria-hidden={showSkeleton}
          >
            {/* Élément invisible pour calculer dynamiquement la largeur du plus long intitulé */}
            <div
              ref={measureLabelsRef}
              aria-hidden="true"
              className="invisible absolute pointer-events-none -left-[9999px] -top-[9999px]"
            >
              {statsCards.map((card) => (
                <span
                  key={card.id}
                  className="text-[12px] font-bold whitespace-nowrap"
                >
                  {card.label}
                </span>
              ))}
            </div>

            {/* Bouton Masquer / Afficher les vignettes en haut à droite */}
            <div className="mt-[40px] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowStats(!showStats)}
                className="w-full sm:w-auto h-10 sm:min-w-[215px] border border-[#D7D4DC] rounded-[5px] px-3 flex items-center justify-center sm:justify-start gap-2 text-[16px] font-semibold text-[#3A416F] bg-white hover:border-[#C2BFC6] transition"
                aria-pressed={showStats}
              >
                <span className="relative size-4">
                  <Image
                    src={showStats ? StatsRedIcon : StatsGreenIcon}
                    alt=""
                    fill
                    sizes="16px"
                    className="object-contain"
                  />
                </span>
                <span>{showStats ? "Masquer les vignettes" : "Afficher les vignettes"}</span>
              </button>

              <Tooltip content="Réglage des vignettes">
                <button
                  type="button"
                  onClick={() => setShowVignettesModal(true)}
                  aria-label="Réglage des vignettes"
                  className="group h-10 w-10 flex-shrink-0 border border-[#D7D4DC] rounded-[5px] flex items-center justify-center bg-white hover:border-[#C2BFC6] transition"
                >
                  <span className="relative w-[18px] h-[17px] flex items-center justify-center transition-transform duration-300 group-hover:rotate-45">
                    <Image
                      src={SettingDashboardIcon}
                      alt=""
                      width={18}
                      height={17}
                      className="w-[18px] h-[17px] object-contain"
                    />
                  </span>
                </button>
              </Tooltip>
            </div>

            {showStats && (
              <div className="mt-[20px] mb-[30px]">
                <div
                  ref={statsSliderRef}
                  onMouseDown={handleStatsMouseDown}
                  onMouseMove={handleStatsMouseMove}
                  onMouseUp={handleStatsMouseUpOrLeave}
                  onMouseLeave={handleStatsMouseUpOrLeave}
                  className="w-auto -mx-5 xl:mx-0 xl:w-full overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing xl:cursor-default"
                >
                  <div
                    style={
                      {
                        "--stat-card-width": `${responsiveCardWidth}px`,
                      } as React.CSSProperties
                    }
                    className="flex items-stretch justify-start gap-[24px] min-w-max px-5 xl:px-0 pb-2 pt-1 xl:overflow-x-visible xl:flex-wrap"
                  >
                    {statsCards.map((card) => {
                      const diff = card.value - card.previousValue;
                      const absDiff = Math.abs(diff);
                      const isPositive = diff > 0;
                      const isNegative = diff < 0; 

                      let arrowIcon = "/icons/Arrow_green_up.svg";
                      let diffColor = "text-[#00D591]"; // Green

                      if (diff > 0) {
                        arrowIcon = "/icons/Arrow_green_up.svg";
                        diffColor = "text-[#00D591]";
                      } else if (diff < 0) {
                        arrowIcon = "/icons/Arrow_red_down.svg";
                        diffColor = "text-[#EF4F4E]";
                      } else {
                        arrowIcon = "/icons/Arrow_green_up.svg";
                      }

                      const diffFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
                      const formattedDiff = diffFormatter.format(Math.round(Math.abs(diff)));

                      return (
                        <div
                          key={card.id}
                          className="flex h-[135px] w-[var(--stat-card-width,205px)] xl:w-[270px] shrink-0 flex-col items-start justify-center gap-[5px] rounded-[20px] border border-[#D7D4DC] bg-white px-5 py-5 select-none"
                        >
                          <div className="flex h-[36px] w-full items-center justify-start gap-3">
                            <div className="flex items-center justify-center shrink-0">
                              <Image
                                src={card.icon}
                                alt=""
                                width={28}
                                height={28}
                                className="h-[28px] w-[28px]"
                              />
                            </div>

                            <div className="flex items-baseline gap-2">
                              <span className="text-[30px] font-bold leading-none text-[#3A416F]">
                                <StatsValue
                                  value={card.value}
                                  format={card.format}
                                  precision={card.precision}
                                  isLoading={isLoadingStats}
                                />
                              </span>
                              {Math.round(Math.abs(diff)) >= 1 && (
                                <div className={`flex items-center gap-1 mb-1 transition-opacity duration-700 ${diffColor} ${showTrends ? "opacity-100" : "opacity-0"}`}>
                                  <Image
                                    src={arrowIcon}
                                    alt=""
                                    width={12}
                                    height={12}
                                    className="h-3 w-3"
                                  />
                                  <span className="text-[10px] font-semibold">
                                    {diff > 0 ? "+" : ""}{formattedDiff}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <p className="text-[12px] font-bold text-[#3A416F] whitespace-nowrap">
                              {card.label}
                            </p>
                            <p className="text-[10px] font-semibold text-[#5D6494]">
                              7 derniers jours
                            </p>
                            <p className="text-[10px] font-semibold text-[#C2BFC6]">
                              VS les 7 derniers jours
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Champs dropdown sous les vignettes de stats */}
            <div className="mt-[30px] mb-[30px]">
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
                onProgramOptionsChange={handleProgramOptionsChange}
                onFiltersLoadingChange={setAreFiltersLoading}
              />
            </div>

            {hasLoadedPreferences && hasLoadedProgramList && !selectedProgram && (
              <div className="text-center mt-[40px] mb-[40px] flex flex-col items-center">
                <h2 className="text-[18px] font-bold text-[#2E3271] mb-[12px]">
                  Oups ! Aucun programme pour le moment....
                </h2>
                <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] leading-relaxed mb-[20px] max-w-[550px] text-center">
                  {hasProgramOptions ? (
                    <>
                      Sélectionne un programme dans le menu déroulant ou rends toi dans le{" "}
                      <Link href={storeUrl} className="text-[#7069FA] hover:text-[#6660e4] transition-colors">
                        Store
                      </Link>{" "}
                      pour en trouver un nouveau !
                    </>
                  ) : (
                    <>
                      <Link href={trainingsUrl} className="text-[#7069FA] hover:text-[#6660e4] transition-colors">
                        Crée un entraînement
                      </Link>{" "}
                      dès maintenant ou rends toi dans le{" "}
                      <Link href={storeUrl} className="text-[#7069FA] hover:text-[#6660e4] transition-colors">
                        Store
                      </Link>{" "}
                      pour trouver ton prochain programme !
                    </>
                  )}
                </p>
                <CTAButton href={storeUrl}>
                  Aller sur le Store
                </CTAButton>
              </div>
            )}

            {selectedProgram !== "" && selectedTraining === "" && (
              <div className="text-center mt-[40px] mb-[40px] flex flex-col items-center">
                <h2 className="text-[18px] font-bold text-[#2E3271] mb-[12px]">
                  Oups ! Aucun entraînement pour le moment....
                </h2>
                <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] leading-relaxed max-w-[550px] text-center">
                  Sélectionne un entraînement dans le menu déroulant pour
                  afficher tes performances exercice par exercice.
                </p>
              </div>
            )}

            {selectedTraining !== "" && (
              <div className="mt-[30px]">
                {fetchError ? (
                  <p className="text-center text-[#E53E3E] font-semibold">{fetchError}</p>
                ) : isLoadingExercises || !hasFetchedExercises ? (
                  <div className="flex justify-center py-10">
                    <GliftSpinner size={32} />
                  </div>
                ) : trainingExercises.length === 0 ? (
                  <p className="text-center text-[#5D6494] font-semibold">
                    Aucun exercice n&apos;a été trouvé pour cet entraînement.
                  </p>
                ) : selectedExercise !== "" && filteredExercises.length === 0 ? (
                  <p className="text-center text-[#5D6494] font-semibold">
                    Aucun exercice ne correspond à votre sélection.
                  </p>
                ) : (
                  <div>
                    {filteredExercises.map((exercise, index) => {
                      const settings = getExerciseSettings(exercise.id);
                      return (
                        <Fragment key={exercise.id}>
                          {index > 0 && (
                            <div className="w-full h-[1px] bg-[#E7E8EA] my-[20px]" />
                          )}
                          <DashboardExerciseBlock
                            id={exercise.id}
                            name={exercise.exercice?.trim() || FALLBACK_EXERCISE_LABEL}
                            sessionCount={settings.sessionCount}
                            curveType={settings.curveType}
                            recordType={settings.recordCurveType}
                            goal={settings.goal}
                            onSessionChange={(nextValue: string) => {
                              if (SESSION_OPTIONS.some((o) => o.value === nextValue)) {
                                updateExerciseSettings(exercise.id, {
                                  sessionCount: nextValue as SessionValue,
                                });
                              }
                            }}
                            onCurveChange={(nextValue: string) => {
                              if (CURVE_OPTIONS.some((o) => o.value === nextValue)) {
                                updateExerciseSettings(exercise.id, {
                                  curveType: nextValue as CurveOptionValue,
                                });
                              }
                            }}
                            onRecordTypeChange={(nextValue: string) => {
                              if (CURVE_OPTIONS.some((o) => o.value === nextValue)) {
                                updateExerciseSettings(exercise.id, {
                                  recordCurveType: nextValue as CurveOptionValue,
                                });
                              }
                            }}
                            onGoalChange={(nextGoal: DashboardExerciseGoal | null) => {
                              updateExerciseSettings(exercise.id, {
                                goal: nextGoal,
                              });
                            }}
                            onGoalCompletionChange={handleGoalCompletionChange}
                            weightUnit={weightUnit}
                          />
                        </Fragment>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
      <StatVignettesModal
        open={showVignettesModal}
        onClose={() => setShowVignettesModal(false)}
        vignettes={activeVignettes}
        onSave={handleSaveVignettes}
        weightUnit={weightUnit}
      />
    </main>
  );
}
