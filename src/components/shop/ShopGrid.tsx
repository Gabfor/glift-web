"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import ShopCard from "@/components/shop/ShopCard";
import { useSupabase } from "@/components/SupabaseProvider";
import { useUser } from "@/context/UserContext";
import { createScopedLogger } from "@/utils/logger";
import { useVisibilityRefetch } from "@/hooks/useVisibilityRefetch";

type Offer = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  type: string[] | string;
  code: string;
  image: string;
  image_alt: string;
  brand_image?: string;
  brand_image_alt?: string;
  shop?: string;
  shop_website?: string;
  shop_link?: string;
  shipping?: string;
  premium?: boolean;
  modal?: string;
  condition?: string;
};

export default function ShopGrid({
  sortBy,
  currentPage,
  filters
}: {
  sortBy: string;
  currentPage: number;
  filters: string[];
}) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  const supabase = useSupabase();
  const { user, isAuthResolved, refreshSession } = useUser();
  const userId = user?.id ?? null;
  const isReady = useMemo(
    () => isAuthResolved && !!userId,
    [isAuthResolved, userId]
  );
  const logger = useMemo(() => createScopedLogger("ShopGrid"), []);

  const safeFilters = useMemo<string[]>(
    () => (Array.isArray(filters) ? filters : []),
    [filters]
  );
  const filtersKey = useMemo(() => safeFilters.join("|"), [safeFilters]);

  const getOrderForSortBy = (s: string) => {
    switch (s) {
      case "popularity":
        return { column: "downloads", ascending: false };
      case "oldest":
        return { column: "created_at", ascending: true };
      case "expiration":
        return { column: "", ascending: true }; // tri client
      case "newest":
      default:
        return { column: "created_at", ascending: false };
    }
  };

  // Fetch offers uniquement quand l'utilisateur est prêt
  const runFetch = useCallback(async () => {
    if (!isReady) {
      logger.debug("runFetch: user/session not ready", {
        isAuthResolved,
        userId,
      });
      return;
    }

    setLoading(true);

    logger.info("Fetching offers", {
      userId,
      sortBy,
      currentPage,
      filters: safeFilters,
    });

    const start = (currentPage - 1) * 8;
    const end = start + 7;

    const order = getOrderForSortBy(sortBy);

    let query = supabase
      .from("offer_shop")
      .select(`
        id,
        name,
        start_date,
        end_date,
        type,
        code,
        image,
        image_alt,
        brand_image,
        brand_image_alt,
        shop,
        shop_website,
        shop_link,
        shipping,
        premium,
        modal,
        condition
      `)
      .eq("status", "ON");

    if (safeFilters[0]) {
      query = query.or(`gender.eq.${safeFilters[0]},gender.eq.Tous`);
    }
    if (safeFilters[2]) query = query.ilike("sport", safeFilters[2]);
    if (safeFilters[3]) query = query.eq("shop", safeFilters[3]);

    // Tri Supabase (sauf “expiration” qui sera tri client)
    if (order.column) {
      query = query.order(order.column, { ascending: order.ascending });
    }

    const { data, error } = await query.range(start, end);

    if (error) {
      logger.error("Erreur Supabase", error.message);
      setOffers([]);
    } else {
      const list = data || [];

      if (sortBy === "expiration") {
        list.sort((a: any, b: any) => {
          if (!a.end_date && !b.end_date) return 0;
          if (!a.end_date) return 1;
          if (!b.end_date) return -1;
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
        });
      }
      setOffers(list as Offer[]);
    }

    setLoading(false);
    setHasFetchedOnce(true);
  }, [
    currentPage,
    isReady,
    logger,
    safeFilters,
    sortBy,
    supabase,
    userId,
    isAuthResolved,
  ]);

  useEffect(() => {
    if (!isReady) {
      logger.debug("Waiting for auth before fetching offers", {
        isAuthResolved,
        userId,
      });
      setOffers([]);
      setLoading(false);
      setHasFetchedOnce(false);
      return;
    }

    runFetch();
  }, [filtersKey, isReady, runFetch, isAuthResolved, userId, logger]);

  const fetchVisibilitySync = useCallback(() => {
    if (!isReady) {
      logger.debug("Visibility sync skipped: auth not ready", {
        isAuthResolved,
        userId,
      });
      return;
    }

    logger.debug("Visibility sync triggered → refreshing session and offers", {
      userId,
    });
    void refreshSession("shop-grid-visibility");
    runFetch();
  }, [
    isAuthResolved,
    isReady,
    logger,
    refreshSession,
    runFetch,
    userId,
  ]);

  useVisibilityRefetch(fetchVisibilitySync, {
    scope: "ShopGrid",
  });

  // Filtrage client sur "type" (string JSON → array)
  const filteredOffers = offers
    .filter((offer) => !!offer.image)
    .filter((offer) => {
      if (!safeFilters[1]) return true;

      let parsed: string[] = [];
      try {
        if (Array.isArray(offer.type)) {
          parsed = offer.type;
        } else if (typeof offer.type === "string") {
          parsed = JSON.parse(offer.type || "[]");
          if (!Array.isArray(parsed)) parsed = [parsed].filter(Boolean);
        }
      } catch {
        parsed = [];
      }

      return parsed.some((t) =>
        t.toLowerCase().includes(safeFilters[1].toLowerCase())
      );
    });

  return (
    <div className="relative mt-8">
      {filteredOffers.length === 0 && !loading && hasFetchedOnce && (
        <p className="text-center text-[#5D6494]">Aucun programme trouvé.</p>
      )}

      <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(270px,1fr))] justify-center">
        {filteredOffers.map((offer) => (
          <ShopCard
            key={offer.id}
            offer={{
              ...offer,
              type: Array.isArray(offer.type)
                ? offer.type
                : (() => {
                    try {
                      const parsed = JSON.parse(offer.type || "[]");
                      return Array.isArray(parsed) ? parsed : [parsed].filter(Boolean);
                    } catch {
                      return [];
                    }
                  })(),
            }}
          />
        ))}
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <span className="text-[#5D6494] font-semibold">Chargement...</span>
        </div>
      )}
    </div>
  );
}