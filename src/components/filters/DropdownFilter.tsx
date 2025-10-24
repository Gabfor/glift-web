"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import ChevronIcon from "/public/icons/chevron.svg";
import ChevronGreyIcon from "/public/icons/chevron_grey.svg";

type FilterOption = {
  value: string;
  label: string;
};

type DropdownFilterProps = {
  label: string;
  placeholder: string;
  options: FilterOption[];
  selected: string;
  onSelect: (value: string) => void;
  width?: string;
  className?: string;
};

export default function DropdownFilter({
  label,
  placeholder,
  options,
  selected,
  onSelect,
  width,
  className,
}: DropdownFilterProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isPlaceholder = selected === "";
  const selectedLabel = isPlaceholder
    ? placeholder
    : options.find((option) => option.value === selected)?.label ?? placeholder;

  const computedWidth = useMemo(() => {
    if (width) {
      return width;
    }

    const labels = [placeholder, ...options.map((option) => option.label)];
    const fallbackWidth = (() => {
      const maxChars = labels.reduce(
        (max, label) => Math.max(max, label.length),
        0,
      );
      const averageCharWidth = 9; // Approximation for 16px semibold text
      const extraPadding = 56; // Account for button padding and chevron icon

      return `${Math.ceil(maxChars * averageCharWidth + extraPadding)}px`;
    })();

    if (typeof window === "undefined") {
      return fallbackWidth;
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      return fallbackWidth;
    }

    context.font = "600 16px Inter, sans-serif";
    const longestTextWidth = labels.reduce((maxWidth, label) => {
      const measurement = context.measureText(label);
      return Math.max(maxWidth, measurement.width);
    }, 0);

    const extraPadding = 56;

    return `${Math.ceil(longestTextWidth + extraPadding)}px`;
  }, [options, placeholder, width]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setOpen(false);
        buttonRef.current?.blur();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div
      className={`flex flex-col gap-[5px] relative transition-all duration-300 ${className ?? ""}`}
      style={{ width: computedWidth }}
      ref={menuRef}
    >
      <div className="flex items-center justify-between">
        <span className="text-[16px] text-[#3A416F] font-bold">{label}</span>
        {!isPlaceholder && (
          <button
            type="button"
            onClick={() => onSelect("")}
            className="text-[12px] mt-[3px] text-[#7069FA] font-semibold hover:text-[#6660E4]"
          >
            Effacer
          </button>
        )}
      </div>
      <button
        type="button"
        ref={buttonRef}
        onClick={() => setOpen((current) => !current)}
        className={`
          h-10
          border
          ${
            open
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
          bg-white
          hover:border-[#C2BFC6]
          transition
        `}
      >
        <span
          className={`pr-[10px] ${isPlaceholder ? "text-[#D7D4DC]" : "text-[#3A416F]"}`}
        >
          {selectedLabel}
        </span>
        <Image
          src={isPlaceholder ? ChevronGreyIcon : ChevronIcon}
          alt=""
          width={8.73}
          height={6.13}
          style={{
            transform: open ? "rotate(-180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            transformOrigin: "center 45%",
          }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 mt-20 w-full bg-white rounded-[5px] py-2 z-50 shadow-[0px_1px_9px_1px_rgba(0,0,0,0.12)]"
        >
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
                className={`text-left text-[16px] font-semibold py-[8px] px-3 mx-[8px] rounded-[5px] hover:bg-[#FAFAFF] transition-colors duration-150 ${
                  selected === option.value
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
  );
}

export type { FilterOption };
