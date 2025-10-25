"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import Tooltip from "@/components/Tooltip";
import ColumnMenu from "@/components/ColumnMenu";
import { Row } from "@/types/training";

type Props = {
  rows: Row[];
  selectedRowIds: string[];
  dragActive: boolean;
  handleDeleteSelectedRows: () => void;
  iconSrc: string;
  setIconSrc: (src: string) => void;
  columns: {
    name: string;
    label: string;
    visible: boolean;
  }[];
  togglableColumns: {
    name: string;
    label: string;
    visible: boolean;
  }[];
  setColumns: React.Dispatch<React.SetStateAction<{
    name: string;
    label: string;
    visible: boolean;
  }[]>>;
  handleGroupSuperset: () => void;
  onLinkClick: (rowId: string) => void;
  onNoteClick?: () => void;
  saveColumnsInSupabase: (columns: {
    name: string;
    label: string;
    visible: boolean;
  }[]) => Promise<void>;
};

export default function TableActionsBar({
  rows,
  columns,
  togglableColumns,
  setColumns,
  selectedRowIds,
  handleDeleteSelectedRows,
  iconSrc,
  setIconSrc,
  handleGroupSuperset,
  onLinkClick,
  onNoteClick,
  saveColumnsInSupabase,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredSuperset, setHoveredSuperset] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(false);
  const [hoveredNote, setHoveredNote] = useState(false);
  const [hoveredDelete, setHoveredDelete] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const selectedIndexes = selectedRowIds
    .map(id => rows.findIndex(r => r.id === id))
    .filter(index => index !== -1)
    .sort((a, b) => a - b);

  const allSelectedInSameSuperset =
    selectedIndexes.length >= 2 &&
    selectedIndexes.every(
      (i) =>
        rows[i].superset_id &&
        rows[i].superset_id === rows[selectedIndexes[0]].superset_id
    );

  const isFullSupersetSelected = (() => {
    if (selectedIndexes.length < 2) return false;
    const supersetId = rows[selectedIndexes[0]].superset_id;
    if (!supersetId) return false;

    const supersetRowIndexes = rows
      .map((r, index) => (r.superset_id === supersetId ? index : -1))
      .filter(index => index !== -1);

    const selectedSet = new Set(selectedIndexes);
    const supersetSet = new Set(supersetRowIndexes);

    if (selectedSet.size !== supersetSet.size) return false;
    for (const i of supersetSet) {
      if (!selectedSet.has(i)) return false;
    }
    return true;
  })();

  const isMixedSelection = (() => {
    if (selectedIndexes.length < 2) return false;

    const selectedSupersetIds = new Set(
      selectedIndexes.map(i => rows[i].superset_id)
    );

    return (
      selectedSupersetIds.has(null) && selectedSupersetIds.size > 1
    ) || (!selectedSupersetIds.has(null) && selectedSupersetIds.size > 1);
  })();

  const isSameSeriesCount = (() => {
    if (selectedIndexes.length < 2) return false;
    const firstSeriesCount = rows[selectedIndexes[0]].series;
    return selectedIndexes.every(i => rows[i].series === firstSeriesCount);
  })();

  const areSelectedRowsConsecutive = selectedIndexes
    .every((val, i, arr) => i === 0 || val === arr[i - 1] + 1);

  const selectedRow = selectedRowIds.length === 1 ? rows.find(r => r.id === selectedRowIds[0]) : null;
  const hasNote = !!selectedRow?.note?.trim();

  useEffect(() => {
    const handleClickOutside = async (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        await saveColumnsInSupabase(columns); // sauvegarde automatique à la fermeture du menu ✅
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [columns, saveColumnsInSupabase]);

  return (
    <div className="flex gap-4 items-center justify-end mb-4">
      {selectedRowIds.length >= 2 && areSelectedRowsConsecutive && !isMixedSelection && isSameSeriesCount && (isFullSupersetSelected || !allSelectedInSameSuperset) && (
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
              className="w-5 h-5"
            />
          </button>
        </Tooltip>
      )}

      {selectedRowIds.length === 1 && (
        <>
          <Tooltip content={selectedRow?.link ? "Modifier le lien" : "Ajouter un lien"}>
            <button
              onClick={() => onLinkClick(selectedRowIds[0])}
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
                className="w-5 h-5"
              />
            </button>
          </Tooltip>

          <Tooltip content={selectedRow?.note ? "Modifier la note" : "Ajouter une note"}>
            <button
              onClick={onNoteClick}
              onMouseEnter={() => setHoveredNote(true)}
              onMouseLeave={() => setHoveredNote(false)}
            >
              <Image
                src={
                  hasNote
                    ? hoveredNote
                      ? "/icons/note_active_hover.svg"
                      : "/icons/note_active.svg"
                    : hoveredNote
                      ? "/icons/note_hover.svg"
                      : "/icons/note.svg"
                }
                alt={selectedRow?.note ? "Modifier la note" : "Ajouter une note"}
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </button>
          </Tooltip>
        </>
      )}

      {selectedRowIds.length > 0 && (
        <Tooltip content="Supprimer">
          <button
            onClick={() => {
              handleDeleteSelectedRows();
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
              className="w-5 h-5"
            />
          </button>
        </Tooltip>
      )}

      <div ref={menuRef} className="relative inline-flex items-center">
        <Tooltip content="Colonnes">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            onMouseEnter={() => setIconSrc("/icons/colonne_hover.svg")}
            onMouseLeave={() => setIconSrc("/icons/colonne.svg")}
          >
            <Image src={iconSrc} alt="Colonnes" width={20} height={20} className="w-5 h-5" />
          </button>
        </Tooltip>

        {menuOpen && (
          <ColumnMenu
            columns={togglableColumns}
            onToggle={(name) => {
              setColumns(prev =>
                prev.map(col =>
                  col.name === name ? { ...col, visible: !col.visible } : col
                )
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
