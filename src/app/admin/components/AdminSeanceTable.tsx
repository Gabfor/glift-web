"use client";

import { useState } from "react";
import Image from "next/image";
import { SeanceRow } from "../create-blog-article/blogArticleForm";
import TrainingTable from "@/components/TrainingTable";
import AddRowButton from "@/components/AddRowButton";
import Tooltip from "@/components/Tooltip";
import LinkModal from "@/components/LinkModal";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { Row } from "@/types/training";

type Props = {
  rows: SeanceRow[];
  setRows: (rows: SeanceRow[]) => void;
};

export default function AdminSeanceTable({ rows, setRows }: Props) {
  const [plusIcon, setPlusIcon] = useState("/icons/plus.svg");
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

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
        id: `temp-seance-${i}`,
        series: numSeries,
        repetitions: Array.isArray(r.reps) ? [...r.reps] : Array(numSeries).fill(r.reps || ""),
        poids: Array(numSeries).fill(""),
        effort: Array(numSeries).fill("parfait"),
        repos: r.repos || "",
        checked: selectedIndices.includes(i),
        iconHovered: false,
        exercice: r.exercice || "",
        materiel: r.materiel || "",
        link: r.link,
        superset_id: r.superset_id,
        conseils: r.conseils || "",
        locked: false,
      };
    });
  };

  const mapToSeanceRows = (trainingRows: Row[]): SeanceRow[] => {
    return trainingRows.map(r => ({
      exercice: r.exercice,
      materiel: r.materiel,
      series: r.series,
      reps: r.repetitions,
      repos: r.repos,
      link: r.link,
      superset_id: r.superset_id ?? undefined,
      conseils: r.conseils,
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
    // Si on réordonne, on décoche tout pour éviter les décalages d'index
    if (newRows.length === trainingRows.length) {
      setSelectedIndices([]);
    }
    setRows(mapToSeanceRows(newRows));
  };

  const handleUpdateRow = (index: number, updates: Partial<Row>) => {
    const updated = [...trainingRows];
    updated[index] = { ...updated[index], ...updates };
    handleSetTrainingRows(updated);
  };

  const handleEffortChange = (rowIndex: number, subIndex: number, direction: "up" | "down") => {
  };

  const handleCheckboxChange = (id: string) => {
    const index = parseInt(id.replace("temp-seance-", ""));
    if (isNaN(index)) return;
    
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
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
        exercice: "",
        materiel: "",
        series: 4,
        reps: ["", "", "", ""],
        repos: "",
        conseils: ""
      }
    ]);
  };

  const [hoveredLink, setHoveredLink] = useState(false);
  const [hoveredDelete, setHoveredDelete] = useState(false);
  const [hoveredSuperset, setHoveredSuperset] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const sortedSelectedIndices = [...selectedIndices].sort((a, b) => a - b);

  const allSelectedInSameSuperset =
    sortedSelectedIndices.length >= 2 &&
    sortedSelectedIndices.every(
      (i) =>
        trainingRows[i].superset_id &&
        trainingRows[i].superset_id === trainingRows[sortedSelectedIndices[0]].superset_id
    );

  const isFullSupersetSelected = (() => {
    if (sortedSelectedIndices.length < 2) return false;
    const supersetId = trainingRows[sortedSelectedIndices[0]].superset_id;
    if (!supersetId) return false;

    const supersetRowIndexes = trainingRows
      .map((r, index) => (r.superset_id === supersetId ? index : -1))
      .filter(index => index !== -1);

    const selectedSet = new Set(sortedSelectedIndices);
    const supersetSet = new Set(supersetRowIndexes);

    if (selectedSet.size !== supersetSet.size) return false;
    for (const i of supersetSet) {
      if (!selectedSet.has(i)) return false;
    }
    return true;
  })();

  const isMixedSelection = (() => {
    if (sortedSelectedIndices.length < 2) return false;

    const selectedSupersetIds = new Set(
      sortedSelectedIndices.map(i => trainingRows[i].superset_id)
    );

    return (
      selectedSupersetIds.has(null) && selectedSupersetIds.size > 1
    ) || (!selectedSupersetIds.has(null) && selectedSupersetIds.size > 1);
  })();

  const isSameSeriesCount = (() => {
    if (sortedSelectedIndices.length < 2) return false;
    const firstSeriesCount = trainingRows[sortedSelectedIndices[0]].series;
    return sortedSelectedIndices.every(i => trainingRows[i].series === firstSeriesCount);
  })();

  const areSelectedRowsConsecutive = sortedSelectedIndices
    .every((val, i, arr) => i === 0 || val === arr[i - 1] + 1);

  const handleDeleteSelected = () => {
    const newRows = [...rows].filter((_, i) => !selectedIndices.includes(i));
    setSelectedIndices([]);
    setRows(newRows);
  };

  const handleGroupSuperset = () => {
    if (sortedSelectedIndices.length < 2) return;
    
    const updatedRows = [...trainingRows];

    if (isFullSupersetSelected) {
      // Ungroup
      for (const i of sortedSelectedIndices) {
        updatedRows[i] = { ...updatedRows[i], superset_id: undefined };
      }
    } else {
      // Group
      const newSupersetId = Math.random().toString(36).substring(2);
      for (const i of sortedSelectedIndices) {
        updatedRows[i] = { ...updatedRows[i], superset_id: newSupersetId };
      }
    }
    
    handleSetTrainingRows(updatedRows);
    setSelectedIndices([]);
    setHoveredSuperset(false);
  };

  const handlePromptLink = () => {
    if (selectedIndices.length === 1) {
      setShowLinkModal(true);
    }
  };

  const handleSaveLink = (newLink: string, newExercice: string) => {
    if (selectedIndices.length === 1) {
      const idx = selectedIndices[0];
      handleUpdateRow(idx, { link: newLink, exercice: newExercice });
      setShowLinkModal(false);
      setSelectedIndices([]);
    }
  };

  const selectedRow = selectedIndices.length === 1 ? trainingRows[selectedIndices[0]] : null;

  return (
    <div className="w-full mt-4">
      <div className="flex justify-between items-center mb-[5px] min-h-[28px]">
        <h3 className="text-[18px] text-[#3A416F] font-bold">Tableau</h3>
        <div className="flex gap-4 items-center">
          {selectedIndices.length > 0 && (
            <>
              {selectedIndices.length === 1 && (
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
              {selectedIndices.length >= 2 && areSelectedRowsConsecutive && !isMixedSelection && isSameSeriesCount && (isFullSupersetSelected || !allSelectedInSameSuperset) && (
                <Tooltip content={isFullSupersetSelected ? "Annuler le superset" : "Créer un superset"}>
                  <button
                    onClick={() => {
                      handleGroupSuperset();
                      setHoveredSuperset(false);
                    }}
                    onMouseEnter={() => setHoveredSuperset(true)}
                    onMouseLeave={() => setHoveredSuperset(false)}
                  >
                    <Image
                      src={
                        isFullSupersetSelected
                          ? hoveredSuperset
                            ? "/icons/superset_desactivate_hover.svg"
                            : "/icons/superset_desactivate.svg"
                          : hoveredSuperset
                            ? "/icons/superset_hover.svg"
                            : "/icons/superset.svg"
                      }
                      alt={isFullSupersetSelected ? "Dissocier le superset" : "Créer un superset"}
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

      {/* Details des exercices */}
      <div className="mt-[30px] flex flex-col gap-[30px]">
        {trainingRows.map((row, index) => (
          <div key={`details-${index}`} className="flex flex-col">
            {/* Séparateur "Exercice" */}
            <div className="relative flex items-center h-[50px] mb-[12px]">
              <div className="flex-1 flex justify-center items-center relative z-10">
                <div className="text-[16px] text-[#D7D4DC] font-semibold bg-[#FBFCFE] px-4">
                  Exercice
                </div>
              </div>
              <div className="absolute top-[25px] left-0 w-full h-[1px] bg-[#ECE9F1] z-0"></div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Exercice</label>
                <input 
                  type="text" 
                  value={row.exercice} 
                  onChange={(e) => handleUpdateRow(index, { exercice: e.target.value })}
                  placeholder="Nom de l'exercice"
                  className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD] transition-all duration-150"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Conseils</label>
                <RichTextEditor 
                  value={row.conseils || ""} 
                  onChange={(html) => handleUpdateRow(index, { conseils: html })}
                  containerClassName="h-[170px] overflow-hidden"
                  editorClassName="h-[130px] overflow-y-auto w-full min-h-[130px]"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {showLinkModal && selectedRow && (
        <LinkModal
          exercice={selectedRow.exercice}
          initialLink={selectedRow.link || ""}
          onCancel={() => setShowLinkModal(false)}
          onSave={handleSaveLink}
        />
      )}
    </div>
  );
}
