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
import type { CategoricalChartState } from "recharts/types/chart/generateCategoricalChart";
import DashboardExerciseDropdown from "@/components/dashboard/DashboardExerciseDropdown";
import Tooltip from "@/components/Tooltip";
import React, { useCallback, useMemo, useRef, useState } from "react";

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

export default function DashboardExerciseBlock({
  id,
  name,
  sessionCount,
  curveType,
  onSessionChange,
  onCurveChange,
}: DashboardExerciseBlockProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [tooltipState, setTooltipState] = useState<{
    visible: boolean;
    label: string;
    value: number;
    x: number;
    y: number;
  }>({ visible: false, label: "", value: 0, x: 0, y: 0 });

  const hideTooltip = useCallback(() => {
    setTooltipState((prev) =>
      prev.visible ? { ...prev, visible: false } : prev,
    );
  }, []);

  const handleMouseMove = useCallback((state: CategoricalChartState | undefined) => {
    if (!chartContainerRef.current || !state) {
      hideTooltip();
      return;
    }

    const {
      isTooltipActive,
      activePayload,
      activeCoordinate,
      chartX,
      chartY,
      activeLabel,
    } = state;

    if (
      !isTooltipActive ||
      !activePayload?.length ||
      !activeCoordinate ||
      typeof chartX !== "number" ||
      typeof chartY !== "number"
    ) {
      hideTooltip();
      return;
    }

    const distance = Math.sqrt(
      Math.pow(chartX - activeCoordinate.x, 2) +
        Math.pow(chartY - activeCoordinate.y, 2),
    );

    const isHoveringDot = distance <= 12;

    if (!isHoveringDot) {
      hideTooltip();
      return;
    }

    setTooltipState({
      visible: true,
      label: typeof activeLabel === "string" ? activeLabel : "",
      value: Number(activePayload?.[0]?.value ?? 0),
      x: activeCoordinate.x,
      y: activeCoordinate.y,
    });
  }, [hideTooltip]);

  const tooltipContent = useMemo(() => {
    if (!tooltipState.visible) {
      return "";
    }
    const label = tooltipState.label;
    const value = tooltipState.value;
    return label ? `${label} · ${value} kg` : `${value} kg`;
  }, [tooltipState]);

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
            options={[
              { value: "average_weight", label: "Poids moyen" },
              { value: "max_weight", label: "Poids maximum" },
              { value: "total_weight", label: "Poids total" },
            ]}
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
          <div
            ref={chartContainerRef}
            className="relative h-full w-full rounded-[16px] bg-white px-[20px] pt-[26px] pb-[18px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={mockData}
                margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={hideTooltip}
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
                  tick={{ fill: "#8D8FB3", fontSize: 12, fontWeight: 600 }}
                  tickMargin={10}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={["dataMin - 1", "dataMax + 1"]}
                  tick={{ fill: "#8D8FB3", fontSize: 12, fontWeight: 600 }}
                  tickFormatter={(value: number) => `${value} kg`}
                  width={52}
                  axisLine={false}
                  tickLine={false}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#A1A5FD"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill={`url(#gradient-${id})`}
                  dot={{
                    r: 4,
                    stroke: "#fff",
                    strokeWidth: 1,
                    fill: "#7069FA",
                  }}
                  activeDot={{
                    r: 5,
                    fill: "#7069FA",
                    stroke: "#fff",
                    strokeWidth: 1,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <Tooltip
              key={`${tooltipState.label}-${tooltipState.x}-${tooltipState.y}-${tooltipState.visible}`}
              content={tooltipContent}
              forceVisible={tooltipState.visible}
              disableHover
              delay={0}
              offset={16}
            >
              <div
                style={{
                  position: "absolute",
                  left: tooltipState.x,
                  top: tooltipState.y,
                  width: 1,
                  height: 1,
                  pointerEvents: "none",
                  transform: "translate(-50%, -50%)",
                }}
              />
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
