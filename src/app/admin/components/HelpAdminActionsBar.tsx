"use client";

import Image from "next/image";
import { useState } from "react";
import Tooltip from "@/components/Tooltip";

type Props = {
    selectedIds: string[];
    onDelete: () => void;
    onEdit?: () => void;
    onReset?: () => void;
    onAdd: () => void;
};

export default function HelpAdminActionsBar({
    selectedIds,
    onDelete,
    onEdit,
    onReset,
    onAdd,
}: Props) {
    const [plusIcon, setPlusIcon] = useState("/icons/admin_plus.svg");
    const [deleteIcon, setDeleteIcon] = useState("/icons/admin_delete.svg");
    const [editIcon, setEditIcon] = useState("/icons/admin_edit_program_purple.svg");
    const [resetIcon, setResetIcon] = useState("/icons/admin_erase.svg");

    return (
        <div className="flex justify-end items-center mb-4 gap-4 relative z-10 w-full">
            {selectedIds.length > 0 && onReset && (
                <Tooltip content="Remettre à zéro" delay={0}>
                    <button
                        onClick={onReset}
                        onMouseEnter={() => setResetIcon("/icons/admin_erase_hover.svg")}
                        onMouseLeave={() => setResetIcon("/icons/admin_erase.svg")}
                        className="mr-2"
                    >
                        <Image src={resetIcon} alt="Reset" width={20} height={20} />
                    </button>
                </Tooltip>
            )}

            {selectedIds.length === 1 && onEdit && (
                <Tooltip content="Modifier" delay={0}>
                    <button
                        onClick={onEdit}
                        onMouseEnter={() => setEditIcon("/icons/admin_edit_program_purple_hover.svg")}
                        onMouseLeave={() => setEditIcon("/icons/admin_edit_program_purple.svg")}
                        className="mr-2"
                    >
                        <Image src={editIcon} alt="Edit" width={20} height={20} />
                    </button>
                </Tooltip>
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

            <Tooltip content="Créer une aide" delay={0}>
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
