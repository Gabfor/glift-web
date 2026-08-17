"use client";

import { useEffect, useState } from "react";
import StoreFilters from "@/components/store/StoreFilters";
import StoreGrid from "@/components/store/StoreGrid";
import Pagination from "@/components/pagination/Pagination";
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
  const [currentPage, setCurrentPage] = useState(1);
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

      const savedPage = sessionStorage.getItem("glift_store_page");
      if (savedPage) {
        const p = Number.parseInt(savedPage, 10);
        if (p) setCurrentPage(p);
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
      sessionStorage.setItem("glift_store_page", currentPage.toString());
      sessionStorage.setItem("glift_store_favoritesOnly", String(favoritesOnly));
    } catch { /* ignore */ }
  }, [sortBy, filters, currentPage, favoritesOnly, isRestored]);

  return (
    <div className="max-w-[1152px] mx-auto">
      <StoreFilters
        sortBy={sortBy}
        initialFilters={filters}
        favoritesOnly={favoritesOnly}
        onFavoritesOnlyToggle={() => {
          setFavoritesOnly((prev) => !prev);
          setCurrentPage(1);
        }}
        onSortChange={(value) => {
          setSortBy(value);
          setCurrentPage(1);
        }}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
          setCurrentPage(1);
        }}
      />
      <StoreGrid
        sortBy={sortBy}
        currentPage={currentPage}
        filters={filters}
        favoritesOnly={favoritesOnly}
        onCountChange={setTotalPrograms}
        initialPrograms={currentPage === 1 && filters.every(f => f === "") && sortBy === "relevance" && !favoritesOnly ? initialPrograms : undefined}
        initialUserProfile={initialUserProfile}
        initialIsAuthenticated={initialIsAuthenticated}
        initialFavorites={initialFavorites}
      />
      {totalPrograms > 8 && (
        <div className="hidden md:block">
          <Pagination
            currentPage={currentPage}
            totalItems={totalPrograms}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
}
