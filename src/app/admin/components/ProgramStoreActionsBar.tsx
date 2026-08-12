"use client";

import Image from "next/image";
import { useState } from "react";
import Tooltip from "@/components/Tooltip";

type Props = {
  selectedIds: Array<string | number>;
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
  const [plusIcon, setPlusIcon] = useState("/icons/admin_plus.svg");
  const [deleteIcon, setDeleteIcon] = useState("/icons/admin_delete.svg");
  const [duplicateIcon, setDuplicateIcon] = useState("/icons/admin_duplicate_program.svg");
  const [editIcon, setEditIcon] = useState("/icons/admin_edit_program_purple.svg");
  const [toggleHovered, setToggleHovered] = useState(false);

  const getToggleIcon = () => {
    if (selectedStatus === "ON") {
      return toggleHovered ? "/icons/admin_OFF_hover.svg" : "/icons/admin_OFF.svg";
    } else {
      return toggleHovered ? "/icons/admin_ON_hover.svg" : "/icons/admin_ON.svg";
    }
  };

  return (
    <div className="flex justify-end items-center gap-4 mb-4">
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
              onMouseEnter={() => setEditIcon("/icons/admin_edit_program_purple_hover.svg")}
              onMouseLeave={() => setEditIcon("/icons/admin_edit_program_purple.svg")}
            >
              <Image src={editIcon} alt="Edit" width={20} height={20} />
            </button>
          </Tooltip>

          <Tooltip content="Dupliquer">
            <button
              onClick={onDuplicate}
              onMouseEnter={() => setDuplicateIcon("/icons/admin_duplicate_program_hover.svg")}
              onMouseLeave={() => setDuplicateIcon("/icons/admin_duplicate_program.svg")}
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
            onMouseEnter={() => setDeleteIcon("/icons/admin_delete_hover.svg")}
            onMouseLeave={() => setDeleteIcon("/icons/admin_delete.svg")}
          >
            <Image src={deleteIcon} alt="Delete" width={20} height={20} />
          </button>
        </Tooltip>
      )}

      {selectedIds.length > 0 && <div className="w-px h-5 bg-[#ECE9F1]" />}

      <Tooltip content="Ajouter une carte">
        <button
          onClick={onAdd}
          onMouseEnter={() => setPlusIcon("/icons/admin_plus_hover.svg")}
          onMouseLeave={() => setPlusIcon("/icons/admin_plus.svg")}
        >
          <Image src={plusIcon} alt="Add" width={20} height={20} />
        </button>
      </Tooltip>
    </div>
  );
}
