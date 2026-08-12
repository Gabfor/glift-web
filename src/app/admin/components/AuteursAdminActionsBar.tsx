"use client";

import Image from "next/image";
import { useState } from "react";
import Tooltip from "@/components/Tooltip";

type Props = {
    selectedIds: string[];
    selectedStatus: boolean | null;
    onDelete: () => void;
    onEdit?: () => void;
    onToggleStatus?: () => void;
    onAdd: () => void;
};

export default function AuteursAdminActionsBar({
    selectedIds,
    selectedStatus,
    onDelete,
    onEdit,
    onToggleStatus,
    onAdd,
}: Props) {
    const [plusIcon, setPlusIcon] = useState("/icons/admin_plus.svg");
    const [deleteIcon, setDeleteIcon] = useState("/icons/admin_delete.svg");
    const [editIcon, setEditIcon] = useState("/icons/admin_edit_program_purple.svg");
    const [toggleHovered, setToggleHovered] = useState(false);

    const getToggleIcon = () => {
        if (selectedStatus === true) {
            return toggleHovered ? "/icons/admin_OFF_hover.svg" : "/icons/admin_OFF.svg";
        } else {
            return toggleHovered ? "/icons/admin_ON_hover.svg" : "/icons/admin_ON.svg";
        }
    };

    return (
        <div className="flex justify-end items-center gap-4 relative z-10 mb-4">
            {selectedIds.length === 1 && onToggleStatus && (
                <Tooltip content={selectedStatus === true ? "Désactiver" : "Activer"} delay={0}>
                    <button
                        onClick={onToggleStatus}
                        onMouseEnter={() => setToggleHovered(true)}
                        onMouseLeave={() => setToggleHovered(false)}
                        className="mr-2"
                    >
                        <Image src={getToggleIcon()} alt="Toggle Status" width={20} height={20} />
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

            <Tooltip content="Créer un auteur" delay={0}>
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
