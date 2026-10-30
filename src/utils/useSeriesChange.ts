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

        const targetRow = previousRows[index];
        if (!targetRow) return previousRows;

        // Si la ligne appartient à un superset, propager à tout le groupe
        const targetSupersetId = targetRow.superset_id;
        const indicesToUpdate = targetSupersetId
          ? previousRows
              .map((r, i) => (r.superset_id === targetSupersetId ? i : -1))
              .filter((i) => i !== -1)
          : [index];

        // Si l'un des exercices du groupe a déjà atteint le max (6), on bloque
        const canIncrementAll = indicesToUpdate.every(
          (i) => (previousRows[i]?.series ?? 0) < MAX_SERIES
        );
        if (!canIncrementAll) {
          return previousRows;
        }

        const newRows = [...previousRows];

        indicesToUpdate.forEach((i) => {
          const currentRow = previousRows[i];
          if (!currentRow) return;

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

          newRows[i] = updatedRow;
          transferHiddenValues(currentRow, updatedRow);
        });

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

        const targetRow = previousRows[index];
        if (!targetRow) return previousRows;

        // Si la ligne appartient à un superset, propager à tout le groupe
        const targetSupersetId = targetRow.superset_id;
        const indicesToUpdate = targetSupersetId
          ? previousRows
              .map((r, i) => (r.superset_id === targetSupersetId ? i : -1))
              .filter((i) => i !== -1)
          : [index];

        // Si l'un des exercices du groupe est déjà au minimum (1), on bloque
        const canDecrementAll = indicesToUpdate.every(
          (i) => (previousRows[i]?.series ?? 0) > MIN_SERIES
        );
        if (!canDecrementAll) {
          return previousRows;
        }

        const newRows = [...previousRows];

        indicesToUpdate.forEach((i) => {
          const currentRow = previousRows[i];
          if (!currentRow) return;

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

          newRows[i] = updatedRow;
          transferHiddenValues(currentRow, updatedRow);
        });

        return newRows;
      });
    },
    [getHiddenValues, setRows, transferHiddenValues]
  );

  return { handleIncrementSeries, handleDecrementSeries };
}
