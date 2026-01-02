"use client";

import { useEffect, useRef, useState } from "react";
import ShopCard from "@/components/shop/ShopCard";
import ShopGridSkeleton from "@/components/shop/ShopGridSkeleton";
import { createClient } from "@/lib/supabaseClient";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";
import type { Database } from "@/lib/supabase/types";
import { haveStringArrayChanged } from "@/utils/arrayUtils";

type OfferRow = Database["public"]["Tables"]["offer_shop"]["Row"];
type OfferQueryRow = Pick<
  OfferRow,
  |
  "id"
  | "name"
  | "start_date"
  | "end_date"
  | "type"
  | "code"
  | "image"
  | "image_alt"
  | "brand_image"
  | "brand_image_alt"
  | "shop"
  | "shop_website"
  | "shop_link"
  | "shipping"
  | "premium"
  | "modal"
  | "condition"
  | "gender"
>;

type OfferId = OfferRow["id"];

type Offer = {
  id: OfferId;
  name: string;
  start_date: string;
  end_date: string;
  type: string[];
  code: string;
  image: string;
  image_alt: string;
  brand_image?: string;
  brand_image_alt?: string;
  shop?: string;
  shop_website?: string;
  shop_link?: string;
  shipping?: string;
  modal?: string;
  condition?: string;
  gender?: string;
};

const parseOfferTypes = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      return value.split(",").map((item: string) => item.trim());
    }
  }

  return [];
};

const mapOfferRowToOffer = (row: OfferQueryRow): Offer => ({
  id: row.id,
  name: row.name,
  start_date: row.start_date ?? "",
  end_date: row.end_date ?? "",
  type: parseOfferTypes(row.type),
  code: row.code ?? "",
  image: row.image,
  image_alt: row.image_alt ?? "",
  brand_image: row.brand_image ?? "",
  brand_image_alt: row.brand_image_alt ?? "",
  shop: row.shop ?? "",
  shop_website: row.shop_website ?? "",
  shop_link: row.shop_link ?? "",
  shipping: row.shipping ?? "",

  modal: row.modal ?? "",
  condition: row.condition ?? "",
  gender: row.gender ?? "",
});

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
  const showSkeleton = useMinimumVisibility(loading);
  const hasLoadedOnceRef = useRef(false);
  const previousQueryRef = useRef<{
    sortBy: string;
    currentPage: number;
    filters: string[];
  } | null>(null);

  const [userProfile, setUserProfile] = useState<{
    gender: string | null;
    main_goal: string | null;
  } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("gender, main_goal")
          .eq("id", user.id)
          .single();

        if (data) {
          setUserProfile(data);
        }
      }
    };
    fetchProfile();
  }, []);

  const getOrderForSortBy = (sortBy: string) => {
    switch (sortBy) {
      case "relevance":
        return { column: "", ascending: false }; // Client-side sort
      case "oldest":
        return { column: "start_date", ascending: true };
      case "expiration":
        return { column: "", ascending: true }; // Client-side sort (or mixed)
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
      haveStringArrayChanged(previousQuery.filters, filters);

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
    };

    let isActive = true;

    const fetchOffers = async () => {
      setLoading(true);
      const supabase = createClient();

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
          modal,
          shipping,
          modal,
          condition,
          gender
        `)
        .eq("status", "ON");

      if (filters[0]) {
        query = query.or(`gender.eq.${filters[0]},gender.eq.Tous`);
      }
      if (filters[2]) query = query.ilike("sport", filters[2]);
      if (filters[3]) query = query.eq("shop", filters[3]);

      // ➜ Appliquer tri Supabase sauf pour "expiration" et "relevance"
      let finalQuery = query;
      if (order.column) {
        finalQuery = finalQuery.order(order.column, { ascending: order.ascending });
      }

      // If Relevance, fetch ALL matching items to sort client-side
      // Otherwise paginate server-side
      const isClientSideSort = sortBy === "relevance";

      if (!isClientSideSort) {
        finalQuery = finalQuery.range(start, end);
      }

      const { data, error } = await finalQuery.returns<OfferQueryRow[]>();

      if (!isActive) {
        return;
      }

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
          normalized.sort((a, b) => {
            let scoreA = 0;
            let scoreB = 0;

            const goal = userProfile?.main_goal?.toLowerCase();
            const gender = userProfile?.gender?.toLowerCase();

            // Goal match (+5)
            if (goal && a.type.some((t) => t.toLowerCase() === goal)) {
              scoreA += 5;
            }
            if (goal && b.type.some((t) => t.toLowerCase() === goal)) {
              scoreB += 5;
            }

            // Gender match (+2)
            if (gender) {
              const offerGenderA = a.gender?.toLowerCase();
              const isWildcardA = offerGenderA && (offerGenderA === "tous" || offerGenderA === "mixte" || offerGenderA === "unisexe");

              if (isWildcardA || (offerGenderA && offerGenderA === gender)) {
                scoreA += 2;
              }

              const offerGenderB = b.gender?.toLowerCase();
              const isWildcardB = offerGenderB && (offerGenderB === "tous" || offerGenderB === "mixte" || offerGenderB === "unisexe");

              if (isWildcardB || (offerGenderB && offerGenderB === gender)) {
                scoreB += 2;
              }
            }

            return scoreB - scoreA;
          });

          // Apply pagination client-side
          // But wait, the component expects 'offers' to be the partial list?
          // The current code sets 'offers' state.
          // If I return only slice, pagination works.
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
  }, [sortBy, currentPage, filters]);

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
              <ShopCard key={offer.id} offer={offer} />
            ))}
          </div>

        </div>
      )}
    </>
  );
}
