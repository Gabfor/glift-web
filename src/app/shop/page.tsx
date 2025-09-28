"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import ShopHeader from "@/components/shop/ShopHeader";
import ShopFilters from "@/components/shop/ShopFilters";
import ShopGrid from "@/components/shop/ShopGrid";
import ShopPagination from "@/components/shop/ShopPagination";
import { createScopedLogger } from "@/utils/logger";
import { useVisibilityRefetch } from "@/hooks/useVisibilityRefetch";
import { useSessionAwareClient } from "@/hooks/useSessionAwareClient";

const ShopBannerSlider = dynamic(() => import("@/components/ShopBannerSliderClient"), {
  ssr: false,
});

export default function ShopPage() {
  const logger = createScopedLogger("ShopPage");
  const { supabase, status, sessionVersion, user, refreshSession } = useSessionAwareClient();
  const userId = user?.id ?? null;

  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPrograms, setTotalPrograms] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);
  const [filters, setFilters] = useState<string[]>(["", "", "", ""]);
  const [typeOptions, setTypeOptions] = useState<string[]>([]);
  const [sportOptions, setSportOptions] = useState<string[]>([]);

  const safeFilters = useMemo<string[]>(
    () => (Array.isArray(filters) ? filters : []),
    [filters]
  );

  const fetchOfferTypes = useCallback(
    async (reason: string) => {
      console.log("[ShopPage] fetchOfferTypes", {
        status,
        sessionVersion,
        userId,
        reason,
      });
      if (status !== "authenticated" || !userId) {
        console.log("[ShopPage] fetchOfferTypes skipped", {
          status,
          sessionVersion,
          userId,
        });
        setTypeOptions([]);
        return;
      }
      const { data, error } = await supabase
        .from("offer_shop")
        .select("type")
        .eq("status", "ON");
      if (error || !data) {
        logger.error("fetchOfferTypes error", error?.message ?? "unknown");
        setTypeOptions([]);
        return;
      }
      const collected: string[] = [];
      data.forEach((item) => {
        const raw = (item as any).type;
        try {
          if (Array.isArray(raw)) {
            raw.forEach((value) => {
              if (typeof value === "string") collected.push(value.trim());
            });
          } else if (typeof raw === "string") {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                parsed.forEach((value) => {
                  if (typeof value === "string") collected.push(value.trim());
                });
              } else if (typeof parsed === "string") {
                collected.push(parsed.trim());
              }
            } catch {
              raw
                .split(",")
                .map((value) => value.trim())
                .forEach((value) => {
                  if (value.length > 0) collected.push(value);
                });
            }
          }
        } catch {
          return;
        }
      });
      setTypeOptions([...new Set(collected)]);
    },
    [logger, sessionVersion, status, supabase, userId]
  );

  const fetchSports = useCallback(
    async (reason: string) => {
      console.log("[ShopPage] fetchSports", {
        status,
        sessionVersion,
        userId,
        reason,
      });
      if (status !== "authenticated" || !userId) {
        console.log("[ShopPage] fetchSports skipped", {
          status,
          sessionVersion,
          userId,
        });
        setSportOptions([]);
        return;
      }
      const { data, error } = await supabase
        .from("offer_shop")
        .select("sport")
        .eq("status", "ON");
      if (error || !data) {
        logger.error("fetchSports error", error?.message ?? "unknown");
        setSportOptions([]);
        return;
      }
      const sports = data
        .map((item: any) => item.sport?.trim())
        .filter((value: string | undefined) => value && value.length > 0) as string[];
      setSportOptions([...new Set(sports)]);
    },
    [logger, sessionVersion, status, supabase, userId]
  );

  const refreshFilters = useCallback(
    async (reason: string) => {
      await Promise.all([fetchOfferTypes(reason), fetchSports(reason)]);
    },
    [fetchOfferTypes, fetchSports]
  );

  useEffect(() => {
    void refreshFilters("effect");
  }, [refreshFilters]);

  const fetchTotalCount = useCallback(
    async (reason: string) => {
      console.log("[ShopPage] fetchTotalCount", {
        status,
        sessionVersion,
        userId,
        sortBy,
        filters: safeFilters,
        reason,
      });
      if (status !== "authenticated" || !userId) {
        console.log("[ShopPage] fetchTotalCount skipped", {
          status,
          sessionVersion,
          userId,
        });
        setTotalPrograms(0);
        setLoadingCount(false);
        return;
      }
      setLoadingCount(true);
      let query = supabase
        .from("offer_shop")
        .select("*", { count: "exact", head: true })
        .eq("status", "ON");
      if (safeFilters[0]) {
        query = query.or(`gender.eq.${safeFilters[0]},gender.eq.Tous`);
      }
      if (safeFilters[1]) query = query.ilike("type", `%${safeFilters[1]}%`);
      if (safeFilters[2]) query = query.ilike("sport", safeFilters[2]);
      if (safeFilters[3]) query = query.eq("shop", safeFilters[3]);
      const { count, error } = await query;
      if (error) {
        logger.error("fetchTotalCount error", error.message);
        setTotalPrograms(0);
      } else {
        setTotalPrograms(count || 0);
      }
      setLoadingCount(false);
    },
    [logger, safeFilters, sessionVersion, sortBy, status, supabase, userId]
  );

  useEffect(() => {
    void fetchTotalCount("deps-change");
  }, [fetchTotalCount]);

  const handleVisibilitySync = useCallback(() => {
    if (status !== "authenticated" || !userId) {
      console.log("[ShopPage] visibility skipped", {
        status,
        sessionVersion,
        userId,
      });
      return;
    }
    console.log("[ShopPage] visibility refetch", {
      status,
      sessionVersion,
      userId,
    });
    void refreshSession("shop-visibility");
    void refreshFilters("visibility");
    void fetchTotalCount("visibility");
  }, [fetchTotalCount, refreshFilters, refreshSession, sessionVersion, status, userId]);

  useVisibilityRefetch(handleVisibilitySync, 1500);

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
          <ShopPagination
            currentPage={currentPage}
            totalPrograms={totalPrograms}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </div>
    </main>
  );
}
