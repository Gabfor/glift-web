"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import ChevronIcon from "/public/icons/chevron.svg";
import ChevronGreyIcon from "/public/icons/chevron_grey.svg";

const BUTTON_LEFT_PADDING = 12; // Tailwind pl-3 => 0.75rem
const BUTTON_RIGHT_PADDING = 15; // Explicit requirement: 15px spacing to the right border
const BUTTON_CONTENT_GAP = 10; // Tailwind gap-[10px]
const CHEVRON_WIDTH = 9; // Approximate width of the chevron icon in pixels
const WIDTH_BUFFER = 10; // Additional buffer to avoid text clipping
const EXTRA_PADDING =
  BUTTON_LEFT_PADDING +
  BUTTON_RIGHT_PADDING +
  BUTTON_CONTENT_GAP +
  CHEVRON_WIDTH +
  WIDTH_BUFFER;

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
  const measurementRef = useRef<HTMLSpanElement>(null);

  const labels = useMemo(
    () => [placeholder, ...options.map((option) => option.label)],
    [options, placeholder],
  );

  const longestLabel = useMemo(
    () =>
      labels.reduce((longest, label) =>
        label.length > longest.length ? label : longest,
      ),
    [labels],
  );

  const fallbackWidth = useMemo(() => {
    if (width) {
      return width;
    }

    const averageCharWidth = 9; // Approximation for 16px semibold text
    const extraPadding = EXTRA_PADDING; // Account for button padding, chevron icon and buffer

    return `${Math.ceil(longestLabel.length * averageCharWidth + extraPadding)}px`;
  }, [longestLabel, width]);

  const [computedWidth, setComputedWidth] = useState<string>(fallbackWidth);

  const useIsomorphicLayoutEffect =
    typeof window === "undefined" ? useEffect : useLayoutEffect;

  useIsomorphicLayoutEffect(() => {
    if (width) {
      setComputedWidth(width);
      return;
    }

    const measurementNode = measurementRef.current;

    if (!measurementNode) {
      setComputedWidth(fallbackWidth);
      return;
    }

    const extraPadding = EXTRA_PADDING;
    const measuredWidth = measurementNode.getBoundingClientRect().width;

    setComputedWidth(`${Math.ceil(measuredWidth + extraPadding)}px`);
  }, [fallbackWidth, width, longestLabel]);

  const isPlaceholder = selected === "";
  const selectedLabel = isPlaceholder
    ? placeholder
    : options.find((option) => option.value === selected)?.label ?? placeholder;

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
      <span
        ref={measurementRef}
        aria-hidden
        className="pointer-events-none absolute -z-50 whitespace-nowrap text-[16px] font-semibold opacity-0"
      >
        {longestLabel}
      </span>
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
          pl-3
          pr-[15px]
          py-2
          flex items-center
          gap-[10px]
          text-[16px]
          font-semibold
          bg-white
          hover:border-[#C2BFC6]
          transition
        `}
      >
        <span
          className={`${
            isPlaceholder ? "text-[#D7D4DC]" : "text-[#3A416F]"
          } whitespace-nowrap`}
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
