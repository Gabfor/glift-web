"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { Row } from "@/types/training";
import { getEffortBgColor } from "@/utils/effortColors";
import { getEffortTextColor } from "@/utils/effortColors";

type Props = {
  row: Row;
  index: number;
  style?: React.CSSProperties;
  isHidden?: boolean;
  isAnimating?: boolean;
  setRows: React.Dispatch<React.SetStateAction<Row[]>>;
  handleEffortChange: (rowIndex: number, subIndex: number, direction: "up" | "down") => void;
  handleCheckboxChange: (id: string) => void;
  handleIncrementSeries: (index: number) => void;
  handleDecrementSeries: (index: number) => void;
  handleIconHover: (index: number, value: boolean) => void;
  columns: {
    name: string;
    label: string;
    visible: boolean;
  }[];
  setIsEditing: (val: boolean) => void;
  adminMode?: boolean;
};

export default function TrainingRow({
  row,
  index,
  isHidden,
  isAnimating,
  setRows,
  handleEffortChange,
  handleCheckboxChange,
  handleIncrementSeries,
  handleDecrementSeries,
  handleIconHover,
  columns,
  setIsEditing,
  adminMode = false,
}: Props) {
  const rowId = row.id ?? `temp-${index}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id: rowId, disabled: adminMode });

  const [isGrabbing, setIsGrabbing] = useState(false);

  useEffect(() => {
    const handlePointerUp = () => setIsGrabbing(false);
    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, []);

  useEffect(() => {
    if (!isDragging && row.iconHovered) {
      handleIconHover(index, false);
    }
  }, [handleIconHover, index, isDragging, row.iconHovered]);

  if (isHidden) {
    return (
      <tr style={{ height: "40px" }}>
        <td colSpan={100} style={{ height: "40px", padding: 0, border: "none" }} />
      </tr>
    );
  }

  const dragListeners =
    !adminMode && listeners && typeof listeners.onPointerDown === "function"
      ? { onPointerDown: (event: React.PointerEvent<HTMLImageElement>) => listeners.onPointerDown!(event) }
      : {};

  const isVisible = (name: string) => columns.find((c) => c.name === name)?.visible;

  const transitionTiming = "cubic-bezier(0.22, 1, 0.36, 1)";
  const sortableStyle: React.CSSProperties = {
    transform: transform
      ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
      : undefined,
    transition: !isDragging ? `transform 360ms ${transitionTiming}` : undefined,
    willChange: "transform",
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? "absolute" : undefined,
    top: isDragging ? 0 : undefined,
    left: isDragging ? 0 : undefined,
    width: "100%",
    backgroundColor: row.checked ? "#F4F5FE" : "#ffffff",
    borderBottom: isDragging ? "1px solid #ECE9F1" : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      {...attributes}
      style={{
        ...sortableStyle,
        visibility: isHidden ? "hidden" : "visible",
        borderBottom: isAnimating ? "1px solid #E0E0E0" : undefined,
      }}
      className={`bg-white border-[#ECE9F1] ${isHidden ? "opacity-0" : ""}`}
    >
      {/* ✅ Colonne icônes drag + checkbox */}
      <td
        className="px-0 py-0"
        style={{ maxWidth: "60px", width: "60px", backgroundColor: row.checked ? "#F4F5FE" : "transparent" }}
      >
        <div className="flex items-center h-10 justify-center gap-2 border-t border-[#ECE9F1]">
          <Image
            {...dragListeners}
            src={row.iconHovered ? "/icons/drag_hover.svg" : "/icons/drag.svg"}
            alt="Icone"
            width={20}
            height={20}
            className={`w-5 h-5 select-none ${isGrabbing ? "cursor-grabbing" : "cursor-grab"}`}
            onMouseEnter={() => handleIconHover(index, true)}
            onMouseDown={() => setIsGrabbing(true)}
            onMouseLeave={() => handleIconHover(index, false)}
          />
          <button
            onClick={() => handleCheckboxChange(rowId)}
            className="flex items-center justify-center"
            style={{ width: "15px", height: "15px" }}
          >
            <Image
              src={row.checked ? "/icons/checkbox_checked.svg" : "/icons/checkbox_unchecked.svg"}
              alt={row.checked ? "Coché" : "Non coché"}
              width={15}
              height={15}
              style={{ width: "15px", height: "15px" }}
            />
          </button>
        </div>
      </td>

      <td className="px-0 py-0" style={{ height: "40px", padding: "0" }}>
        {row.link ? (
          <a
            href={row.link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-full block px-3 py-2 border-l border-t border-[#ECE9F1] font-semibold text-[#7069FA] underline focus:outline-none training-input"
            style={{ backgroundColor: "transparent" }}
          >
            {row.exercice || "Nom de l’exercice"}
          </a>
        ) : (
          <input
            type="text"
            value={row.exercice}
            onFocus={() => setIsEditing(true)}
            onBlur={() => setIsEditing(false)}
            onChange={(e) => {
              setRows((prev) => {
                const updated = [...prev];
                updated[index].exercice = e.target.value;
                return updated;
              });
            }}
            className="w-full h-full border-l border-t border-[#ECE9F1] px-3 py-2 focus:outline-none training-input truncate"
            placeholder="Nom de l’exercice"
            style={{ backgroundColor: "transparent" }}
          />
        )}
      </td>

      {isVisible("materiel") && (
        <td className="px-0 py-0">
          <input
            type="text"
            value={row.materiel}
            onFocus={() => setIsEditing(true)}
            onBlur={() => setIsEditing(false)}
            onChange={(e) => {
              setRows((prev) => {
                const updated = [...prev];
                updated[index].materiel = e.target.value;
                return updated;
              });
            }}
            className="w-full h-10 border-l border-t border-[#ECE9F1] px-3 focus:outline-none training-input truncate"
            style={{ backgroundColor: "transparent", lineHeight: "40px" }}
            placeholder="Matériel"
          />
        </td>
      )}

      <td className="px-0 py-0" style={{ maxWidth: "60px", width: "60px" }}>
        <div className="flex items-center h-10 justify-end border-l border-t border-[#ECE9F1]">
          <input
            type="number"
            value={row.series}
            disabled
            className="w-9 h-8 text-left border-none px-2 py-1 rounded-md focus:outline-none training-input-series"
            style={{
              backgroundColor: "transparent",
              border: "none",
              WebkitAppearance: "none",
              MozAppearance: "textfield",
            }}
          />
          <div className="flex flex-col items-center justify-between">
            <button
              onClick={() => handleIncrementSeries(index)}
              className="w-5 h-3 flex items-center justify-center mb-1"
              disabled={row.series >= 6}
            >
              <img src="/icons/chevron_training_up.svg" alt="+" />
            </button>
            <button
              onClick={() => handleDecrementSeries(index)}
              className="w-5 h-3 flex items-center justify-center"
              disabled={row.series <= 1}
            >
              <img src="/icons/chevron_training_down.svg" alt="-" />
            </button>
          </div>
        </div>
      </td>

      <td className="px-0 py-0" style={{ maxWidth: "157px", width: "157px" }}>
        <div className="flex flex-row w-full">
          {row.repetitions.map((rep, subIndex) => (
            <input
              key={`rep-${subIndex}`}
              type="number"
              className="flex-grow h-10 text-center border-l border-t border-[#ECE9F1] px-1 py-1 focus:outline-none training-input"
              style={{
                width: `${100 / row.series}%`,
                backgroundColor:
                  row.effort[subIndex] !== "parfait"
                    ? getEffortBgColor(row.effort[subIndex])
                    : row.checked
                    ? "#F4F5FE"
                    : "transparent",
                color: getEffortTextColor(row.effort[subIndex]),
              }}
              value={rep || ""}
              placeholder="0"
              onChange={(e) => {
                setRows((prev) => {
                  const updated = [...prev];
                  updated[index].repetitions[subIndex] = e.target.value;
                  return updated;
                });
              }}
            />
          ))}
        </div>
      </td>

      <td className="px-0 py-0" style={{ maxWidth: "157px", width: "157px" }}>
        <div className="flex flex-row w-full">
          {row.poids.map((weight, subIndex) => (
            <input
              key={`weight-${subIndex}`}
              type="number"
              className="flex-grow h-10 text-center border-l border-t border-[#ECE9F1] px-1 py-1 focus:outline-none training-input"
              style={{
                width: `${100 / row.series}%`,
                backgroundColor:
                  row.effort[subIndex] !== "parfait"
                    ? getEffortBgColor(row.effort[subIndex])
                    : row.checked
                    ? "#F4F5FE"
                    : "transparent",
                color: getEffortTextColor(row.effort[subIndex]),
              }}
              value={weight || ""}
              placeholder="0"
              onChange={(e) => {
                setRows((prev) => {
                  const updated = [...prev];
                  updated[index].poids[subIndex] = e.target.value;
                  return updated;
                });
              }}
            />
          ))}
        </div>
      </td>

      {isVisible("repos") && (
        <td className="px-0 py-0">
          <input
            type="number"
            className="w-full h-10 text-center border-l border-t border-[#ECE9F1] px-1 py-1 focus:outline-none training-input input-centered"
            value={row.repos}
            onFocus={() => setIsEditing(true)}
            onBlur={() => setIsEditing(false)}
            placeholder="0"
            onChange={(e) => {
              setRows((prev) => {
                const updated = [...prev];
                updated[index].repos = e.target.value;
                return updated;
              });
            }}
            style={{ backgroundColor: "transparent" }}
          />
        </td>
      )}

      {isVisible("effort") && (
        <td className="px-0 py-0" style={{ maxWidth: "157px", width: "157px" }}>
          <div className="flex items-center h-10 justify-end border-t border-[#ECE9F1]">
            {row.effort.map((eff, subIndex) => (
              <div key={`effort-${subIndex}`} className="flex items-center justify-center w-full border-l h-10">
                <div className="flex justify-center items-center w-full">
                  <img
                    src={
                      eff === "trop facile"
                        ? "/icons/smiley_easy.svg"
                        : eff === "trop dur"
                        ? "/icons/smiley_hard.svg"
                        : "/icons/smiley_perfect.svg"
                    }
                    alt="Effort"
                    className="w-6 h-6"
                  />
                </div>
                <div className="flex flex-col items-center ml-auto">
                  <button
                    className="w-5 h-3 flex items-center justify-center mb-1"
                    onClick={() => handleEffortChange(index, subIndex, "up")}
                    disabled={eff === "trop facile"}
                  >
                    <img src="/icons/chevron_training_up.svg" alt="+" />
                  </button>
                  <button
                    className="w-5 h-3 flex items-center justify-center"
                    onClick={() => handleEffortChange(index, subIndex, "down")}
                    disabled={eff === "trop dur"}
                  >
                    <img src="/icons/chevron_training_down.svg" alt="-" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </td>
      )}
    </tr>
  );
}
