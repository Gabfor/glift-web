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
    const [plusIcon, setPlusIcon] = useState("/icons/plus.svg");
    const [deleteIcon, setDeleteIcon] = useState("/icons/delete.svg");
    const [editIcon, setEditIcon] = useState("/icons/edit_program_purple.svg");
    const [resetIcon, setResetIcon] = useState("/icons/erase.svg");

    return (
        <div className="flex justify-end items-center mb-4 gap-4 relative z-10 w-full">
            {selectedIds.length > 0 && onReset && (
                <Tooltip content="Remettre à zéro" delay={0}>
                    <button
                        onClick={onReset}
                        onMouseEnter={() => setResetIcon("/icons/erase_hover.svg")}
                        onMouseLeave={() => setResetIcon("/icons/erase.svg")}
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
                        onMouseEnter={() => setEditIcon("/icons/edit_program_purple_hover.svg")}
                        onMouseLeave={() => setEditIcon("/icons/edit_program_purple.svg")}
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
                        onMouseEnter={() => setDeleteIcon("/icons/delete_hover.svg")}
                        onMouseLeave={() => setDeleteIcon("/icons/delete.svg")}
                    >
                        <Image src={deleteIcon} alt="Delete" width={20} height={20} />
                    </button>
                </Tooltip>
            )}

            {selectedIds.length > 0 && <div className="w-px h-5 bg-[#ECE9F1]" />}

            <Tooltip content="Créer une aide" delay={0}>
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
