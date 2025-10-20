"use client";

import Image from "next/image";
import { useState } from "react";
import Tooltip from "@/components/Tooltip";

type Props = {
  selectedIds: number[];
  selectedStatus: string | null;
  onDelete: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onAdd: () => void;
};

export default function ProgramStoreActionsBar({
  selectedIds,
  selectedStatus,
  onDelete,
  onDuplicate,
  onEdit,
  onToggleStatus,
  onAdd,
}: Props) {
  const [plusIcon, setPlusIcon] = useState("/icons/plus.svg");
  const [deleteIcon, setDeleteIcon] = useState("/icons/delete.svg");
  const [duplicateIcon, setDuplicateIcon] = useState("/icons/duplicate_program.svg");
  const [editIcon, setEditIcon] = useState("/icons/edit_program_purple.svg");
  const [toggleHovered, setToggleHovered] = useState(false);

  const getToggleIcon = () => {
    if (selectedStatus === "ON") {
      return toggleHovered ? "/icons/OFF_hover.svg" : "/icons/OFF.svg";
    } else {
      return toggleHovered ? "/icons/ON_hover.svg" : "/icons/ON.svg";
    }
  };

  return (
    <div className="flex justify-end items-center gap-4 mb-4 min-h-[40px]">
      {selectedIds.length === 1 && (
        <>
          <Tooltip content={selectedStatus === "ON" ? "Désactiver" : "Activer"}>
            <button
              onClick={onToggleStatus}
              onMouseEnter={() => setToggleHovered(true)}
              onMouseLeave={() => setToggleHovered(false)}
            >
              <Image src={getToggleIcon()} alt="Toggle Status" width={20} height={20} />
            </button>
          </Tooltip>

          <Tooltip content="Éditer">
            <button
              onClick={onEdit}
              onMouseEnter={() => setEditIcon("/icons/edit_program_purple_hover.svg")}
              onMouseLeave={() => setEditIcon("/icons/edit_program_purple.svg")}
            >
              <Image src={editIcon} alt="Edit" width={20} height={20} />
            </button>
          </Tooltip>

          <Tooltip content="Dupliquer">
            <button
              onClick={onDuplicate}
              onMouseEnter={() => setDuplicateIcon("/icons/duplicate_program_hover.svg")}
              onMouseLeave={() => setDuplicateIcon("/icons/duplicate_program.svg")}
            >
              <Image src={duplicateIcon} alt="Duplicate" width={20} height={20} />
            </button>
          </Tooltip>
        </>
      )}

      {selectedIds.length > 0 && (
        <Tooltip content="Supprimer">
          <button
            onClick={onDelete}
            onMouseEnter={() => setDeleteIcon("/icons/delete_hover.svg")}
            onMouseLeave={() => setDeleteIcon("/icons/delete.svg")}
          >
            <Image src={deleteIcon} alt="Delete" width={20} height={20} />
          </button>
        </Tooltip>
      )}

      {selectedIds.length > 0 && <div className="w-px h-5 bg-[#ECE9F1]" />}

      <Tooltip content="Ajouter une carte">
        <button
          onClick={onAdd}
          onMouseEnter={() => setPlusIcon("/icons/plus_hover.svg")}
          onMouseLeave={() => setPlusIcon("/icons/plus.svg")}
        >
          <Image src={plusIcon} alt="Add" width={20} height={20} />
        </button>
      </Tooltip>
    </div>
  );
}
