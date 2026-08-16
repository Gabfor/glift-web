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
}

export default function StorePageClient({
  initialPrograms,
  initialTotalCount,
  initialUserProfile,
  initialIsAuthenticated
}: StorePageClientProps) {
  const [sortBy, setSortBy] = useState(() => {
    try { return sessionStorage.getItem("glift_store_sortBy") || "relevance"; } catch { return "relevance"; }
  });
  const [currentPage, setCurrentPage] = useState(() => {
    try { return Number.parseInt(sessionStorage.getItem("glift_store_page") || "1", 10) || 1; } catch { return 1; }
  });
  const [totalPrograms, setTotalPrograms] = useState(initialTotalCount);
  const [loadingCount, setLoadingCount] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [filters, setFilters] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem("glift_store_filters");
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return ["", "", "", "", "", "", ""];
  });
  const { user, isPremiumUser } = useUser();

  // Save to sessionStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem("glift_store_sortBy", sortBy);
      sessionStorage.setItem("glift_store_filters", JSON.stringify(filters));
      sessionStorage.setItem("glift_store_page", currentPage.toString());
    } catch { /* ignore */ }
  }, [sortBy, filters, currentPage]);

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
