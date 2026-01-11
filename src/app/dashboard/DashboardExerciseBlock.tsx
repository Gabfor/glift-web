"use client";

import Image from "next/image";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import type { Props as RechartsDotProps } from "recharts/types/shape/Dot";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";
import CTAButton from "@/components/CTAButton";
import DropdownField from "@/components/account/fields/DropdownField";
import DashboardExerciseDropdown from "@/components/dashboard/DashboardExerciseDropdown";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/ui/Modal";
import ModalMessage from "@/components/ui/ModalMessage";
import TextField from "@/components/account/fields/TextField";
import { CURVE_OPTIONS, type CurveOptionValue } from "@/constants/curveOptions";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabaseClient";
import DashboardRecordCard from "@/components/dashboard/DashboardRecordCard";
import RecordsCarousel from "@/components/dashboard/RecordsCarousel";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { DashboardExerciseGoal } from "@/app/dashboard/types";

export interface DashboardExerciseBlockProps {
  id: string;
  name: string;
  sessionCount: string;
  curveType: CurveOptionValue;
  recordType: CurveOptionValue;
  onSessionChange: (value: string) => void;
  onCurveChange: (value: string) => void;
  onRecordTypeChange: (value: CurveOptionValue) => void;
  goal?: DashboardExerciseGoal | null;
  onGoalChange: (goal: DashboardExerciseGoal | null) => void;
  onGoalCompletionChange?: (exerciseId: string, completed: boolean) => void;
}

type SessionSet = {
  repetitions: number | null;
  weights: number[];
};

type RawSession = {
  performedAt: string;
  sets: SessionSet[];
};

type ChartPoint = {
  date: string;
  tooltipDate: string;
  unit: string;
  value: number | null;
};

type ExerciseRecord = {
  curveType: CurveOptionValue;
  label: string;
  value: number | null;
  date: Date | null;
};

type AggregatedSessionMetrics = {
  averageWeight: number | null;
  maxWeight: number | null;
  totalWeight: number;
  averageReps: number | null;
  maxReps: number | null;
  totalReps: number;
};

const CURVE_UNIT_MAP: Record<CurveOptionValue, string> = {
  "poids-moyen": "kg",
  "poids-maximum": "kg",
  "poids-total": "kg",
  "repetition-moyenne": "rép.",
  "repetition-maximum": "rép.",
  "repetitions-totales": "rép.",
};

const CURVE_DISPLAY_UNIT_MAP: Record<CurveOptionValue, string> = {
  "poids-moyen": "Kg",
  "poids-maximum": "Kg",
  "poids-total": "Kg",
  "repetition-moyenne": "Rép.",
  "repetition-maximum": "Rép.",
  "repetitions-totales": "Rép.",
};

const parseSessionCount = (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const roundValue = (value: number): number => Math.round(value * 100) / 100;

const MONTH_SHORT_LABELS = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
];

const measureTextWidth = (text: string, font: string): number => {
  if (typeof document === "undefined") {
    return 0;
  }
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    return 0;
  }
  context.font = font;
  const metrics = context.measureText(text);
  return metrics.width;
};

const formatChartLabel = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = MONTH_SHORT_LABELS[date.getMonth()];
  return `${day} ${month}`;
};

const aggregateSessionMetrics = (session: RawSession): AggregatedSessionMetrics => {
  let totalWeight = 0;
  let weightSumForAverage = 0;
  let weightCountForAverage = 0;
  let maxWeight: number | null = null;

  let totalReps = 0;
  let repSumForAverage = 0;
  let repCountForAverage = 0;
  let maxReps: number | null = null;

  session.sets.forEach((set) => {
    const weights = set.weights;
    const repetitions =
      typeof set.repetitions === "number" && Number.isFinite(set.repetitions)
        ? set.repetitions
        : null;

    if (weights.length > 0) {
      const setTotalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      const setAverageWeight = setTotalWeight / weights.length;
      totalWeight += setTotalWeight;
      weightSumForAverage += setAverageWeight;
      weightCountForAverage += 1;
      maxWeight = maxWeight === null ? setAverageWeight : Math.max(maxWeight, setAverageWeight);
    }

    const effectiveRepetitions =
      repetitions ?? (weights.length > 0 ? weights.length : null);

    if (typeof effectiveRepetitions === "number" && Number.isFinite(effectiveRepetitions)) {
      totalReps += effectiveRepetitions;
      repSumForAverage += effectiveRepetitions;
      repCountForAverage += 1;
      maxReps =
        maxReps === null ? effectiveRepetitions : Math.max(maxReps, effectiveRepetitions);
    }
  });

  return {
    averageWeight: weightCountForAverage > 0 ? weightSumForAverage / weightCountForAverage : null,
    maxWeight,
    totalWeight,
    averageReps: repCountForAverage > 0 ? repSumForAverage / repCountForAverage : null,
    maxReps,
    totalReps,
  };
};

const getValueForCurve = (
  metrics: AggregatedSessionMetrics,
  curveType: CurveOptionValue,
): number | null => {
  switch (curveType) {
    case "poids-moyen":
      return metrics.averageWeight;
    case "poids-maximum":
      return metrics.maxWeight;
    case "poids-total":
      return metrics.totalWeight;
    case "repetition-moyenne":
      return metrics.averageReps;
    case "repetition-maximum":
      return metrics.maxReps;
    case "repetitions-totales":
      return metrics.totalReps;
    default:
      return null;
  }
};

const splitDateLabel = (label: string) => {
  const [day, ...rest] = label.split(" ");
  return {
    day: day ?? "",
    month: rest.join(" ") ?? "",
  };
};

const formatRecordDate = (value: Date | null): string => {
  if (!value || Number.isNaN(value.getTime())) {
    return "Aucune donnée";
  }

  const day = value.getDate().toString().padStart(2, "0");
  const month = MONTH_SHORT_LABELS[value.getMonth()];
  const year = value.getFullYear();

  return `${day} ${month} ${year}`;
};

const createInitialRecords = (): ExerciseRecord[] =>
  CURVE_OPTIONS.map((option) => ({
    curveType: option.value,
    label: option.label,
    value: null,
    date: null,
  }));

const removeDiacritics = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const sanitizeMonthToken = (token: string) =>
  removeDiacritics(token.trim()).toLowerCase().replace(/[^a-z]/g, "");

const MONTH_LABEL_MAP: Record<string, number> = {
  jan: 1,
  janvier: 1,
  janv: 1,
  feb: 2,
  fev: 2,
  fevr: 2,
  fevrier: 2,
  mar: 3,
  mars: 3,
  apr: 4,
  avr: 4,
  avril: 4,
  may: 5,
  mai: 5,
  jun: 6,
  juin: 6,
  jul: 7,
  jui: 7,
  juil: 7,
  juillet: 7,
  aug: 8,
  aou: 8,
  aout: 8,
  sep: 9,
  sept: 9,
  septembre: 9,
  oct: 10,
  octobre: 10,
  nov: 11,
  novembre: 11,
  dec: 12,
  decembre: 12,
};

const resolveMonthIndex = (token: string): number | null => {
  const sanitized = sanitizeMonthToken(token);
  if (!sanitized) {
    return null;
  }

  if (MONTH_LABEL_MAP[sanitized]) {
    return MONTH_LABEL_MAP[sanitized];
  }

  const shortened = sanitized.slice(0, 3);
  return shortened && MONTH_LABEL_MAP[shortened] ? MONTH_LABEL_MAP[shortened] : null;
};

const parseDateFromLabel = (value: unknown): Date | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const dateFromNumber = new Date(value);
    return Number.isNaN(dateFromNumber.getTime()) ? null : dateFromNumber;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const directParse = new Date(trimmed);
  if (!Number.isNaN(directParse.getTime())) {
    return directParse;
  }

  const cleaned = trimmed.replace(/[,]/g, " ").replace(/\s+/g, " ").trim();
  const parts = cleaned.split(" ");
  if (parts.length < 2) {
    return null;
  }

  const dayPart = Number.parseInt(parts[0], 10);
  if (Number.isNaN(dayPart)) {
    return null;
  }

  const numericMonth = Number.parseInt(parts[1], 10);
  const monthIndex = !Number.isNaN(numericMonth)
    ? Math.min(Math.max(numericMonth, 1), 12)
    : resolveMonthIndex(parts[1]);
  if (monthIndex == null) {
    return null;
  }

  const yearPart = parts.slice(2).find((part) => /^\d{4}$/.test(part));
  const year = yearPart ? Number.parseInt(yearPart, 10) : new Date().getFullYear();

  const candidate = new Date(year, monthIndex - 1, dayPart);
  return Number.isNaN(candidate.getTime()) ? null : candidate;
};

const formatTooltipDate = (value: unknown): string => {
  const parsedDate = parseDateFromLabel(value);

  if (!parsedDate) {
    return typeof value === "string" ? value : "";
  }

  const day = parsedDate.getDate().toString().padStart(2, "0");
  const month = MONTH_SHORT_LABELS[parsedDate.getMonth()];
  const year = parsedDate.getFullYear();

  return `${day} ${month} ${year}`;
};

type AxisTickProps = {
  x: number;
  y: number;
  payload: { value: string };
};

const DateAxisTick = ({ x, y, payload }: AxisTickProps) => {
  const { day, month } = splitDateLabel(payload?.value ?? "");

  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle">
        <tspan
          x={0}
          dy={-6}
          fill="#3A416F"
          fontSize={12}
          fontWeight={700}
        >
          {day}
        </tspan>
        <tspan
          x={0}
          dy={14}
          fill="#C2BFC6"
          fontSize={10}
          fontWeight={600}
        >
          {month}
        </tspan>
      </text>
    </g>
  );
};

const renderDateAxisTick = (props: AxisTickProps) => <DateAxisTick {...props} />;

type ValueAxisTickProps = {
  x: number;
  y: number;
  payload: { value: number };
};

const Y_AXIS_TICK_OFFSET = 10;
const Y_AXIS_GRID_GAP = 20;
const Y_AXIS_WIDTH = 52;

const ValueAxisTick = ({
  y,
  payload,
  unit,
  axisWidth,
}: ValueAxisTickProps & { unit: string; axisWidth: number }) => {
  const numericValue = typeof payload?.value === "number" ? payload.value : 0;
  const formattedValue = numericValue.toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  });

  return (
    <text
      x={axisWidth - Y_AXIS_GRID_GAP}
      y={y}
      fill="#3A416F"
      fontSize={12}
      fontWeight={700}
      textAnchor="end"
      dominantBaseline="middle"
    >
      {`${formattedValue}${unit ? ` ${unit}` : ""}`}
    </text>
  );
};

const createValueAxisTickRenderer = (unit: string, axisWidth: number) => {
  const TickComponent = (props: ValueAxisTickProps) => (
    <ValueAxisTick {...props} unit={unit} axisWidth={axisWidth} />
  );
  TickComponent.displayName = "DashboardValueAxisTick";
  return TickComponent;
};

const TOOLTIP_OFFSET_FROM_POINT_PX = 20;
const CHART_DOT_RADIUS = 4;
const CHART_ACTIVE_DOT_RADIUS = 5;
const CHART_DOT_INTERACTION_RADIUS = 14;

const DEFAULT_GOAL_ICON_SRC = "/icons/trophy.svg";
const COMPLETED_GOAL_ICON_SRC = "/icons/trophy_gold.svg";
const DEFAULT_GOAL_RING_COLOR = "#7069FA";
const COMPLETED_GOAL_RING_COLOR = "#00D591";
const DEFAULT_GOAL_BASE_RING_COLOR = "#E9E7F3";
const EMPTY_GOAL_ICON_SRC = "/icons/trophy_grey.svg";
const EMPTY_GOAL_RING_COLOR = "#ECE9F1";
const EMPTY_GOAL_DESCRIPTION = "Aucun objectif pour le moment.";
const EMPTY_GOAL_ACTION_LABEL = "Définir mon objectif.";
const EDIT_GOAL_ACTION_LABEL = "Modifier mon objectif.";

type RechartsDotPayload = Record<string, unknown> | null | undefined;

type ExtendedRechartsDotProps = Omit<RechartsDotProps, "payload" | "value"> & {
  dataKey?: string;
  payload?: RechartsDotPayload;
  value?: number | string | (number | string)[] | null | undefined;
};

type RechartsDotRenderProps = ExtendedRechartsDotProps & { key?: React.Key };

type DashboardExerciseDotProps = ExtendedRechartsDotProps & {
  interactionRadius: number;
  radius: number;
};

type DotPosition = { x: number; y: number };

const dotPositionMap = new WeakMap<Record<string, unknown>, DotPosition>();

const DashboardExerciseDot = ({
  cx = 0,
  cy = 0,
  interactionRadius,
  radius,
  dataKey: _dataKey,
  payload,
  ...rest
}: DashboardExerciseDotProps) => {
  void _dataKey;


  if (payload && (payload as any).value === null) {
    return null;
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    dotPositionMap.set(payload as Record<string, unknown>, { x: cx, y: cy });
  }

  const { value: _value, ...circleProps } = rest;
  void _value;

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={interactionRadius}
        fill="transparent"
        stroke="transparent"
        style={{ pointerEvents: "all" }}
      />
      <circle
        {...(circleProps as React.SVGProps<SVGCircleElement>)}
        cx={cx}
        cy={cy}
        r={radius}
        fill="#7069FA"
        stroke="#fff"
        strokeWidth={1}
      />
    </g>
  );
};

const renderDashboardExerciseDot = (radius: number) => {
  const RenderDashboardExerciseDot = ({
    key: dotKey,
    ...restDotProps
  }: RechartsDotRenderProps) => (
    <DashboardExerciseDot
      key={dotKey}
      {...restDotProps}
      interactionRadius={CHART_DOT_INTERACTION_RADIUS}
      radius={radius}
    />
  );

  return RenderDashboardExerciseDot;
};

const isWithinInteractionRadius = (
  anchor: DotPosition | null,
  coordinate: TooltipContentProps<number, string>["coordinate"] | null,
  radius: number,
) => {
  if (
    !anchor ||
    typeof anchor.x !== "number" ||
    typeof anchor.y !== "number" ||
    !coordinate ||
    typeof coordinate.x !== "number" ||
    typeof coordinate.y !== "number"
  ) {
    return false;
  }

  const deltaX = coordinate.x - anchor.x;
  const deltaY = coordinate.y - anchor.y;
  const distanceSquared = deltaX * deltaX + deltaY * deltaY;

  return distanceSquared <= radius * radius;
};

const DashboardExerciseChartTooltip = ({
  active,
  payload,
  label,
  coordinate,
}: Partial<TooltipContentProps<number, string>>) => {
  const value = payload?.[0]?.value;
  const dotPayload = payload?.[0]?.payload;
  const dotPosition =
    dotPayload && typeof dotPayload === "object" && !Array.isArray(dotPayload)
      ? dotPositionMap.get(dotPayload as Record<string, unknown>)
      : undefined;
  const anchorX = typeof dotPosition?.x === "number" ? dotPosition.x : null;
  const anchorY = typeof dotPosition?.y === "number" ? dotPosition.y : null;
  const isVisible =
    !!active &&
    !!payload?.length &&
    typeof label === "string" &&
    typeof value === "number" &&
    typeof anchorX === "number" &&
    typeof anchorY === "number" &&
    isWithinInteractionRadius(
      dotPosition ?? null,
      coordinate ?? null,
      CHART_DOT_INTERACTION_RADIUS,
    );

  if (!isVisible) {
    return null;
  }

  const tooltipKey = `${anchorX}-${anchorY}`;
  const dotData =
    dotPayload && typeof dotPayload === "object" && !Array.isArray(dotPayload)
      ? (dotPayload as Record<string, unknown>)
      : undefined;
  const dateValue = dotData?.tooltipDate ?? dotData?.date ?? label;
  const unit = typeof dotData?.unit === "string" ? (dotData.unit as string) : "";
  const formattedDate = formatTooltipDate(dateValue);
  const formattedMetric =
    typeof value === "number"
      ? `${value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`
      : typeof value === "string"
        ? value
        : "";

  return (
    <Tooltip
      key={tooltipKey}
      content={
        <div className="flex flex-col items-center gap-[6px]">
          <span className="text-[10px] font-medium leading-none text-[#ffffff]">
            {formattedDate}
          </span>
          <span className="text-[12px] font-semibold leading-none text-[#ffffff]">
            {formattedMetric}
          </span>
        </div>
      }
      placement="top"
      forceVisible
      disableHover
      asChild
      contentClassName="relative flex flex-col items-center gap-[6px] rounded-md bg-[#2E3142] px-3 py-2 text-white shadow-md"
      arrowClassName="bg-[#2E3142]"
      offset={TOOLTIP_OFFSET_FROM_POINT_PX}
    >
      <div
        style={{
          position: "absolute",
          top: anchorY,
          left: anchorX,
          width: 0,
          height: 0,
          pointerEvents: "none",
        }}
      />
    </Tooltip>
  );
};

export default function DashboardExerciseBlock({
  id,
  name,
  sessionCount,
  curveType,
  recordType,
  onSessionChange,
  onCurveChange,
  onRecordTypeChange,
  goal,
  onGoalChange,
  onGoalCompletionChange,
}: DashboardExerciseBlockProps) {
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [rawSessions, setRawSessions] = useState<RawSession[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [records, setRecords] = useState<ExerciseRecord[]>(() => createInitialRecords());
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoalType, setSelectedGoalType] = useState<string>("");
  const [goalTypeTouched, setGoalTypeTouched] = useState(false);
  const [goalTarget, setGoalTarget] = useState("");
  const [goalTargetError, setGoalTargetError] = useState<string | null>(null);
  const [favoriteRecordTypes, setFavoriteRecordTypes] = useState<Set<string>>(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load favorites from local storage
  // Load favorites from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`glift_favorite_records_${id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const favoriteSet = new Set<string>(parsed);
        setFavoriteRecordTypes(favoriteSet);

        // If we have a favorite, switch to it immediately!
        // This runs on mount (or id change), effectively "on load".
        // Use the first valid favorite found in CURVE_OPTIONS order to be deterministic.
        if (!hasPrioritizedRef.current && favoriteSet.size > 0) {
          const prioritized = CURVE_OPTIONS.find(o => favoriteSet.has(o.value));
          if (prioritized && prioritized.value !== recordType) {
            // Mark as prioritized so we don't do it again
            hasPrioritizedRef.current = true;
            onRecordTypeChange(prioritized.value);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load favorites", e);
    }
  }, [id, onRecordTypeChange, recordType]); // recordType dependency needed to avoid redundant switch if already correct

  const toggleFavorite = (type: string) => {
    setFavoriteRecordTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }

      try {
        localStorage.setItem(`glift_favorite_records_${id}`, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error("Failed to save favorites", e);
      }

      return next;
    });
  };

  const normalizedGoal = useMemo(() => {
    if (!goal || !Number.isFinite(goal.target) || goal.target <= 0) {
      return null;
    }

    return {
      type: goal.type,
      target: goal.target,
    } satisfies DashboardExerciseGoal;
  }, [goal]);

  const goalRecordValue = useMemo(() => {
    if (!normalizedGoal) {
      return 0;
    }

    const matchingRecord = records.find((record) => record.curveType === normalizedGoal.type);
    return typeof matchingRecord?.value === "number" ? matchingRecord.value : 0;
  }, [normalizedGoal, records]);

  const rawGoalProgress =
    normalizedGoal && normalizedGoal.target > 0
      ? (goalRecordValue / normalizedGoal.target) * 100
      : null;
  const goalProgress =
    rawGoalProgress !== null ? Math.min(Math.max(rawGoalProgress, 0), 100) : null;

  const hasGoal = normalizedGoal !== null;
  const roundedGoalProgress = hasGoal ? Math.round(goalProgress ?? 0) : null;
  const formattedGoalProgress =
    roundedGoalProgress !== null ? roundedGoalProgress.toLocaleString("fr-FR") : "";
  const hasReachedGoal = rawGoalProgress !== null ? rawGoalProgress >= 100 : false;
  const goalIconSrc = hasGoal
    ? hasReachedGoal
      ? COMPLETED_GOAL_ICON_SRC
      : DEFAULT_GOAL_ICON_SRC
    : EMPTY_GOAL_ICON_SRC;
  const goalRingColor = hasGoal
    ? hasReachedGoal
      ? COMPLETED_GOAL_RING_COLOR
      : DEFAULT_GOAL_RING_COLOR
    : EMPTY_GOAL_RING_COLOR;
  const goalBaseRingColor = hasGoal ? DEFAULT_GOAL_BASE_RING_COLOR : EMPTY_GOAL_RING_COLOR;
  const goalActionLabel = hasGoal ? EDIT_GOAL_ACTION_LABEL : EMPTY_GOAL_ACTION_LABEL;
  const goalIconAlt = hasGoal ? "Objectif" : "Aucun objectif";
  const goalProgressTextColorClass = hasReachedGoal ? "text-[#00D591]" : "text-[#7069FA]";
  const goalActionTextColorClass = hasReachedGoal
    ? "text-[#00D591] hover:text-[#00D591]"
    : "text-[#7069FA] hover:text-[#6660E4]";

  useEffect(() => {
    onGoalCompletionChange?.(id, hasGoal && hasReachedGoal);
  }, [hasGoal, hasReachedGoal, id, onGoalCompletionChange]);

  useEffect(
    () => () => {
      onGoalCompletionChange?.(id, false);
    },
    [id, onGoalCompletionChange],
  );

  const handleOpenGoalModal = () => {
    setSelectedGoalType(normalizedGoal?.type ?? "");
    setGoalTarget(normalizedGoal ? String(normalizedGoal.target) : "");
    setGoalTargetError(null);
    setGoalTypeTouched(false);
    setIsGoalModalOpen(true);
  };

  const handleCloseGoalModal = () => {
    setIsGoalModalOpen(false);
    setGoalTypeTouched(false);
    setGoalTargetError(null);
  };

  const handleGoalTargetChange = (value: string) => {
    setGoalTarget(value);
    if (goalTargetError) {
      setGoalTargetError(null);
    }
  };

  const handleSaveGoal = () => {
    setGoalTypeTouched(true);
    const goalTypeIsValid = CURVE_OPTIONS.some((option) => option.value === selectedGoalType);
    if (!goalTypeIsValid) {
      return;
    }

    const parsedTarget = Number.parseFloat(goalTarget.replace(/,/g, "."));
    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      setGoalTargetError("Renseignez une valeur positive.");
      return;
    }

    onGoalChange({
      type: selectedGoalType as CurveOptionValue,
      target: parsedTarget,
    });

    // Switch to the record card corresponding to the new goal type
    onRecordTypeChange(selectedGoalType as CurveOptionValue);

    handleCloseGoalModal();
  };

  useEffect(() => {
    if (isGoalModalOpen) {
      return;
    }

    setSelectedGoalType(normalizedGoal?.type ?? "");
    setGoalTarget(normalizedGoal ? String(normalizedGoal.target) : "");
  }, [isGoalModalOpen, normalizedGoal]);

  const chartAxisData = useMemo(() => {
    const desiredGridLines = 5;
    const values = chartData
      .map((d) => d.value)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

    // If no data, return default suitable values
    if (values.length === 0) {
      return {
        domain: [0, 100],
        ticks: [0, 25, 50, 75, 100]
      };
    }

    let minV = Math.min(...values);
    let maxV = Math.max(...values);

    const minFloor = Math.floor(minV);
    const maxCeil = Math.ceil(maxV);
    let range = maxCeil - minFloor;

    // Ensure small range doesn't break calculation
    if (range === 0) range = 5;

    let rawInterval = range / (desiredGridLines - 1);
    if (rawInterval < 1) rawInterval = 1;
    let interval = Math.ceil(rawInterval);

    // Initial snapping logic to match mobile
    let snappedMin = Math.floor(minFloor / interval) * interval;
    if (minV - snappedMin < interval * 0.2) {
      snappedMin -= interval;
    }
    const realMinY = Math.max(0, snappedMin);

    // Recalculate interval for fixed grid lines covering the needed range
    const neededRange = maxV - realMinY;
    rawInterval = neededRange / (desiredGridLines - 1);
    if (rawInterval < 1) rawInterval = 1;
    interval = Math.ceil(rawInterval);

    // Enforce multiples of 5
    if (interval >= 5) {
      interval = Math.ceil(interval / 5) * 5;
    }

    const chartMaxY = realMinY + interval * (desiredGridLines - 1);

    // Generate ticks
    const ticks: number[] = [];
    for (let i = 0; i < desiredGridLines; i++) {
      ticks.push(realMinY + i * interval);
    }

    return {
      domain: [realMinY, chartMaxY],
      ticks,
    };
  }, [chartData]);

  const currentUnit = CURVE_UNIT_MAP[curveType] ?? "";
  const yAxisWidth = useMemo(() => {
    if (typeof window === "undefined") {
      return Y_AXIS_WIDTH;
    }

    if (chartAxisData.ticks.length === 0) {
      return Y_AXIS_WIDTH;
    }

    const font = "700 12px Quicksand, sans-serif";
    const maxTickValue = Math.max(...chartAxisData.ticks);
    const formattedValue = maxTickValue.toLocaleString("fr-FR", {
      maximumFractionDigits: 2,
    });
    const label = `${formattedValue}${currentUnit ? ` ${currentUnit}` : ""}`;

    const textWidth = measureTextWidth(label, font);

    // 10px (start offset) + textWidth + 20px (gap between text end and grid)
    return Y_AXIS_TICK_OFFSET + textWidth + Y_AXIS_GRID_GAP;
  }, [chartAxisData, currentUnit]);
  const renderValueAxisTick = useMemo(
    () => createValueAxisTickRenderer(currentUnit, yAxisWidth),
    [currentUnit, yAxisWidth],
  );

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    setChartSize({
      width: Math.max(0, rect.width),
      height: Math.max(0, rect.height),
    });

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      const { width, height } = entry.contentRect;
      setChartSize({
        width: Math.max(0, width),
        height: Math.max(0, height),
      });
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Realtime subscription to update data when a new session is added
  useEffect(() => {
    const channel = supabase
      .channel(`exercise-updates-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "training_session_exercises",
          filter: `training_row_id=eq.${id}`,
        },
        () => {
          // Increment trigger to force re-fetch
          setRefreshTrigger((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, supabase]);

  useEffect(() => {
    const userId = user?.id ?? null;
    const sessionLimit = parseSessionCount(sessionCount);

    if (!userId || sessionLimit === 0) {
      setRawSessions([]);
      setFetchError(null);
      setIsLoadingData(false);
      return;
    }

    let isActive = true;

    const fetchSessions = async () => {
      setIsLoadingData(true);
      setFetchError(null);

      const { data, error } = await supabase
        .from("training_session_exercises")
        .select(
          `
            id,
            training_row_id,
            session:training_sessions!inner (
              performed_at,
              user_id
            ),
            sets:training_session_sets (
              repetitions,
              weights
            )
          `,
        )
        .eq("training_row_id", id)
        .eq("training_sessions.user_id", userId)
        .order("performed_at", { referencedTable: "training_sessions", ascending: false })
        .limit(sessionLimit);

      if (!isActive) {
        return;
      }

      if (error) {
        setFetchError("Une erreur est survenue lors du chargement des données.");
        setRawSessions([]);
      } else {
        const normalizedSessions = (data ?? [])
          .map((row) => {
            const performedAtRaw =
              row.session && typeof row.session === "object"
                ? (row.session as { performed_at?: string | null }).performed_at
                : null;

            if (!performedAtRaw || typeof performedAtRaw !== "string") {
              return null;
            }

            const sets = Array.isArray(row.sets)
              ? row.sets.map((set) => {
                const repetitions =
                  typeof set?.repetitions === "number" && Number.isFinite(set.repetitions)
                    ? set.repetitions
                    : null;
                const weights = Array.isArray(set?.weights)
                  ? set.weights
                    .map((value) => {
                      if (typeof value === "number") {
                        return Number.isFinite(value) ? value : null;
                      }
                      if (typeof value === "string") {
                        const parsed = Number.parseFloat(value);
                        return Number.isFinite(parsed) ? parsed : null;
                      }
                      return null;
                    })
                    .filter((value): value is number => value != null)
                  : [];

                return {
                  repetitions,
                  weights,
                } satisfies SessionSet;
              })
              : [];

            return {
              performedAt: performedAtRaw,
              sets,
            } satisfies RawSession;
          })
          .filter((session): session is RawSession => session !== null);

        setRawSessions(normalizedSessions);
      }

      setIsLoadingData(false);
    };

    void fetchSessions();

    return () => {
      isActive = false;
    };
  }, [id, sessionCount, supabase, user?.id, refreshTrigger]);

  useEffect(() => {
    if (!rawSessions.length) {
      setChartData([]);
      setRecords(createInitialRecords());
      return;
    }

    const sortedSessions = [...rawSessions].sort((a, b) => {
      const dateA = new Date(a.performedAt).getTime();
      const dateB = new Date(b.performedAt).getTime();
      return dateA - dateB;
    });

    const computedChartData = sortedSessions
      .map((session) => {
        const parsedDate = new Date(session.performedAt);
        if (Number.isNaN(parsedDate.getTime())) {
          return null;
        }

        const metrics = aggregateSessionMetrics(session);
        const rawValue = getValueForCurve(metrics, curveType);

        if (rawValue == null || !Number.isFinite(rawValue)) {
          return null;
        }

        return {
          date: formatChartLabel(parsedDate),
          tooltipDate: parsedDate.toISOString(),
          unit: currentUnit,
          value: roundValue(rawValue),
        } satisfies ChartPoint;
      })
      .filter((point) => point !== null) as ChartPoint[];

    // Padding logic to center points
    const limit = parseSessionCount(sessionCount);
    const missing = Math.max(0, limit - computedChartData.length);
    const padBefore = Math.floor(missing / 2);
    const padAfter = missing - padBefore;

    const emptyPoint: ChartPoint = {
      date: "",
      tooltipDate: "",
      unit: "",
      value: null,
    };

    const paddedData = [
      ...Array(padBefore).fill(emptyPoint),
      ...computedChartData,
      ...Array(padAfter).fill(emptyPoint),
    ];

    setChartData(paddedData);

    const bestRecordsMap = CURVE_OPTIONS.reduce(
      (acc, option) => {
        acc[option.value] = {
          curveType: option.value,
          label: option.label,
          value: null,
          date: null,
        } satisfies ExerciseRecord;
        return acc;
      },
      {} as Record<CurveOptionValue, ExerciseRecord>,
    );

    sortedSessions.forEach((session) => {
      const parsedDate = new Date(session.performedAt);
      const hasValidDate = !Number.isNaN(parsedDate.getTime());
      const metrics = aggregateSessionMetrics(session);

      CURVE_OPTIONS.forEach(({ value }) => {
        const rawMetricValue = getValueForCurve(metrics, value);
        if (rawMetricValue == null || !Number.isFinite(rawMetricValue)) {
          return;
        }

        const roundedMetricValue = roundValue(rawMetricValue);
        const currentRecord = bestRecordsMap[value];
        const currentRecordValue = currentRecord.value;
        if (currentRecordValue == null || roundedMetricValue > currentRecordValue) {
          bestRecordsMap[value] = {
            ...currentRecord,
            value: roundedMetricValue,
            date: hasValidDate ? parsedDate : currentRecord.date,
          } satisfies ExerciseRecord;
        }
      });
    });

    const computedRecords = CURVE_OPTIONS.map(({ value }) => bestRecordsMap[value]);
    setRecords(computedRecords);
  }, [curveType, currentUnit, rawSessions]);

  // Ref to track if we've already prioritized the favorite on load
  const hasPrioritizedRef = useRef(false);

  useEffect(() => {
    if (!records.length) {
      return;
    }

    // 2. Standard fallback: check if current selection is valid
    const hasMatchingRecord = records.some((record) => record.curveType === recordType);
    if (hasMatchingRecord) {
      return;
    }

    // 3. Fallback to first if invalid
    const fallbackRecord = records[0];
    if (fallbackRecord && fallbackRecord.curveType !== recordType) {
      onRecordTypeChange(fallbackRecord.curveType);
    }
  }, [onRecordTypeChange, recordType, records, favoriteRecordTypes]);

  const currentRecordIndex = useMemo(() => {
    if (!records.length) {
      return 0;
    }

    const index = records.findIndex((record) => record.curveType === recordType);
    return index === -1 ? 0 : index;
  }, [recordType, records]);

  const chartMargin = useMemo(() => ({
    top: 20,
    right: 20,
    bottom: 15,
    left: yAxisWidth
  }), [yAxisWidth]);

  const currentRecord = records[currentRecordIndex] ?? null;
  const recordUnitLabel = currentRecord ? CURVE_DISPLAY_UNIT_MAP[currentRecord.curveType] : "";
  const recordNumericValue = typeof currentRecord?.value === "number" ? currentRecord.value : null;
  const formattedRecordValue = recordNumericValue !== null
    ? recordNumericValue.toLocaleString("fr-FR", {
      maximumFractionDigits: recordNumericValue % 1 === 0 ? 0 : 2,
    })
    : "--";
  const recordDateLabel = currentRecord ? formatRecordDate(currentRecord.date) : "Aucune donnée";
  const recordTypeLabel = currentRecord?.label ?? "";

  const handleRecordNavigation = (direction: "prev" | "next") => {
    const total = records.length;
    if (!total) {
      return;
    }

    const delta = direction === "next" ? 1 : -1;
    const nextIndex = (currentRecordIndex + delta + total) % total;
    const nextRecord = records[nextIndex];
    if (nextRecord) {
      onRecordTypeChange(nextRecord.curveType);
    }
  };

  const slides = useMemo(() => {
    return records.map((record, index) => {
      // Determine if this record matches the current goal
      const isGoalType = normalizedGoal?.type === record.curveType;

      // Calculate goal progress for this specific record type if it matches the goal
      let cardGoalProgress: number | null = null;
      if (isGoalType && normalizedGoal && normalizedGoal.target > 0) {
        const val = typeof record.value === "number" ? record.value : 0;
        cardGoalProgress = Math.min((val / normalizedGoal.target) * 100, 100); // Capped at 100 for display? Or allow >100? Rounding handled in Card.
        // Actually the card handles visualization. Let's pass raw % or capped?
        // The card code does `Math.round(goalProgress)`.
        cardGoalProgress = (val / normalizedGoal.target) * 100;
      }

      // If there is NO goal set at all, we might want to allow setting one for this type?
      // The card has "Définir un objectif".
      // If we execute that, we should probably set the "Goal Type" to this record's type.

      return {
        key: record.curveType,
        content: (
          <DashboardRecordCard
            dateLabel={formatRecordDate(record.date)}
            valueLabel={
              typeof record.value === "number"
                ? record.value.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " " + (CURVE_DISPLAY_UNIT_MAP[record.curveType] || "")
                : "--"
            }
            typeLabel={record.label}
            goalProgress={cardGoalProgress}
            hasGoal={isGoalType && !!normalizedGoal}
            iconSrc={record.curveType.includes("poids") ? "/icons/record_poids.svg" : "/icons/record_reps.svg"}
            isFavorite={favoriteRecordTypes.has(record.curveType)}
            onFavoriteToggle={() => toggleFavorite(record.curveType)}
            onCancelGoal={() => onGoalChange(null)}
            onActionClick={() => {
              if (isGoalType && !!normalizedGoal) {
                // View/Edit existing goal
                handleOpenGoalModal();
              } else {
                // Set new goal for this type
                setSelectedGoalType(record.curveType);
                setGoalTarget("");
                setIsGoalModalOpen(true);
              }
            }}
          />
        ),
      };
    });
  }, [records, normalizedGoal, CURVE_DISPLAY_UNIT_MAP, formatRecordDate, favoriteRecordTypes]);

  // Need to verify CURVE_DISPLAY_UNIT_MAP validity in this scope (it was defined outside component)
  // formatRecordDate also defined outside.

  return (
    <div className="w-full flex flex-col xl:flex-row gap-[24px]">
      {/* ZONE 1: Graphique + Header (approx 75% width or flex: 3) */}
      <div className="flex-1 xl:flex-[3] flex flex-col bg-white border border-[#D7D4DC] rounded-[20px] overflow-hidden shadow-sm h-[339px]">
        {/* Header inside Zone 1 */}
        <div className="h-[60px] flex items-center justify-between px-[30px] border-b border-[#D7D4DC]">
          <h2 className="text-[16px] font-bold text-[#2E3271]">{name}</h2>
          <div className="flex items-center gap-[20px]">
            <DashboardExerciseDropdown
              value={sessionCount}
              onChange={onSessionChange}
              options={[
                { value: "5", label: "5 dernières séances" },
                { value: "10", label: "10 dernières séances" },
                { value: "15", label: "15 dernières séances" },
              ]}
              iconSrc="/icons/tableau.svg"
              iconHoverSrc="/icons/tableau_hover.svg"
              selectedValueClassName="hidden"
            />
            <DashboardExerciseDropdown
              value={curveType}
              onChange={(newCurve) => {
                // Update graph
                onCurveChange(newCurve);

                // Update card ONLY if the current record is NOT a favorite
                // We check if the *currently displayed* record type is favorited.
                // If it is favorite, we don't want to switch it away.
                if (!favoriteRecordTypes.has(recordType)) {
                  onRecordTypeChange(newCurve as CurveOptionValue);
                }
              }}
              options={CURVE_OPTIONS.map(({ value, label }) => ({ value, label }))}
              iconSrc="/icons/courbe.svg"
              iconHoverSrc="/icons/courbe_hover.svg"
              selectedValueClassName="hidden"
            />
          </div>
        </div>

        {/* Graph Content */}
        <div className="w-full flex-1 p-[20px]">
          <div
            ref={chartContainerRef}
            className="dashboard-exercise-chart relative h-full w-full"
          >
            {chartSize.width > 0 && chartSize.height > 0 && chartData.length > 0 ? (
              <ResponsiveContainer
                width={chartSize.width}
                height={chartSize.height}
              >
                <AreaChart
                  data={chartData}
                  margin={chartMargin}
                >
                  <defs>
                    <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A1A5FD" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#A1A5FD" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#ECE9F1"
                    strokeWidth={1}
                    strokeDasharray="0"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    tick={renderDateAxisTick}
                    tickMargin={18}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />

                  <YAxis
                    domain={chartAxisData.domain}
                    ticks={chartAxisData.ticks}
                    tick={renderValueAxisTick}
                    width={yAxisWidth}
                    tickMargin={8}
                    axisLine={false}
                    tickLine={false}
                    mirror={false}
                    orientation="left"
                    padding={{ top: 0, bottom: 0 }}
                    interval={0}
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#A1A5FD"
                    strokeWidth={1}
                    fillOpacity={1}
                    fill={`url(#gradient-${id})`}
                    isAnimationActive={false}
                    dot={renderDashboardExerciseDot(CHART_DOT_RADIUS)}
                    activeDot={renderDashboardExerciseDot(CHART_ACTIVE_DOT_RADIUS)}
                  />
                  <RechartsTooltip
                    cursor={false}
                    content={<DashboardExerciseChartTooltip />}
                    wrapperStyle={{ pointerEvents: "none" }}
                    allowEscapeViewBox={{ x: true, y: true }}
                    isAnimationActive={false}
                    offset={0}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
            {isLoadingData ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <p className="text-[13px] font-semibold text-[#5D6494]">
                  Chargement des données…
                </p>
              </div>
            ) : null}
            {!isLoadingData && fetchError ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center">
                <p className="text-[13px] font-semibold text-[#E53E3E]">
                  {fetchError}
                </p>
              </div>
            ) : null}
            {!isLoadingData && !fetchError && chartData.length === 0 ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center">
                <p className="text-[14px] font-semibold text-[#C2BFC6]">
                  Aucune donnée disponible
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ZONE 2: Records Carousel (approx 25% width or flex: 1) */}
      <div className="w-full xl:w-[270px] flex-shrink-0 flex items-center justify-center h-[339px]">
        {/* The carousel container needs to be relative/isolated */}
        {records.length > 0 ? (
          <RecordsCarousel
            slides={slides}
            offsetRadius={2}
            showNavigation={false}
            goToSlide={currentRecordIndex}
            onIndexChange={(index) => {
              const record = records[index];
              if (record && record.curveType !== recordType) {
                // Update active record card
                onRecordTypeChange(record.curveType);

                // Update chart ONLY if the NEW record is NOT a favorite
                // (or should it be if the OLD wasn't? User logic implies if "favorite" is involved, don't sync)
                // Interpretation: "Si je l'a met en favorite... si je change la carte... la courbe ne bouge pas"
                // This means if I arrive on a Favorite card (or leave one?), the Sync is broken.
                // Let's assume: If the TARGET card is a favorite, we shouldn't auto-update the chart to it?
                // Or: If the CURRENT card was favorite?
                // Re-reading: "La seule façon qu'une carte... arrête de bouger est si je l'a met en favorite. Dans ce cas le changement de courbe n'a plus d'impact... et si je change la carte, la courbe ne bouge pas non plus".
                // This strongly implies that being on a Favorite card disables the bidirectional link.

                // Case 1: Active card is Favorite. User swipes to another. 
                // Does curve update? "La courbe ne bouge pas non plus".
                // So if we *were* on a favorite, or if we *arrive* on a favorite?
                // "Si je la met en favorite" -> referring to the specific card "Max Poids".
                // If I swipe *to* "Max Poids" (Favorite), does chart update?
                // If I swipe *from* "Max Poids" (Favorite), does chart update?

                // Let's implement: If the NEW card is a favorite, DON'T sync.
                // AND: If the OLD card was a favorite? (User didn't specify, but implies isolation).
                // Let's stick to the simplest interpretation that fits: 
                // If the selected record is a favorite, do NOT sync the chart.
                // If the selected record is NOT a favorite, sync the chart.

                if (!favoriteRecordTypes.has(record.curveType)) {
                  onCurveChange(record.curveType);
                }
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-white rounded-[20px] border border-[#D7D4DC] flex items-center justify-center text-center p-4">
            <p className="text-[#5D6494] text-sm font-semibold">Aucun record disponible</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .dashboard-exercise-chart .recharts-surface:focus {
          outline: none;
        }
      `}</style>

      {/* GOAL MODAL */}
      <Modal
        open={isGoalModalOpen}
        title="Objectif"
        onClose={handleCloseGoalModal}
        footerWrapperClassName="mt-[5px]"
        footer={
          <div className="flex justify-center gap-4">
            <button
              type="button"
              className="px-4 py-2 font-semibold text-[#5D6494] hover:text-[#3A416F]"
              onClick={handleCloseGoalModal}
            >
              Annuler
            </button>
            <CTAButton type="button" onClick={handleSaveGoal}>
              {hasGoal ? "Modifier" : "Enregistrer"}
            </CTAButton>
          </div>
        }
      >
        <ModalMessage
          variant="info"
          title="Conseil"
          description="Un objectif doit être réalisable. N’hésitez pas à diviser un objectif ambitieux en plusieurs sous-objectifs."
          className="w-full"
        />

        <div className="mt-[25px] flex flex-col items-center gap-0">
          <DropdownField
            label="Type d'objectif"
            selected={selectedGoalType}
            onSelect={(value) => {
              setSelectedGoalType(value);
            }}
            options={CURVE_OPTIONS.map(({ value, label }) => ({ value, label }))}
            placeholder="Sélectionnez un type d'objectif"
            touched={goalTypeTouched}
            setTouched={setGoalTypeTouched}
            clearable={false}
            containerClassName="w-full max-w-[368px]"
            width="w-full"
            buttonRoundedClassName="rounded-[5px]"
          />

          <div className="w-full max-w-[368px]">
            <TextField
              label="Objectif à atteindre"
              value={goalTarget}
              onChange={handleGoalTargetChange}
              placeholder="Renseignez votre objectif"
              inputClassName="rounded-[5px]"
              error={goalTargetError ?? undefined}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
