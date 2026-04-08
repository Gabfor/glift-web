"use client";

import { useEffect, useRef, useState } from "react";
import ShopCard from "@/components/shop/ShopCard";
import ShopGridSkeleton from "@/components/shop/ShopGridSkeleton";
import { createClient } from "@/lib/supabaseClient";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";
import type { Database } from "@/lib/supabase/types";
import { haveStringArrayChanged } from "@/utils/arrayUtils";
import { useUser } from "@/context/UserContext";

import { mapOfferRowToOffer, OfferQueryRow } from "@/utils/shopUtils";

import { ShopOffer, ShopProfile } from "@/types/shop";
import { sortOffersByRelevance } from "@/utils/sortingUtils";

export default function ShopGrid({
  sortBy,
  currentPage,
  filters,
  onOfferClick,
  initialOffers = [],
}: {
  sortBy: string;
  currentPage: number;
  filters: string[];
  onOfferClick: (offer: ShopOffer) => void;
  initialOffers?: ShopOffer[];
}) {
  const [offers, setOffers] = useState<ShopOffer[]>(initialOffers);
  const [loading, setLoading] = useState(initialOffers.length === 0);
  const showSkeleton = useMinimumVisibility(loading);
  const hasLoadedOnceRef = useRef(initialOffers.length > 0);

  const [userProfile, setUserProfile] = useState<ShopProfile | null>(null);
  const { user, isLoading: isUserContextLoading } = useUser();

  const previousQueryRef = useRef<{
    sortBy: string;
    currentPage: number;
    filters: string[];
    userProfile: ShopProfile | null;
  } | null>(initialOffers.length > 0 ? {
    sortBy,
    currentPage,
    filters: [...filters],
    userProfile: null
  } : null);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("gender, main_goal, supplements")
          .eq("id", user.id)
          .single();

        if (data) {
          setUserProfile(data);
        }
      } else {
        setUserProfile(null);
      }
    };
    if (!isUserContextLoading) {
      fetchProfile();
    }
  }, [user, isUserContextLoading]);

  const getOrderForSortBy = (sortBy: string) => {
    switch (sortBy) {
      case "relevance":
        return { column: "", ascending: false }; // Client-side sort
      case "popularity":
        return { column: "click_count", ascending: false };
      case "oldest":
        return { column: "start_date", ascending: true };
      case "expiration":
        return { column: "", ascending: true }; // Client-side sort
      case "newest":
      default:
        return { column: "start_date", ascending: false };
    }
  };

  useEffect(() => {
    const previousQuery = previousQueryRef.current;
    const hasQueryChanged =
      !previousQuery ||
      previousQuery.sortBy !== sortBy ||
      previousQuery.currentPage !== currentPage ||
      haveStringArrayChanged(previousQuery.filters, filters) ||
      previousQuery.userProfile !== userProfile;

    const shouldSkipFetch =
      previousQuery !== null &&
      !hasQueryChanged &&
      hasLoadedOnceRef.current;

    if (shouldSkipFetch) {
      return;
    }

    previousQueryRef.current = {
      sortBy,
      currentPage,
      filters: [...filters],
      userProfile,
    };

    let isActive = true;

    const fetchOffers = async () => {
      // ✅ LOADING LOGIC: stay in skeleton while UserContext is syncing
      const isInitialSync = !hasLoadedOnceRef.current;
      const isProfileSyncing = isUserContextLoading;

      const queryChangedMaturity = previousQuery && (
        previousQuery.sortBy !== sortBy || 
        previousQuery.currentPage !== currentPage || 
        haveStringArrayChanged(previousQuery.filters, filters)
      );

      if (isInitialSync || queryChangedMaturity) {
        setLoading(true);
      }

      const supabase = createClient();
      const start = (currentPage - 1) * 8;
      const end = start + 7;
      const order = getOrderForSortBy(sortBy);

      let query = supabase
        .from("offer_shop")
        .select(`
          id, name, start_date, end_date, type, code, image, image_alt, 
          brand_image, brand_image_alt, shop, shop_website, shop_link, 
          shipping, modal, condition, gender, boost, click_count, created_at
        `)
        .eq("status", "ON");

      if (filters[0]) {
        query = query.or(`gender.eq.${filters[0]},gender.eq.Tous`);
      }
      if (filters[2]) query = query.filter("sport", "cs", JSON.stringify([filters[2]]));
      if (filters[3]) query = query.eq("shop", filters[3]);

      let finalQuery = query;
      if (sortBy === "popularity") {
        finalQuery = finalQuery
          .order("click_count", { ascending: false })
          .order("created_at", { ascending: false })
          .order("name", { ascending: true });
      } else if (order.column) {
        finalQuery = finalQuery.order(order.column, { ascending: order.ascending });
      }

      const isClientSideSort = sortBy === "relevance" || sortBy === "expiration";
      if (!isClientSideSort) {
        finalQuery = finalQuery.range(start, end);
      }

      const { data, error } = await finalQuery.returns<OfferQueryRow[]>();

      if (!isActive) return;

      if (error) {
        console.error("Erreur Supabase :", error.message);
      } else {
        let normalized = (data ?? []).map(mapOfferRowToOffer);

        if (sortBy === "expiration") {
          normalized.sort((a, b) => {
            if (!a.end_date && !b.end_date) return 0;
            if (!a.end_date) return 1;
            if (!b.end_date) return -1;
            return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
          });
        }

        if (sortBy === "relevance") {
          // ✅ SESSION PERSISTENCE:
          const sessionKey = `shop_relevance_order_${user?.id || 'guest'}`;
          const savedOrder = sessionStorage.getItem(sessionKey);
          
          if (savedOrder && !queryChangedMaturity) {
            const orderIds = JSON.parse(savedOrder) as string[];
            normalized.sort((a, b) => {
              const indexA = orderIds.indexOf(a.id);
              const indexB = orderIds.indexOf(b.id);
              if (indexA === -1 || indexB === -1) return 0;
              return indexA - indexB;
            });
          } else {
            normalized = sortOffersByRelevance(normalized, userProfile);
            const orderIds = normalized.map(o => o.id);
            sessionStorage.setItem(sessionKey, JSON.stringify(orderIds));
          }
        }

        if (isClientSideSort) {
          normalized = normalized.slice(start, end + 1);
        }

        setOffers(normalized);
      }

      hasLoadedOnceRef.current = true;
      setLoading(false);
    };

    void fetchOffers();

    return () => {
      isActive = false;
    };
  }, [sortBy, currentPage, filters, userProfile, isUserContextLoading]);

  const filteredOffers = offers
    .filter((offer) => Boolean(offer.image))
    .filter((offer) => {
      if (!filters[1]) return true;

      return offer.type.some((t) =>
        t.toLowerCase().includes(filters[1].toLowerCase())
      );
    });

  return (
    <>
      {showSkeleton ? (
        <ShopGridSkeleton />
      ) : (
        <div className="relative mt-8">
          {filteredOffers.length === 0 && !loading && (
            <p className="text-center text-[#5D6494] font-semibold">
              Aucune offre trouvée.
            </p>
          )}

          <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(270px,1fr))] justify-center">
            {filteredOffers.map((offer) => (
              <ShopCard key={offer.id} offer={offer} onOfferClick={onOfferClick} />
            ))}
          </div>

        </div>
      )}
    </>
  );
}
