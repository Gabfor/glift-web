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

const createEmptyHiddenValues = (): HiddenValues => ({
  repetitions: [],
  poids: [],
  effort: [],
});

export function useSeriesChange(setRows: React.Dispatch<React.SetStateAction<Row[]>>) {
  const hiddenValuesByRowRef = useRef(new WeakMap<Row, HiddenValues>());
  const hiddenValuesByIdRef = useRef(new Map<string, HiddenValues>());

  const getHiddenValues = useCallback(
    (row: Row): HiddenValues => {
      if (row.id) {
        let values = hiddenValuesByIdRef.current.get(row.id);
        if (!values) {
          values = createEmptyHiddenValues();
          hiddenValuesByIdRef.current.set(row.id, values);
        }
        return values;
      }

      let values = hiddenValuesByRowRef.current.get(row);
      if (!values) {
        values = createEmptyHiddenValues();
        hiddenValuesByRowRef.current.set(row, values);
      }
      return values;
    },
    []
  );

  const transferHiddenValues = useCallback((previousRow: Row, nextRow: Row) => {
    if (previousRow.id) {
      // Nothing to transfer: values are associated with the persistent id.
      return;
    }

    const existingValues = hiddenValuesByRowRef.current.get(previousRow);
    if (existingValues) {
      hiddenValuesByRowRef.current.delete(previousRow);
      hiddenValuesByRowRef.current.set(nextRow, existingValues);
    }
  }, []);

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

        const hiddenValues = getHiddenValues(currentRow);

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

        transferHiddenValues(currentRow, updatedRow);

        return newRows;
      });
    },
    [getHiddenValues, setRows, transferHiddenValues]
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

        const hiddenValues = getHiddenValues(currentRow);

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

        transferHiddenValues(currentRow, updatedRow);

        return newRows;
      });
    },
    [getHiddenValues, setRows, transferHiddenValues]
  );

  return { handleIncrementSeries, handleDecrementSeries };
}
