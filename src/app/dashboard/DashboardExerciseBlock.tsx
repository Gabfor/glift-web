"use client";

import Image from "next/image";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import DashboardExerciseDropdown from "@/components/dashboard/DashboardExerciseDropdown";
import { CURVE_OPTIONS } from "@/constants/curveOptions";
import Tooltip from "@/components/Tooltip";
import React from "react";

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

export default function DashboardExerciseBlock({
  id,
  name,
  sessionCount,
  curveType,
  onSessionChange,
  onCurveChange,
}: DashboardExerciseBlockProps) {
  const renderDot = React.useCallback(
    (props: {
      cx?: number;
      cy?: number;
      value?: number;
      payload?: { date?: string };
    }) => {
      const { cx, cy, value, payload } = props;

      if (
        typeof cx !== "number" ||
        typeof cy !== "number" ||
        typeof value !== "number"
      ) {
        return null;
      }

      const { day, month } = splitDateLabel(payload?.date ?? "");
      const dateLabel = month ? `${day} ${month}` : payload?.date ?? "";
      const tooltipLabel = `${dateLabel} · ${value.toLocaleString("fr-FR")} kg`;

      return (
        <Tooltip content={tooltipLabel} delay={1000} asChild>
          <circle
            cx={cx}
            cy={cy}
            r={4}
            stroke="#fff"
            strokeWidth={1}
            fill="#7069FA"
            style={{ cursor: "pointer" }}
          />
        </Tooltip>
      );
    },
    [],
  );

  return (
    <div className="w-full bg-white border border-[#ECE9F1] rounded-[8px] shadow-glift overflow-hidden">
      {/* HEADER */}
      <div className="h-[60px] flex items-center justify-between px-[30px] border-b border-[#F1EEF4]">
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
            <p className="text-[#C2BFC6] text-[12px] mt-1">01 Février 2026</p>
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
          <div className="dashboard-exercise-chart relative h-full w-full rounded-[16px] bg-white">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData} margin={CHART_MARGIN}>
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
                  dot={renderDot}
                  activeDot={{
                    r: 5,
                    fill: "#7069FA",
                    stroke: "#fff",
                    strokeWidth: 1,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
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
