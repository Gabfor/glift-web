"use client";

import { useEffect, useState } from "react";
import StoreFilters from "@/components/store/StoreFilters";
import StoreGrid from "@/components/store/StoreGrid";
import Pagination from "@/components/pagination/Pagination";
import { createClient } from "@/lib/supabaseClient";
import { useUser } from "@/context/UserContext";
import { StoreProgram } from "@/types/store";

interface StorePageClientProps {
  initialPrograms: StoreProgram[];
  initialTotalCount: number;
}

export default function StorePageClient({
  initialPrograms,
  initialTotalCount
}: StorePageClientProps) {
  const [sortBy, setSortBy] = useState("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPrograms, setTotalPrograms] = useState(initialTotalCount);
  const [loadingCount, setLoadingCount] = useState(false);
  const [filters, setFilters] = useState(["", "", "", "", "", ""]);
  const { user, isPremiumUser } = useUser();

  // Fetch total count of ON programs once (or when sort/filter changes)
  useEffect(() => {
    // Skip initial fetch since it's provided by SSR
    if (currentPage === 1 && filters.every(f => f === "") && sortBy === "relevance") {
      return;
    }

    const fetchTotalCount = async () => {
      setLoadingCount(true);
      const supabase = createClient();

      let query = supabase
        .from("program_store")
        .select("*", { count: "exact", head: true })
        .eq("status", "ON");

      const [
        genderFilter,
        goalFilter,
        levelFilter,
        locationFilter,
        durationFilter,
        availabilityFilter,
      ] = filters;

      // appliquer les filtres s'ils sont actifs
      if (genderFilter) {
        query = query.in("gender", [genderFilter, "Tous"]);
      }
      if (goalFilter) query = query.eq("goal", goalFilter);
      if (levelFilter) {
        query = query.in("level", [levelFilter, "Tous niveaux"]);
      }
      if (locationFilter) query = query.eq("location", locationFilter);
      if (durationFilter) {
        const maxDuration = Number.parseInt(durationFilter, 10);
        if (!Number.isNaN(maxDuration)) {
          query = query.lte("duration", maxDuration);
        }
      }
      if (availabilityFilter === "Oui") {
        if (!user || !isPremiumUser) {
          query = query.eq("plan", "starter");
        }
      }

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
  }, [sortBy, filters, user, isPremiumUser, currentPage]);

  return (
    <div className="max-w-[1152px] mx-auto">
      <StoreFilters
        sortBy={sortBy}
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
        initialPrograms={currentPage === 1 && filters.every(f => f === "") && sortBy === "relevance" ? initialPrograms : undefined}
      />
      {!loadingCount && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalPrograms}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </div>
  );
}
