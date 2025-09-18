import { useEffect, useState } from "react";
import { Row } from "@/types/training";

export function useTrainingModals(
  rows: Row[],
  setRows: React.Dispatch<React.SetStateAction<Row[]>>,
  selectedRowIds: string[],
  setSelectedRowIds: React.Dispatch<React.SetStateAction<string[]>>
) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedLinkRowIndex, setSelectedLinkRowIndex] = useState<number | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedNoteRowIndex, setSelectedNoteRowIndex] = useState<number | null>(null);

  const handleSaveNote = async (newNote: string) => {
    if (selectedNoteRowIndex === null) return;

    const newRows = [...rows];
    newRows[selectedNoteRowIndex].note = newNote;
    newRows[selectedNoteRowIndex].checked = false;

    setRows(newRows);
    setSelectedRowIds([]); // On vide la sélection par ID

    setShowNoteModal(false);
    setSelectedNoteRowIndex(null);
  };

  const handleSaveLink = async (newLink: string, newExercice: string) => {
    if (selectedLinkRowIndex === null) return;

    const newRows = [...rows];
    newRows[selectedLinkRowIndex].link = newLink;
    newRows[selectedLinkRowIndex].exercice = newExercice;
    newRows[selectedLinkRowIndex].checked = false;

    setRows(newRows);
    setSelectedRowIds([]); // On vide la sélection par ID
    setSelectedLinkRowIndex(null);
    setShowLinkModal(false);
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && selectedLinkRowIndex !== null) {
        setShowLinkModal(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [selectedLinkRowIndex]);

  return {
    showLinkModal,
    setShowLinkModal,
    selectedLinkRowIndex,
    setSelectedLinkRowIndex,
    showNoteModal,
    setShowNoteModal,
    selectedNoteRowIndex,
    setSelectedNoteRowIndex,
    handleSaveNote,
    handleSaveLink,
  };
}
