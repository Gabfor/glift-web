"use client";

import { useEffect, useState } from "react";
import ShopHeader from "@/components/shop/ShopHeader";
import ShopFilters from "@/components/shop/ShopFilters";
import ShopGrid from "@/components/shop/ShopGrid";
import Pagination from "@/components/pagination/Pagination";
import { createClient } from "@/lib/supabaseClient";
import type { Database } from "@/lib/supabase/types";
import dynamic from "next/dynamic";

const ShopBannerSlider = dynamic(() => import("@/components/ShopBannerSliderClient"), {
  ssr: false,
});

type OfferRow = Database["public"]["Tables"]["offer_shop"]["Row"];
type OfferTypeRow = Pick<OfferRow, "type">;
type OfferSportRow = Pick<OfferRow, "sport">;

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

      if (typeof parsed === "string") {
        return [parsed];
      }
    } catch {
      return value.split(",").map((entry: string) => entry.trim());
    }
  }

  return [];
};

export default function ShopPage() {
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPrograms, setTotalPrograms] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);
  const [filters, setFilters] = useState(["", "", "", ""]);
  const [typeOptions, setTypeOptions] = useState<string[]>([]);
  const [sportOptions, setSportOptions] = useState<string[]>([]);

  // ✅ Charger les types uniques au montage
  useEffect(() => {
    const fetchOfferTypes = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("offer_shop")
        .select("type")
        .eq("status", "ON")
        .returns<OfferTypeRow[]>();

      if (error || !data) return;

      const allTypes: string[] = [];

      data.forEach((item) => {
        const parsed = parseOfferTypes(item.type);
        allTypes.push(...parsed);
      });

      const uniqueTypes = [...new Set(allTypes)];
      setTypeOptions(uniqueTypes);
    };

    const fetchSports = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("offer_shop")
        .select("sport")
        .eq("status", "ON")
        .returns<OfferSportRow[]>();

      if (error || !data) return;

      const sports = data
        .map((item) => item.sport?.trim())
        .filter((v): v is string => Boolean(v && v.length > 0));

      const uniqueSports = [...new Set(sports)];
      setSportOptions(uniqueSports);
    };

    fetchOfferTypes();
    fetchSports();
  }, []);

  // ✅ Compter les offres filtrées
  useEffect(() => {
    const fetchTotalCount = async () => {
      setLoadingCount(true);
      const supabase = createClient();

      let query = supabase
        .from("offer_shop")
        .select("*", { count: "exact", head: true })
        .eq("status", "ON");

      if (filters[0]) {
        query = query.or(`gender.eq.${filters[0]},gender.eq.Tous`);
      }
      if (filters[1]) query = query.ilike("type", `%${filters[1]}%`);
      if (filters[2]) query = query.ilike("sport", filters[2]);
      if (filters[3]) query = query.eq("shop", filters[3]);

      const { count, error } = await query;

      if (error) {
        console.error("Erreur lors du comptage des programmes :", error.message);
        setTotalPrograms(0);
      } else {
        setTotalPrograms(count || 0);
      }

      setLoadingCount(false);
    };

    fetchTotalCount();
  }, [sortBy, filters]);

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[60px]">
      <div className="max-w-[1152px] mx-auto">
        <ShopHeader />
      </div>
      <ShopBannerSlider />
      <div className="max-w-[1152px] mx-auto">
      <ShopFilters
        sortBy={sortBy}
        onSortChange={(value) => {
          setSortBy(value);
          setCurrentPage(1);
        }}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
          setCurrentPage(1);
        }}
        typeOptions={typeOptions}
        sportOptions={sportOptions}
      />
        <ShopGrid sortBy={sortBy} currentPage={currentPage} filters={filters} />
        {!loadingCount && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalPrograms}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </div>
    </main>
  );
}
