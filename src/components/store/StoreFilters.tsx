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
  selected.split(",").forEach((s) => {
    const trimmed = s.trim();
    if (trimmed.length > 0 && trimmed !== "__none__") {
      values.add(trimmed);
    }
  });
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
    return selected
      .split(",")
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

  if (selected && selected !== "__none__") {
    selected.split(",").forEach((s) => {
      const trimmed = s.trim();
      if (trimmed.length > 0 && !options.some((option) => option.value === trimmed)) {
        options.push({ value: trimmed, label: `${trimmed} minutes` });
      }
    });
  }

  return options.sort((a, b) => Number.parseInt(a.value, 10) - Number.parseInt(b.value, 10));
};

const matchesStoreFilters = (
  program: NormalizedProgramStoreField,
  filters: string[],
  skipIndex: number,
  isAuthenticated: boolean,
  isPremiumUser: boolean
) => {
  if (filters.some((f, idx) => idx !== skipIndex && f === "__none__")) {
    return false;
  }

  const [genderFilter, goalFilter, levelFilter, locationFilter, durationFilter, partnerFilter, availabilityFilter] = filters;

  // Index 0: Gender
  if (skipIndex !== 0 && genderFilter && program.gender) {
    const targets = genderFilter.split(",").map((s) => s.trim().toLowerCase());
    const isUniversal = isUniversalValue(program.gender, "Tous") || isUniversalValue(program.gender, "Mixte") || isUniversalValue(program.gender, "Unisexe");
    if (!isUniversal && !targets.includes(program.gender.trim().toLowerCase())) {
      return false;
    }
  }

  // Index 1: Goal
  if (skipIndex !== 1 && goalFilter && program.goal) {
    const targets = goalFilter.split(",").map((s) => s.trim().toLowerCase());
    if (!targets.includes(program.goal.trim().toLowerCase())) {
      return false;
    }
  }

  // Index 2: Level
  if (skipIndex !== 2 && levelFilter && program.level) {
    const targets = levelFilter.split(",").map((s) => s.trim().toLowerCase());
    const isUniversal = isUniversalValue(program.level, "Tous niveaux");
    if (!isUniversal && !targets.includes(program.level.trim().toLowerCase())) {
      return false;
    }
  }

  // Index 3: Location
  if (skipIndex !== 3 && locationFilter && program.location) {
    const targets = locationFilter.split(",").map((s) => s.trim().toLowerCase());
    if (!targets.includes(program.location.trim().toLowerCase())) {
      return false;
    }
  }

  // Index 4: Duration
  if (skipIndex !== 4 && durationFilter) {
    const max = Number.parseInt(durationFilter, 10);
    if (!Number.isNaN(max) && program.duration && program.duration > max) {
      return false;
    }
  }

  // Index 5: Partner
  if (skipIndex !== 5 && partnerFilter && program.partner) {
    const targets = partnerFilter.split(",").map((s) => s.trim().toLowerCase());
    if (!targets.includes(program.partner.trim().toLowerCase())) {
      return false;
    }
  }

  // Index 6: Availability
  if (skipIndex !== 6 && availabilityFilter) {
    const isAvail = isAuthenticated && (isPremiumUser || program.plan === "starter");
    if (availabilityFilter === "Oui" && !isAvail) return false;
    if (availabilityFilter === "Non" && isAvail) return false;
  }

  return true;
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

    const allGenderValues = new Set<string>();
    const allGoalValues = new Set<string>();
    const allLevelValues = new Set<string>();
    const allLocationValues = new Set<string>();
    const allDurationValues: number[] = [];
    const allAvailabilityValues = new Set<string>(["Oui", "Non"]);
    const allPartnerValues = new Set<string>();

    programs.forEach((program) => {
      if (program.gender) {
        const g = program.gender.trim().toLowerCase();
        if (g === "tous" || g === "mixte" || g === "unisexe") {
          allGenderValues.add("Femme");
          allGenderValues.add("Homme");
        } else if (g === "femme") {
          allGenderValues.add("Femme");
        } else if (g === "homme") {
          allGenderValues.add("Homme");
        } else if (program.gender.trim()) {
          allGenderValues.add(program.gender.trim());
        }
      }
      if (program.goal) allGoalValues.add(program.goal);
      if (program.level) allLevelValues.add(program.level);
      if (program.location) allLocationValues.add(program.location);
      if (program.duration) allDurationValues.push(program.duration);
      if (program.partner) allPartnerValues.add(program.partner);

      if (matchesStoreFilters(program, selectedFilters, 0, isAuthenticated, isPremiumUser) && program.gender) {
        const g = program.gender.trim().toLowerCase();
        if (g === "tous" || g === "mixte" || g === "unisexe") {
          genderValues.add("Femme");
          genderValues.add("Homme");
        } else if (g === "femme") {
          genderValues.add("Femme");
        } else if (g === "homme") {
          genderValues.add("Homme");
        } else if (program.gender.trim()) {
          genderValues.add(program.gender.trim());
        }
      }
      if (matchesStoreFilters(program, selectedFilters, 1, isAuthenticated, isPremiumUser) && program.goal) {
        goalValues.add(program.goal);
      }
      if (matchesStoreFilters(program, selectedFilters, 2, isAuthenticated, isPremiumUser) && program.level) {
        levelValues.add(program.level);
      }
      if (matchesStoreFilters(program, selectedFilters, 3, isAuthenticated, isPremiumUser) && program.location) {
        locationValues.add(program.location);
      }
      if (matchesStoreFilters(program, selectedFilters, 4, isAuthenticated, isPremiumUser) && program.duration) {
        durationValues.push(program.duration);
      }
      if (matchesStoreFilters(program, selectedFilters, 5, isAuthenticated, isPremiumUser) && program.partner) {
        partnerValues.add(program.partner);
      }
      if (matchesStoreFilters(program, selectedFilters, 6, isAuthenticated, isPremiumUser)) {
        const isAvail = isAuthenticated && (isPremiumUser || program.plan === "starter");
        availabilityValues.add(isAvail ? "Oui" : "Non");
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
      genderOptions: toStringOptions(genderValues, ["tous", "mixte", "unisexe"]),
      goalOptions: toStringOptions(goalValues),
      levelOptions: toStringOptions(levelValues, ["tous niveaux"]),
      locationOptions: toStringOptions(locationValues),
      durationOptions: buildDurationOptions(durationValues, selectedFilters[4] ?? ""),

      allGenderOptions: toStringOptions(allGenderValues, ["tous", "mixte", "unisexe"]),
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

  // Build drawer sections
  const drawerSections: FilterSectionData[] = useMemo(() => {
    const sections: FilterSectionData[] = [
      {
        title: "Genre",
        options: genderOptions.map((o) => o.value),
      },
      {
        title: "Objectif",
        options: goalOptions.map((o) => o.value),
      },
      {
        title: "Niveau",
        options: levelOptions.map((o) => o.value),
      },
      {
        title: "Lieu",
        options: locationOptions.map((o) => o.value),
      },
      {
        title: "Durée max.",
        options: durationOptions.map((o) => o.value),
      },
      {
        title: "Partenaire",
        options: partnerOptions.map((o) => o.value),
      },
    ];

    if (isUserDataLoaded && isAuthenticated && !isPremiumUser) {
      sections.push({
        title: "Disponibilité",
        options: availabilityOptions.map((o) => o.value),
      });
    }

    return sections;
  }, [
    genderOptions,
    goalOptions,
    levelOptions,
    locationOptions,
    durationOptions,
    partnerOptions,
    availabilityOptions,
    isUserDataLoaded,
    isAuthenticated,
    isPremiumUser,
  ]);

  // Convert selectedFilters array to drawer Map<string, Set<string>>
  const drawerSelectedFilters = useMemo(() => {
    const map: Record<string, Set<string>> = {};

    // Genre (index 0)
    if (selectedFilters[0] && selectedFilters[0] !== "__none__") {
      map["Genre"] = new Set(selectedFilters[0].split(",").map((s) => s.trim()));
    } else {
      map["Genre"] = new Set();
    }

    // Objectif (index 1)
    if (selectedFilters[1] && selectedFilters[1] !== "__none__") {
      map["Objectif"] = new Set(selectedFilters[1].split(",").map((s) => s.trim()));
    } else {
      map["Objectif"] = new Set();
    }

    // Niveau (index 2)
    if (selectedFilters[2] && selectedFilters[2] !== "__none__") {
      map["Niveau"] = new Set(selectedFilters[2].split(",").map((s) => s.trim()));
    } else {
      map["Niveau"] = new Set();
    }

    // Lieu (index 3)
    if (selectedFilters[3] && selectedFilters[3] !== "__none__") {
      map["Lieu"] = new Set(selectedFilters[3].split(",").map((s) => s.trim()));
    } else {
      map["Lieu"] = new Set();
    }

    // Durée max. (index 4)
    if (selectedFilters[4] && selectedFilters[4] !== "__none__") {
      const max = parseInt(selectedFilters[4], 10);
      const activeDurations = allDurationOptions
        .filter((o) => parseInt(o.value, 10) <= max)
        .map((o) => o.value);
      map["Durée max."] = new Set(activeDurations.length > 0 ? activeDurations : [selectedFilters[4]]);
    } else {
      map["Durée max."] = new Set();
    }

    // Partenaire (index 5)
    if (selectedFilters[5] && selectedFilters[5] !== "__none__") {
      map["Partenaire"] = new Set(selectedFilters[5].split(",").map((s) => s.trim()));
    } else {
      map["Partenaire"] = new Set();
    }

    // Disponibilité (index 6)
    if (selectedFilters[6] && selectedFilters[6] !== "__none__") {
      if (selectedFilters[6] === "Oui") {
        map["Disponibilité"] = new Set(["Téléchargeable"]);
      } else if (selectedFilters[6] === "Non") {
        map["Disponibilité"] = new Set(["Non téléchargeable"]);
      } else {
        map["Disponibilité"] = new Set(selectedFilters[6].split(",").map((s) => s.trim()));
      }
    } else {
      map["Disponibilité"] = new Set();
    }

    return map;
  }, [selectedFilters, allDurationOptions]);

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
    if (newDrawerFilters["Genre"] && newDrawerFilters["Genre"].size > 0) {
      newFilters[0] = Array.from(newDrawerFilters["Genre"]).join(",");
    }

    // Objectif (index 1)
    if (newDrawerFilters["Objectif"] && newDrawerFilters["Objectif"].size > 0) {
      newFilters[1] = Array.from(newDrawerFilters["Objectif"]).join(",");
    }

    // Niveau (index 2)
    if (newDrawerFilters["Niveau"] && newDrawerFilters["Niveau"].size > 0) {
      newFilters[2] = Array.from(newDrawerFilters["Niveau"]).join(",");
    }

    // Lieu (index 3)
    if (newDrawerFilters["Lieu"] && newDrawerFilters["Lieu"].size > 0) {
      newFilters[3] = Array.from(newDrawerFilters["Lieu"]).join(",");
    }

    // Durée max. (index 4)
    if (newDrawerFilters["Durée max."] && newDrawerFilters["Durée max."].size > 0) {
      const maxVal = Math.max(...Array.from(newDrawerFilters["Durée max."]).map((s) => parseInt(s, 10) || 0));
      if (maxVal > 0) {
        newFilters[4] = String(maxVal);
      }
    }

    // Partenaire (index 5)
    if (newDrawerFilters["Partenaire"] && newDrawerFilters["Partenaire"].size > 0) {
      newFilters[5] = Array.from(newDrawerFilters["Partenaire"]).join(",");
    }

    // Disponibilité (index 6)
    if (newDrawerFilters["Disponibilité"] && newDrawerFilters["Disponibilité"].size > 0) {
      const availSet = newDrawerFilters["Disponibilité"];
      if (availSet.has("Téléchargeable") && !availSet.has("Non téléchargeable")) {
        newFilters[6] = "Oui";
      } else if (availSet.has("Non téléchargeable") && !availSet.has("Téléchargeable")) {
        newFilters[6] = "Non";
      }
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
              <div className="absolute left-0 mt-[10px] w-full bg-white rounded-[5px] py-1.5 z-50 shadow-glift-hover">
                <div className="flex flex-col">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onSortChange(option.value);
                        setOpenMobileSortMenu(false);
                      }}
                      className={`text-left text-[15px] font-semibold py-[7px] pl-[5px] pr-3 mx-[6px] rounded-[5px] hover:bg-[#FAFAFF] transition-colors duration-150 ${
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

