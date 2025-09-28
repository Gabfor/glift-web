import { Row } from "@/types/training";

export function useSeriesChange(rows: Row[], setRows: React.Dispatch<React.SetStateAction<Row[]>>) {
  const handleIncrementSeries = (index: number) => {
    const newRows = [...rows];
    const row = newRows[index];

    if (row.series < 6) {
      row.series += 1;
      row.repetitions.push("");            // Nouvelle case vide
      row.poids.push("");                  // Nouvelle case vide
      row.effort.push("parfait");          // Valeur par défaut
      setRows(newRows);
    }
  };

  const handleDecrementSeries = (index: number) => {
    const newRows = [...rows];
    const row = newRows[index];

    if (row.series > 1) {
      row.series -= 1;
      row.repetitions.pop();               // Retire la dernière case
      row.poids.pop();                     // Retire la dernière case
      row.effort.pop();                    // Retire la dernière case
      setRows(newRows);
    }
  };

  return { handleIncrementSeries, handleDecrementSeries };
}
