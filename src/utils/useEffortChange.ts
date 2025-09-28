import { Row } from "@/types/training";

export function useEffortChange(rows: Row[], setRows: (rows: Row[]) => void) {
  const handleEffortChange = (rowIndex: number, subIndex: number, direction: "up" | "down") => {
    const newRows = [...rows];
    const currentEffort = newRows[rowIndex].effort[subIndex];
    let newEffort = currentEffort;

    if (currentEffort === "trop facile" && direction === "up") return;
    if (currentEffort === "trop dur" && direction === "down") return;

    if (direction === "up") {
      newEffort = currentEffort === "parfait" ? "trop facile" : "parfait";
    }

    if (direction === "down") {
      newEffort = currentEffort === "parfait" ? "trop dur" : "parfait";
    }

    if (currentEffort !== newEffort) {
      newRows[rowIndex].effort[subIndex] = newEffort;
      setRows([...newRows]);
    }
  };

  return handleEffortChange;
}
