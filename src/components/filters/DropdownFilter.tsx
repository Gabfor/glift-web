"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import ChevronIcon from "/public/icons/chevron.svg";
import ChevronGreyIcon from "/public/icons/chevron_grey.svg";
import CheckboxCheckedIcon from "/public/icons/checkbox_checked.svg";
import CheckboxUncheckedIcon from "/public/icons/checkbox_unchecked.svg";

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
  allOptions?: FilterOption[];
  isMultiSelect?: boolean;
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
  allOptions = [],
  isMultiSelect = true,
}: DropdownFilterProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const measurementRef = useRef<HTMLButtonElement>(null);
  const headerMeasurementRef = useRef<HTMLDivElement>(null);
  const measurementTextRef = useRef<HTMLSpanElement>(null);
  const [calculatedWidth, setCalculatedWidth] = useState<number>();
  const [showTopGradient, setShowTopGradient] = useState(false);
  const [showBottomGradient, setShowBottomGradient] = useState(false);

  const preparedOptions = useMemo(() => {
    const clonedOptions = [...options];

    if (!sortOptions) {
      return clonedOptions;
    }

    return clonedOptions.sort((a, b) =>
      a.label.localeCompare(b.label, "fr", { sensitivity: "base" })
    );
  }, [options, sortOptions]);

  // Selected values as a Set for multi-select
  const selectedValues = useMemo(() => {
    if (!isMultiSelect) return new Set<string>();
    if (selected === "" || selected === undefined) {
      // Default: all options selected
      return new Set(preparedOptions.map((o) => o.value));
    }
    if (selected === "__none__") {
      return new Set<string>();
    }
    return new Set(selected.split(",").map((s) => s.trim()).filter(Boolean));
  }, [isMultiSelect, selected, preparedOptions]);

  const allSelected = useMemo(() => {
    if (!isMultiSelect) return false;
    return preparedOptions.length > 0 && selectedValues.size === preparedOptions.length;
  }, [isMultiSelect, preparedOptions.length, selectedValues.size]);

  const isPlaceholder = isMultiSelect
    ? selected === ""
    : selected === "";

  const selectedLabel = useMemo(() => {
    if (selected === "") {
      return placeholder;
    }
    if (selected === "__none__") {
      return "Aucun";
    }

    if (isMultiSelect) {
      const selectedList = preparedOptions.filter((o) => selectedValues.has(o.value));
      if (selectedList.length === 0) return "Aucun";
      if (selectedList.length === preparedOptions.length) return placeholder;
      if (selectedList.length === 1) return selectedList[0].label;
      return `${selectedList[0].label} (+${selectedList.length - 1})`;
    }

    const selectedOption = preparedOptions.find((option) => option.value === selected);
    return selectedOption?.label ?? placeholder;
  }, [selected, isMultiSelect, placeholder, preparedOptions, selectedValues]);

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
        "Aucun",
        ...preparedOptions.map((option) => option.label),
        ...allOptions.map((option) => option.label),
      ]);

      if (!isPlaceholder) {
        labelsToMeasure.add(selectedLabel);
      }

      let maxMeasuredWidth = 0;

      labelsToMeasure.forEach((l) => {
        measurementTextRef.current!.textContent = l;
        const { width } = measurementRef.current!.getBoundingClientRect();
        maxMeasuredWidth = Math.max(maxMeasuredWidth, Math.ceil(width));
      });

      if (headerMeasurementRef.current) {
        const { width: headerWidth } = headerMeasurementRef.current.getBoundingClientRect();
        maxMeasuredWidth = Math.max(maxMeasuredWidth, Math.ceil(headerWidth));
      }

      const iconSpacing = hasIcons ? 30 : 0;
      const widthLimit =
        typeof maxWidth === "number" ? maxWidth : Number.POSITIVE_INFINITY;
      const widthWithExtras = maxMeasuredWidth + iconSpacing;
      const finalWidth = Math.max(0, Math.min(widthWithExtras, widthLimit));
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
    allOptions,
    hasIcons,
    isPlaceholder,
    maxWidth,
    placeholder,
    preparedOptions,
    selectedLabel,
    isMultiSelect,
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

  useEffect(() => {
    if (open && listRef.current) {
      const target = listRef.current;
      const isAtBottom = Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 1;
      const isAtTop = target.scrollTop < 1;
      const hasScroll = target.scrollHeight > target.clientHeight;

      setShowBottomGradient(hasScroll && !isAtBottom);
      setShowTopGradient(hasScroll && !isAtTop);
    }
  }, [open, preparedOptions]);

  const handleToggleOption = (optionValue: string) => {
    if (!isMultiSelect) {
      onSelect(optionValue);
      setOpen(false);
      buttonRef.current?.blur();
      return;
    }

    const newSet = new Set(selectedValues);
    if (newSet.has(optionValue)) {
      newSet.delete(optionValue);
    } else {
      newSet.add(optionValue);
    }

    if (newSet.size === preparedOptions.length) {
      onSelect("");
    } else if (newSet.size === 0) {
      onSelect("__none__");
    } else {
      onSelect(Array.from(newSet).join(","));
    }
  };

  const buttonStateClasses = (() => {
    if (disabled) {
      return "border-[#D7D4DC] bg-[#F2F1F6] cursor-not-allowed";
    }

    if (open) {
      return "border-transparent outline-none ring-2 ring-[#A1A5FD] bg-white";
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
      className={`inline-flex flex-col gap-[5px] relative ${className ?? ""}`}
      ref={menuRef}
    >
      <div className="flex items-center justify-between">
        <span className="text-[16px] text-[#3A416F] font-bold">{label}</span>
        {!isPlaceholder && (
          <button
            type="button"
            onClick={() => onSelect("")}
            className="text-[12px] mt-[3px] text-[#7069FA] font-semibold hover:text-[#6660E4] cursor-pointer"
          >
            Effacer
          </button>
        )}
      </div>
      <div
        ref={headerMeasurementRef}
        className="absolute opacity-0 pointer-events-none -z-10 flex items-center gap-[10px]"
        aria-hidden
      >
        <span className="text-[16px] font-bold">{label}</span>
        <span className="text-[12px] font-semibold">Effacer</span>
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
          cursor-pointer
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
          {selectedOptionHasIcon(preparedOptions, selected) && (
            <Image
              src={selectedOptionHasIcon(preparedOptions, selected)!}
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
          className="absolute left-0 mt-20 min-w-full w-max max-w-[320px] bg-white rounded-[5px] z-50 shadow-[0px_1px_9px_1px_rgba(0,0,0,0.12)] overflow-hidden animate-in fade-in-50 duration-150"
        >
          {/* Top Gradient */}
          <div
            className={`absolute top-0 left-0 right-0 h-[24px] bg-gradient-to-b from-white to-transparent pointer-events-none transition-opacity duration-200 z-10 ${
              showTopGradient ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            className="flex flex-col overflow-y-auto max-h-[220px] py-1.5 scrollable-dropdown"
            ref={listRef}
            onScroll={(e) => {
              const target = e.currentTarget;
              const isAtBottom = Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 1;
              const isAtTop = target.scrollTop < 1;
              const hasScroll = target.scrollHeight > target.clientHeight;

              setShowBottomGradient(hasScroll && !isAtBottom);
              setShowTopGradient(hasScroll && !isAtTop);
            }}
          >
            {preparedOptions.map((option) => {
              const isChecked = isMultiSelect
                ? selectedValues.has(option.value)
                : selected === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleToggleOption(option.value)}
                  className={`text-left text-[15px] font-semibold py-[7px] pl-[5px] pr-3 mx-[6px] rounded-[5px] hover:bg-[#FAFAFF] transition-colors duration-150 flex items-center gap-2.5 cursor-pointer select-none group ${
                    isChecked
                      ? "text-[#3A416F]"
                      : "text-[#5D6494] hover:text-[#3A416F]"
                  }`}
                >
                  {isMultiSelect && (
                    <Image
                      src={isChecked ? CheckboxCheckedIcon : CheckboxUncheckedIcon}
                      alt={isChecked ? "Coché" : "Non coché"}
                      width={15}
                      height={15}
                      className="shrink-0"
                    />
                  )}

                  <span className="flex min-w-0 items-center flex-1">
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
              );
            })}
          </div>
          {/* Bottom Gradient */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-[24px] bg-gradient-to-t from-white to-transparent pointer-events-none transition-opacity duration-200 z-10 ${
              showBottomGradient ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
      )}
    </div>
  );
}

function selectedOptionHasIcon(options: FilterOption[], selected: string): string | undefined {
  if (!selected || selected === "__none__" || selected.includes(",")) return undefined;
  return options.find((o) => o.value === selected)?.iconSrc;
}

export type { FilterOption };
