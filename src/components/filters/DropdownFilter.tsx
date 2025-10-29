"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  className?: string;
};

export default function DropdownFilter({
  label,
  placeholder,
  options,
  selected,
  onSelect,
  className,
}: DropdownFilterProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const measurementRef = useRef<HTMLButtonElement>(null);
  const measurementTextRef = useRef<HTMLSpanElement>(null);
  const [calculatedWidth, setCalculatedWidth] = useState<number>();

  const sortedOptions = useMemo(
    () =>
      [...options].sort((a, b) =>
        a.label.localeCompare(b.label, "fr", { sensitivity: "base" })
      ),
    [options]
  );

  const isPlaceholder = selected === "";
  const selectedLabel = isPlaceholder
    ? placeholder
    : sortedOptions.find((option) => option.value === selected)?.label ?? placeholder;

  useLayoutEffect(() => {
    const updateWidth = () => {
      if (!measurementRef.current || !measurementTextRef.current) {
        return;
      }

      const labelsToMeasure = new Set<string>([
        placeholder,
        ...sortedOptions.map((option) => option.label),
      ]);

      if (!isPlaceholder) {
        labelsToMeasure.add(selectedLabel);
      }

      let maxWidth = 0;

      labelsToMeasure.forEach((label) => {
        measurementTextRef.current!.textContent = label;
        const { width } = measurementRef.current!.getBoundingClientRect();
        maxWidth = Math.max(maxWidth, Math.ceil(width));
      });

      setCalculatedWidth(maxWidth);

      // Reset to the currently displayed label so the hidden element reflects the UI state
      measurementTextRef.current.textContent = isPlaceholder ? placeholder : selectedLabel;
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);

    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, [isPlaceholder, placeholder, selectedLabel, sortedOptions]);

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
      className={`inline-flex flex-col gap-[5px] relative transition-all duration-300 ${className ?? ""}`}
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
        ref={measurementRef}
        tabIndex={-1}
        aria-hidden
        className="
          absolute
          opacity-0
          pointer-events-none
          -z-10
          h-10
          border
          border-[#D7D4DC]
          rounded-[5px]
          pl-3
          pr-[15px]
          py-2
          flex items-center
          justify-between
          gap-[10px]
          text-[16px]
          font-semibold
          whitespace-nowrap
        "
      >
        <span
          ref={measurementTextRef}
          className="whitespace-nowrap text-left flex-1"
        >
          {isPlaceholder ? placeholder : selectedLabel}
        </span>
        <span className="shrink-0" style={{ width: 8.73, height: 6.13 }} />
      </button>
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
          pl-3
          pr-[15px]
          py-2
          flex items-center
          justify-between
          gap-[10px]
          text-[16px]
          font-semibold
          bg-white
          hover:border-[#C2BFC6]
          transition
        `}
        style={calculatedWidth ? { width: calculatedWidth } : undefined}
      >
        <span
          className={`${
            isPlaceholder ? "text-[#D7D4DC]" : "text-[#3A416F]"
          } whitespace-nowrap text-left flex-1`}
        >
          {selectedLabel}
        </span>
        <Image
          src={isPlaceholder ? ChevronGreyIcon : ChevronIcon}
          alt=""
          width={8.73}
          height={6.13}
          className="shrink-0"
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
            {sortedOptions.map((option) => (
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
