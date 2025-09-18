import { Row } from "@/types/training";

export function useSuperset(
  rows: Row[],
  setRows: React.Dispatch<React.SetStateAction<Row[]>>,
  selectedRowIds: string[],
  setSelectedRowIds: React.Dispatch<React.SetStateAction<string[]>>,
  setHoveredSuperset: React.Dispatch<React.SetStateAction<boolean>>
) {
  const handleGroupSuperset = () => {
    if (selectedRowIds.length < 2) return;

    const selectedIndexes = selectedRowIds
      .map(id => rows.findIndex(r => r.id === id))
      .filter(index => index !== -1)
      .sort((a, b) => a - b);

    const allSameSuperset = selectedIndexes.every(
      (i) =>
        rows[i].superset_id &&
        rows[i].superset_id === rows[selectedIndexes[0]].superset_id
    );

    const newRows = [...rows];

    if (allSameSuperset) {
      selectedIndexes.forEach((i) => {
        newRows[i].superset_id = null;
      });
    } else {
      const newId = crypto.randomUUID();
      selectedIndexes.forEach((i) => {
        newRows[i].superset_id = newId;
      });
    }

    selectedIndexes.forEach((i) => {
      newRows[i].checked = false;
    });

    setRows(newRows);
    setSelectedRowIds([]);
    setHoveredSuperset(false);
  };

  return { handleGroupSuperset };
}
