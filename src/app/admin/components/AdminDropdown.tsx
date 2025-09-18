"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import ChevronIcon from "/public/icons/chevron.svg";
import ChevronGreyIcon from "/public/icons/chevron_grey.svg";

export type DropdownOption = {
  value: string;
  label: string;
};

export default function AdminDropdown({
  label,
  options,
  placeholder,
  selected,
  onSelect,
  className = "",
  buttonClassName = "",
  onOpenChange,
  success = false,
}: {
  label: string;
  options: DropdownOption[];
  placeholder: string;
  selected: string;
  onSelect: (value: string) => void;
  className?: string;
  buttonClassName?: string;
  onOpenChange?: (open: boolean) => void;
  success?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isPlaceholder = selected === "";
  const selectedLabel =
    isPlaceholder
      ? placeholder
      : options.find((o) => o.value === selected)?.label ?? placeholder;

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
        buttonRef.current?.blur();
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Définir bordure normale (hors succès)
  const defaultBorder =
    "border-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]";

  return (
    <div
      className={`flex flex-col relative transition-all duration-300 ${className}`}
      ref={menuRef}
    >
      <span className="text-[16px] text-[#3A416F] font-bold">{label}</span>

      <button
        type="button"
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        className={`
          h-[45px]
          border
          rounded-[5px]
          px-[15px]
          flex items-center
          justify-between
          text-[16px]
          font-semibold
          bg-white
          transition-colors duration-150
          focus:outline-none
          ${success ? "border-[#00D591]" : defaultBorder}
          ${buttonClassName}
        `}
      >
        <span
          className={`pr-[10px] ${
            isPlaceholder ? "text-[#D7D4DC]" : "text-[#3A416F]"
          }`}
        >
          {selectedLabel}
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
        <div className="absolute left-0 mt-[60px] w-full bg-white rounded-[5px] py-2 z-50 shadow-[0px_1px_9px_1px_rgba(0,0,0,0.12)] scrollable-dropdown max-h-[180px] overflow-y-auto">
          <div className="flex flex-col">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSelect(option.value);
                  setOpen(false);
                  buttonRef.current?.blur();
                }}
                className={`
                  text-left
                  text-[16px]
                  font-semibold
                  py-[8px]
                  px-3
                  mx-[8px]
                  rounded-[5px]
                  hover:bg-[#FAFAFF]
                  transition-colors duration-150
                  ${
                    selected === option.value
                      ? "text-[#7069FA]"
                      : "text-[#5D6494] hover:text-[#3A416F]"
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
