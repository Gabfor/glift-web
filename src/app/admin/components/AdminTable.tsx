"use client";

import React, { useState } from "react";
import Image from "next/image";
import ChevronIcon from "/public/icons/chevron.svg";
import ChevronGreyIcon from "/public/icons/chevron_grey.svg";

export type AdminTableColumn<T> = {
  key: string;
  label: string | React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  className?: string;
  render: (item: T) => React.ReactNode;
};

export type AdminTableProps<T> = {
  columns: AdminTableColumn<T>[];
  data: T[];
  selectedIds: string[];
  onToggleSelectAll: () => void;
  onToggleSelectOne: (id: string) => void;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (columnKey: string) => void;
  getItemId: (item: T) => string;
  emptyMessage?: string;
  className?: string;
};

export default function AdminTable<T>({
  columns,
  data,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectOne,
  sortBy,
  sortDirection = "asc",
  onSort,
  getItemId,
  emptyMessage = "Aucun élément trouvé.",
  className = "",
}: AdminTableProps<T>) {
  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  return (
    <div
      className={`overflow-x-auto rounded-[8px] bg-white shadow-glift ${className}`}
    >
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-[#ECE9F1] h-[60px]">
          <tr>
            {/* Checkbox Select All */}
            <th className="px-4 w-[48px]">
              <button
                type="button"
                onClick={onToggleSelectAll}
                className="flex items-center justify-center h-[60px] shrink-0 min-w-[15px]"
                aria-label="Tout sélectionner"
              >
                <Image
                  src={
                    isAllSelected
                      ? "/icons/admin_checkbox_checked.svg"
                      : "/icons/checkbox_unchecked.svg"
                  }
                  alt="Checkbox"
                  width={15}
                  height={15}
                />
              </button>
            </th>

            {/* Header Columns */}
            {columns.map((col) => {
              const isSortActive = sortBy === col.key;
              const isAscending = sortDirection === "asc";
              const isSortable = col.sortable !== false && !!onSort;
              const icon = isSortActive ? ChevronIcon : ChevronGreyIcon;

              const justifyClass =
                col.align === "center"
                  ? "justify-center"
                  : col.align === "right"
                    ? "justify-end"
                    : "";

              return (
                <th
                  key={col.key}
                  className={`px-4 font-semibold text-[#3A416F] select-none ${
                    isSortable ? "cursor-pointer" : ""
                  } ${col.width || ""} ${col.className || ""}`}
                  onClick={() => {
                    if (isSortable) onSort(col.key);
                  }}
                >
                  <div
                    className={`flex items-center gap-1 whitespace-nowrap ${justifyClass}`}
                  >
                    {col.label}
                    {isSortable && (
                      <span className="relative w-[8px] h-[8px] ml-[3px] mt-[3px] shrink-0">
                        <Image
                          src={icon}
                          alt=""
                          fill
                          style={{
                            objectFit: "contain",
                            transform:
                              isSortActive && isAscending
                                ? "rotate(-180deg)"
                                : "rotate(0deg)",
                            transition: "transform 0.2s ease",
                          }}
                        />
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="text-center py-12 text-[#5D6494] font-medium"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => {
              const id = getItemId(item);
              const isSelected = selectedIds.includes(id);

              return (
                <tr key={id} className="border-b border-[#ECE9F1] h-[60px]">
                  {/* Row Checkbox */}
                  <td className="px-4 align-middle">
                    <button
                      type="button"
                      onClick={() => onToggleSelectOne(id)}
                      className="flex items-center justify-center h-[60px] shrink-0 min-w-[15px]"
                      aria-label="Sélectionner la ligne"
                    >
                      <Image
                        src={
                          isSelected
                            ? "/icons/admin_checkbox_checked.svg"
                            : "/icons/checkbox_unchecked.svg"
                        }
                        alt="checkbox"
                        width={15}
                        height={15}
                      />
                    </button>
                  </td>

                  {/* Row Cells */}
                  {columns.map((col) => {
                    const alignClass =
                      col.align === "center"
                        ? "text-center"
                        : col.align === "right"
                          ? "text-right"
                          : "text-left";

                    return (
                      <td
                        key={col.key}
                        className={`px-4 align-middle font-semibold text-[#5D6494] text-[14px] ${alignClass} ${
                          col.width || ""
                        } ${col.className || ""}`}
                      >
                        {col.render(item)}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Standard ON/OFF Status Badge for Admin Tables
 */
export function AdminStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full uppercase ${
        isActive ? "bg-[#DCFAF1] text-[#00D591]" : "bg-[#FEF7D0] text-[#DCBC04]"
      }`}
      style={{
        width: "40px",
        height: "20px",
        fontSize: "10px",
        fontWeight: 600,
      }}
    >
      {isActive ? "ON" : "OFF"}
    </span>
  );
}

/**
 * Standard Default/Featured Star Toggle for Admin Tables
 */
export function AdminStarToggle({
  isFeatured,
  onToggle,
  title,
}: {
  isFeatured: boolean;
  onToggle: () => void;
  title?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="flex items-center justify-center">
      <button
        type="button"
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative w-[20px] h-[20px] flex items-center justify-center transition-opacity"
        title={title}
      >
        <Image
          src={
            hovered && !isFeatured
              ? "/icons/coeur_hover.svg"
              : isFeatured
                ? "/icons/coeur_red.svg"
                : "/icons/coeur_grey.svg"
          }
          alt={isFeatured ? "Actif" : "Inactif"}
          width={20}
          height={20}
          className="object-contain"
        />
      </button>
    </div>
  );
}

