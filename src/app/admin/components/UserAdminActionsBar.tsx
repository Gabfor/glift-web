"use client";

import Image from "next/image";
import { useState } from "react";

import Tooltip from "@/components/Tooltip";
import { cn } from "@/lib/utils";

type Props = {
  selectedIds: string[];
  onDelete: () => void;
  onToggleStatus: () => void;
  onEdit: () => void;
  className?: string;
};

export default function UserAdminActionsBar({
  selectedIds,
  onDelete,
  onToggleStatus,
  onEdit,
  className,
}: Props) {
  const [deleteIcon, setDeleteIcon] = useState("/icons/delete.svg");
  const [statusIcon, setStatusIcon] = useState("/icons/statut.svg");
  const [editIcon, setEditIcon] = useState("/icons/edit_program_purple.svg");

  const hasSelection = selectedIds.length > 0;
  const hasSingleSelection = selectedIds.length === 1;

  return (
    <div className={cn("flex items-center justify-end gap-4", className)}>
      {hasSingleSelection && (
        <Tooltip content="Modifier" delay={0}>
          <button
            onClick={onEdit}
            onMouseEnter={() => setEditIcon("/icons/edit_program_purple_hover.svg")}
            onMouseLeave={() => setEditIcon("/icons/edit_program_purple.svg")}
            aria-label="Modifier l'utilisateur"
          >
            <Image src={editIcon} alt="Modifier" width={20} height={20} />
          </button>
        </Tooltip>
      )}

      {hasSingleSelection && (
        <Tooltip content="Mettre à jour le statut" delay={0}>
          <button
            onClick={onToggleStatus}
            onMouseEnter={() => setStatusIcon("/icons/statut_hover.svg")}
            onMouseLeave={() => setStatusIcon("/icons/statut.svg")}
            aria-label="Mettre à jour le statut"
          >
            <Image src={statusIcon} alt="Modifier le statut" width={20} height={20} />
          </button>
        </Tooltip>
      )}

      {hasSelection && (
        <Tooltip content="Supprimer" delay={0}>
          <button
            onClick={onDelete}
            onMouseEnter={() => setDeleteIcon("/icons/delete_hover.svg")}
            onMouseLeave={() => setDeleteIcon("/icons/delete.svg")}
            aria-label="Supprimer l'utilisateur"
          >
            <Image src={deleteIcon} alt="Supprimer" width={20} height={20} />
          </button>
        </Tooltip>
      )}
    </div>
  );
}
