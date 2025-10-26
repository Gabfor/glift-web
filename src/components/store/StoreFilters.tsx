"use client";

import { useEffect, useState } from "react";
import { type FilterOption } from "@/components/filters/DropdownFilter";
import FiltersPanel, {
  type FilterGroup,
  type SortOption,
} from "@/components/filters/FiltersPanel";
import { createClient } from "@/lib/supabaseClient";

type Props = {
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  onFiltersChange: (filters: string[]) => void;
};

export default function StoreFilters({ sortBy, onSortChange, onFiltersChange }: Props) {
  const sortOptions: SortOption[] = [
    { value: "popularity", label: "Popularité" },
    { value: "newest", label: "Nouveauté" },
    { value: "oldest", label: "Ancienneté" },
  ];

  const [genderOptions, setGenderOptions] = useState<FilterOption[]>([]);
  const [goalOptions, setGoalOptions] = useState<FilterOption[]>([]);
  const [levelOptions, setLevelOptions] = useState<FilterOption[]>([]);
  const [locationOptions, setLocationOptions] = useState<FilterOption[]>([]);
  const [partnerOptions, setPartnerOptions] = useState<FilterOption[]>([]);
  const [durationOptions, setDurationOptions] = useState<FilterOption[]>([]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      const supabase = createClient();

      type ProgramStoreField = {
        gender?: string | null;
        goal?: string | null;
        level?: string | null;
        partner_name?: string | null;
        duration?: string | null;
        location?: string | null;
      };

      const fields: Array<keyof ProgramStoreField> = [
        "gender",
        "goal",
        "level",
        "location",
        "partner_name",
      ];
      const setters = [
        setGenderOptions,
        setGoalOptions,
        setLevelOptions,
        setLocationOptions,
        setPartnerOptions,
      ];

      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const setter = setters[i];

        const { data, error } = await supabase
          .from("program_store")
          .select(field)
          .eq("status", "ON")
          .not(field, "is", null);

        if (error) {
          console.error(`Erreur fetch ${field}:`, error.message);
          if (field === "location") {
            setter([
              { value: "Salle", label: "Salle" },
              { value: "Domicile", label: "Domicile" },
            ]);
          } else {
            setter([]);
          }
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
          if (field === "location" && options.length === 0) {
            setter([
              { value: "Salle", label: "Salle" },
              { value: "Domicile", label: "Domicile" },
            ]);
          } else {
            setter(options);
          }
        }
      }

      const { data: durationData, error: durationError } = await supabase
        .from("program_store")
        .select("duration")
        .eq("status", "ON")
        .not("duration", "is", null);

      if (durationError) {
        console.error("Erreur fetch duration:", durationError.message);
        setDurationOptions([]);
      } else {
        const numericDurations = (durationData ?? [])
          .map((item: ProgramStoreField) => {
            const value = item.duration;
            if (typeof value === "number") {
              return Number.isFinite(value) ? value : null;
            }
            if (typeof value === "string") {
              const parsed = Number.parseInt(value, 10);
              return Number.isNaN(parsed) ? null : parsed;
            }
            return null;
          })
          .filter((value): value is number => value !== null && value > 0);

        if (numericDurations.length === 0) {
          setDurationOptions([]);
        } else {
          const maxRoundedDuration = Math.min(
            120,
            Math.max(
              ...numericDurations.map((duration) => {
                const remainder = duration % 30;
                return remainder === 0 ? duration : duration + (30 - remainder);
              })
            )
          );

          const options: FilterOption[] = [];
          for (let limit = 30; limit <= maxRoundedDuration; limit += 30) {
            options.push({ value: String(limit), label: `${limit} minutes` });
          }

          setDurationOptions(options);
        }
      }
    };

    fetchFilterOptions();
  }, []);

  const filterOptions: FilterGroup[] = [
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
      label: "Lieu",
      placeholder: "Tous les lieux",
      options: locationOptions,
    },
    {
      label: "Durée max.",
      placeholder: "Toutes les durées",
      options: durationOptions,
    },
    {
      label: "Partenaire",
      placeholder: "Tous les partenaires",
      options: partnerOptions,
    },
  ];

  const [selectedFilters, setSelectedFilters] = useState(["", "", "", "", "", ""]);

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
