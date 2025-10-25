"use client";

import Image from "next/image";
import React from "react";
import { Row } from "@/types/training";
import { getEffortBgColor } from "@/utils/effortColors";
import { getEffortTextColor } from "@/utils/effortColors";

type Props = {
  row: Row;
  columns: {
    name: string;
    label: string;
    visible: boolean;
  }[];
};

export default function TrainingRowOverlay({ row, columns }: Props) {
  const isVisible = (name: string) => columns.find((c) => c.name === name)?.visible;

  return (
    <tr
      className="bg-white border-[#ECE9F1]"
      style={{
        borderBottom: "1px solid #ECE9F1",
        backgroundColor: row.checked ? "#F4F5FE" : "#ffffff",
        height: "40px",
        userSelect: "none",
        transform: "none",
      }}
    >
      <td
        className="px-0 py-0"
        style={{ maxWidth: "60px", width: "60px", backgroundColor: row.checked ? "#F4F5FE" : "transparent" }}
      >
        <div className="flex items-center h-10 justify-center gap-2 border-t border-[#ECE9F1]">
          <Image
            src={row.iconHovered ? "/icons/drag_hover.svg" : "/icons/drag.svg"}
            alt="Icone"
            width={20}
            height={20}
            className="w-5 h-5 cursor-grabbing select-none"
            style={{ display: "block" }}
          />
          <Image
            src={row.checked ? "/icons/checkbox_checked.svg" : "/icons/checkbox_unchecked.svg"}
            alt={row.checked ? "Coché" : "Non coché"}
            width={15}
            height={15}
            style={{ width: "15px", height: "15px" }}
          />
        </div>
      </td>

      <td className="px-0 py-0" style={{ height: "40px", padding: "0" }}>
        <input
          type="text"
          disabled
          value={row.exercice}
          placeholder="Nom de l’exercice"
          className={`w-full h-full px-3 py-2 border-l border-t border-[#ECE9F1] text-[14px] font-semibold leading-[1.5] placeholder:text-gray-400 training-input ${row.link ? "underline" : ""}`}
          style={{
            backgroundColor: "transparent",
            color: row.link ? "#7069FA" : "#5D6494",
          }}
        />
      </td>

      {isVisible("materiel") && (
        <td className="px-0 py-0" style={{ height: "40px", padding: "0", width: "135px" }}>
          <input
            type="text"
            disabled
            value={row.materiel}
            placeholder="Matériel"
            className="w-full h-full px-3 py-2 border-l border-t border-[#ECE9F1] text-[14px] font-semibold leading-[1.5] placeholder:text-gray-400 text-[#5D6494] training-input"
            style={{ backgroundColor: "transparent" }}
          />
        </td>
      )}

      <td
        className="px-0 py-0"
        style={{ maxWidth: "60px", width: "60px", backgroundColor: row.checked ? "#F4F5FE" : "transparent" }}
      >
        <div className="flex items-center h-10 justify-end border-l border-t border-[#ECE9F1]">
          <span className="w-9 h-8 text-left px-2 py-1 font-semibold text-[#5D6494]" style={{ lineHeight: "1.5", display: "flex", alignItems: "center", justifyContent: "center" }}>{row.series}</span>
          <div className="flex flex-col items-center justify-between">
            <div className="w-5 h-3 flex items-center justify-center mb-1">
              <Image
                src="/icons/chevron_training_up.svg"
                alt="Up"
                width={10}
                height={7}
                className="w-[10px] h-[7px]"
              />
            </div>
            <div className="w-5 h-3 flex items-center justify-center">
              <Image
                src="/icons/chevron_training_down.svg"
                alt="Down"
                width={10}
                height={7}
                className="w-[10px] h-[7px]"
              />
            </div>
          </div>
        </div>
      </td>

      <td className="px-0 py-0" style={{ maxWidth: "157px", width: "157px" }}>
        <div className="flex flex-row w-full">
          {Array.from({ length: row.series }).map((_, subIndex) => {
            const value = row.repetitions[subIndex];
            const isUserInput = value !== "" && value !== undefined;

            return (
              <div key={`rep-${subIndex}`} className="flex w-full">
                <div
                  className="flex-grow h-10 text-center border-l border-t border-[#ECE9F1] px-1 py-1 training-input font-semibold"
                  style={{
                    width: `${100 / row.series}%`,
                    backgroundColor:
                      row.effort[subIndex] !== "parfait"
                        ? getEffortBgColor(row.effort[subIndex])
                        : row.checked
                        ? "#F4F5FE"
                        : "transparent",
                    color: isUserInput ? getEffortTextColor(row.effort[subIndex]) : "#D7D4DC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: "1.5",
                  }}
                >
                  {value || "0"}
                </div>
              </div>
            );
          })}
        </div>
      </td>

      <td className="px-0 py-0" style={{ maxWidth: "157px", width: "157px" }}>
        <div className="flex flex-row w-full">
          {Array.from({ length: row.series }).map((_, subIndex) => {
            const value = row.poids[subIndex];
            const isUserInput = value !== "" && value !== undefined;

            return (
              <div key={`weight-${subIndex}`} className="flex w-full">
                <div
                  className="flex-grow h-10 text-center border-l border-t border-[#ECE9F1] px-1 py-1 training-input font-semibold"
                  style={{
                    width: `${100 / row.series}%`,
                    backgroundColor:
                      row.effort[subIndex] !== "parfait"
                        ? getEffortBgColor(row.effort[subIndex])
                        : row.checked
                        ? "#F4F5FE"
                        : "transparent",
                    color: isUserInput ? getEffortTextColor(row.effort[subIndex]) : "#D7D4DC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: "1.5",
                  }}
                >
                  {value || "0"}
                </div>
              </div>
            );
          })}
        </div>
      </td>

      {isVisible("repos") && (
        <td className="px-0 py-0" style={{ maxWidth: "60px", width: "60px" }}>
          <div
            className="w-full h-10 text-center border-l border-t border-[#ECE9F1] px-1 py-1 training-input font-semibold"
            style={{
              lineHeight: "1.5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: row.repos !== "" && row.repos !== undefined ? "#5D6494" : "#D7D4DC",
            }}
          >
            {row.repos || "0"}
          </div>
        </td>
      )}

      {isVisible("effort") && (
        <td className="px-0 py-0" style={{ maxWidth: "237px", width: "237px" }}>
          <div className="flex items-center h-10 justify-end border-t border-[#ECE9F1]">
            {Array.from({ length: row.series }).map((_, subIndex) => (
              <div key={`effort-${subIndex}`} className="flex items-center justify-center w-full border-l h-10">
                <div className="flex justify-center items-center w-full">
                  <Image
                    src={
                      row.effort[subIndex] === "trop facile"
                        ? "/icons/smiley_easy.svg"
                        : row.effort[subIndex] === "trop dur"
                        ? "/icons/smiley_hard.svg"
                        : "/icons/smiley_perfect.svg"
                    }
                    alt="Effort"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </div>
                <div className="flex flex-col items-center ml-auto">
                  <div className="w-5 h-3 flex items-center justify-center mb-1">
                    <Image
                      src="/icons/chevron_training_up.svg"
                      alt="Up"
                      width={10}
                      height={7}
                      className="w-[10px] h-[7px]"
                    />
                  </div>
                  <div className="w-5 h-3 flex items-center justify-center">
                    <Image
                      src="/icons/chevron_training_down.svg"
                      alt="Down"
                      width={10}
                      height={7}
                      className="w-[10px] h-[7px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </td>
      )}
    </tr>
  );
}
