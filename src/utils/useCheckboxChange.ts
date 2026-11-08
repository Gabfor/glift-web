import { useRef } from "react";
import { Row } from "@/types/training";

export function useCheckboxChange(
  rows: Row[],
  setRows: React.Dispatch<React.SetStateAction<Row[]>>,
  setSelectedRowIds: React.Dispatch<React.SetStateAction<string[]>>
) {
  const lastClickedIndexRef = useRef<number | null>(null);

  return (id: string, event?: React.MouseEvent) => {
    const index = rows.findIndex((r) => r.id === id);
    if (index === -1) return;

    const newRows = [...rows];

    // Support de la sélection multiple par plage avec Shift+Click
    if (event?.shiftKey && lastClickedIndexRef.current !== null && lastClickedIndexRef.current !== index) {
      const start = Math.min(lastClickedIndexRef.current, index);
      const end = Math.max(lastClickedIndexRef.current, index);

      const updatedIds = new Set<string>();
      for (let i = start; i <= end; i++) {
        if (!newRows[i].locked) {
          newRows[i] = { ...newRows[i], checked: true };
          if (newRows[i].id) {
            updatedIds.add(newRows[i].id!);
          }
        }
      }

      setRows(newRows);
      setSelectedRowIds((prev) => {
        const next = new Set(prev);
        for (const uid of updatedIds) {
          next.add(uid);
        }
        return Array.from(next);
      });
      lastClickedIndexRef.current = index;
      return;
    }

    const nextChecked = !newRows[index].checked;
    newRows[index] = { ...newRows[index], checked: nextChecked };

    setRows(newRows);
    setSelectedRowIds((prev) =>
      nextChecked
        ? [...prev, id]
        : prev.filter((existingId) => existingId !== id)
    );
    lastClickedIndexRef.current = nextChecked ? index : null;
  };
}
