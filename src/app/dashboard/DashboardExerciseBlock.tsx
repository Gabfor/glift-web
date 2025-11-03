"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import DashboardExerciseDropdown from "./DashboardExerciseDropdown";

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
  return (
    <div className="w-full bg-white border border-[#ECE9F1] rounded-[8px] shadow-glift overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between px-[30px] py-[25px] border-b border-[#F1EEF4]">
        <h2 className="text-[18px] font-bold text-[#2E3271]">{name}</h2>
        <div className="flex items-center gap-[30px] mt-4 md:mt-0">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] px-[30px] py-[25px]">
        <div className="flex flex-col justify-center">
          <div>
            <p className="text-[36px] font-bold text-[#2E3271] leading-none">25 kg</p>
            <p className="text-[#5D6494] font-semibold mt-1">Record personnel</p>
            <p className="text-[#9CA0C0] text-[14px]">08 Juin 2020</p>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="relative w-[60px] h-[60px]">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path
                  className="text-[#E9E7F3]"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#7056E4]"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="74, 100"
                  fill="none"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <img src="/icons/trophy.svg" alt="Objectif" className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-[#5D6494] font-semibold">
                Vous avez atteint <span className="text-[#7056E4] font-bold">74%</span> de votre objectif.
              </p>
              <button className="text-[#7056E4] text-[15px] font-semibold mt-1 hover:underline">
                Voir mon objectif.
              </button>
            </div>
          </div>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockData}>
              <defs>
                <linearGradient id={`color-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7056E4" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#7056E4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#9CA0C0", fontSize: 12 }} />
              <YAxis domain={["dataMin-1", "dataMax+1"]} tick={{ fill: "#9CA0C0", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  borderRadius: "6px",
                  border: "1px solid #ECE9F1",
                  color: "#2E3271",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#7056E4"
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#color-${id})`}
                dot={{ r: 4, stroke: "#7056E4", strokeWidth: 2, fill: "#fff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
