import { Row } from "@/types/training";

export function useCheckboxChange(
  rows: Row[],
  setRows: React.Dispatch<React.SetStateAction<Row[]>>,
  setSelectedRowIds: React.Dispatch<React.SetStateAction<string[]>>
) {
  return (id: string) => {
    const newRows = [...rows];
    const index = newRows.findIndex(r => r.id === id);
    if (index === -1) return;

    newRows[index].checked = !newRows[index].checked;

    setRows(newRows);
    setSelectedRowIds((prev) =>
      newRows[index].checked
        ? [...prev, id]
        : prev.filter((existingId) => existingId !== id)
    );
  };
}
