"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { type FilterOption } from "@/components/filters/DropdownFilter";
import FiltersPanel, {
  type FilterGroup,
  type SortOption,
} from "@/components/filters/FiltersPanel";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import StoreMobileFilterDrawer, {
  type FilterSectionData,
} from "@/components/store/StoreMobileFilterDrawer";
import { createClient } from "@/lib/supabaseClient";
import { useUser } from "@/context/UserContext";
import { StoreProgram } from "@/types/store";
import { mapProgramRowToCard, ProgramQueryRow } from "@/utils/storeUtils";

type Props = {
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  onFiltersChange: (filters: string[]) => void;
  initialFilters?: string[];
  favoritesOnly?: boolean;
  onFavoritesOnlyToggle?: () => void;
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

const ensureFilterSelection = (values: Set<string>, selected: string) => {
  if (!selected || selected === "__none__") return;
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
    .filter((value) => value.length > 0 && value !== "__none__")
    .filter((value) => !exclusionSet.has(value.toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));
};

const buildDurationOptions = (durations: number[], selected: string) => {
  if (durations.length === 0) {
    if (!selected || selected === "__none__") return [];
    return [selected]
      .map((value) => value.trim())
      .filter((value) => value.length > 0 && value !== "__none__")
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

export default function StoreFilters({
  sortBy,
  onSortChange,
  onFiltersChange,
  initialFilters,
  favoritesOnly = false,
  onFavoritesOnlyToggle,
}: Props) {
  const sortOptions: SortOption[] = [
    { value: "relevance", label: "Pertinence" },
    { value: "popularity", label: "Popularité" },
    { value: "newest", label: "Nouveauté" },
    { value: "oldest", label: "Ancienneté" },
  ];

  const [programs, setPrograms] = useState<NormalizedProgramStoreField[]>([]);
  const [rawPrograms, setRawPrograms] = useState<StoreProgram[]>([]);

  const [selectedFilters, setSelectedFilters] = useState(initialFilters ?? ["", "", "", "", "", "", ""]);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [openMobileSortMenu, setOpenMobileSortMenu] = useState(false);
  const mobileSortRef = useRef<HTMLDivElement>(null);

  const { user, isPremiumUser, isUserDataLoaded } = useUser();
  const isAuthenticated = !!user;

  // Close mobile sort dropdown on outside click
  useEffect(() => {
    if (!openMobileSortMenu) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (mobileSortRef.current && !mobileSortRef.current.contains(e.target as Node)) {
        setOpenMobileSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [openMobileSortMenu]);

  useEffect(() => {
    let isActive = true;

    try {
      const cached = sessionStorage.getItem("glift_store_programs_cache");
      if (cached) setPrograms(JSON.parse(cached));
      const rawCached = sessionStorage.getItem("glift_store_programs_raw_cache");
      if (rawCached) setRawPrograms(JSON.parse(rawCached));
    } catch {
      // ignore
    }

    const fetchPrograms = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("program_store")
        .select(`
          id, title, level, goal, gender, sessions, duration, description, 
          image, image_alt, partner_image, partner_image_alt, partner_link, 
          link, downloads, created_at, plan, location, partner_name, image_mobile
        `)
        .eq("status", "ON");

      if (error) {
        console.error("Erreur fetch filtres store:", error.message);
        if (isActive) {
          setPrograms([]);
          setRawPrograms([]);
        }
        return;
      }

      if (!isActive) return;

      const normalized = (data ?? []).map((item) => normalizeProgram(item));
      const mapped = (data ?? []).map((row) => mapProgramRowToCard(row as ProgramQueryRow));

      setPrograms(normalized);
      setRawPrograms(mapped);

      try {
        sessionStorage.setItem("glift_store_programs_cache", JSON.stringify(normalized));
        sessionStorage.setItem("glift_store_programs_raw_cache", JSON.stringify(mapped));
      } catch { /* ignore */ }
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
      return program.plan === "starter";
    };

    const isAvailableMatch = (program: NormalizedProgramStoreField, filterValue: string) => {
      if (!filterValue) return true;
      const isAvailable = checkAvailability(program);
      return filterValue === "Oui" ? isAvailable : !isAvailable;
    };

    const allGenderValues = new Set<string>();
    const allGoalValues = new Set<string>();
    const allLevelValues = new Set<string>();
    const allLocationValues = new Set<string>();
    const allDurationValues: number[] = [];
    const allAvailabilityValues = new Set<string>(["Oui", "Non"]);
    const allPartnerValues = new Set<string>();

    programs.forEach((program) => {
      if (program.gender) allGenderValues.add(program.gender);
      if (program.goal) allGoalValues.add(program.goal);
      if (program.level) allLevelValues.add(program.level);
      if (program.location) allLocationValues.add(program.location);
      if (program.duration) allDurationValues.push(program.duration);
      if (program.partner) allPartnerValues.add(program.partner);
      
      let matches = !selectedFilters.some((f) => f === "__none__");
      // Index 0: Gender
      if (matches && selectedFilters[0] && program.gender) {
        const targets = selectedFilters[0].split(",").map((s) => s.trim().toLowerCase());
        if (!isUniversalValue(program.gender, "Tous") && !targets.includes(program.gender.trim().toLowerCase())) {
          matches = false;
        }
      }

      // Index 1: Goal
      if (matches && selectedFilters[1] && program.goal) {
        const targets = selectedFilters[1].split(",").map((s) => s.trim().toLowerCase());
        if (!targets.includes(program.goal.trim().toLowerCase())) {
          matches = false;
        }
      }

      // Index 2: Level
      if (matches && selectedFilters[2] && program.level) {
        const targets = selectedFilters[2].split(",").map((s) => s.trim().toLowerCase());
        if (!isUniversalValue(program.level, "Tous niveaux") && !targets.includes(program.level.trim().toLowerCase())) {
          matches = false;
        }
      }

      // Index 3: Location
      if (matches && selectedFilters[3] && program.location) {
        const targets = selectedFilters[3].split(",").map((s) => s.trim().toLowerCase());
        if (!targets.includes(program.location.trim().toLowerCase())) {
          matches = false;
        }
      }

      // Index 4: Duration
      if (matches && selectedFilters[4]) {
        const targets = selectedFilters[4].split(",").map((s) => Number.parseInt(s, 10)).filter((n) => !Number.isNaN(n));
        if (targets.length > 0) {
          const max = Math.max(...targets);
          if (program.duration && program.duration > max) matches = false;
        }
      }

      // Index 5: Partner
      if (matches && selectedFilters[5] && program.partner) {
        const targets = selectedFilters[5].split(",").map((s) => s.trim().toLowerCase());
        if (!targets.includes(program.partner.trim().toLowerCase())) {
          matches = false;
        }
      }

      if (matches) {
        const isAvail = checkAvailability(program);
        availabilityValues.add(isAvail ? "Oui" : "Non");
      }

      if (matches && selectedFilters[6]) {
        const availTargets = selectedFilters[6].split(",").map((s) => s.trim());
        const isMatch = availTargets.some((t) => isAvailableMatch(program, t));
        if (!isMatch) {
          matches = false;
        }
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
      label: "Genre",
      placeholder: "Tous",
      options: [
        { value: "Femme", label: "Femme" },
        { value: "Homme", label: "Homme" },
      ],
      allOptions: [
        { value: "Femme", label: "Femme" },
        { value: "Homme", label: "Homme" },
      ],
    },
    {
      label: "Objectif",
      placeholder: "Tous les objectifs",
      options: allGoalOptions,
      allOptions: allGoalOptions,
    },
    {
      label: "Niveau",
      placeholder: "Tous les niveaux",
      options: allLevelOptions,
      allOptions: allLevelOptions,
    },
    {
      label: "Lieu",
      placeholder: "Tous les lieux",
      options: allLocationOptions,
      allOptions: allLocationOptions,
    },
    {
      label: "Durée max.",
      placeholder: "Toutes les durées",
      options: allDurationOptions,
      allOptions: allDurationOptions,
    },
    {
      label: "Partenaire",
      placeholder: "Tous les partenaires",
      options: allPartnerOptions,
      allOptions: allPartnerOptions,
    },
  ];

  // Build drawer sections
  const drawerSections: FilterSectionData[] = useMemo(() => {
    const sections: FilterSectionData[] = [
      {
        title: "Genre",
        options: ["Femme", "Homme"],
      },
      {
        title: "Objectif",
        options: allGoalOptions.map((o) => o.value),
      },
      {
        title: "Niveau",
        options: allLevelOptions.map((o) => o.value),
      },
      {
        title: "Lieu",
        options: allLocationOptions.map((o) => o.value),
      },
      {
        title: "Durée max.",
        options: allDurationOptions.map((o) => o.value),
      },
      {
        title: "Partenaire",
        options: allPartnerOptions.map((o) => o.value),
      },
    ];

    if (isUserDataLoaded && isAuthenticated && !isPremiumUser) {
      sections.push({
        title: "Disponibilité",
        options: ["Téléchargeable", "Non téléchargeable"],
      });
    }

    return sections;
  }, [
    allGoalOptions,
    allLevelOptions,
    allLocationOptions,
    allDurationOptions,
    allPartnerOptions,
    isUserDataLoaded,
    isAuthenticated,
    isPremiumUser,
  ]);

  // Convert selectedFilters array to drawer Map<string, Set<string>>
  const drawerSelectedFilters = useMemo(() => {
    const map: Record<string, Set<string>> = {};

    // Genre (index 0)
    if (selectedFilters[0] === "__none__") map["Genre"] = new Set();
    else if (selectedFilters[0] === "Homme") map["Genre"] = new Set(["Homme"]);
    else if (selectedFilters[0] === "Femme") map["Genre"] = new Set(["Femme"]);
    else map["Genre"] = new Set(["Femme", "Homme"]);

    // Objectif (index 1)
    if (selectedFilters[1] === "__none__") {
      map["Objectif"] = new Set();
    } else if (selectedFilters[1]) {
      map["Objectif"] = new Set(selectedFilters[1].split(",").map((s) => s.trim()));
    } else {
      map["Objectif"] = new Set(allGoalOptions.map((o) => o.value));
    }

    // Niveau (index 2)
    if (selectedFilters[2] === "__none__") {
      map["Niveau"] = new Set();
    } else if (selectedFilters[2]) {
      map["Niveau"] = new Set(selectedFilters[2].split(",").map((s) => s.trim()));
    } else {
      map["Niveau"] = new Set(allLevelOptions.map((o) => o.value));
    }

    // Lieu (index 3)
    if (selectedFilters[3] === "__none__") {
      map["Lieu"] = new Set();
    } else if (selectedFilters[3]) {
      map["Lieu"] = new Set(selectedFilters[3].split(",").map((s) => s.trim()));
    } else {
      map["Lieu"] = new Set(allLocationOptions.map((o) => o.value));
    }

    // Durée max. (index 4)
    if (selectedFilters[4] === "__none__") {
      map["Durée max."] = new Set();
    } else if (selectedFilters[4]) {
      const max = parseInt(selectedFilters[4], 10);
      const activeDurations = allDurationOptions
        .filter((o) => parseInt(o.value, 10) <= max)
        .map((o) => o.value);
      map["Durée max."] = new Set(activeDurations);
    } else {
      map["Durée max."] = new Set(allDurationOptions.map((o) => o.value));
    }

    // Partenaire (index 5)
    if (selectedFilters[5] === "__none__") {
      map["Partenaire"] = new Set();
    } else if (selectedFilters[5]) {
      map["Partenaire"] = new Set(selectedFilters[5].split(",").map((s) => s.trim()));
    } else {
      map["Partenaire"] = new Set(allPartnerOptions.map((o) => o.value));
    }

    // Disponibilité (index 6)
    if (selectedFilters[6] === "__none__") {
      map["Disponibilité"] = new Set();
    } else if (selectedFilters[6] === "Oui") {
      map["Disponibilité"] = new Set(["Téléchargeable"]);
    } else if (selectedFilters[6] === "Non") {
      map["Disponibilité"] = new Set(["Non téléchargeable"]);
    } else {
      map["Disponibilité"] = new Set(["Téléchargeable", "Non téléchargeable"]);
    }

    return map;
  }, [
    selectedFilters,
    allGoalOptions,
    allLevelOptions,
    allLocationOptions,
    allDurationOptions,
    allPartnerOptions,
  ]);

  const handleFilterChange = (index: number, value: string) => {
    const newFilters = [...selectedFilters];
    newFilters[index] = value;
    setSelectedFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // When drawer applies
  const handleDrawerApply = (newDrawerFilters: Record<string, Set<string>>) => {
    const newFilters = ["", "", "", "", "", "", ""];

    // Genre (index 0)
    if (newDrawerFilters["Genre"] !== undefined) {
      const sexSet = newDrawerFilters["Genre"];
      if (sexSet.size === 0) {
        newFilters[0] = "__none__";
      } else if (sexSet.size === 1) {
        newFilters[0] = Array.from(sexSet)[0];
      } else {
        newFilters[0] = "";
      }
    }

    // Objectif (index 1)
    if (newDrawerFilters["Objectif"] !== undefined) {
      const goalSet = newDrawerFilters["Objectif"];
      if (goalSet.size === 0) {
        newFilters[1] = "__none__";
      } else if (goalSet.size < allGoalOptions.length) {
        newFilters[1] = Array.from(goalSet).join(",");
      } else {
        newFilters[1] = "";
      }
    }

    // Niveau (index 2)
    if (newDrawerFilters["Niveau"] !== undefined) {
      const levelSet = newDrawerFilters["Niveau"];
      if (levelSet.size === 0) {
        newFilters[2] = "__none__";
      } else if (levelSet.size < allLevelOptions.length) {
        newFilters[2] = Array.from(levelSet).join(",");
      } else {
        newFilters[2] = "";
      }
    }

    // Lieu (index 3)
    if (newDrawerFilters["Lieu"] !== undefined) {
      const locSet = newDrawerFilters["Lieu"];
      if (locSet.size === 0) {
        newFilters[3] = "__none__";
      } else if (locSet.size < allLocationOptions.length) {
        newFilters[3] = Array.from(locSet).join(",");
      } else {
        newFilters[3] = "";
      }
    }

    // Durée max. (index 4)
    if (newDrawerFilters["Durée max."] !== undefined) {
      const durSet = newDrawerFilters["Durée max."];
      if (durSet.size === 0) {
        newFilters[4] = "__none__";
      } else if (durSet.size < allDurationOptions.length) {
        const maxVal = Math.max(...Array.from(durSet).map((s) => parseInt(s, 10) || 0));
        newFilters[4] = String(maxVal);
      } else {
        newFilters[4] = "";
      }
    }

    // Partenaire (index 5)
    if (newDrawerFilters["Partenaire"] !== undefined) {
      const partnerSet = newDrawerFilters["Partenaire"];
      if (partnerSet.size === 0) {
        newFilters[5] = "__none__";
      } else if (partnerSet.size < allPartnerOptions.length) {
        newFilters[5] = Array.from(partnerSet).join(",");
      } else {
        newFilters[5] = "";
      }
    }

    // Disponibilité (index 6)
    if (newDrawerFilters["Disponibilité"] !== undefined) {
      const availSet = newDrawerFilters["Disponibilité"];
      if (availSet.size === 0) {
        newFilters[6] = "__none__";
      } else if (availSet.size === 1) {
        newFilters[6] = availSet.has("Téléchargeable") ? "Oui" : "Non";
      } else {
        newFilters[6] = "";
      }
    } else {
      newFilters[6] = "";
    }

    setSelectedFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const hasAnyFilterActive = selectedFilters.some((val) => val !== "");
  const selectedSortLabel = sortOptions.find((o) => o.value === sortBy)?.label || "Pertinence";

  return (
    <>
      {/* --- VUE DESKTOP (md et +) --- */}
      <div className="hidden md:block">
        <FiltersPanel
          sortBy={sortBy}
          sortOptions={sortOptions}
          onSortChange={onSortChange}
          filters={filterOptions}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          storageKey="glift_store"
          favoritesOnly={favoritesOnly}
          onFavoritesOnlyToggle={onFavoritesOnlyToggle}
          isAuthenticated={isAuthenticated}
          favoriteIconActive="/icons/coeur_red.svg"
          favoriteIconInactive="/icons/coeur_grey.svg"
          rightContent={
            isUserDataLoaded && isAuthenticated && !isPremiumUser ? (
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
      </div>

      {/* --- VUE MOBILE (< md) STYLE GLIFT-MOBILE --- */}
      <div className="md:hidden mb-6">
        <div className="flex items-center gap-[10px]">
          {/* Menu déroulant de tri : 2/3 de largeur */}
          <div className="flex-[2] relative" ref={mobileSortRef}>
            <button
              type="button"
              onClick={() => setOpenMobileSortMenu(!openMobileSortMenu)}
              className={`w-full h-10 border ${
                openMobileSortMenu
                  ? "border-[#A1A5FD] ring-2 ring-[#A1A5FD]"
                  : "border-[#D7D4DC]"
              } rounded-[5px] px-3 py-2 flex items-center justify-between text-[16px] font-semibold text-[#3A416F] bg-white hover:border-[#C2BFC6] transition`}
            >
              <div className="flex items-center gap-2 pr-[10px] truncate">
                <Image src="/icons/tri.svg" alt="" width={16} height={14} />
                <span className="truncate">{selectedSortLabel}</span>
              </div>
              <Image
                src="/icons/chevron.svg"
                alt=""
                width={8.73}
                height={6.13}
                style={{
                  transform: openMobileSortMenu ? "rotate(-180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                  transformOrigin: "center 45%",
                }}
              />
            </button>

            {openMobileSortMenu && (
              <div className="absolute left-0 mt-2 w-full bg-white rounded-[5px] py-2 z-50 shadow-[0px_1px_9px_1px_rgba(0,0,0,0.12)]">
                <div className="flex flex-col">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onSortChange(option.value);
                        setOpenMobileSortMenu(false);
                      }}
                      className={`text-left text-[16px] font-semibold py-[8px] px-3 mx-[8px] rounded-[5px] hover:bg-[#FAFAFF] transition-colors duration-150 ${
                        option.value === sortBy
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

          {/* Bouton filtre : 1/3 de largeur avec texte "Filtres" */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex-[1] h-10 rounded-[5px] border border-[#D7D4DC] bg-white flex items-center justify-center gap-2 px-3 cursor-pointer hover:border-[#C2BFC6] transition text-[16px] font-semibold text-[#3A416F]"
            aria-label="Ouvrir les filtres"
          >
            <Image
              src={hasAnyFilterActive ? "/icons/filtres_green.svg" : "/icons/filtres_red.svg"}
              alt=""
              width={16}
              height={16}
            />
            <span>Filtres</span>
          </button>

          {/* Bouton Favoris (Mobile) */}
          {user && onFavoritesOnlyToggle && (
            <button
              type="button"
              onClick={onFavoritesOnlyToggle}
              className="w-10 h-10 rounded-[5px] border border-[#D7D4DC] bg-white flex items-center justify-center p-0 shrink-0 cursor-pointer hover:border-[#C2BFC6] transition"
              aria-label="Filtrer par favoris"
            >
              <Image
                src={favoritesOnly ? "/icons/coeur_red.svg" : "/icons/coeur_grey.svg"}
                alt=""
                width={24}
                height={24}
              />
            </button>
          )}
        </div>
      </div>

      {/* --- TIROIR LATÉRAL DE FILTRES MOBILE --- */}
      <StoreMobileFilterDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        sections={drawerSections}
        selectedFilters={drawerSelectedFilters}
        onApply={handleDrawerApply}
        allPrograms={rawPrograms}
        isPremiumUser={isPremiumUser}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
}

