"use client";

import Image from "next/image";
import { useState } from "react";
import Tooltip from "@/components/Tooltip";

type Props = {
    selectedIds: string[];
    onDelete: () => void;
    onAdd: () => void;
};

export default function HelpAdminActionsBar({
    selectedIds,
    onDelete,
    onAdd,
}: Props) {
    const [plusIcon, setPlusIcon] = useState("/icons/plus.svg");
    const [deleteIcon, setDeleteIcon] = useState("/icons/delete.svg");

    return (
        <div className="flex justify-end items-center mb-4 gap-4 relative z-10 w-full">
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
