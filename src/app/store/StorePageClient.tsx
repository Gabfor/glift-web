"use client";

import { useEffect, useState } from "react";
import StoreFilters from "@/components/store/StoreFilters";
import StoreGrid from "@/components/store/StoreGrid";
import LoadMore from "@/components/pagination/LoadMore";
import { createClient } from "@/lib/supabaseClient";
import { useUser } from "@/context/UserContext";
import { StoreProgram, StoreProfile } from "@/types/store";
import { haveStringArrayChanged } from "@/utils/arrayUtils";

interface StorePageClientProps {
  initialPrograms: StoreProgram[];
  initialTotalCount: number;
  initialUserProfile: StoreProfile | null;
  initialIsAuthenticated: boolean;
  initialFavorites?: string[];
  initialFilters?: string[];
}

export default function StorePageClient({
  initialPrograms,
  initialTotalCount,
  initialUserProfile,
  initialIsAuthenticated,
  initialFavorites = [],
  initialFilters = ["", "", "", "", "", "", ""],
}: StorePageClientProps) {
  const [sortBy, setSortBy] = useState("relevance");
  const [visibleCount, setVisibleCount] = useState(12);
  const [totalPrograms, setTotalPrograms] = useState(initialTotalCount);
  const [loadingCount, setLoadingCount] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [filters, setFilters] = useState<string[]>(() => {
    if (initialFilters && initialFilters.some((f) => f !== "")) {
      return initialFilters;
    }
    if (typeof window !== "undefined") {
      try {
        const savedToggle = localStorage.getItem("glift_store_included_only");
        if (savedToggle === "true") {
          document.cookie = "glift_store_included_only=true; path=/; max-age=31536000; SameSite=Lax";
          return ["", "", "", "", "", "", "Oui"];
        }
      } catch { /* ignore */ }
    }
    return initialFilters ?? ["", "", "", "", "", "", ""];
  });
  const [isRestored, setIsRestored] = useState(false);
  const { user, isPremiumUser } = useUser();

  // Restore from sessionStorage and localStorage on mount after hydration
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
      let restoredFilters = savedFilters ? JSON.parse(savedFilters) : ["", "", "", "", "", "", ""];
      if (!Array.isArray(restoredFilters) || restoredFilters.length < 7) {
        restoredFilters = ["", "", "", "", "", "", ""];
      }

      // Restore persisted toggle state ("Inclus avec mon abonnement") from localStorage
      const savedToggle = localStorage.getItem("glift_store_included_only");
      if (savedToggle === "true") {
        restoredFilters[6] = "Oui";
        document.cookie = "glift_store_included_only=true; path=/; max-age=31536000; SameSite=Lax";
      } else if (savedToggle === "false") {
        restoredFilters[6] = "";
        document.cookie = "glift_store_included_only=false; path=/; max-age=31536000; SameSite=Lax";
      } else if (initialFilters[6] === "Oui") {
        restoredFilters[6] = "Oui";
        localStorage.setItem("glift_store_included_only", "true");
        document.cookie = "glift_store_included_only=true; path=/; max-age=31536000; SameSite=Lax";
      }

      setFilters(restoredFilters);

      const savedFavs = sessionStorage.getItem("glift_store_favoritesOnly");
      if (savedFavs === "true") setFavoritesOnly(true);
    } catch {
      // ignore
    } finally {
      setIsRestored(true);
    }
  }, []);

  // Save to sessionStorage and localStorage on every change (only after initial restore)
  useEffect(() => {
    if (!isRestored) return;
    try {
      sessionStorage.setItem("glift_store_sortBy", sortBy);
      sessionStorage.setItem("glift_store_filters", JSON.stringify(filters));
      sessionStorage.setItem("glift_store_visibleCount", visibleCount.toString());
      sessionStorage.setItem("glift_store_favoritesOnly", String(favoritesOnly));

      // Persist the "Inclus avec mon abonnement" toggle in localStorage and cookie
      if (filters[6] === "Oui") {
        localStorage.setItem("glift_store_included_only", "true");
        document.cookie = "glift_store_included_only=true; path=/; max-age=31536000; SameSite=Lax";
      } else {
        localStorage.setItem("glift_store_included_only", "false");
        document.cookie = "glift_store_included_only=false; path=/; max-age=31536000; SameSite=Lax";
      }
    } catch { /* ignore */ }
  }, [sortBy, filters, visibleCount, favoritesOnly, isRestored]);

  return (
    <div className="max-w-[1152px] mx-auto">
      <StoreFilters
        sortBy={sortBy}
        initialFilters={filters}
        favoritesOnly={favoritesOnly}
        initialUserProfile={initialUserProfile}
        initialIsAuthenticated={initialIsAuthenticated}
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
        initialFilters={initialFilters}
        onCountChange={setTotalPrograms}
        onResetFavorites={() => {
          setFavoritesOnly(false);
          setVisibleCount(12);
        }}
        onResetFilters={() => {
          setFilters(["", "", "", "", "", "", ""]);
          try {
            sessionStorage.setItem("glift_store_filters", JSON.stringify(["", "", "", "", "", "", ""]));
            localStorage.setItem("glift_store_included_only", "false");
            document.cookie = "glift_store_included_only=false; path=/; max-age=31536000; SameSite=Lax";
          } catch { /* ignore */ }
          setVisibleCount(12);
        }}
        initialPrograms={
          visibleCount === 12 &&
          sortBy === "relevance" &&
          !favoritesOnly &&
          !haveStringArrayChanged(filters, initialFilters)
            ? initialPrograms
            : undefined
        }
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
