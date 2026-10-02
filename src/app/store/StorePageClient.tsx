"use client";

import { useEffect, useState } from "react";
import StoreFilters from "@/components/store/StoreFilters";
import StoreGrid from "@/components/store/StoreGrid";
import LoadMore from "@/components/pagination/LoadMore";
import { createClient } from "@/lib/supabaseClient";
import { useUser } from "@/context/UserContext";
import { StoreProgram, StoreProfile } from "@/types/store";

interface StorePageClientProps {
  initialPrograms: StoreProgram[];
  initialTotalCount: number;
  initialUserProfile: StoreProfile | null;
  initialIsAuthenticated: boolean;
  initialFavorites?: string[];
}

export default function StorePageClient({
  initialPrograms,
  initialTotalCount,
  initialUserProfile,
  initialIsAuthenticated,
  initialFavorites = [],
}: StorePageClientProps) {
  const [sortBy, setSortBy] = useState("relevance");
  const [visibleCount, setVisibleCount] = useState(12);
  const [totalPrograms, setTotalPrograms] = useState(initialTotalCount);
  const [loadingCount, setLoadingCount] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [filters, setFilters] = useState<string[]>(["", "", "", "", "", "", ""]);
  const [isRestored, setIsRestored] = useState(false);
  const { user, isPremiumUser } = useUser();

  // Restore from sessionStorage on mount after hydration
  useEffect(() => {
    try {
      const savedSort = sessionStorage.getItem("glift_store_sortBy");
      if (savedSort) setSortBy(savedSort);

      const savedCount = sessionStorage.getItem("glift_store_visibleCount");
      if (savedCount) {
        const c = Number.parseInt(savedCount, 10);
        if (c) setVisibleCount(c);
      }

      const savedFilters = sessionStorage.getItem("glift_store_filters");
      if (savedFilters) setFilters(JSON.parse(savedFilters));

      const savedFavs = sessionStorage.getItem("glift_store_favoritesOnly");
      if (savedFavs === "true") setFavoritesOnly(true);
    } catch {
      // ignore
    } finally {
      setIsRestored(true);
    }
  }, []);

  // Save to sessionStorage on every change (only after initial restore)
  useEffect(() => {
    if (!isRestored) return;
    try {
      sessionStorage.setItem("glift_store_sortBy", sortBy);
      sessionStorage.setItem("glift_store_filters", JSON.stringify(filters));
      sessionStorage.setItem("glift_store_visibleCount", visibleCount.toString());
      sessionStorage.setItem("glift_store_favoritesOnly", String(favoritesOnly));
    } catch { /* ignore */ }
  }, [sortBy, filters, visibleCount, favoritesOnly, isRestored]);

  return (
    <div className="max-w-[1152px] mx-auto">
      <StoreFilters
        sortBy={sortBy}
        initialFilters={filters}
        favoritesOnly={favoritesOnly}
        onFavoritesOnlyToggle={() => {
          setFavoritesOnly((prev) => !prev);
          setVisibleCount(12);
        }}
        onSortChange={(value) => {
          setSortBy(value);
          setVisibleCount(12);
        }}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
          setVisibleCount(12);
        }}
      />
      <StoreGrid
        sortBy={sortBy}
        visibleCount={visibleCount}
        filters={filters}
        favoritesOnly={favoritesOnly}
        onCountChange={setTotalPrograms}
        onResetFavorites={() => {
          setFavoritesOnly(false);
          setVisibleCount(12);
        }}
        onResetFilters={() => {
          setFilters(["", "", "", "", "", "", ""]);
          setVisibleCount(12);
        }}
        initialPrograms={visibleCount === 12 && filters.every(f => f === "") && sortBy === "relevance" && !favoritesOnly ? initialPrograms : undefined}
        initialUserProfile={initialUserProfile}
        initialIsAuthenticated={initialIsAuthenticated}
        initialFavorites={initialFavorites}
      />
      <LoadMore
        currentCount={Math.min(visibleCount, totalPrograms)}
        totalCount={totalPrograms}
        onLoadMore={() => setVisibleCount((prev) => prev + 12)}
        label="programmes"
      />
    </div>
  );
}
