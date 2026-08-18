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
  description?: string | null;
  gender: string | null;
  boost: boolean | string | null;
  click_count: number | null;
  created_at: string | null;
  sport: string | string[] | null;
  image_mobile: string | null;
};

const normalizeToArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v));
    } catch {
      return value
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v);
    }
    return [value];
  }
  return [];
};

const mapOfferRowToOffer = (row: OfferQueryRow): ShopOffer => ({
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
  description: row.description ?? undefined,
  gender: row.gender ?? undefined,
  boost: Boolean(row.boost),
  click_count: row.click_count ?? 0,
  created_at: row.created_at ?? undefined,
  sport: normalizeToArray(row.sport),
  image_mobile: row.image_mobile ?? undefined,
});

const processOffers = (
  rawList: ShopOffer[],
  currentFilters: string[],
  currentSort: string,
  profile: ShopProfile | null,
  currentFavorites: string[],
  favsOnly: boolean
): ShopOffer[] => {
  if (currentFilters.some((f) => f === "__none__")) {
    return [];
  }

  let list = [...rawList];

  const [genderFilter = "", categoryFilter = "", sportFilter = "", shopFilter = ""] = currentFilters;

  list = list.filter((offer) => {
    // 1. Sexe
    if (genderFilter && genderFilter.trim() !== "" && genderFilter.toLowerCase() !== "tous") {
      const targets = genderFilter.split(",").map((s) => s.trim().toLowerCase());
      const offerGender = (offer.gender || "").trim().toLowerCase();
      const isUniversal = ["tous", "mixte", "unisexe"].includes(offerGender);
      if (!isUniversal && !targets.includes(offerGender)) {
        return false;
      }
    }

    // 2. Catégorie (type)
    if (
      categoryFilter &&
      categoryFilter.trim() !== "" &&
      categoryFilter.toLowerCase() !== "tous" &&
      categoryFilter.toLowerCase() !== "toutes les catégories"
    ) {
      const targets = categoryFilter.split(",").map((s) => s.trim().toLowerCase());
      const types = offer.type.map((t) => t.toLowerCase().trim());
      const hasMatch = targets.some((target) =>
        types.some((t) => t.includes(target) || target.includes(t))
      );
      if (!hasMatch) {
        return false;
      }
    }

    // 3. Sport
    if (
      sportFilter &&
      sportFilter.trim() !== "" &&
      sportFilter.toLowerCase() !== "tous" &&
      sportFilter.toLowerCase() !== "tous les sports"
    ) {
      const targets = sportFilter.split(",").map((s) => s.trim().toLowerCase());
      const sports = offer.sport.map((s) => s.toLowerCase().trim());
      const hasMatch = targets.some((target) =>
        sports.some((s) => s.includes(target) || target.includes(s))
      );
      if (!hasMatch) {
        return false;
      }
    }

    // 4. Boutique (shop)
    if (
      shopFilter &&
      shopFilter.trim() !== "" &&
      shopFilter.toLowerCase() !== "tous" &&
      shopFilter.toLowerCase() !== "toutes les boutiques"
    ) {
      const targets = shopFilter.split(",").map((s) => s.trim().toLowerCase());
      const offerShop = (offer.shop || "").toLowerCase().trim();
      const isUniversal = !offerShop || offerShop === "tous";
      if (!isUniversal) {
        const hasMatch = targets.some((target) =>
          offerShop === target || offerShop.includes(target)
        );
        if (!hasMatch) {
          return false;
        }
      }
    }

    return true;
  });

  if (favsOnly) {
    list = list.filter((offer) => currentFavorites.includes(offer.id));
  }

  if (currentSort === "relevance") {
    const sorted = sortOffersByRelevance(list, profile, currentFavorites);
    list = sorted;
  } else if (currentSort === "popularity") {
    list.sort((a, b) => (b.click_count ?? 0) - (a.click_count ?? 0));
  } else if (currentSort === "newest") {
    list.sort((a, b) => {
      const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
      const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      const createA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const createB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return createB - createA;
    });
  } else if (currentSort === "expiration") {
    list.sort((a, b) => {
      if (!a.end_date && !b.end_date) return a.name.localeCompare(b.name);
      if (!a.end_date) return 1;
      if (!b.end_date) return -1;
      return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
    });
  }

  return list;
};

export default function ShopGrid({
  sortBy,
  currentPage,
  filters,
  onOfferClick,
  onCountChange,
  initialOffers = [],
  initialUserProfile = null,
  initialIsAuthenticated = false,
  initialFavorites = [],
  favoritesOnly = false,
}: {
  sortBy: string;
  currentPage: number;
  filters: string[];
  onOfferClick: (offer: ShopOffer) => void;
  onCountChange?: (count: number) => void;
  initialOffers?: ShopOffer[];
  initialUserProfile?: ShopProfile | null;
  initialIsAuthenticated?: boolean;
  initialFavorites?: string[];
  favoritesOnly?: boolean;
}) {
  const { user, profile } = useUser();

  const userProfile: ShopProfile | null = useMemo(() => {
    if (profile) {
      return {
        gender: profile.gender || null,
        supplements: profile.supplements || null,
        main_goal: profile.main_goal || null,
      };
    }
    return initialUserProfile;
  }, [profile, initialUserProfile]);

  const [allOffers, setAllOffers] = useState<ShopOffer[]>(initialOffers);
  const [offers, setOffers] = useState<ShopOffer[]>(() => initialOffers.slice(0, ITEMS_PER_PAGE));
  const [loading, setLoading] = useState(initialOffers.length === 0);
  const [favorites, setFavorites] = useState<string[]>(initialFavorites);
  const rawOffersCacheRef = useRef<ShopOffer[]>(initialOffers.length > 0 ? initialOffers : []);
  const hasLoadedOnceRef = useRef<boolean>(initialOffers.length > 0);

  // Load favorites from Supabase DB (or localStorage fallback) on client mount
  useEffect(() => {
    let isCancelled = false;

    async function loadFavorites() {
      let loadedFavs: string[] = initialFavorites;

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
            loadedFavs = (data as Array<{ offer_id: string }>).map((item) => String(item.offer_id));
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
      }
    }

    loadFavorites();

    return () => {
      isCancelled = true;
    };
  }, [user?.id]);

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

  const lastStateRef = useRef({
    sortBy,
    currentPage,
    filters: JSON.stringify(filters),
    favoritesOnly,
  });

  useEffect(() => {
    let isActive = true;

    const stateChanged =
      lastStateRef.current.sortBy !== sortBy ||
      lastStateRef.current.currentPage !== currentPage ||
      lastStateRef.current.filters !== JSON.stringify(filters) ||
      lastStateRef.current.favoritesOnly !== favoritesOnly;

    lastStateRef.current = {
      sortBy,
      currentPage,
      filters: JSON.stringify(filters),
      favoritesOnly,
    };

    // If on default initial view without explicit user action, keep initial offers completely stable
    if (!stateChanged && initialOffers.length > 0) {
      if (onCountChange) onCountChange(initialOffers.length);
      const fetchRaw = async () => {
        const supabase = createClientComponentClient();
        const { data } = await supabase
          .from("offer_shop")
          .select("*")
          .eq("status", "ON");
        if (!isActive || !data) return;
        const rawOffers = (data || []) as OfferQueryRow[];
        rawOffersCacheRef.current = rawOffers.map(mapOfferRowToOffer);
      };
      void fetchRaw();
      return;
    }

    const applyOffers = (rawList: ShopOffer[]) => {
      const processed = processOffers(
        rawList,
        filters,
        sortBy,
        userProfile,
        favorites,
        favoritesOnly
      );

      if (!isActive) return;

      if (onCountChange) onCountChange(processed.length);

      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const paginated = processed.slice(startIndex, startIndex + ITEMS_PER_PAGE);

      setAllOffers(processed);
      setOffers(paginated);
      setLoading(false);
      hasLoadedOnceRef.current = true;
    };

    // If we already have the raw offers in memory, filter immediately without any skeleton flicker
    if (rawOffersCacheRef.current.length > 0) {
      applyOffers(rawOffersCacheRef.current);
    } else {
      setLoading(true);
    }

    // Fetch from Supabase (first load or background sync)
    const fetchOffers = async () => {
      const supabase = createClientComponentClient();
      const { data, error } = await supabase
        .from("offer_shop")
        .select("*")
        .eq("status", "ON");

      if (!isActive) return;

      if (error) {
        console.error("Error fetching shop offers:", error);
        if (rawOffersCacheRef.current.length === 0) {
          setAllOffers([]);
          setOffers([]);
          setLoading(false);
          hasLoadedOnceRef.current = true;
        }
        return;
      }

      const rawOffers = (data || []) as OfferQueryRow[];
      const normalized = rawOffers.map(mapOfferRowToOffer);

      rawOffersCacheRef.current = normalized;
      applyOffers(normalized);
    };

    void fetchOffers();

    return () => {
      isActive = false;
    };
  }, [sortBy, currentPage, filters, userProfile, favoritesOnly, favorites]);

  return (
    <>
      {loading ? (
        <ShopGridSkeleton />
      ) : (
        <div className="relative mt-8">
          {allOffers.length === 0 && !loading && (
            <p className="text-center text-[#3A416F] font-semibold whitespace-pre-line">
              {favoritesOnly
                ? "Aucune offre enregistrée en favori pour le moment."
                : "Aucune offre disponible\navec ces filtres."}
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
