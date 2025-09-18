import { Row } from "@/types/training";

export function useIconHover(rows: Row[], setRows: React.Dispatch<React.SetStateAction<Row[]>>) {
  return (index: number, value: boolean) => {
    const newRows = [...rows];
    newRows[index].iconHovered = value;
    setRows(newRows);
  };
}
