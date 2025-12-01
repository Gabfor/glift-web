import { Dispatch, SetStateAction } from "react";

import { Row } from "@/types/training";

export function useEffortChange(setRows: Dispatch<SetStateAction<Row[]>>) {
  const handleEffortChange = (rowIndex: number, subIndex: number, direction: "up" | "down") => {
    setRows((previousRows) => {
      const newRows = [...previousRows];
      const currentEffort = newRows[rowIndex]?.effort[subIndex];

      if (!currentEffort) return previousRows;

      let newEffort = currentEffort;

      if (currentEffort === "trop facile" && direction === "up") return previousRows;
      if (currentEffort === "trop dur" && direction === "down") return previousRows;

      if (direction === "up") {
        newEffort = currentEffort === "parfait" ? "trop facile" : "parfait";
      }

      if (direction === "down") {
        newEffort = currentEffort === "parfait" ? "trop dur" : "parfait";
      }

      if (currentEffort === newEffort) return previousRows;

      newRows[rowIndex] = {
        ...newRows[rowIndex],
        effort: newRows[rowIndex].effort.map((value, idx) => (idx === subIndex ? newEffort : value)),
      };

      return newRows;
    });
  };

  return handleEffortChange;
}
