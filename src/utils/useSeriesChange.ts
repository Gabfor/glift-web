import { useCallback, useRef } from "react";
import { Row } from "@/types/training";

const MAX_SERIES = 6;
const MIN_SERIES = 1;
const DEFAULT_EFFORT_VALUE = "parfait";

type HiddenValues = {
  repetitions: string[];
  poids: string[];
  effort: string[];
};

export function useSeriesChange(setRows: React.Dispatch<React.SetStateAction<Row[]>>) {
  const hiddenValuesRef = useRef(new WeakMap<Row, HiddenValues>());

  const handleIncrementSeries = useCallback(
    (index: number) => {
      setRows((previousRows) => {
        if (index < 0 || index >= previousRows.length) {
          return previousRows;
        }

        const currentRow = previousRows[index];

        if (!currentRow || currentRow.series >= MAX_SERIES) {
          return previousRows;
        }

        let hiddenValues = hiddenValuesRef.current.get(currentRow);
        if (!hiddenValues) {
          hiddenValues = { repetitions: [], poids: [], effort: [] };
          hiddenValuesRef.current.set(currentRow, hiddenValues);
        }

        const restoredRep = hiddenValues.repetitions.pop();
        const restoredPoids = hiddenValues.poids.pop();
        const restoredEffort = hiddenValues.effort.pop();

        const updatedRow: Row = {
          ...currentRow,
          series: currentRow.series + 1,
          repetitions: [...currentRow.repetitions, restoredRep ?? ""],
          poids: [...currentRow.poids, restoredPoids ?? ""],
          effort: [...currentRow.effort, restoredEffort ?? DEFAULT_EFFORT_VALUE],
        };

        const newRows = [...previousRows];
        newRows[index] = updatedRow;

        hiddenValuesRef.current.delete(currentRow);
        hiddenValuesRef.current.set(updatedRow, hiddenValues);

        return newRows;
      });
    },
    [setRows]
  );

  const handleDecrementSeries = useCallback(
    (index: number) => {
      setRows((previousRows) => {
        if (index < 0 || index >= previousRows.length) {
          return previousRows;
        }

        const currentRow = previousRows[index];

        if (!currentRow || currentRow.series <= MIN_SERIES) {
          return previousRows;
        }

        let hiddenValues = hiddenValuesRef.current.get(currentRow);
        if (!hiddenValues) {
          hiddenValues = { repetitions: [], poids: [], effort: [] };
          hiddenValuesRef.current.set(currentRow, hiddenValues);
        }

        const removedRep = currentRow.repetitions[currentRow.repetitions.length - 1] ?? "";
        const removedPoids = currentRow.poids[currentRow.poids.length - 1] ?? "";
        const removedEffort =
          currentRow.effort[currentRow.effort.length - 1] ?? DEFAULT_EFFORT_VALUE;

        hiddenValues.repetitions.push(removedRep);
        hiddenValues.poids.push(removedPoids);
        hiddenValues.effort.push(removedEffort);

        const updatedRow: Row = {
          ...currentRow,
          series: currentRow.series - 1,
          repetitions: currentRow.repetitions.slice(0, -1),
          poids: currentRow.poids.slice(0, -1),
          effort: currentRow.effort.slice(0, -1),
        };

        const newRows = [...previousRows];
        newRows[index] = updatedRow;

        hiddenValuesRef.current.delete(currentRow);
        hiddenValuesRef.current.set(updatedRow, hiddenValues);

        return newRows;
      });
    },
    [setRows]
  );

  return { handleIncrementSeries, handleDecrementSeries };
}
