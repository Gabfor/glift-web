"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabaseClient";
import FiltersPanel, {
  type FilterGroup,
  type SortOption,
} from "@/components/filters/FiltersPanel";
import DropdownFilter, { type FilterOption } from "@/components/filters/DropdownFilter";
import { useUser } from "@/context/UserContext";

type Props = {
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  onFiltersChange: (filters: string[]) => void;
  initialFilters?: string[];
  favoritesOnly?: boolean;
  onFavoritesOnlyToggle?: () => void;
};

type OfferShopField = {
  gender?: string | string[] | null;
  shop?: string | string[] | null;
  type?: string | string[] | null;
  sport?: string | string[] | null;
};

type NormalizedOfferShopField = {
  genders: string[];
  shops: string[];
  types: string[];
  sport: string | null;
};

const normalizeToArray = (value: unknown): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
          .filter((entry) => entry.length > 0);
      }
      if (typeof parsed === "string") {
        const parsedTrimmed = parsed.trim();
        return parsedTrimmed ? [parsedTrimmed] : [];
      }
    } catch {
      const splitted = trimmed
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
      if (splitted.length > 0) {
        return splitted;
      }
    }

    return [trimmed];
  }

  return [];
};

const normalizeSport = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    // If it's an array, take the first element or join them? 
    // For filters, usually we want distinct values. 
    // If the DB has ["Boxe", "MMA"], ideally we'd want both.
    // But existing logic treats sport as a single string. 
    // Let's just take the first one for now to match strict typing or join.
    // Actually, looking at usages, it seems we just want a string.
    // If it returns multiple, we might need a different approach.
    // Safe fallback:
    return value.length > 0 && typeof value[0] === 'string' ? value[0] : null;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeOffer = (field: OfferShopField): NormalizedOfferShopField => ({
  genders: normalizeToArray(field.gender),
  shops: normalizeToArray(field.shop),
  types: normalizeToArray(field.type),
  sport: normalizeSport(field.sport),
});

const hasUniversalValue = (values: string[]) =>
  values.some((value) => value.trim().toLowerCase() === "tous");

const includesValue = (values: string[], target: string) => {
  const normalizedTarget = target.trim().toLowerCase();
  return values.some((value) => value.trim().toLowerCase() === normalizedTarget);
};

const matchesFilters = (
  offer: NormalizedOfferShopField,
  filters: string[],
  skipIndex: number
) => {
  const [genderFilter, typeFilter, sportFilter, shopFilter] = filters;

  if (skipIndex !== 0 && genderFilter) {
    if (
      offer.genders.length > 0 &&
      !includesValue(offer.genders, genderFilter) &&
      !hasUniversalValue(offer.genders)
    ) {
      return false;
    }
    if (offer.genders.length === 0 && genderFilter) {
      return false;
    }
  }

  if (skipIndex !== 1 && typeFilter) {
    const normalizedType = typeFilter.trim().toLowerCase();
    if (!offer.types.some(t => t.toLowerCase().includes(normalizedType))) {
      return false;
    }
  }

  if (skipIndex !== 2 && sportFilter) {
    if (!offer.sport || offer.sport.trim().toLowerCase() !== sportFilter.trim().toLowerCase()) {
      return false;
    }
  }

  if (skipIndex !== 3 && shopFilter) {
    if (
      offer.shops.length > 0 &&
      !includesValue(offer.shops, shopFilter) &&
      !hasUniversalValue(offer.shops)
    ) {
      return false;
    }
    if (offer.shops.length === 0 && shopFilter) {
      return false;
    }
  }

  return true;
};

const ensureSelectedIncluded = (options: Set<string>, selected: string) => {
  if (!selected) return;
  const trimmed = selected.trim();
  if (trimmed.length === 0) return;
  options.add(trimmed);
};

const toFilterOptions = (
  values: Set<string>,
  optionsToExclude: string[] = []
): FilterOption[] => {
  const exclusion = new Set(optionsToExclude.map((value) => value.toLowerCase()));

  return Array.from(values)
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .filter((value) => !exclusion.has(value.toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));
};

export default function ShopFilters({
  sortBy,
  onSortChange,
  onFiltersChange,
  initialFilters,
  favoritesOnly = false,
  onFavoritesOnlyToggle,
}: Props) {
  const { user } = useUser();
  const sortOptions: SortOption[] = [
    { value: "relevance", label: "Pertinence" },
    { value: "popularity", label: "Popularité" },
    { value: "newest", label: "Nouveauté" },
    { value: "expiration", label: "Expiration" },
  ];

  const [offers, setOffers] = useState<NormalizedOfferShopField[]>(() => {
    try {
      const cached = sessionStorage.getItem("glift_shop_offers_cache");
      if (cached) return JSON.parse(cached);
    } catch { /* ignore */ }
    return [];
  });

  useEffect(() => {
    let isActive = true;

    const fetchFilterOptions = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("offer_shop")
        .select("gender, shop, type, sport")
        .eq("status", "ON");

      if (error) {
        console.error("Erreur fetch filtres shop:", error.message);
        if (isActive) {
          setOffers([]);
        }
        return;
      }

      if (!isActive) return;

      const normalizedOffers = (data ?? []).map((item) => normalizeOffer(item));
      setOffers(normalizedOffers);
      try { sessionStorage.setItem("glift_shop_offers_cache", JSON.stringify(normalizedOffers)); } catch { /* ignore */ }
    };

    void fetchFilterOptions();

    return () => {
      isActive = false;
    };
  }, []);

  const [selectedFilters, setSelectedFilters] = useState(initialFilters ?? ["", "", "", ""]);

  const { genderOptions, goalOptions, sportOptions, partnerOptions } = useMemo(() => {
    const genderValues = new Set<string>();
    const goalValues = new Set<string>();
    const sportValues = new Set<string>();
    const partnerValues = new Set<string>();

    offers.forEach((offer) => {
      if (matchesFilters(offer, selectedFilters, 0)) {
        offer.genders.forEach((gender) => genderValues.add(gender));
      }

      if (matchesFilters(offer, selectedFilters, 1)) {
        offer.types.forEach((type) => goalValues.add(type));
      }

      if (matchesFilters(offer, selectedFilters, 2) && offer.sport) {
        sportValues.add(offer.sport);
      }

      if (matchesFilters(offer, selectedFilters, 3)) {
        offer.shops.forEach((shop) => partnerValues.add(shop));
      }
    });

    ensureSelectedIncluded(genderValues, selectedFilters[0] ?? "");
    ensureSelectedIncluded(goalValues, selectedFilters[1] ?? "");
    ensureSelectedIncluded(sportValues, selectedFilters[2] ?? "");
    ensureSelectedIncluded(partnerValues, selectedFilters[3] ?? "");

    return {
      genderOptions: toFilterOptions(genderValues, ["tous"]),
      goalOptions: toFilterOptions(goalValues),
      sportOptions: toFilterOptions(sportValues),
      partnerOptions: toFilterOptions(partnerValues, ["tous"]),
    };
  }, [offers, selectedFilters]);

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
      options: sportOptions,
    },
    {
      label: "Boutique",
      placeholder: "Toutes les boutiques",
      options: partnerOptions,
    },
  ];

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [openMobileSortMenu, setOpenMobileSortMenu] = useState(false);
  const mobileSortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMobileSortMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileSortRef.current && !mobileSortRef.current.contains(event.target as Node)) {
        setOpenMobileSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMobileSortMenu]);

  const selectedSortLabel =
    sortOptions.find((option) => option.value === sortBy)?.label ?? "";

  const hasAnyFilterActive = selectedFilters.some((f) => f && f.trim() !== "");

  const handleFilterChange = (index: number, value: string) => {
    const newFilters = [...selectedFilters];
    newFilters[index] = value;
    setSelectedFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <>
      {/* --- VUE DESKTOP (md:) --- */}
      <div className="hidden md:block">
        <FiltersPanel
          sortBy={sortBy}
          sortOptions={sortOptions}
          onSortChange={onSortChange}
          filters={filterOptions}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          storageKey="glift_shop"
          favoritesOnly={favoritesOnly}
          onFavoritesOnlyToggle={onFavoritesOnlyToggle}
          isAuthenticated={Boolean(user)}
        />
      </div>

      {/* --- VUE MOBILE (< md) STYLE GLIFT-MOBILE --- */}
      <div className="md:hidden mb-6">
        <div className="flex items-center gap-[10px]">
          {/* Menu déroulant de tri */}
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

          {/* Bouton filtre */}
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
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
                src={favoritesOnly ? "/icons/coeur_rouge.svg" : "/icons/coeur_gris.svg"}
                alt=""
                width={24}
                height={24}
              />
            </button>
          )}
        </div>

        {/* Panneau des filtres déplié sur mobile */}
        {showMobileFilters && (
          <div className="mt-4 flex flex-col gap-3">
            {filterOptions.map((filter, index) => (
              <DropdownFilter
                key={`${filter.label}-${index}`}
                label={filter.label}
                placeholder={filter.placeholder}
                options={filter.options}
                allOptions={filter.allOptions}
                selected={selectedFilters[index] ?? ""}
                onSelect={(value) => handleFilterChange(index, value)}
                disabled={filter.options.length === 0}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
