"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFilters from "@/components/store/StoreFilters";
import StoreGrid from "@/components/store/StoreGrid";
import StorePagination from "@/components/store/StorePagination";
import { createClient } from "@/lib/supabase/client";

export default function StorePage() {
  const LOG_PREFIX = "[StorePage]";
  const supabase = createClient();

  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPrograms, setTotalPrograms] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);
  const [filters, setFilters] = useState<string[]>(["", "", "", ""]);

  const filtersKey = useMemo(() => filters.join("|"), [filters]);

  useEffect(() => {
    console.log(LOG_PREFIX, "render", {
      sortBy,
      currentPage,
      filters,
      loadingCount,
      totalPrograms,
    });
  });

  const fetchTotalCount = useCallback(async () => {
    console.log(LOG_PREFIX, "fetchTotalCount:start", {
      sortBy,
      filters,
    });
    setLoadingCount(true);

    let query = supabase
      .from("program_store")
      .select("*", { count: "exact", head: true })
      .eq("status", "ON");

    // apply filters
    if (filters[0]) {
      query = query.in("gender", [filters[0], "Tous"]);
    }
    if (filters[1]) query = query.eq("goal", filters[1]);
    if (filters[2]) query = query.eq("level", filters[2]);
    if (filters[3]) query = query.eq("partner_name", filters[3]);

    console.log(LOG_PREFIX, "fetchTotalCount:query", {
      filters,
    });

    const { count, error } = await query;

    if (error) {
      console.error(
        LOG_PREFIX,
        "fetchTotalCount:error",
        error.message,
        error
      );
      setTotalPrograms(0);
    } else {
      console.log(LOG_PREFIX, "fetchTotalCount:success", {
        count,
      });
      setTotalPrograms(count || 0);
    }

    setLoadingCount(false);
    console.log(LOG_PREFIX, "fetchTotalCount:end", {
      count: error ? 0 : count || 0,
    });
  }, [supabase, filters, sortBy, LOG_PREFIX]);

  // Initial + on filters/sort change
  useEffect(() => {
    console.log(LOG_PREFIX, "effect:fetchTotalCount", {
      sortBy,
      filters,
      filtersKey,
    });
    fetchTotalCount();
  }, [fetchTotalCount, sortBy, filtersKey]);

  // Re-count when Supabase restores/refreshes a session (e.g., after sleep)
  useEffect(() => {
    console.log(LOG_PREFIX, "effect:onAuthStateChange:subscribe");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      console.log(LOG_PREFIX, "auth:event", event);
      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED"
      ) {
        console.log(LOG_PREFIX, "auth:event triggers recount", event);
        fetchTotalCount();
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase, fetchTotalCount]);

  useEffect(() => {
    console.log(LOG_PREFIX, "loadingCount", loadingCount);
  }, [loadingCount]);

  useEffect(() => {
    console.log(LOG_PREFIX, "totalPrograms", totalPrograms);
  }, [totalPrograms]);

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[60px]">
      <div className="max-w-[1152px] mx-auto">
        <StoreHeader />

        <StoreFilters
          sortBy={sortBy}
          onSortChange={(value) => {
            console.log(LOG_PREFIX, "onSortChange", {
              previous: sortBy,
              next: value,
            });
            setSortBy(value);
            setCurrentPage(1);
          }}
          onFiltersChange={(newFilters) => {
            console.log(LOG_PREFIX, "onFiltersChange", {
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
