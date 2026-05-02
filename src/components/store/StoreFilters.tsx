"use client";

import { useEffect, useMemo, useState } from "react";
import { type FilterOption } from "@/components/filters/DropdownFilter";
import FiltersPanel, {
  type FilterGroup,
  type SortOption,
} from "@/components/filters/FiltersPanel";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { createClient } from "@/lib/supabaseClient";
import { useUser } from "@/context/UserContext";

type Props = {
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  onFiltersChange: (filters: string[]) => void;
  initialFilters?: string[];
};

type ProgramStoreField = {
  gender?: string | null;
  goal?: string | null;
  level?: string | null;
  location?: string | null;
  partner_name?: string | null;
  duration?: number | string | null;
  plan?: string | null;
};

type NormalizedProgramStoreField = {
  gender: string | null;
  goal: string | null;
  level: string | null;
  location: string | null;
  partner: string | null;
  duration: number | null;
  plan: "starter" | "premium" | null;
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
  plan: (program.plan as "starter" | "premium") || "starter",
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
    availabilityFilter,
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

export default function StoreFilters({ sortBy, onSortChange, onFiltersChange, initialFilters }: Props) {
  const sortOptions: SortOption[] = [
    { value: "relevance", label: "Pertinence" },
    { value: "popularity", label: "Popularité" },
    { value: "newest", label: "Nouveauté" },
    { value: "oldest", label: "Ancienneté" },
  ];

  const [programs, setPrograms] = useState<NormalizedProgramStoreField[]>(() => {
    try {
      const cached = sessionStorage.getItem("glift_store_programs_cache");
      if (cached) return JSON.parse(cached);
    } catch { /* ignore */ }
    return [];
  });
  const [selectedFilters, setSelectedFilters] = useState(initialFilters ?? ["", "", "", "", "", "", ""]);
  const { user, isPremiumUser, isUserDataLoaded } = useUser();
  const isAuthenticated = !!user;

  useEffect(() => {
    let isActive = true;

    const fetchPrograms = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("program_store")
        .select("gender, goal, level, location, duration, plan, partner_name")
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
      try { sessionStorage.setItem("glift_store_programs_cache", JSON.stringify(normalized)); } catch { /* ignore */ }
    };

    void fetchPrograms();

    return () => {
      isActive = false;
    };
  }, []);

  const {
    genderOptions,
    goalOptions,
    levelOptions,
    locationOptions,
    durationOptions,
    allGenderOptions,
    allGoalOptions,
    allLevelOptions,
    allLocationOptions,
    allDurationOptions,
    availabilityOptions,
    allAvailabilityOptions,
    partnerOptions,
    allPartnerOptions,
  } = useMemo(() => {
    const genderValues = new Set<string>();
    const goalValues = new Set<string>();
    const levelValues = new Set<string>();
    const locationValues = new Set<string>();
    const durationValues: number[] = [];
    const availabilityValues = new Set<string>();
    const partnerValues = new Set<string>();

    const checkAvailability = (program: NormalizedProgramStoreField) => {
      if (!isAuthenticated) return false;
      if (isPremiumUser) return true;
      // Basic plan
      return program.plan === "starter";
    };

    const isAvailableMatch = (program: NormalizedProgramStoreField, filterValue: string) => {
      if (!filterValue) return true;
      const isAvailable = checkAvailability(program);
      return filterValue === "Oui" ? isAvailable : !isAvailable;
    };

    // Global values for width calculation
    const allGenderValues = new Set<string>();
    const allGoalValues = new Set<string>();
    const allLevelValues = new Set<string>();
    const allLocationValues = new Set<string>();
    const allDurationValues: number[] = [];
    const allAvailabilityValues = new Set<string>(["Oui", "Non"]);
    const allPartnerValues = new Set<string>();

    programs.forEach((program) => {
      // Collect ALL possible values
      if (program.gender) allGenderValues.add(program.gender);
      if (program.goal) allGoalValues.add(program.goal);
      if (program.level) allLevelValues.add(program.level);
      if (program.location) allLocationValues.add(program.location);
      if (program.duration) allDurationValues.push(program.duration);
      if (program.partner) allPartnerValues.add(program.partner);

      // Match common filters logic (replicated partly here or we rely on matchesFilters?) 
      // We need to use matchesFilters but inject the check for availability options
      // CAUTION: matchesFilters defined outside doesn't know about userAuth.
      // We need to implement availability check here inside the loop.

      // Re-implement matchesFilters roughly or pass current availability:

      let matches = true;
      // Index 0: Gender
      if (selectedFilters[0] && program.gender &&
        program.gender.trim().toLowerCase() !== selectedFilters[0].trim().toLowerCase() &&
        !isUniversalValue(program.gender, "Tous")) matches = false;

      // Index 1: Goal
      if (matches && selectedFilters[1] && program.goal &&
        program.goal.trim().toLowerCase() !== selectedFilters[1].trim().toLowerCase()) matches = false;

      // Index 2: Level
      if (matches && selectedFilters[2] && program.level &&
        program.level.trim().toLowerCase() !== selectedFilters[2].trim().toLowerCase() &&
        !isUniversalValue(program.level, "Tous niveaux")) matches = false;

      // Index 3: Location
      if (matches && selectedFilters[3] && program.location &&
        program.location.trim().toLowerCase() !== selectedFilters[3].trim().toLowerCase()) matches = false;

      // Index 4: Duration
      if (matches && selectedFilters[4]) {
        const max = Number.parseInt(selectedFilters[4], 10);
        if (!Number.isNaN(max) && program.duration && program.duration > max) matches = false;
      }

      // Index 5: Partner
      if (matches && selectedFilters[5] && program.partner &&
        program.partner.trim().toLowerCase() !== selectedFilters[5].trim().toLowerCase()) matches = false;

      if (matches) {
        // Check availability for option generation (if we are NOT filtering by availability OR if we allow it)
        // Actually, we want to know: "Given other filters, what availabilities are present?"
        // So we skip index 6 check for availabilityValues.

        const isAvail = checkAvailability(program);
        availabilityValues.add(isAvail ? "Oui" : "Non");
      }

      // Now for other options, we MUST respect availability filter
      if (matches && selectedFilters[6] && !isAvailableMatch(program, selectedFilters[6])) {
        matches = false;
      }

      if (matches) {
        if (program.gender) genderValues.add(program.gender);
        if (program.goal) goalValues.add(program.goal);
        if (program.level) levelValues.add(program.level);
        if (program.location) locationValues.add(program.location);
        if (program.duration) durationValues.push(program.duration);
        if (program.partner) partnerValues.add(program.partner);
      }
    });

    ensureFilterSelection(genderValues, selectedFilters[0] ?? "");
    ensureFilterSelection(goalValues, selectedFilters[1] ?? "");
    ensureFilterSelection(levelValues, selectedFilters[2] ?? "");
    ensureFilterSelection(locationValues, selectedFilters[3] ?? "");
    ensureFilterSelection(partnerValues, selectedFilters[5] ?? "");
    ensureFilterSelection(availabilityValues, selectedFilters[6] ?? "");

    // For all locations, we don't force selection, just return options
    const allLocationFallback = () => {
      if (allLocationValues.size > 0) return toStringOptions(allLocationValues);
      return toStringOptions(new Set(["Salle", "Domicile"]));
    };

    return {
      genderOptions: toStringOptions(genderValues, ["tous"]),
      goalOptions: toStringOptions(goalValues),
      levelOptions: toStringOptions(levelValues, ["tous niveaux"]),
      locationOptions: toStringOptions(locationValues),
      durationOptions: buildDurationOptions(durationValues, selectedFilters[4] ?? ""),

      allGenderOptions: toStringOptions(allGenderValues, ["tous"]),
      allGoalOptions: toStringOptions(allGoalValues),
      allLevelOptions: toStringOptions(allLevelValues, ["tous niveaux"]),
      allLocationOptions: allLocationFallback(),
      allDurationOptions: buildDurationOptions(allDurationValues, ""),
      partnerOptions: toStringOptions(partnerValues),
      allPartnerOptions: toStringOptions(allPartnerValues),
      availabilityOptions: toStringOptions(availabilityValues),
      allAvailabilityOptions: toStringOptions(allAvailabilityValues),
    };
  }, [programs, selectedFilters, isAuthenticated, isPremiumUser]);

  const filterOptions: FilterGroup[] = [
    {
      label: "Sexe",
      placeholder: "Tous",
      options: genderOptions,
      allOptions: allGenderOptions,
    },
    {
      label: "Objectif",
      placeholder: "Tous les objectifs",
      options: goalOptions,
      allOptions: allGoalOptions,
    },
    {
      label: "Niveau",
      placeholder: "Tous les niveaux",
      options: levelOptions,
      allOptions: allLevelOptions,
    },
    {
      label: "Lieu",
      placeholder: "Tous les lieux",
      options: locationOptions,
      allOptions: allLocationOptions,
    },
    {
      label: "Durée max.",
      placeholder: "Toutes les durées",
      options: durationOptions,
      allOptions: allDurationOptions,
    },
    {
      label: "Partenaire",
      placeholder: "Tous les partenaires",
      options: partnerOptions,
      allOptions: allPartnerOptions,
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
      storageKey="glift_store"
      rightContent={
        isUserDataLoaded && !isPremiumUser ? (
          <div className="flex items-center gap-[10px]">
            <span className="text-[16px] font-semibold text-[#3A416F]">
              Masquer les programmes bloqués
            </span>
            <ToggleSwitch
              checked={selectedFilters[6] === "Oui"}
              onCheckedChange={(checked) => handleFilterChange(6, checked ? "Oui" : "")}
            />
          </div>
        ) : undefined
      }
    />
  );
}
