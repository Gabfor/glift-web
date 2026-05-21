"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabaseClient";
import ShopCard from "./ShopCard";
import ShopGridSkeleton from "./ShopGridSkeleton";
import { ShopOffer, ShopProfile } from "@/types/shop";
import { sortOffersByRelevance } from "@/utils/sortingUtils";
import { useUser } from "@/context/UserContext";

const ITEMS_PER_PAGE = 8;

type OfferQueryRow = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  type: string | string[] | null;
  code: string | null;
  image: string | null;
  image_alt: string | null;
  brand_image: string | null;
  brand_image_alt: string | null;
  shop: string | null;
  shop_website: string | null;
  shop_link: string | null;
  shipping: string | number | null;
  modal: string | null;
  condition: string | null;
  gender: string | null;
  boost: boolean | string | null;
  click_count: number | null;
  created_at: string | null;
  sport: string | string[] | null;
};

const normalizeToArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(v => String(v));
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(v => String(v));
    } catch {
      return value.split(",").map(v => v.trim()).filter(v => v);
    }
    return [value];
  }
  return [];
};

const mapOfferRowToOffer = (row: OfferQueryRow): ShopOffer => ({
  ...row,
  start_date: row.start_date ?? "",
  end_date: row.end_date ?? "",
  code: row.code ?? "",
  image: row.image ?? "",
  image_alt: row.image_alt ?? "",
  type: normalizeToArray(row.type),
  sport: normalizeToArray(row.sport),
  click_count: row.click_count ?? 0,
  brand_image: row.brand_image ?? undefined,
  brand_image_alt: row.brand_image_alt ?? undefined,
  shop: row.shop ?? undefined,
  shop_website: row.shop_website ?? undefined,
  shop_link: row.shop_link ?? undefined,
  shipping: row.shipping ? String(row.shipping) : undefined,
  modal: row.modal ?? undefined,
  condition: row.condition ?? undefined,
  gender: row.gender ?? undefined,
  boost: row.boost === true || row.boost === "true",
  created_at: row.created_at ?? undefined,
});

export default function ShopGrid({
  sortBy,
  currentPage,
  filters,
  onOfferClick,
  onCountChange,
  initialOffers = [],
}: {
  sortBy: string;
  currentPage: number;
  filters: string[];
  onOfferClick: (offer: ShopOffer) => void;
  onCountChange?: (count: number) => void;
  initialOffers?: ShopOffer[];
}) {
  const isDefaultQuery =
    currentPage === 1 &&
    sortBy === "relevance" &&
    filters.every((f) => f === "");

  const [offers, setOffers] = useState<ShopOffer[]>(initialOffers);
  const [loading, setLoading] = useState(
    initialOffers.length === 0 || !isDefaultQuery
  );
  const { profile, isLoading: isUserContextLoading } = useUser();
  
  const userProfile: ShopProfile | null = useMemo(() => profile ? {
    gender: profile.gender || null,
    supplements: profile.supplements || null,
    main_goal: profile.main_goal || null
  } : null, [profile]);

  const hasLoadedOnceRef = useRef(false);
  const previousQueryRef = useRef<{
    sortBy: string;
    currentPage: number;
    filters: string[];
    userProfile: ShopProfile | null;
  } | null>(null);

  useEffect(() => {
    // Si les offres SSR sont déjà disponibles pour la requête par défaut, pas besoin de re-fetcher
    if (
      initialOffers.length > 0 &&
      isDefaultQuery &&
      !hasLoadedOnceRef.current
    ) {
      hasLoadedOnceRef.current = true;
      previousQueryRef.current = {
        sortBy,
        currentPage,
        filters: [...filters],
        userProfile: userProfile ? { ...userProfile } : null,
      };
      return;
    }

    const previousQuery = previousQueryRef.current;
    const hasQueryChanged =
      !previousQuery ||
      previousQuery.sortBy !== sortBy ||
      previousQuery.currentPage !== currentPage ||
      previousQuery.userProfile?.gender !== userProfile?.gender ||
      previousQuery.userProfile?.supplements !== userProfile?.supplements ||
      previousQuery.userProfile?.main_goal !== userProfile?.main_goal ||
      JSON.stringify(previousQuery.filters) !== JSON.stringify(filters);

    if (!hasQueryChanged && hasLoadedOnceRef.current) {
      return;
    }

    previousQueryRef.current = {
      sortBy,
      currentPage,
      filters: [...filters],
      userProfile: userProfile ? { ...userProfile } : null,
    };

    let isActive = true;

    const fetchOffers = async () => {
      setLoading(true);
      const supabase = createClient();

      let query = supabase
        .from("offer_shop")
        .select(`
          id, name, start_date, end_date, type, code, image, image_alt, 
          brand_image, brand_image_alt, shop, shop_website, shop_link, 
          shipping, modal, condition, gender, boost, click_count, created_at, sport
        `)
        .eq("status", "ON");

      // Server-side filters (Primary)
      if (filters[0]) {
        query = query.or(`gender.eq.${filters[0]},gender.eq.Tous`);
      }
      if (filters[2]) {
        query = query.or(`sport.cs.["${filters[2]}"],sport.cs.["Tous"]`);
      }
      if (filters[3]) {
        query = query.or(`shop.eq.${filters[3]},shop.eq.Tous`);
      }

      const { data, error } = await query.returns<OfferQueryRow[]>();

      if (!isActive) return;

      if (error) {
        console.error("Erreur fetch offers:", error.message);
        setOffers([]);
        if (onCountChange) onCountChange(0);
        setLoading(false);
        return;
      }

      let normalized = (data ?? []).map(mapOfferRowToOffer);

      // JS Filters: Image presence and Category partial match
      normalized = normalized
        .filter((offer) => Boolean(offer.image))
        .filter((offer) => {
          if (!filters[1]) return true;
          const normalizedType = filters[1].trim().toLowerCase();
          return offer.type.some((t) =>
            t.toLowerCase().includes(normalizedType)
          );
        });

      // Sorting
      if (sortBy === "relevance") {
        normalized = sortOffersByRelevance(normalized, userProfile);
      } else if (sortBy === "popularity") {
        normalized.sort((a, b) => {
          if (b.click_count !== a.click_count) return (b.click_count ?? 0) - (a.click_count ?? 0);
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          if (dateB !== dateA) return dateB - dateA;
          return a.name.localeCompare(b.name);
        });
      } else if (sortBy === "newest") {
        normalized.sort((a, b) => {
          const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
          const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
          if (dateB !== dateA) return dateB - dateA;
          const createA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const createB = b.created_at ? new Date(b.created_at).getTime() : 0;
          if (createB !== createA) return createB - createA;
          return a.name.localeCompare(b.name);
        });
      } else if (sortBy === "expiration") {
        normalized.sort((a, b) => {
          if (!a.end_date && !b.end_date) return a.name.localeCompare(b.name);
          if (!a.end_date) return 1;
          if (!b.end_date) return -1;
          const timeA = new Date(`${a.end_date}T00:00:00`).getTime();
          const timeB = new Date(`${b.end_date}T00:00:00`).getTime();
          if (timeA !== timeB) return timeA - timeB;
          return a.name.localeCompare(b.name);
        });
      }

      if (onCountChange) onCountChange(normalized.length);

      // In-memory pagination
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const paginated = normalized.slice(startIndex, startIndex + ITEMS_PER_PAGE);

      setOffers(paginated);
      setLoading(false);
      hasLoadedOnceRef.current = true;
    };

    void fetchOffers();

    return () => {
      isActive = false;
    };
  }, [sortBy, currentPage, filters, userProfile, isUserContextLoading]);

  return (
    <>
      {loading ? (
        <ShopGridSkeleton />
      ) : (
        <div className="relative mt-8">
          {offers.length === 0 && !loading && (
            <p className="text-center text-[#3A416F] font-semibold whitespace-pre-line">
              Aucune offre disponible{"\n"}avec ces filtres...
            </p>
          )}

          <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(270px,1fr))] justify-center">
            {offers.map((offer) => (
              <ShopCard key={offer.id} offer={offer} onOfferClick={onOfferClick} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
