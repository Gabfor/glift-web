"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import FiltersPanel, {
  type FilterGroup,
  type SortOption,
} from "@/components/filters/FiltersPanel";
import { type FilterOption } from "@/components/filters/DropdownFilter";

type Props = {
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  onFiltersChange: (filters: string[]) => void;
  typeOptions: string[];
  sportOptions: string[];
};

type OfferShopField = {
  gender?: string | string[] | null;
  shop?: string | string[] | null;
};

export default function ShopFilters({
  sortBy,
  onSortChange,
  onFiltersChange,
  typeOptions,
  sportOptions,
}: Props) {
  const sortOptions: SortOption[] = [
    { value: "popularity", label: "Pertinence" },
    { value: "newest", label: "Nouveauté" },
    { value: "expiration", label: "Expiration" },
  ];

  const [genderOptions, setGenderOptions] = useState<FilterOption[]>([]);
  const [goalOptions, setGoalOptions] = useState<FilterOption[]>([]);
  const [partnerOptions, setPartnerOptions] = useState<FilterOption[]>([]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      const supabase = createClient();

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
    };

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const mappedGoalOptions = typeOptions
      .filter((val) => typeof val === "string" && val.trim() !== "")
      .sort((a, b) => a.localeCompare(b))
      .map((val) => ({ value: val, label: val }));
    setGoalOptions(mappedGoalOptions);
  }, [typeOptions]);

  const mappedSportOptions: FilterOption[] = [...sportOptions]
    .filter((val) => typeof val === "string")
    .sort((a, b) => a.localeCompare(b))
    .map((val) => ({
      value: val,
      label: val,
    }));

  const filterOptions: FilterGroup[] = [
    { label: "Sexe", placeholder: "Tous", options: genderOptions },
    {
      label: "Catégorie",
      placeholder: "Toutes les catégories",
      options: goalOptions,
    },
    {
      label: "Sport",
      placeholder: "Tous les sports",
      options: mappedSportOptions,
    },
    {
      label: "Boutique",
      placeholder: "Toutes les boutiques",
      options: partnerOptions,
    },
  ];

  const [selectedFilters, setSelectedFilters] = useState(["", "", "", ""]);

  const handleFilterChange = (index: number, value: string) => {
    const newFilters = [...selectedFilters];
    newFilters[index] = value;
    setSelectedFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <FiltersPanel
      sortBy={sortBy}
      sortOptions={sortOptions}
      onSortChange={onSortChange}
      filters={filterOptions}
      selectedFilters={selectedFilters}
      onFilterChange={handleFilterChange}
    />
  );
}
