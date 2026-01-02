"use client";

import { useEffect, useMemo, useState } from "react";
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
};

type OfferShopField = {
  gender?: string | string[] | null;
  shop?: string | string[] | null;
  type?: string | string[] | null;
  sport?: string | null;
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
    if (!includesValue(offer.types, typeFilter)) {
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
}: Props) {
  const sortOptions: SortOption[] = [
    { value: "relevance", label: "Pertinence" },
    { value: "newest", label: "Nouveauté" },
    { value: "expiration", label: "Expiration" },
  ];

  const [offers, setOffers] = useState<NormalizedOfferShopField[]>([]);

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
    };

    void fetchFilterOptions();

    return () => {
      isActive = false;
    };
  }, []);

  const [selectedFilters, setSelectedFilters] = useState(["", "", "", ""]);

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
