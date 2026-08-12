"use client";

import Image from "next/image";
import { useState } from "react";
import Tooltip from "@/components/Tooltip";

type Props = {
  selectedIds: string[];
  onDelete: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onAdd: () => void;
};

export default function ProgramAdminActionsBar({
  selectedIds,
  onDelete,
  onDuplicate,
  onEdit,
  onAdd,
}: Props) {
  const [plusIcon, setPlusIcon] = useState("/icons/admin_plus.svg");
  const [deleteIcon, setDeleteIcon] = useState("/icons/admin_delete.svg");
  const [duplicateIcon, setDuplicateIcon] = useState("/icons/admin_duplicate_program.svg");
  const [editIcon, setEditIcon] = useState("/icons/admin_edit_program_purple.svg");

  return (
    <div className="flex justify-end items-center mb-4 gap-4">
      {selectedIds.length === 1 && (
        <>
          <Tooltip content="Éditer" delay={0}>
            <button
              onClick={onEdit}
              onMouseEnter={() => setEditIcon("/icons/admin_edit_program_purple_hover.svg")}
              onMouseLeave={() => setEditIcon("/icons/admin_edit_program_purple.svg")}
            >
              <Image src={editIcon} alt="Edit" width={20} height={20} />
            </button>
          </Tooltip>

          <Tooltip content="Dupliquer" delay={0}>
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
        <Tooltip content="Supprimer" delay={0}>
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

      <Tooltip content="Ajouter un programme" delay={0}>
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
