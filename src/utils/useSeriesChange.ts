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

        const newRows = [...previousRows];
        const row = newRows[index];

        if (!row || row.series >= MAX_SERIES) {
          return previousRows;
        }

        let hiddenValues = hiddenValuesRef.current.get(row);
        if (!hiddenValues) {
          hiddenValues = { repetitions: [], poids: [], effort: [] };
          hiddenValuesRef.current.set(row, hiddenValues);
        }

        const restoredRep = hiddenValues.repetitions.pop();
        const restoredPoids = hiddenValues.poids.pop();
        const restoredEffort = hiddenValues.effort.pop();

        row.series += 1;
        row.repetitions = [...row.repetitions, restoredRep ?? ""];
        row.poids = [...row.poids, restoredPoids ?? ""];
        row.effort = [...row.effort, restoredEffort ?? DEFAULT_EFFORT_VALUE];

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

        const newRows = [...previousRows];
        const row = newRows[index];

        if (!row || row.series <= MIN_SERIES) {
          return previousRows;
        }

        let hiddenValues = hiddenValuesRef.current.get(row);
        if (!hiddenValues) {
          hiddenValues = { repetitions: [], poids: [], effort: [] };
          hiddenValuesRef.current.set(row, hiddenValues);
        }

        const removedRep = row.repetitions[row.repetitions.length - 1] ?? "";
        const removedPoids = row.poids[row.poids.length - 1] ?? "";
        const removedEffort = row.effort[row.effort.length - 1] ?? DEFAULT_EFFORT_VALUE;

        hiddenValues.repetitions.push(removedRep);
        hiddenValues.poids.push(removedPoids);
        hiddenValues.effort.push(removedEffort);

        row.series -= 1;
        row.repetitions = row.repetitions.slice(0, -1);
        row.poids = row.poids.slice(0, -1);
        row.effort = row.effort.slice(0, -1);

        return newRows;
      });
    },
    [setRows]
  );

  return { handleIncrementSeries, handleDecrementSeries };
}
