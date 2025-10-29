"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { KeyboardEvent } from "react";
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
  allowTyping = false,
  inputLength,
  digitsOnly = false,
  padWithZero = false,
  clearable = false,
  clearLabel = "Effacer",
  onClear,
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
  allowTyping?: boolean;
  inputLength?: number;
  digitsOnly?: boolean;
  padWithZero?: boolean;
  clearable?: boolean;
  clearLabel?: string;
  onClear?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [typedValue, setTypedValue] = useState("");

  const sortedOptions = useMemo(
    () =>
      [...options].sort((a, b) =>
        a.label.localeCompare(b.label, "fr", { sensitivity: "base" })
      ),
    [options]
  );

  const isPlaceholder = selected === "";
  const isShowingPlaceholder = isPlaceholder && typedValue === "";
  const selectedLabel =
    isPlaceholder
      ? placeholder
      : sortedOptions.find((o) => o.value === selected)?.label ?? placeholder;

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setTypedValue("");
    }
  }, [open]);

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

  const maxInputLength = useMemo(() => {
    if (inputLength) {
      return inputLength;
    }
    return sortedOptions.reduce(
      (max, option) => Math.max(max, option.value.length),
      0
    );
  }, [inputLength, sortedOptions]);

  const commitValue = (raw: string) => {
    const directMatch = sortedOptions.find((option) => option.value === raw);
    if (directMatch) {
      onSelect(directMatch.value);
      return true;
    }

    if (padWithZero && digitsOnly && maxInputLength > 0) {
      const padded = raw.padStart(maxInputLength, "0");
      const paddedMatch = sortedOptions.find((option) => option.value === padded);
      if (paddedMatch) {
        onSelect(paddedMatch.value);
        return true;
      }
    }

    return false;
  };

  const updateTypedValue = (next: string) => {
    if (!allowTyping) {
      return;
    }

    let value = next;

    if (digitsOnly) {
      value = value.replace(/\D/g, "");
    }

    if (maxInputLength > 0) {
      value = value.slice(-maxInputLength);
    }

    if (value === "") {
      setTypedValue("");
      onSelect("");
      return;
    }

    if (maxInputLength > 0 && value.length >= maxInputLength) {
      const success = commitValue(value);
      setTypedValue(success ? "" : value);
      return;
    }

    if (commitValue(value)) {
      setTypedValue("");
      return;
    }

    setTypedValue(value);
  };

  useEffect(() => {
    if (!allowTyping) {
      return;
    }
    setTypedValue("");
  }, [allowTyping, selected]);

  const handleBlur = () => {
    if (!allowTyping) {
      return;
    }
    if (typedValue === "") {
      return;
    }
    const success = commitValue(typedValue);
    if (success) {
      setTypedValue("");
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!allowTyping) {
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      updateTypedValue(typedValue.slice(0, -1));
      return;
    }

    if (digitsOnly && !/^\d$/.test(event.key)) {
      return;
    }

    if (event.key.length === 1) {
      event.preventDefault();
      updateTypedValue(typedValue + event.key);
    }
  };

  const handleClear = () => {
    if (allowTyping) {
      setTypedValue("");
    }
    onSelect("");
    onClear?.();
  };

  return (
    <div
      className={`flex flex-col relative transition-all duration-300 ${className}`}
      ref={menuRef}
    >
      <div className="flex items-center justify-between">
        <span className="text-[16px] text-[#3A416F] font-bold">{label}</span>
        {clearable && !isShowingPlaceholder && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[12px] mt-[3px] text-[#7069FA] font-semibold hover:text-[#6660E4]"
          >
            {clearLabel}
          </button>
        )}
      </div>

      <button
        type="button"
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
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
            isShowingPlaceholder ? "text-[#D7D4DC]" : "text-[#3A416F]"
          }`}
        >
          {allowTyping && typedValue !== "" ? typedValue : selectedLabel}
        </span>
        <Image
          src={isShowingPlaceholder ? ChevronGreyIcon : ChevronIcon}
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
            {sortedOptions.map((option) => (
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
