"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import ChevronIcon from "/public/icons/chevron.svg";
import ChevronGreyIcon from "/public/icons/chevron_grey.svg";
import CheckboxChecked from "/public/icons/checkbox_checked.svg";
import CheckboxUnchecked from "/public/icons/checkbox_unchecked.svg";

export type MultiDropdownOption = {
  value: string;
  label: string;
};

export default function AdminMultiSelectDropdown({
  label,
  options,
  placeholder,
  selected,
  onChange,
  className = "",
}: {
  label: string;
  options: MultiDropdownOption[];
  placeholder: string;
  selected: string[]; // 👈 tu peux garder ça si l’appelant respecte bien le contrat
  onChange: (values: string[]) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // ✅ sécurité : toujours forcer selected en tableau
  const selectedArray: string[] = Array.isArray(selected)
    ? selected
    : typeof selected === "string"
    ? (() => {
        try {
          const parsed = JSON.parse(selected);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })()
    : [];

  const isPlaceholder = selectedArray.length === 0;

  const selectedLabels = options
    .filter((o) => selectedArray.includes(o.value))
    .map((o) => o.label)
    .join(", ");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
        buttonRef.current?.blur();
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const toggleOption = (value: string) => {
    if (selectedArray.includes(value)) {
      onChange(selectedArray.filter((v) => v !== value));
    } else {
      onChange([...selectedArray, value]);
    }
  };

  return (
    <div className={`flex flex-col relative transition-all duration-300 ${className}`} ref={menuRef}>
      <span className="text-[16px] text-[#3A416F] font-bold">{label}</span>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className={`
          h-[45px] w-full
          border
          ${
            open
              ? "border-[#A1A5FD] focus:border-transparent focus:outline-none ring-2 ring-[#A1A5FD]"
              : "border-[#D7D4DC]"
          }
          rounded-[5px]
          px-[15px]
          flex items-center
          justify-between
          text-[16px]
          font-semibold
          bg-white
          hover:border-[#C2BFC6]
          transition
        `}
      >
        <span
          className={`pr-[10px] text-left flex-1 truncate ${
            isPlaceholder ? "text-[#D7D4DC]" : "text-[#3A416F]"
          }`}
        >
          {isPlaceholder ? placeholder : selectedLabels}
        </span>
        <Image
          src={isPlaceholder ? ChevronGreyIcon : ChevronIcon}
          alt=""
          width={9}
          height={6}
          style={{
            transform: open ? "rotate(-180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            transformOrigin: "center 45%",
          }}
        />
      </button>

      {open && (
        <div
          className="
            absolute left-0 mt-[80px]
            w-full
            bg-white
            rounded-[5px]
            py-2
            z-50
            shadow-[0px_1px_9px_1px_rgba(0,0,0,0.12)]
            scrollable-dropdown
            max-h-[180px]
            overflow-y-auto
          "
        >
          <div className="flex flex-col">
            {options.map((option) => {
              const isChecked = selectedArray.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => toggleOption(option.value)}
                  className="
                    flex items-center gap-2
                    text-[16px] font-semibold
                    py-[8px] px-3 mx-[8px]
                    rounded-[5px]
                    hover:bg-[#FAFAFF]
                    text-[#5D6494] hover:text-[#3A416F]
                    transition-colors duration-150 text-left
                  "
                >
                  <Image
                    src={isChecked ? CheckboxChecked : CheckboxUnchecked}
                    alt={isChecked ? "Coché" : "Non coché"}
                    width={16}
                    height={16}
                  />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
