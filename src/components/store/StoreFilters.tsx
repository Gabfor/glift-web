"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabaseClient";
import TriIcon from "/public/icons/tri.svg";
import ChevronIcon from "/public/icons/chevron.svg";
import FiltresRedIcon from "/public/icons/filtres_red.svg";
import FiltresGreenIcon from "/public/icons/filtres_green.svg";
import ChevronGreyIcon from "/public/icons/chevron_grey.svg";

type Props = {
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  onFiltersChange: (filters: string[]) => void;
};

type FilterOption = {
  value: string;
  label: string;
};

const FilterDropdown = ({
  label,
  options,
  placeholder,
  selected,
  onSelect,
  width,
}: {
  label: string;
  options: FilterOption[];
  placeholder: string;
  selected: string;
  onSelect: (value: string) => void;
  width?: string;
}) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isPlaceholder = selected === "";
  const selectedLabel = isPlaceholder
    ? placeholder
    : options.find((o) => o.value === selected)?.label ?? placeholder;

  useEffect(() => {
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

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div
      className="flex flex-col gap-[5px] relative transition-all duration-300"
      style={{ width: width ?? "153px" }}
      ref={menuRef}
    >
      <div className="flex items-center justify-between">
        <span className="text-[16px] text-[#3A416F] font-bold">{label}</span>
        {!isPlaceholder && (
          <button
            onClick={() => onSelect("")}
            className="
              text-[12px]
              mt-[3px]
              text-[#7069FA]
              font-semibold
              transition-colors duration-150
              hover:text-[#6660E4]
              focus:outline-none
            "
            style={{ textDecoration: "none" }}
          >
            Effacer
          </button>
        )}
      </div>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className={`
          h-10
          border
          ${open
            ? "border-[#A1A5FD] focus:border-transparent focus:outline-none ring-2 ring-[#A1A5FD]"
            : "border-[#D7D4DC]"}
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
          className="
            absolute left-0 mt-20
            w-full
            bg-white
            rounded-[5px]
            py-2
            z-50
            shadow-[0px_1px_9px_1px_rgba(0,0,0,0.12)]
          "
        >
          <div className="flex flex-col">
            {options.map((option) => (
              <button
                key={option.value}
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
                  ${selected === option.value ? "text-[#7069FA]" : "text-[#5D6494] hover:text-[#3A416F]"}
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
};

export default function StoreFilters({ sortBy, onSortChange, onFiltersChange }: Props) {
  const [showFilters, setShowFilters] = useState(false);
  const [open, setOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const sortOptions = [
    { value: "popularity", label: "Popularité" },
    { value: "newest", label: "Nouveauté" },
    { value: "oldest", label: "Ancienneté" },
  ];

  const selectedSortLabel = sortOptions.find((o) => o.value === sortBy)?.label ?? "";

  const [genderOptions, setGenderOptions] = useState<FilterOption[]>([]);
  const [goalOptions, setGoalOptions] = useState<FilterOption[]>([]);
  const [levelOptions, setLevelOptions] = useState<FilterOption[]>([]);
  const [partnerOptions, setPartnerOptions] = useState<FilterOption[]>([]);

  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;

      if (
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
        buttonRef.current?.blur();
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      const supabase = createClient();

      type ProgramStoreField = {
        gender?: string | null;
        goal?: string | null;
        level?: string | null;
        partner_name?: string | null;
      };

      const fields: Array<keyof ProgramStoreField> = [
        "gender",
        "goal",
        "level",
        "partner_name",
      ];
      const setters = [setGenderOptions, setGoalOptions, setLevelOptions, setPartnerOptions];

      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const setter = setters[i];

        const { data, error } = await supabase
          .from('program_store')
          .select(field)
          .eq('status', 'ON')
          .not(field, 'is', null);

        if (error) {
          console.error(`Erreur fetch ${field}:`, error.message);
          setter([]);
        } else {
        const uniqueValues = Array.from(
          new Set(
            (data ?? [])
              .map((item: ProgramStoreField) => item[field])
              .filter((value): value is string => typeof value === "string")
          )
        )
          .filter((value) => value !== "Tous")
          .sort((a, b) => a.localeCompare(b));

          const options = uniqueValues.map((val) => ({ value: val, label: val }));
          setter(options);
        }
      }
    };

    fetchFilterOptions();
  }, []);

  const filterOptions = [
    {
      label: "Sexe",
      placeholder: "Tous",
      options: genderOptions,
    },
    {
      label: "Objectif",
      placeholder: "Tous les objectifs",
      options: goalOptions,
    },
    {
      label: "Niveau",
      placeholder: "Tous les niveaux",
      options: levelOptions,
    },
    {
      label: "Partenaire",
      placeholder: "Tous les partenaires",
      options: partnerOptions,
    },
  ];

  const filterWidths = ["108px", "215px", "170px", "200px"];
  const [selectedFilters, setSelectedFilters] = useState(["", "", "", ""]);

  const handleFilterChange = (index: number, value: string) => {
    const newFilters = [...selectedFilters];
    newFilters[index] = value;
    setSelectedFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const anyFilterActive = selectedFilters.some((val) => val !== "");

  const toggleOpen = () => {
    setOpen(prev => !prev);
    if (open) {
      buttonRef.current?.blur();
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center flex-wrap gap-4 mb-4">
        <div className="relative inline-block" ref={menuRef}>
          <button
            ref={buttonRef}
            onClick={toggleOpen}
            className={`
              h-10
              min-w-[153px]
              border
              ${open ? "border-[#A1A5FD] focus:border-transparent focus:outline-none ring-2 ring-[#A1A5FD]" : "border-[#D7D4DC]"}
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
                transform: open ? "rotate(-180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
                transformOrigin: "center 45%",
              }}
            />
          </button>

          {open && (
            <div
              className="
                absolute left-0 mt-2
                min-w-[153px]
                bg-white
                rounded-[5px]
                py-2
                z-50
                shadow-[0px_1px_9px_1px_rgba(0,0,0,0.12)]
              "
            >
              <div className="flex flex-col">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSortChange(option.value);
                      setOpen(false);
                      buttonRef.current?.blur();
                    }}
                    className="
                      text-left
                      text-[16px]
                      text-[#5D6494]
                      font-semibold
                      py-[8px]
                      px-3
                      mx-[8px]
                      rounded-[5px]
                      hover:bg-[#FAFAFF]
                      hover:text-[#3A416F]
                      transition-colors duration-150
                    "
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            h-10
            min-w-[189px]
            border border-[#D7D4DC]
            rounded-[5px]
            px-3
            flex items-center
            text-[16px]
            font-semibold
            text-[#3A416F]
            bg-white
            hover:border-[#C2BFC6]
            transition
          `}
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
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-4 transition-all duration-300">
          {filterOptions.map((filter, idx) => (
            <FilterDropdown
              key={idx}
              label={filter.label}
              placeholder={filter.placeholder}
              options={filter.options}
              selected={selectedFilters[idx]}
              onSelect={(val) => handleFilterChange(idx, val)}
              width={filterWidths[idx]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
