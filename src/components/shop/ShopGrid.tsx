"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { createClientComponentClient } from "@/lib/supabase/client";
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
  image_mobile: string | null;
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
  image_mobile: row.image_mobile ?? undefined,
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

  const [allOffers, setAllOffers] = useState<ShopOffer[]>(initialOffers);
  const [offers, setOffers] = useState<ShopOffer[]>(() => initialOffers.slice(0, 8));
  const [loading, setLoading] = useState(
    initialOffers.length === 0 || !isDefaultQuery
  );
  const { user, profile, isLoading: isUserContextLoading } = useUser();
  
  const userProfile: ShopProfile | null = useMemo(() => profile ? {
    gender: profile.gender || null,
    supplements: profile.supplements || null,
    main_goal: profile.main_goal || null
  } : null, [profile]);

  const [favorites, setFavorites] = useState<string[]>([]);
  const initialSortedRef = useRef(false);

  // Load favorites from Supabase DB (or localStorage fallback) on client mount and sort initial offers once
  useEffect(() => {
    let isCancelled = false;

    async function loadFavorites() {
      let loadedFavs: string[] = [];

      // 1. First read local cache
      try {
        const stored = localStorage.getItem("glift_favorite_offers");
        if (stored) {
          loadedFavs = JSON.parse(stored);
        }
      } catch {
        // ignore
      }

      if (user?.id) {
        try {
          const supabase = createClientComponentClient();
          const { data, error } = await (supabase.from("user_shop_favorites" as any) as any)
            .select("offer_id")
            .eq("user_id", user.id);

          if (!error && data) {
            loadedFavs = (data as Array<{ offer_id: string }>).map((item) => item.offer_id);
            try {
              localStorage.setItem("glift_favorite_offers", JSON.stringify(loadedFavs));
            } catch {
              // ignore
            }
          }
        } catch {
          // ignore if DB table not present
        }
      }

      if (!isCancelled) {
        setFavorites(loadedFavs);

        if (initialOffers.length > 0 && sortBy === "relevance" && !initialSortedRef.current) {
          initialSortedRef.current = true;
          const sorted = sortOffersByRelevance(initialOffers, userProfile, loadedFavs);
          setAllOffers(sorted);
          setOffers(sorted.slice(0, ITEMS_PER_PAGE));
        }
      }
    }

    loadFavorites();

    return () => {
      isCancelled = true;
    };
  }, [user?.id, initialOffers, sortBy, userProfile]);

  const handleToggleFavorite = useCallback(
    async (offerId: string) => {
      const isCurrentlyFav = favorites.includes(offerId);
      const next = isCurrentlyFav
        ? favorites.filter((id) => id !== offerId)
        : [...favorites, offerId];

      setFavorites(next);
      try {
        localStorage.setItem("glift_favorite_offers", JSON.stringify(next));
      } catch {
        // ignore
      }

      if (user?.id) {
        try {
          const supabase = createClientComponentClient();
          if (isCurrentlyFav) {
            await (supabase.from("user_shop_favorites" as any) as any)
              .delete()
              .eq("user_id", user.id)
              .eq("offer_id", offerId);
          } else {
            await (supabase.from("user_shop_favorites" as any) as any)
              .upsert({ user_id: user.id, offer_id: offerId });
          }
        } catch (err) {
          console.error("Error syncing favorite to Supabase:", err);
        }
      }
    },
    [favorites, user?.id]
  );

  const hasLoadedOnceRef = useRef(false);
  const previousQueryRef = useRef<{
    sortBy: string;
    currentPage: number;
    filters: string[];
    userProfile: ShopProfile | null;
  } | null>(null);

  useEffect(() => {
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
      setLoading(false);
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
      setLoading(false);
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
      const supabase = createClientComponentClient();

      let query = supabase.from("offer_shop").select("*").eq("status", "ON");

      const genderFilter = filters.find((f) =>
        ["homme", "femme", "unisexe", "mixte", "tous"].includes(f.toLowerCase())
      );
      const categoryFilter = filters.find(
        (f) => !["homme", "femme", "unisexe", "mixte", "tous"].includes(f.toLowerCase())
      );

      if (categoryFilter && categoryFilter.toLowerCase() !== "tous") {
        query = query.contains("type", [categoryFilter]);
      }

      if (genderFilter && genderFilter.toLowerCase() !== "tous") {
        query = query.or(`gender.ilike.%${genderFilter}%,gender.ilike.%tous%,gender.ilike.%mixte%,gender.ilike.%unisexe%`);
      }

      const { data, error } = await query;

      if (!isActive) return;

      if (error) {
        console.error("Error fetching shop offers:", error);
        setAllOffers([]);
        setOffers([]);
        setLoading(false);
        hasLoadedOnceRef.current = true;
        return;
      }

      const rawOffers = (data || []) as OfferQueryRow[];
      const normalized: ShopOffer[] = rawOffers.map((row) => ({
        id: row.id,
        name: row.name,
        start_date: row.start_date ?? "",
        end_date: row.end_date ?? "",
        type: normalizeToArray(row.type),
        code: row.code ?? "",
        image: row.image || "/placeholder.jpg",
        image_alt: row.image_alt ?? "",
        brand_image: row.brand_image ?? undefined,
        brand_image_alt: row.brand_image_alt ?? undefined,
        shop: row.shop ?? undefined,
        shop_website: row.shop_website ?? undefined,
        shop_link: row.shop_link ?? undefined,
        shipping: row.shipping ? String(row.shipping) : undefined,
        modal: row.modal ?? undefined,
        condition: row.condition ?? undefined,
        gender: row.gender ?? undefined,
        boost: Boolean(row.boost),
        click_count: row.click_count ?? 0,
        created_at: row.created_at ?? undefined,
        sport: normalizeToArray(row.sport),
        image_mobile: row.image_mobile ?? undefined,
      }));

      if (sortBy === "relevance") {
        const sorted = sortOffersByRelevance(normalized, userProfile, favorites);
        normalized.splice(0, normalized.length, ...sorted);
      } else if (sortBy === "popularity") {
        normalized.sort((a, b) => (b.click_count ?? 0) - (a.click_count ?? 0));
      } else if (sortBy === "newest") {
        normalized.sort((a, b) => {
          const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
          const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
          if (dateB !== dateA) return dateB - dateA;
          const createA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const createB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return createB - createA;
        });
      } else if (sortBy === "expiration") {
        normalized.sort((a, b) => {
          if (!a.end_date && !b.end_date) return a.name.localeCompare(b.name);
          if (!a.end_date) return 1;
          if (!b.end_date) return -1;
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
        });
      }

      if (onCountChange) onCountChange(normalized.length);

      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const paginated = normalized.slice(startIndex, startIndex + ITEMS_PER_PAGE);

      setAllOffers(normalized);
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
          {allOffers.length === 0 && !loading && (
            <p className="text-center text-[#3A416F] font-semibold whitespace-pre-line">
              Aucune offre disponible{"\n"}avec ces filtres...
            </p>
          )}

          <div className="flex flex-col gap-5 md:hidden">
            {allOffers.map((offer) => (
              <ShopCard
                key={offer.id}
                offer={offer}
                onOfferClick={onOfferClick}
                isFavorite={favorites.includes(offer.id)}
                onToggleFavorite={handleToggleFavorite}
                isAuthenticated={Boolean(user)}
              />
            ))}
          </div>

          <div className="hidden md:grid md:gap-6 md:grid-cols-[repeat(auto-fill,minmax(270px,1fr))] justify-center">
            {offers.map((offer) => (
              <ShopCard
                key={offer.id}
                offer={offer}
                onOfferClick={onOfferClick}
                isFavorite={favorites.includes(offer.id)}
                onToggleFavorite={handleToggleFavorite}
                isAuthenticated={Boolean(user)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
