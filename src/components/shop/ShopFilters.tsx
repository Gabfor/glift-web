"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabaseClient";
import DropdownFilter, {
  type FilterOption,
} from "@/components/filters/DropdownFilter";
import TriIcon from "/public/icons/tri.svg";
import ChevronIcon from "/public/icons/chevron.svg";
import FiltresRedIcon from "/public/icons/filtres_red.svg";
import FiltresGreenIcon from "/public/icons/filtres_green.svg";

type Props = {
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  onFiltersChange: (filters: string[]) => void;
  typeOptions: string[];
  sportOptions: string[];
};


export default function ShopFilters({ sortBy, onSortChange, onFiltersChange, typeOptions, sportOptions, }: Props) {
  const [showFilters, setShowFilters] = useState(false);
  const [open, setOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        open &&
        menuRef.current &&
        !menuRef.current.contains(target)
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

  const sortOptions = [
    { value: "popularity", label: "Pertinence" },
    { value: "newest", label: "Nouveauté" },
    { value: "expiration", label: "Expiration" },
  ];

  const selectedSortLabel = sortOptions.find((o) => o.value === sortBy)?.label ?? "";

  const [genderOptions, setGenderOptions] = useState<FilterOption[]>([]);
  const [goalOptions, setGoalOptions] = useState<FilterOption[]>([]);
  const [partnerOptions, setPartnerOptions] = useState<FilterOption[]>([]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      const supabase = createClient();

      type OfferShopField = {
        gender?: string | string[] | null;
        shop?: string | string[] | null;
      };

      const fields: Array<keyof OfferShopField> = ["gender", "shop"];
      const setters = [setGenderOptions, setPartnerOptions];

      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const setter = setters[i];

        const { data, error } = await supabase
          .from("offer_shop")
          .select(field)
          .eq("status", "ON")
          .not(field, "is", null);

        if (error) {
          console.error(`Erreur fetch ${field}:`, error.message);
          setter([]);
        } else {
          const rawValues = (data ?? []).flatMap((item: OfferShopField) => {
            const value = item[field];
            if (!value) return [];

            if (typeof value === "string") {
              try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [value];
              } catch {
                return [value];
              }
            }

            return Array.isArray(value) ? value : [];
          });

          const uniqueValues = Array.from(new Set(rawValues))
            .filter(
              (v) =>
                typeof v === "string" &&
                v.trim() !== "" &&
                v.trim().toLowerCase() !== "tous"
            )
            .sort((a, b) => a.localeCompare(b));

          const options = uniqueValues.map((val) => ({ value: val, label: val }));
          setter(options);
        }
      }

      // ✅ Injecter les catégories depuis la prop typeOptions
      const mappedGoalOptions = typeOptions
        .filter((val) => typeof val === "string" && val.trim() !== "")
        .sort((a, b) => a.localeCompare(b))
        .map((val) => ({ value: val, label: val }));
      setGoalOptions(mappedGoalOptions);
    };

    fetchFilterOptions();
  }, [typeOptions]);

  const mappedSportOptions: FilterOption[] = [...sportOptions]
    .filter((val) => typeof val === "string")
    .sort((a, b) => a.localeCompare(b))
    .map((val) => ({
      value: val,
      label: val,
    }));

  const filterOptions = [
    { label: "Sexe", placeholder: "Tous", options: genderOptions },
    { label: "Catégorie", placeholder: "Toutes les catégories", options: goalOptions },
    { label: "Sport", placeholder: "Tous les sports", options: mappedSportOptions },
    { label: "Boutique", placeholder: "Toutes les boutiques", options: partnerOptions },
  ];

  const filterWidths = ["108px", "215px", "175px", "200px"];
  const [selectedFilters, setSelectedFilters] = useState(["", "", "", ""]);

  const handleFilterChange = (index: number, value: string) => {
    const newFilters = [...selectedFilters];
    newFilters[index] = value;
    setSelectedFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const anyFilterActive = selectedFilters.some((val) => val !== "");

  const toggleOpen = () => {
    setOpen((prev) => !prev);
    if (open) buttonRef.current?.blur();
  };

  return (
    <div className="mb-8">
      <div className="flex items-center flex-wrap gap-4 mb-4">
        <div className="relative" ref={menuRef}>
          <button
            ref={buttonRef}
            onClick={toggleOpen}
            className={`h-10 min-w-[153px] border ${
              open
                ? "border-[#A1A5FD] focus:border-transparent focus:outline-none ring-2 ring-[#A1A5FD]"
                : "border-[#D7D4DC]"
            } rounded-[5px] px-3 py-2 flex items-center justify-between text-[16px] font-semibold text-[#3A416F] bg-white hover:border-[#C2BFC6] transition`}
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
            <div className="absolute left-0 mt-2 min-w-[153px] bg-white rounded-[5px] py-2 z-50 shadow-[0px_1px_9px_1px_rgba(0,0,0,0.12)]">
              <div className="flex flex-col">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSortChange(option.value);
                      setOpen(false);
                      buttonRef.current?.blur();
                    }}
                    className="text-left text-[16px] text-[#5D6494] font-semibold py-[8px] px-3 mx-[8px] rounded-[5px] hover:bg-[#FAFAFF] hover:text-[#3A416F] transition-colors duration-150"
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
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-4 transition-all duration-300">
          {filterOptions.map((filter, idx) => (
            <DropdownFilter
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
