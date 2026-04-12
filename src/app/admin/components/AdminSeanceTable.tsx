"use client";

import { useState } from "react";
import Image from "next/image";
import { SeanceRow } from "../create-blog-article/blogArticleForm";
import TrainingTable from "@/components/TrainingTable";
import AddRowButton from "@/components/AddRowButton";
import Tooltip from "@/components/Tooltip";
import { Row } from "@/types/training";

type Props = {
  rows: SeanceRow[];
  setRows: (rows: SeanceRow[]) => void;
};

export default function AdminSeanceTable({ rows, setRows }: Props) {
  const [plusIcon, setPlusIcon] = useState("/icons/plus.svg");

  const adminColumns = [
    { name: "materiel", label: "Matériel", visible: true },
    { name: "repos", label: "Repos", visible: true },
    { name: "effort", label: "Effort", visible: false },
    { name: "poids", label: "Poids", visible: false },
  ];

  const mapToTrainingRows = (seanceRows: SeanceRow[]): Row[] => {
    return seanceRows.map((r, i) => {
      const numSeries = Number(r.series) || 1;
      return {
        // Need a unique ID for drag and drop to work reliably.
        // We use the index, but ideally, we should have a unique ID per SeanceRow.
        id: `temp-seance-${i}`,
        series: numSeries,
        repetitions: Array.isArray(r.reps) ? [...r.reps] : Array(numSeries).fill(r.reps || ""),
        poids: Array(numSeries).fill(""),
        effort: Array(numSeries).fill("parfait"),
        repos: r.repos || "",
        checked: !!r.checked,
        iconHovered: false,
        exercice: r.exercice || "",
        materiel: r.materiel || "",
        link: r.link,
        locked: false,
      };
    });
  };

  const mapToSeanceRows = (trainingRows: Row[]): SeanceRow[] => {
    return trainingRows.map(r => ({
      checked: r.checked,
      exercice: r.exercice,
      materiel: r.materiel,
      series: r.series,
      reps: r.repetitions,
      repos: r.repos,
      link: r.link,
    }));
  };

  const trainingRows = mapToTrainingRows(rows);

  const handleSetTrainingRows = (newRowsOrUpdater: React.SetStateAction<Row[]>) => {
    let newRows: Row[];
    if (typeof newRowsOrUpdater === 'function') {
      newRows = newRowsOrUpdater(trainingRows);
    } else {
      newRows = newRowsOrUpdater;
    }
    setRows(mapToSeanceRows(newRows));
  };

  const handleUpdateRow = (index: number, updates: Partial<Row>) => {
    const updated = [...trainingRows];
    updated[index] = { ...updated[index], ...updates };
    handleSetTrainingRows(updated);
  };

  const handleEffortChange = (rowIndex: number, subIndex: number, direction: "up" | "down") => {
    // Hidden in admin, no action needed
  };

  const handleCheckboxChange = (id: string) => {
    const index = trainingRows.findIndex(r => (r.id ?? "").toString() === id);
    if (index !== -1) {
      handleUpdateRow(index, { checked: !trainingRows[index].checked });
    }
  };

  const handleIncrementSeries = (index: number) => {
    const row = trainingRows[index];
    if (row.series < 6) {
      handleUpdateRow(index, { 
        series: row.series + 1, 
        repetitions: [...row.repetitions, ""],
        poids: [...row.poids, ""],
        effort: [...row.effort, "parfait"]
      });
    }
  };

  const handleDecrementSeries = (index: number) => {
    const row = trainingRows[index];
    if (row.series > 1) {
      handleUpdateRow(index, { 
        series: row.series - 1, 
        repetitions: row.repetitions.slice(0, -1),
        poids: row.poids.slice(0, -1),
        effort: row.effort.slice(0, -1)
      });
    }
  };

  const handleIconHover = (index: number, value: boolean) => {
    handleUpdateRow(index, { iconHovered: value });
  };

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        checked: false,
        exercice: "",
        materiel: "",
        series: 4,
        reps: ["", "", "", ""],
        repos: ""
      }
    ]);
  };

  const selectedIndexes = trainingRows
    .map((r, i) => (r.checked ? i : -1))
    .filter((i) => i !== -1);

  const [hoveredLink, setHoveredLink] = useState(false);
  const [hoveredDelete, setHoveredDelete] = useState(false);

  const handleDeleteSelected = () => {
    const newRows = [...rows].filter((_, i) => !selectedIndexes.includes(i));
    setRows(newRows);
  };

  const handlePromptLink = () => {
    if (selectedIndexes.length === 1) {
      const idx = selectedIndexes[0];
      const currentLink = trainingRows[idx].link || "";
      const newLink = window.prompt("Entrez l'URL du lien", currentLink);
      if (newLink !== null) {
        handleUpdateRow(idx, { link: newLink, checked: false });
      }
    }
  };

  const selectedRow = selectedIndexes.length === 1 ? trainingRows[selectedIndexes[0]] : null;

  return (
    <div className="w-full mt-4">
      <div className="flex justify-between items-center mb-[5px] min-h-[28px]">
        <h3 className="text-[18px] text-[#3A416F] font-bold">Tableau</h3>
        <div className="flex gap-4 items-center">
          {selectedIndexes.length > 0 && (
            <>
              {selectedIndexes.length === 1 && (
                <Tooltip content={selectedRow?.link ? "Modifier le lien" : "Ajouter un lien"}>
                  <button
                    onClick={handlePromptLink}
                    onMouseEnter={() => setHoveredLink(true)}
                    onMouseLeave={() => setHoveredLink(false)}
                  >
                    <Image
                      src={
                        selectedRow?.link
                          ? hoveredLink
                            ? "/icons/lien_active_hover.svg"
                            : "/icons/lien_active.svg"
                          : hoveredLink
                            ? "/icons/lien_hover.svg"
                            : "/icons/lien.svg"
                      }
                      alt={selectedRow?.link ? "Modifier le lien" : "Ajouter un lien"}
                      width={20}
                      height={20}
                      className="w-5 h-5 transition-all duration-200"
                    />
                  </button>
                </Tooltip>
              )}
              <Tooltip content="Supprimer">
                <button
                  onClick={() => {
                    handleDeleteSelected();
                    setHoveredDelete(false);
                  }}
                  onMouseEnter={() => setHoveredDelete(true)}
                  onMouseLeave={() => setHoveredDelete(false)}
                >
                  <Image
                    src={hoveredDelete ? "/icons/delete_hover.svg" : "/icons/delete.svg"}
                    alt="Supprimer"
                    width={20}
                    height={20}
                    className="w-5 h-5 transition-all duration-200"
                  />
                </button>
              </Tooltip>
            </>
          )}
        </div>
      </div>
      <TrainingTable
        rows={trainingRows}
        setRows={handleSetTrainingRows}
        handleEffortChange={handleEffortChange}
        handleCheckboxChange={handleCheckboxChange}
        handleIncrementSeries={handleIncrementSeries}
        handleDecrementSeries={handleDecrementSeries}
        handleIconHover={handleIconHover}
        columns={adminColumns}
        setIsEditing={() => {}}
        adminMode={true}
      />
      <AddRowButton
        icon={plusIcon}
        setIcon={setPlusIcon}
        onClick={handleAddRow}
      />
    </div>
  );
}
