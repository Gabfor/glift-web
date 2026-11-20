"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

type Props = {
  columns: {
    name: string;
    label: string;
    visible: boolean;
  }[];
  onToggle: (name: string) => void;
  adminMode?: boolean;
};

export default function ColumnMenu({ columns, onToggle, adminMode }: Props) {
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);
  const pathname = usePathname();
  const isAdmin =
    adminMode ??
    (pathname?.startsWith("/admin") ||
      (typeof window !== "undefined" && window.location.hostname.startsWith("admin.")));

  return (
    <div className="absolute -right-4 top-full mt-3 w-[183px] bg-white rounded-[5px] shadow-glift-hover border border-[#ECE9F1] z-50 py-3 px-3 text-[16px] text-[#5D6494]">
      {/* Flèche en haut droite */}
      <div className="absolute top-[-9px] right-4 w-4 h-4 bg-white rotate-45 border-t border-l border-[#ECE9F1] rounded-[1px]" />

      {columns.map((col) => {
        const isHovered = hoveredCol === col.name;
        return (
          <button
            key={col.name}
            onClick={() => onToggle(col.name)}
            onMouseEnter={() => setHoveredCol(col.name)}
            onMouseLeave={() => setHoveredCol(null)}
            className="flex items-center gap-2 py-[6px] cursor-pointer w-full text-left"
          >
            <Image
              src={`/icons/${
                col.visible
                  ? isAdmin
                    ? isHovered
                      ? "admin_checkbox_checked_hover.svg"
                      : "admin_checkbox_checked.svg"
                    : isHovered
                      ? "checkbox_checked_hover.svg"
                      : "checkbox_checked.svg"
                  : isHovered
                    ? "checkbox_unchecked_hover.svg"
                    : "checkbox_unchecked.svg"
              }`}
              alt={col.visible ? "Coché" : "Non coché"}
              width={16}
              height={16}
              className="w-4 h-4"
            />
            <span className="font-semibold">Colonne {col.label}</span>
          </button>
        );
      })}
    </div>
  );
}
