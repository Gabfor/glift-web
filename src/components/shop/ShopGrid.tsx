"use client";

import { useEffect, useState } from "react";
import ShopCard from "@/components/shop/ShopCard";
import ShopGridSkeleton from "@/components/shop/ShopGridSkeleton";
import { createClient } from "@/lib/supabaseClient";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";
import type { Database } from "@/lib/supabase/types";

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
>;

type Offer = {
  id: number;
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
  premium: boolean;
  modal?: string;
  condition?: string;
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
  premium: Boolean(row.premium),
  modal: row.modal ?? "",
  condition: row.condition ?? "",
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

  const getOrderForSortBy = (sortBy: string) => {
    switch (sortBy) {
      case "popularity":
        return { column: "downloads", ascending: false };
      case "oldest":
        return { column: "created_at", ascending: true };
      case "expiration":
        return { column: "", ascending: true };
      case "newest":
      default:
        return { column: "created_at", ascending: false };
    }
  };

  useEffect(() => {
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
          premium,
          modal,
          condition
        `)
        .eq("status", "ON");

      if (filters[0]) {
        query = query.or(`gender.eq.${filters[0]},gender.eq.Tous`);
      }
      if (filters[2]) query = query.ilike("sport", filters[2]);
      if (filters[3]) query = query.eq("shop", filters[3]);

      // ➜ Appliquer tri Supabase sauf pour "expiration"
      let finalQuery = query;
      if (order.column) {
        finalQuery = finalQuery.order(order.column, { ascending: order.ascending });
      }

      const { data, error } = await finalQuery
        .range(start, end)
        .returns<OfferQueryRow[]>();

      if (error) {
        console.error("Erreur Supabase :", error.message);
      } else {
        const normalized = (data ?? []).map(mapOfferRowToOffer);

        if (sortBy === "expiration") {
          normalized.sort((a, b) => {
            if (!a.end_date && !b.end_date) return 0;
            if (!a.end_date) return 1;
            if (!b.end_date) return -1;
            return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
          });
        }

        setOffers(normalized);
      }

      setLoading(false);
    };

    fetchOffers();
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
            <p className="text-center text-[#5D6494]">Aucun programme trouvé.</p>
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
