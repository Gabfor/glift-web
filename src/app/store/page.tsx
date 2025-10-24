"use client";

import { useEffect, useState } from "react";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFilters from "@/components/store/StoreFilters";
import StoreGrid from "@/components/store/StoreGrid";
import Pagination from "@/components/pagination/Pagination";
import { createClient } from "@/lib/supabaseClient";

export default function StorePage() {
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPrograms, setTotalPrograms] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);
  const [filters, setFilters] = useState(["", "", "", ""]);

  // Fetch total count of ON programs once (or when sort/filter changes)
  useEffect(() => {
  const fetchTotalCount = async () => {
    setLoadingCount(true);
    const supabase = createClient();

    let query = supabase
      .from('program_store')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ON');

    // appliquer les filtres s'ils sont actifs
    if (filters[0]) {
      query = query.in('gender', [filters[0], 'Tous']);
    }
    if (filters[1]) query = query.eq('goal', filters[1]);
    if (filters[2]) query = query.eq('level', filters[2]);
    if (filters[3]) query = query.eq('partner_name', filters[3]);

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
        <StoreHeader />
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
        />
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
