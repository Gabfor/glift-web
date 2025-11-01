"use client";

import { useEffect, useMemo, useState } from "react";
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

type ProgramStoreField = {
  gender?: string | null;
  goal?: string | null;
  level?: string | null;
  location?: string | null;
  partner_name?: string | null;
  duration?: number | string | null;
};

type NormalizedProgramStoreField = {
  gender: string | null;
  goal: string | null;
  level: string | null;
  location: string | null;
  partner: string | null;
  duration: number | null;
};

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeDuration = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value.trim(), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
};

const normalizeProgram = (
  program: ProgramStoreField
): NormalizedProgramStoreField => ({
  gender: normalizeString(program.gender),
  goal: normalizeString(program.goal),
  level: normalizeString(program.level),
  location: normalizeString(program.location),
  partner: normalizeString(program.partner_name),
  duration: normalizeDuration(program.duration),
});

const isUniversalValue = (value: string | null, universal: string) =>
  Boolean(value && value.trim().toLowerCase() === universal.toLowerCase());

const matchesFilters = (
  program: NormalizedProgramStoreField,
  filters: string[],
  skipIndex: number
) => {
  const [
    genderFilter,
    goalFilter,
    levelFilter,
    locationFilter,
    durationFilter,
    partnerFilter,
  ] = filters;

  if (skipIndex !== 0 && genderFilter) {
    if (
      !program.gender ||
      (program.gender.trim().toLowerCase() !== genderFilter.trim().toLowerCase() &&
        !isUniversalValue(program.gender, "Tous"))
    ) {
      return false;
    }
  }

  if (skipIndex !== 1 && goalFilter) {
    if (!program.goal || program.goal.trim().toLowerCase() !== goalFilter.trim().toLowerCase()) {
      return false;
    }
  }

  if (skipIndex !== 2 && levelFilter) {
    if (
      !program.level ||
      (program.level.trim().toLowerCase() !== levelFilter.trim().toLowerCase() &&
        !isUniversalValue(program.level, "Tous niveaux"))
    ) {
      return false;
    }
  }

  if (skipIndex !== 3 && locationFilter) {
    if (!program.location || program.location.trim().toLowerCase() !== locationFilter.trim().toLowerCase()) {
      return false;
    }
  }

  if (skipIndex !== 4 && durationFilter) {
    const maxDuration = Number.parseInt(durationFilter, 10);
    if (!Number.isNaN(maxDuration)) {
      if (!program.duration || program.duration > maxDuration) {
        return false;
      }
    }
  }

  if (skipIndex !== 5 && partnerFilter) {
    if (!program.partner || program.partner.trim().toLowerCase() !== partnerFilter.trim().toLowerCase()) {
      return false;
    }
  }

  return true;
};

const ensureFilterSelection = (values: Set<string>, selected: string) => {
  if (!selected) return;
  const trimmed = selected.trim();
  if (!trimmed) return;
  values.add(trimmed);
};

const toStringOptions = (
  values: Set<string>,
  exclusions: string[] = []
): FilterOption[] => {
  const exclusionSet = new Set(exclusions.map((value) => value.toLowerCase()));

  return Array.from(values)
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .filter((value) => !exclusionSet.has(value.toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));
};

const buildDurationOptions = (durations: number[], selected: string) => {
  if (durations.length === 0) {
    if (!selected) return [];
    return [selected]
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .map((value) => ({ value, label: `${value} minutes` }));
  }

  const roundedDurations = durations.map((duration) => {
    const remainder = duration % 30;
    return remainder === 0 ? duration : duration + (30 - remainder);
  });

  const maxRoundedDuration = Math.min(120, Math.max(...roundedDurations));

  const options: FilterOption[] = [];
  for (let limit = 30; limit <= maxRoundedDuration; limit += 30) {
    options.push({ value: String(limit), label: `${limit} minutes` });
  }

  if (selected) {
    const trimmed = selected.trim();
    if (trimmed.length > 0 && !options.some((option) => option.value === trimmed)) {
      options.push({ value: trimmed, label: `${trimmed} minutes` });
    }
  }

  return options.sort((a, b) => Number.parseInt(a.value, 10) - Number.parseInt(b.value, 10));
};

export default function StoreFilters({ sortBy, onSortChange, onFiltersChange }: Props) {
  const sortOptions: SortOption[] = [
    { value: "popularity", label: "Popularité" },
    { value: "newest", label: "Nouveauté" },
    { value: "oldest", label: "Ancienneté" },
  ];

  const [programs, setPrograms] = useState<NormalizedProgramStoreField[]>([]);
  const [selectedFilters, setSelectedFilters] = useState(["", "", "", "", "", ""]);

  useEffect(() => {
    let isActive = true;

    const fetchPrograms = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("program_store")
        .select("gender, goal, level, location, partner_name, duration")
        .eq("status", "ON");

      if (error) {
        console.error("Erreur fetch filtres store:", error.message);
        if (isActive) {
          setPrograms([]);
        }
        return;
      }

      if (!isActive) return;

      const normalized = (data ?? []).map((item) => normalizeProgram(item));
      setPrograms(normalized);
    };

    void fetchPrograms();

    return () => {
      isActive = false;
    };
  }, []);

  const { genderOptions, goalOptions, levelOptions, locationOptions, durationOptions, partnerOptions } =
    useMemo(() => {
      const genderValues = new Set<string>();
      const goalValues = new Set<string>();
      const levelValues = new Set<string>();
      const locationValues = new Set<string>();
      const partnerValues = new Set<string>();
      const durationValues: number[] = [];

      programs.forEach((program) => {
        if (matchesFilters(program, selectedFilters, 0) && program.gender) {
          genderValues.add(program.gender);
        }

        if (matchesFilters(program, selectedFilters, 1) && program.goal) {
          goalValues.add(program.goal);
        }

        if (matchesFilters(program, selectedFilters, 2) && program.level) {
          levelValues.add(program.level);
        }

        if (matchesFilters(program, selectedFilters, 3) && program.location) {
          locationValues.add(program.location);
        }

        if (matchesFilters(program, selectedFilters, 4) && program.duration) {
          durationValues.push(program.duration);
        }

        if (matchesFilters(program, selectedFilters, 5) && program.partner) {
          partnerValues.add(program.partner);
        }
      });

      ensureFilterSelection(genderValues, selectedFilters[0] ?? "");
      ensureFilterSelection(goalValues, selectedFilters[1] ?? "");
      ensureFilterSelection(levelValues, selectedFilters[2] ?? "");
      ensureFilterSelection(locationValues, selectedFilters[3] ?? "");
      ensureFilterSelection(partnerValues, selectedFilters[5] ?? "");

      const locationFallback = () => {
        if (locationValues.size > 0) {
          return toStringOptions(locationValues);
        }

        const defaultLocations = new Set(["Salle", "Domicile"]);
        ensureFilterSelection(defaultLocations, selectedFilters[3] ?? "");
        return toStringOptions(defaultLocations);
      };

      return {
        genderOptions: toStringOptions(genderValues, ["tous"]),
        goalOptions: toStringOptions(goalValues),
        levelOptions: toStringOptions(levelValues, ["tous niveaux"]),
        locationOptions: locationFallback(),
        durationOptions: buildDurationOptions(durationValues, selectedFilters[4] ?? ""),
        partnerOptions: toStringOptions(partnerValues),
      };
    }, [programs, selectedFilters]);

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
