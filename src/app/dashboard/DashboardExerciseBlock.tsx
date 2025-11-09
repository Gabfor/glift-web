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
import DashboardExerciseDropdown from "@/components/dashboard/DashboardExerciseDropdown";
import Tooltip from "@/components/Tooltip";
import { CURVE_OPTIONS } from "@/constants/curveOptions";
import React, { useEffect, useRef, useState } from "react";

interface DashboardExerciseBlockProps {
  id: string;
  name: string;
  sessionCount: string;
  curveType: string;
  onSessionChange: (value: string) => void;
  onCurveChange: (value: string) => void;
}

const mockData = [
  { date: "02 Nov", value: 21 },
  { date: "09 Nov", value: 21 },
  { date: "16 Nov", value: 22 },
  { date: "23 Nov", value: 22 },
  { date: "30 Nov", value: 22 },
  { date: "07 Déc", value: 23 },
  { date: "14 Déc", value: 23 },
  { date: "21 Déc", value: 23 },
  { date: "28 Déc", value: 22 },
  { date: "04 Jan", value: 22 },
  { date: "11 Jan", value: 22 },
  { date: "18 Jan", value: 23 },
  { date: "25 Jan", value: 24 },
  { date: "01 Fév", value: 25 },
  { date: "08 Fév", value: 25 },
];

const splitDateLabel = (label: string) => {
  const [day, ...rest] = label.split(" ");
  return {
    day: day ?? "",
    month: rest.join(" ") ?? "",
  };
};

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

type WeightAxisTickProps = {
  x: number;
  y: number;
  payload: { value: number };
};

const Y_AXIS_TICK_OFFSET = 10;
const Y_AXIS_WIDTH = 52;
const CHART_MARGIN = { top: 20, right: 20, bottom: 20, left: Y_AXIS_WIDTH };

const WeightAxisTick = ({ x, y, payload }: WeightAxisTickProps) => (
  <text
    x={x - Y_AXIS_TICK_OFFSET}
    y={y}
    fill="#3A416F"
    fontSize={12}
    fontWeight={700}
    textAnchor="end"
    dominantBaseline="middle"
  >
    {`${payload?.value ?? 0} kg`}
  </text>
);

const renderWeightAxisTick = (props: WeightAxisTickProps) => (
  <WeightAxisTick {...props} />
);

const TOOLTIP_OFFSET_FROM_POINT_PX = 20;
const CHART_DOT_RADIUS = 4;
const CHART_ACTIVE_DOT_RADIUS = 5;
const CHART_DOT_INTERACTION_RADIUS = 14;

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
  const formattedDate = formatTooltipDate(dateValue);
  const formattedWeight =
    typeof value === "number"
      ? `${value} kg`
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
            {formattedWeight}
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
}: DashboardExerciseBlockProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

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
          <div className="flex flex-col justify-center h-[90px] w-full">
            <p className="text-[40px] font-bold text-[#2E3271] leading-none">25 kg</p>
            <p className="text-[#3A416F] font-bold text-[14px] mt-2">Record personnel</p>
            <p className="text-[#C2BFC6] font-semibold text-[12px] mt-1">01 Février 2026</p>
          </div>

          {/* Objectif */}
          <div className="flex items-center gap-4 h-[90px] w-full">
            <div className="relative w-[70px] h-[70px] flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path
                  className="text-[#E9E7F3]"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#7069FA]"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="74, 100"
                  fill="none"
                  d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src="/icons/trophy.svg"
                  alt="Objectif"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center items-start text-left">
              <p className="text-[#5D6494] font-semibold text-left">
                Vous avez atteint{" "}
                <span className="text-[#7069FA] font-bold">74 %</span> de votre objectif.
              </p>
              <button className="text-[#7069FA] text-[15px] font-semibold mt-1 hover:text-[#6660E4]">
                Voir mon objectif.
              </button>
            </div>
          </div>
        </div>

        {/* Bloc droit : Graphique */}
        <div className="h-[220px] w-full md:flex-1">
          <div
            ref={chartContainerRef}
            className="dashboard-exercise-chart relative h-full w-full rounded-[16px] bg-white"
          >
            {chartSize.width > 0 && chartSize.height > 0 ? (
              <ResponsiveContainer
                width={chartSize.width}
                height={chartSize.height}
              >
                <AreaChart
                  data={mockData}
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
                    tick={renderWeightAxisTick}
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
          </div>
        </div>
      </div>
      <style jsx global>{`
        .dashboard-exercise-chart .recharts-surface:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
}
