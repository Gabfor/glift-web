"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import ChevronIcon from "/public/icons/chevron.svg";
import ChevronGreyIcon from "/public/icons/chevron_grey.svg";

type FilterOption = {
  value: string;
  label: string;
  iconSrc?: string;
};

type DropdownFilterProps = {
  label: string;
  placeholder: string;
  options: FilterOption[];
  selected: string;
  onSelect: (value: string) => void;
  className?: string;
  disabled?: boolean;
  sortOptions?: boolean;
  maxWidth?: number;
};

export default function DropdownFilter({
  label,
  placeholder,
  options,
  selected,
  onSelect,
  className,
  disabled = false,
  sortOptions = true,
  maxWidth,
}: DropdownFilterProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const measurementRef = useRef<HTMLButtonElement>(null);
  const measurementTextRef = useRef<HTMLSpanElement>(null);
  const [calculatedWidth, setCalculatedWidth] = useState<number>();

  const preparedOptions = useMemo(() => {
    const clonedOptions = [...options];

    if (!sortOptions) {
      return clonedOptions;
    }

    return clonedOptions.sort((a, b) =>
      a.label.localeCompare(b.label, "fr", { sensitivity: "base" })
    );
  }, [options, sortOptions]);

  const isPlaceholder = selected === "";
  const selectedOption = isPlaceholder
    ? undefined
    : preparedOptions.find((option) => option.value === selected);
  const selectedLabel = isPlaceholder
    ? placeholder
    : selectedOption?.label ?? placeholder;
  const hasIcons = useMemo(
    () => preparedOptions.some((option) => option.iconSrc),
    [preparedOptions]
  );

  useLayoutEffect(() => {
    const updateWidth = () => {
      if (!measurementRef.current || !measurementTextRef.current) {
        return;
      }

      const labelsToMeasure = new Set<string>([
        placeholder,
        ...preparedOptions.map((option) => option.label),
      ]);

      if (!isPlaceholder) {
        labelsToMeasure.add(selectedLabel);
      }

      let maxMeasuredWidth = 0;

      labelsToMeasure.forEach((label) => {
        measurementTextRef.current!.textContent = label;
        const { width } = measurementRef.current!.getBoundingClientRect();
        maxMeasuredWidth = Math.max(maxMeasuredWidth, Math.ceil(width));
      });

      const iconSpacing = hasIcons ? 30 : 0;
      const widthLimit =
        typeof maxWidth === "number" ? maxWidth : Number.POSITIVE_INFINITY;
      const widthWithIcons = maxMeasuredWidth + iconSpacing;
      const finalWidth = Math.max(0, Math.min(widthWithIcons, widthLimit));
      setCalculatedWidth(finalWidth);

      // Reset to the currently displayed label so the hidden element reflects the UI state
      measurementTextRef.current.textContent = isPlaceholder ? placeholder : selectedLabel;
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);

    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, [
    hasIcons,
    isPlaceholder,
    maxWidth,
    placeholder,
    preparedOptions,
    selectedLabel,
  ]);

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

  useEffect(() => {
    if (disabled && open) {
      setOpen(false);
    }
  }, [disabled, open]);

  const buttonStateClasses = (() => {
    if (disabled) {
      return "border-[#D7D4DC] bg-[#F2F1F6] cursor-not-allowed";
    }

    if (open) {
      return "border-[#A1A5FD] focus:border-transparent focus:outline-none ring-2 ring-[#A1A5FD] bg-white";
    }

    return "border-[#D7D4DC] bg-white hover:border-[#C2BFC6]";
  })();

  const labelColorClass = disabled
    ? "text-[#D7D4DC]"
    : isPlaceholder
      ? "text-[#D7D4DC]"
      : "text-[#3A416F]";

  const chevronIcon = disabled || isPlaceholder ? ChevronGreyIcon : ChevronIcon;

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
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
        disabled={disabled}
        className={`
          h-10
          border
          ${buttonStateClasses}
          rounded-[5px]
          pl-3
          pr-[15px]
          py-2
          flex items-center
          justify-between
          gap-[10px]
          text-[16px]
          font-semibold
          transition
        `}
        style={{
          ...(calculatedWidth
            ? { minWidth: calculatedWidth }
            : undefined),
          ...(typeof maxWidth === "number" ? { maxWidth } : undefined),
        }}
      >
        <span
          className={`${labelColorClass} flex min-w-0 items-center text-left flex-1`}
        >
          <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {selectedLabel}
          </span>
          {selectedOption?.iconSrc && (
            <Image
              src={selectedOption.iconSrc}
              alt=""
              width={20}
              height={15}
              className="ml-[10px] shrink-0"
            />
          )}
        </span>
        <Image
          src={chevronIcon}
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
            {preparedOptions.map((option) => (
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
                <span className="flex min-w-0 items-center">
                  <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {option.label}
                  </span>
                  {option.iconSrc && (
                    <Image
                      src={option.iconSrc}
                      alt=""
                      width={20}
                      height={15}
                      className="ml-[10px] shrink-0"
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export type { FilterOption };
