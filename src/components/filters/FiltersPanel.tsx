"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import DropdownFilter, {
  type FilterOption,
} from "@/components/filters/DropdownFilter";
import TriIcon from "/public/icons/tri.svg";
import ChevronIcon from "/public/icons/chevron.svg";
import FiltresRedIcon from "/public/icons/filtres_red.svg";
import FiltresGreenIcon from "/public/icons/filtres_green.svg";

export type SortOption = {
  value: string;
  label: string;
};

export type FilterGroup = {
  label: string;
  placeholder: string;
  options: FilterOption[];
  allOptions?: FilterOption[];
};

type FiltersPanelProps = {
  sortBy: string;
  sortOptions: SortOption[];
  onSortChange: (sortBy: string) => void;
  filters: FilterGroup[];
  selectedFilters: string[];
  onFilterChange: (index: number, value: string) => void;
};

export default function FiltersPanel({
  sortBy,
  sortOptions,
  onSortChange,
  filters,
  selectedFilters,
  onFilterChange,
}: FiltersPanelProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [openSortMenu, setOpenSortMenu] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!openSortMenu) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpenSortMenu(false);
        buttonRef.current?.blur();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openSortMenu]);

  const selectedSortLabel =
    sortOptions.find((option) => option.value === sortBy)?.label ?? "";

  const anyFilterActive = filters.some((_, index) => {
    const value = selectedFilters[index] ?? "";
    return value !== "";
  });

  const toggleSortMenu = () => {
    setOpenSortMenu((prev) => !prev);
    if (openSortMenu) {
      buttonRef.current?.blur();
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center flex-wrap gap-4 mb-4">
        <div className="relative inline-block" ref={menuRef}>
          <button
            ref={buttonRef}
            onClick={toggleSortMenu}
            className={`
              h-10
              min-w-[153px]
              border
              ${openSortMenu
                ? "border-[#A1A5FD] focus:border-transparent focus:outline-none ring-2 ring-[#A1A5FD]"
                : "border-[#D7D4DC]"
              }
              rounded-[5px]
              px-3
              py-2
              flex items-center
              justify-between
              text-[16px]
              font-semibold
              text-[#3A416F]
              bg-white
              hover:border-[#C2BFC6]
              transition
            `}
          >
            <div className="flex items-center gap-2 pr-[10px]">
              <Image src={TriIcon} alt="" width={16} height={14} />
              <span>{selectedSortLabel}</span>
            </div>
            <Image
              src={ChevronIcon}
              alt=""
              width={8.73}
              height={6.13}
              style={{
                transform: openSortMenu ? "rotate(-180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
                transformOrigin: "center 45%",
              }}
            />
          </button>

          {openSortMenu && (
            <div
              className="
                absolute left-0 mt-2 min-w-[153px] bg-white rounded-[5px] py-2 z-50 shadow-[0px_1px_9px_1px_rgba(0,0,0,0.12)]
              "
            >
              <div className="flex flex-col">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSortChange(option.value);
                      setOpenSortMenu(false);
                      buttonRef.current?.blur();
                    }}
                    className={`text-left text-[16px] font-semibold py-[8px] px-3 mx-[8px] rounded-[5px] hover:bg-[#FAFAFF] transition-colors duration-150 ${option.value === sortBy
                      ? "text-[#7069FA]"
                      : "text-[#5D6494] hover:text-[#3A416F]"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {filters.length > 0 && (
          <button
            onClick={() => setShowFilters((current) => !current)}
            className="h-10 min-w-[189px] border border-[#D7D4DC] rounded-[5px] px-3 flex items-center text-[16px] font-semibold text-[#3A416F] bg-white hover:border-[#C2BFC6] transition"
          >
            <div className="flex items-center gap-2">
              <Image
                src={anyFilterActive ? FiltresGreenIcon : FiltresRedIcon}
                alt=""
                width={16}
                height={16}
              />
              <span>{showFilters ? "Masquer les filtres" : "Afficher les filtres"}</span>
            </div>
          </button>
        )}
      </div>

      {showFilters && filters.length > 0 && (
        <div className="flex flex-wrap gap-4 transition-all duration-300">
          {filters.map((filter, index) => (
            <DropdownFilter
              key={`${filter.label}-${index}`}
              label={filter.label}
              placeholder={filter.placeholder}
              options={filter.options}
              allOptions={filter.allOptions}
              selected={selectedFilters[index] ?? ""}
              onSelect={(value) => onFilterChange(index, value)}
              disabled={filter.options.length === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
