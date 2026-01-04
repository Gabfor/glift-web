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
  | "modal"
  | "condition"
  | "gender"
  | "boost"
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
  boost?: boolean;
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
  boost: row.boost ?? false,
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
    supplements: string | null;
  } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("gender, main_goal, supplements")
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
          condition,
          gender,
          boost
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

      // If Relevance or Expiration, fetch ALL matching items to sort client-side
      // Otherwise paginate server-side
      const isClientSideSort = sortBy === "relevance" || sortBy === "expiration";

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

            const gender = userProfile?.gender?.toLowerCase();
            const supplements = userProfile?.supplements; // "Oui" or "Non" typically, or null

            // 1. Gender Rules
            if (gender) {
              const checkGenderScore = (offerGender: string | undefined): number => {
                const g = offerGender?.toLowerCase();
                const isWildcard = g === "tous" || g === "mixte" || g === "unisexe";

                if (gender === "homme") {
                  if (g === "homme" || isWildcard) return 5;
                  if (g === "femme") return -5;
                } else if (gender === "femme") {
                  if (g === "femme" || isWildcard) return 5;
                  if (g === "homme") return -5;
                } else if (gender === "non binaire" || gender === "non-binaire") {
                  if (isWildcard) return 3;
                }
                return 0;
              };

              scoreA += checkGenderScore(a.gender);
              scoreB += checkGenderScore(b.gender);
            }

            // 2. Supplements Rule
            const isSupplement = (types: string[]) => types.some(t => t.toLowerCase().includes("complément"));

            if (supplements === "Oui") {
              if (isSupplement(a.type)) scoreA += 5;
              if (isSupplement(b.type)) scoreB += 5;
            } else if (supplements === "Non") {
              if (isSupplement(a.type)) scoreA -= 5;
              if (isSupplement(b.type)) scoreB -= 5;
            }

            // 3. Boost Rule
            if (a.boost) scoreA += 5;
            if (b.boost) scoreB += 5;

            // 4. Expiration Rule
            const getExpirationScore = (endDateStr: string): number => {
              if (!endDateStr) return 0;
              const now = new Date().getTime();
              const end = new Date(endDateStr).getTime();
              const diffHours = (end - now) / (1000 * 60 * 60);

              if (diffHours <= 24 && diffHours > 0) return 2;
              if (diffHours > 24 && diffHours <= 72) return 1;
              return 0;
            };

            scoreA += getExpirationScore(a.end_date);
            scoreB += getExpirationScore(b.end_date);

            if (scoreA !== scoreB) {
              return scoreB - scoreA;
            }

            // Tie-breaker 1: Expiration Date (Ascending - ends soonest first)
            // Use a far future date if no end date
            const dateA = a.end_date ? new Date(a.end_date).getTime() : 8640000000000;
            const dateB = b.end_date ? new Date(b.end_date).getTime() : 8640000000000;

            if (dateA !== dateB) {
              return dateA - dateB;
            }

            // Tie-breaker 2: Name (Alphabetical)
            return a.name.localeCompare(b.name);
          });
        }

        if (isClientSideSort) {
          // Apply pagination client-side for relevance and expiration
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
