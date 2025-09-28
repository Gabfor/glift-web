"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFilters from "@/components/store/StoreFilters";
import StoreGrid from "@/components/store/StoreGrid";
import StorePagination from "@/components/store/StorePagination";
import { useVisibilityRefetch } from "@/hooks/useVisibilityRefetch";
import { useSessionAwareClient } from "@/hooks/useSessionAwareClient";

export default function StorePage() {
  const logPrefix = "[StorePage]";
  const { supabase, status, sessionVersion, user } = useSessionAwareClient();
  const userId = user?.id ?? null;

  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPrograms, setTotalPrograms] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);
  const [filters, setFilters] = useState<string[]>(["", "", "", ""]);

  const safeFilters = useMemo<string[]>(
    () => (Array.isArray(filters) ? filters : []),
    [filters]
  );
  const filtersKey = useMemo(() => safeFilters.join("|"), [safeFilters]);

  const fetchTotalCount = useCallback(
    async (reason: string) => {
      console.log(`${logPrefix} fetchTotalCount`, {
        status,
        sessionVersion,
        userId,
        sortBy,
        filters: safeFilters,
        reason,
      });
      if (status !== "authenticated" || !userId) {
        console.log(`${logPrefix} fetchTotalCount skipped`, {
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
        .from("program_store")
        .select("*", { count: "exact", head: true })
        .eq("status", "ON");
      if (safeFilters[0]) {
        query = query.in("gender", [safeFilters[0], "Tous"]);
      }
      if (safeFilters[1]) query = query.eq("goal", safeFilters[1]);
      if (safeFilters[2]) query = query.eq("level", safeFilters[2]);
      if (safeFilters[3]) query = query.eq("partner_name", safeFilters[3]);
      const { count, error } = await query;
      if (error) {
        console.error(`${logPrefix} fetchTotalCount error`, error.message, error);
        setTotalPrograms(0);
      } else {
        setTotalPrograms(count || 0);
      }
      setLoadingCount(false);
    },
    [logPrefix, safeFilters, sessionVersion, sortBy, status, supabase, userId]
  );

  useEffect(() => {
    void fetchTotalCount("deps-change");
  }, [fetchTotalCount, filtersKey]);

  useVisibilityRefetch(() => {
    if (status !== "authenticated" || !userId) {
      console.log(`${logPrefix} visibility skipped`, {
        status,
        sessionVersion,
        userId,
      });
      return;
    }
    console.log(`${logPrefix} visibility refetch`, {
      status,
      sessionVersion,
      userId,
    });
    void fetchTotalCount("visibility");
  });

  useEffect(() => {
    console.log(`${logPrefix} state snapshot`, {
      sortBy,
      currentPage,
      filters,
      loadingCount,
      totalPrograms,
      status,
      sessionVersion,
      userId,
    });
  });

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[60px]">
      <div className="max-w-[1152px] mx-auto">
        <StoreHeader />

        <StoreFilters
          sortBy={sortBy}
          onSortChange={(value) => {
            console.log(`${logPrefix} onSortChange`, {
              previous: sortBy,
              next: value,
            });
            setSortBy(value);
            setCurrentPage(1);
          }}
          onFiltersChange={(newFilters) => {
            console.log(`${logPrefix} onFiltersChange`, {
              previous: filters,
              next: newFilters,
            });
            setFilters(newFilters);
            setCurrentPage(1);
          }}
        />

        <StoreGrid sortBy={sortBy} currentPage={currentPage} filters={filters} />

        {!loadingCount && (
          <StorePagination
            currentPage={currentPage}
            totalPrograms={totalPrograms}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </div>
    </main>
  );
}
