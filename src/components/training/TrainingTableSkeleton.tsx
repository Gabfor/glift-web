"use client";

import { useEffect, useState } from "react";

interface TrainingTableSkeletonProps {
  trainingId?: string;
  defaultRowCount?: number;
}

export default function TrainingTableSkeleton({
  trainingId,
  defaultRowCount = 5,
}: TrainingTableSkeletonProps) {
  const [rowCount, setRowCount] = useState<number>(() => {
    if (typeof window !== "undefined" && trainingId) {
      try {
        const cached = localStorage.getItem(`training_rows_count_${trainingId}`);
        if (cached) {
          const parsed = parseInt(cached, 10);
          if (!isNaN(parsed) && parsed > 0) return Math.min(parsed, 15);
        }
      } catch {
        // ignore
      }
    }
    return defaultRowCount;
  });

  useEffect(() => {
    if (trainingId) {
      try {
        const cached = localStorage.getItem(`training_rows_count_${trainingId}`);
        if (cached) {
          const parsed = parseInt(cached, 10);
          if (!isNaN(parsed) && parsed > 0) {
            setRowCount(Math.min(parsed, 15));
          }
        }
      } catch {
        // ignore
      }
    }
  }, [trainingId]);

  return (
    <div className="w-full animate-pulse select-none">
      <div className="w-full rounded-t-[5px] overflow-hidden border border-[#ECE9F1]">
        <table
          className="w-full text-[14px] font-medium border-collapse table-fixed"
          style={{ minWidth: "900px", borderSpacing: "0px" }}
        >
          {/* Header */}
          <thead className="bg-[#FBFCFE] border-b border-[#ECE9F1]">
            <tr style={{ height: "40px" }}>
              <th
                className="border-r border-[#ECE9F1] px-3"
                style={{ height: "40px", width: "60px", maxWidth: "60px" }}
              >
                <div className="w-[18px] h-[18px] rounded-[4px] bg-[#ECE9F1] mx-auto" />
              </th>
              <th
                className="border-r border-[#ECE9F1] px-3 text-left"
                style={{ height: "40px" }}
              >
                <div className="h-[14px] w-[80px] rounded-[4px] bg-[#ECE9F1]" />
              </th>
              <th
                className="border-r border-[#ECE9F1] px-3 text-left"
                style={{ height: "40px", width: "135px", maxWidth: "135px" }}
              >
                <div className="h-[14px] w-[60px] rounded-[4px] bg-[#ECE9F1]" />
              </th>
              <th
                className="border-r border-[#ECE9F1] px-2 text-center"
                style={{ height: "40px", width: "60px", maxWidth: "60px" }}
              >
                <div className="h-[14px] w-[35px] rounded-[4px] bg-[#ECE9F1] mx-auto" />
              </th>
              <th
                className="border-r border-[#ECE9F1] px-3 text-center"
                style={{ height: "40px", width: "157px", maxWidth: "157px" }}
              >
                <div className="h-[14px] w-[70px] rounded-[4px] bg-[#ECE9F1] mx-auto" />
              </th>
              <th
                className="border-r border-[#ECE9F1] px-3 text-center"
                style={{ height: "40px", width: "157px", maxWidth: "157px" }}
              >
                <div className="h-[14px] w-[40px] rounded-[4px] bg-[#ECE9F1] mx-auto" />
              </th>
              <th
                className="border-r border-[#ECE9F1] px-2 text-center"
                style={{ height: "40px", width: "60px", maxWidth: "60px" }}
              >
                <div className="h-[14px] w-[35px] rounded-[4px] bg-[#ECE9F1] mx-auto" />
              </th>
              <th
                className="px-3 text-center"
                style={{ height: "40px", width: "237px", maxWidth: "237px" }}
              >
                <div className="h-[14px] w-[45px] rounded-[4px] bg-[#ECE9F1] mx-auto" />
              </th>
            </tr>
          </thead>

          {/* Rows */}
          <tbody className="bg-white">
            {Array.from({ length: rowCount }).map((_, index) => (
              <tr
                key={index}
                className="border-b border-[#ECE9F1] hover:bg-transparent"
                style={{ height: "40px" }}
              >
                {/* Drag / Index */}
                <td
                  className="border-r border-[#ECE9F1] px-3 text-center"
                  style={{ height: "40px", width: "60px" }}
                >
                  <div className="w-[14px] h-[14px] rounded-[3px] bg-[#ECE9F1] mx-auto" />
                </td>

                {/* Exercice */}
                <td className="border-r border-[#ECE9F1] px-3" style={{ height: "40px" }}>
                  <div
                    className="h-[14px] rounded-[4px] bg-[#ECE9F1]"
                    style={{ width: `${Math.min(75, 45 + ((index * 13) % 35))}%` }}
                  />
                </td>

                {/* Matériel */}
                <td
                  className="border-r border-[#ECE9F1] px-3"
                  style={{ height: "40px", width: "135px" }}
                >
                  <div
                    className="h-[14px] rounded-[4px] bg-[#ECE9F1]"
                    style={{ width: `${Math.min(80, 40 + ((index * 17) % 40))}%` }}
                  />
                </td>

                {/* Séries */}
                <td
                  className="border-r border-[#ECE9F1] px-2 text-center"
                  style={{ height: "40px", width: "60px" }}
                >
                  <div className="h-[14px] w-[18px] rounded-[3px] bg-[#ECE9F1] mx-auto" />
                </td>

                {/* Répétitions */}
                <td
                  className="border-r border-[#ECE9F1] px-3 text-center"
                  style={{ height: "40px", width: "157px" }}
                >
                  <div className="h-[14px] w-[75px] rounded-[4px] bg-[#ECE9F1] mx-auto" />
                </td>

                {/* Poids */}
                <td
                  className="border-r border-[#ECE9F1] px-3 text-center"
                  style={{ height: "40px", width: "157px" }}
                >
                  <div className="h-[14px] w-[60px] rounded-[4px] bg-[#ECE9F1] mx-auto" />
                </td>

                {/* Repos */}
                <td
                  className="border-r border-[#ECE9F1] px-2 text-center"
                  style={{ height: "40px", width: "60px" }}
                >
                  <div className="h-[14px] w-[30px] rounded-[4px] bg-[#ECE9F1] mx-auto" />
                </td>

                {/* Effort */}
                <td
                  className="px-3 text-center"
                  style={{ height: "40px", width: "237px" }}
                >
                  <div className="h-[14px] w-[65px] rounded-[4px] bg-[#ECE9F1] mx-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

