"use client";

import { useEffect, useState } from "react";
import ShopCard from "@/components/shop/ShopCard";
import { createClient } from "@/lib/supabaseClient";

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

      const { data, error } = await finalQuery.range(start, end);

      if (sortBy === "expiration" && data) {
        data.sort((a, b) => {
          if (!a.end_date && !b.end_date) return 0;
          if (!a.end_date) return 1;
          if (!b.end_date) return -1;
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
        });
      }

      if (error) {
        console.error("Erreur Supabase :", error.message);
      } else {
        setOffers(data || []);
      }

      setLoading(false);
    };

    fetchOffers();
  }, [sortBy, currentPage, filters]);

  const filteredOffers = offers
    .filter((offer) => !!offer.image)
    .filter((offer) => {
      if (!filters[1]) return true;

      let parsed: string[] = [];

      try {
        if (Array.isArray(offer.type)) {
          parsed = offer.type;
        } else if (typeof offer.type === "string") {
          parsed = JSON.parse(offer.type);
        }
      } catch {
        parsed = [];
      }

      return parsed.some((t) =>
        t.toLowerCase().includes(filters[1].toLowerCase())
      );
    });

  return (
    <div className="relative mt-8">
      {filteredOffers.length === 0 && !loading && (
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
                    return Array.isArray(parsed) ? parsed : [parsed];
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
