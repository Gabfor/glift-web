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
import React, { useEffect, useMemo, useRef, useState } from "react";

type DashboardExerciseGoal = {
  progressPercentage?: number | null;
  iconSrc?: string | null;
  ringColor?: string | null;
  description?: string | null;
  actionLabel?: string | null;
  actionHref?: string | null;
};

interface DashboardExerciseBlockProps {
  id: string;
  name: string;
  sessionCount: string;
  curveType: CurveOptionValue;
  onSessionChange: (value: string) => void;
  onCurveChange: (value: string) => void;
  goal?: DashboardExerciseGoal | null;
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
  value: number;
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

const formatChartLabel = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  });
  const formatted = formatter
    .format(date)
    .replace(/\u00A0/g, " ")
    .trim();
  const [day, month = ""] = formatted.split(" ");
  const normalizedMonth = month
    ? month.charAt(0).toUpperCase() + month.slice(1)
    : month;
  return [day, normalizedMonth].filter(Boolean).join(" ");
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

  const formatter = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const parts = formatter.formatToParts(value);
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const monthRaw = parts.find((part) => part.type === "month")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";

  const normalizedMonth = monthRaw
    ? monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1)
    : monthRaw;

  return [day, normalizedMonth, year].filter(Boolean).join(" ");
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

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
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
const Y_AXIS_WIDTH = 52;
const CHART_MARGIN = { top: 20, right: 20, bottom: 20, left: Y_AXIS_WIDTH };

const ValueAxisTick = ({ x, y, payload, unit }: ValueAxisTickProps & { unit: string }) => {
  const numericValue = typeof payload?.value === "number" ? payload.value : 0;
  const formattedValue = numericValue.toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  });

  return (
    <text
      x={x - Y_AXIS_TICK_OFFSET}
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

const createValueAxisTickRenderer = (unit: string) => {
  const TickComponent = (props: ValueAxisTickProps) => <ValueAxisTick {...props} unit={unit} />;
  TickComponent.displayName = "DashboardValueAxisTick";
  return TickComponent;
};

const TOOLTIP_OFFSET_FROM_POINT_PX = 20;
const CHART_DOT_RADIUS = 4;
const CHART_ACTIVE_DOT_RADIUS = 5;
const CHART_DOT_INTERACTION_RADIUS = 14;

const DEFAULT_GOAL_ICON_SRC = "/icons/trophy.svg";
const DEFAULT_GOAL_RING_COLOR = "#7069FA";
const DEFAULT_GOAL_BASE_RING_COLOR = "#E9E7F3";
const EMPTY_GOAL_ICON_SRC = "/icons/trophy_grey.svg";
const EMPTY_GOAL_RING_COLOR = "#ECE9F1";
const EMPTY_GOAL_DESCRIPTION = "Aucun objectif pour le moment.";
const EMPTY_GOAL_ACTION_LABEL = "Définir mon objectif.";
const DEFAULT_GOAL_ACTION_LABEL = "Voir mon objectif.";

const sanitizeString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

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
  onSessionChange,
  onCurveChange,
  goal,
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
  const [currentRecordIndex, setCurrentRecordIndex] = useState(0);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoalType, setSelectedGoalType] = useState<string>("");
  const [goalTypeTouched, setGoalTypeTouched] = useState(false);
  const [goalTarget, setGoalTarget] = useState("");

  const handleCloseGoalModal = () => {
    setIsGoalModalOpen(false);
    setGoalTypeTouched(false);
  };

  const rawGoalProgress = goal?.progressPercentage;
  const goalProgress =
    typeof rawGoalProgress === "number" && Number.isFinite(rawGoalProgress)
      ? Math.min(Math.max(rawGoalProgress, 0), 100)
      : null;
  const hasGoal = goalProgress !== null;
  const formattedGoalProgress = hasGoal
    ? goalProgress.toLocaleString("fr-FR", {
        maximumFractionDigits: goalProgress % 1 === 0 ? 0 : 2,
      })
    : "";
  const goalDescriptionOverride = hasGoal ? sanitizeString(goal?.description) : null;
  const goalIconSrc = hasGoal
    ? sanitizeString(goal?.iconSrc) ?? DEFAULT_GOAL_ICON_SRC
    : EMPTY_GOAL_ICON_SRC;
  const goalRingColor = hasGoal
    ? sanitizeString(goal?.ringColor) ?? DEFAULT_GOAL_RING_COLOR
    : EMPTY_GOAL_RING_COLOR;
  const goalBaseRingColor = hasGoal ? DEFAULT_GOAL_BASE_RING_COLOR : EMPTY_GOAL_RING_COLOR;
  const goalActionLabel = hasGoal
    ? sanitizeString(goal?.actionLabel) ?? DEFAULT_GOAL_ACTION_LABEL
    : EMPTY_GOAL_ACTION_LABEL;
  const goalActionHref = sanitizeString(goal?.actionHref);
  const goalIconAlt = hasGoal ? "Objectif" : "Aucun objectif";

  const currentUnit = CURVE_UNIT_MAP[curveType] ?? "";
  const renderValueAxisTick = useMemo(
    () => createValueAxisTickRenderer(currentUnit),
    [currentUnit],
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
  }, [id, sessionCount, supabase, user?.id]);

  useEffect(() => {
    if (!rawSessions.length) {
      setChartData([]);
      setRecords(createInitialRecords());
      setCurrentRecordIndex(0);
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
      .filter((point): point is ChartPoint => point !== null);

    setChartData(computedChartData);

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
        if (currentRecord.value === null || roundedMetricValue > currentRecord.value) {
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
    setCurrentRecordIndex((prev) =>
      computedRecords.length ? Math.min(prev, computedRecords.length - 1) : 0,
    );
  }, [curveType, currentUnit, rawSessions]);

  const currentRecord = records[currentRecordIndex] ?? null;
  const recordUnitLabel = currentRecord ? CURVE_DISPLAY_UNIT_MAP[currentRecord.curveType] : "";
  const hasRecordValue = typeof currentRecord?.value === "number";
  const formattedRecordValue = hasRecordValue
    ? currentRecord.value.toLocaleString("fr-FR", {
        maximumFractionDigits: currentRecord.value % 1 === 0 ? 0 : 2,
      })
    : "--";
  const recordDateLabel = currentRecord ? formatRecordDate(currentRecord.date) : "Aucune donnée";
  const recordTypeLabel = currentRecord?.label ?? "";

  const handleRecordNavigation = (direction: "prev" | "next") => {
    setCurrentRecordIndex((prevIndex) => {
      const total = records.length;
      if (!total) {
        return 0;
      }
      if (direction === "next") {
        return (prevIndex + 1) % total;
      }
      return (prevIndex - 1 + total) % total;
    });
  };

  return (
    <div className="w-full bg-white border border-[#D7D4DC] rounded-[8px] overflow-hidden">
      {/* HEADER */}
      <div className="h-[60px] flex items-center justify-between px-[30px] border-b border-[#D7D4DC]">
        <h2 className="text-[16px] font-bold text-[#2E3271]">{name}</h2>
        <div className="flex items-center gap-[30px]">
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
          />
          <DashboardExerciseDropdown
            value={curveType}
            onChange={onCurveChange}
            options={CURVE_OPTIONS.map(({ value, label }) => ({ value, label }))}
            iconSrc="/icons/courbe.svg"
            iconHoverSrc="/icons/courbe_hover.svg"
          />
        </div>
      </div>

      {/* CONTENU */}
      <div className="flex flex-col md:flex-row gap-[20px] md:gap-[30px] px-[30px] py-[25px]">
        {/* Bloc gauche */}
        <div className="flex flex-col gap-[30px] justify-center h-full md:w-[430px] flex-shrink-0">
          <div className="flex flex-col justify-center h-[120px] w-full">
            <p className="text-[12px] font-bold text-[#D7D4DC] uppercase">VOS RECORDS SUR CET EXERCICE</p>
            <div className="mt-3 flex items-center gap-[20px]">
              <button
                type="button"
                aria-label="Voir le record précédent"
                className="group flex items-center justify-center"
                onClick={() => handleRecordNavigation("prev")}
              >
                <Image
                  src="/icons/big_arrow_left.svg"
                  alt="Précédent"
                  width={7}
                  height={10}
                  className="block group-hover:hidden"
                />
                <Image
                  src="/icons/big_arrow_left_hover.svg"
                  alt="Précédent"
                  width={7}
                  height={10}
                  className="hidden group-hover:block"
                />
              </button>
              <div className="flex flex-col items-start text-left">
                <div className="flex items-baseline gap-2">
                  <p className="text-[40px] font-bold text-[#3A416F] leading-none">{formattedRecordValue}</p>
                  <span className="text-[20px] font-bold text-[#3A416F] leading-none">{recordUnitLabel}</span>
                </div>
                <p className="text-[#3A416F] font-bold text-[14px] mt-2">{recordTypeLabel}</p>
                <p className="text-[#C2BFC6] font-semibold text-[12px] mt-1">{recordDateLabel}</p>
              </div>
              <button
                type="button"
                aria-label="Voir le record suivant"
                className="group flex items-center justify-center"
                onClick={() => handleRecordNavigation("next")}
              >
                <Image
                  src="/icons/big_arrow_right.svg"
                  alt="Suivant"
                  width={7}
                  height={10}
                  className="block group-hover:hidden"
                />
                <Image
                  src="/icons/big_arrow_right_hover.svg"
                  alt="Suivant"
                  width={7}
                  height={10}
                  className="hidden group-hover:block"
                />
              </button>
            </div>
          </div>

          {/* Objectif */}
          <div className="flex items-center gap-4 h-[90px] w-full">
            <div className="relative w-[70px] h-[70px] flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path
                  stroke={goalBaseRingColor}
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0 -31.831"
                />
                {hasGoal ? (
                  <path
                    stroke={goalRingColor}
                    strokeWidth="3"
                    strokeDasharray={`${goalProgress}, 100`}
                    fill="none"
                    d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0 -31.831"
                  />
                ) : null}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src={goalIconSrc}
                  alt={goalIconAlt}
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center items-start text-left">
              <p className="text-[#5D6494] font-semibold text-left">
                {hasGoal ? (
                  goalDescriptionOverride ? (
                    goalDescriptionOverride
                  ) : (
                    <>
                      Vous avez atteint{" "}
                      <span className="text-[#7069FA] font-bold">{formattedGoalProgress} %</span>{" "}
                      de votre objectif.
                    </>
                  )
                ) : (
                  EMPTY_GOAL_DESCRIPTION
                )}
              </p>
              {goalActionHref ? (
                <a
                  href={goalActionHref}
                  className="text-[#7069FA] text-[15px] font-semibold mt-1 hover:text-[#6660E4]"
                >
                  {goalActionLabel}
                </a>
              ) : (
                <button
                  type="button"
                  className="text-[#7069FA] text-[15px] font-semibold mt-1 hover:text-[#6660E4]"
                  onClick={() => setIsGoalModalOpen(true)}
                >
                  {goalActionLabel}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bloc droit : Graphique */}
        <div className="h-[220px] w-full md:flex-1">
          <div
            ref={chartContainerRef}
            className="dashboard-exercise-chart relative h-full w-full rounded-[16px] bg-white"
          >
            {chartSize.width > 0 && chartSize.height > 0 && chartData.length > 0 ? (
              <ResponsiveContainer
                width={chartSize.width}
                height={chartSize.height}
              >
                <AreaChart
                  data={chartData}
                  margin={CHART_MARGIN}
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
                    domain={["dataMin - 1", "dataMax + 1"]}
                    tick={renderValueAxisTick}
                    width={Y_AXIS_WIDTH}
                    tickMargin={8}
                    axisLine={false}
                    tickLine={false}
                    mirror={false}
                    orientation="left"
                    padding={{ top: 0, bottom: 0 }}
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
                <p className="text-[13px] font-semibold text-[#5D6494]">
                  Aucune donnée disponible pour le moment.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <style jsx global>{`
        .dashboard-exercise-chart .recharts-surface:focus {
          outline: none;
        }
      `}</style>
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
            <CTAButton type="button" onClick={handleCloseGoalModal}>
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
              onChange={setGoalTarget}
              placeholder="Renseignez votre objectif"
              inputClassName="rounded-[5px]"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
