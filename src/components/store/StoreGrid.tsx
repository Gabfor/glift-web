"use client";

import { useEffect, useState } from "react";
import StoreCard from "@/components/store/StoreCard";
import GliftLoader from "@/components/ui/GliftLoader";
import { createClient } from "@/lib/supabaseClient";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";

type Program = {
  id: number;
  title: string;
  level: string;
  sessions: string;
  duration: string;
  description: string;
  image: string;
  image_alt: string;
  partner_image?: string;
  partner_image_alt?: string;
  partner_link?: string;
  link?: string;
  downloads?: number;
  created_at?: string;
  goal?: string;
  gender?: string;
  partner_name?: string;
};

export default function StoreGrid({
  sortBy,
  currentPage,
  filters
}: {
  sortBy: string;
  currentPage: number;
  filters: string[];
}) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const showLoader = useMinimumVisibility(loading);

  const getOrderForSortBy = (sortBy: string) => {
    switch (sortBy) {
      case "popularity":
        return { column: "downloads", ascending: false };
      case "oldest":
        return { column: "created_at", ascending: true };
      case "newest":
      default:
        return { column: "created_at", ascending: false };
    }
  };

  // ➜ Auth check once on load
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });
  }, []);

  // ➜ Fetch programs
  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true);
      const supabase = createClient();

      const start = (currentPage - 1) * 8;
      const end = start + 7;

      const order = getOrderForSortBy(sortBy);

      let query = supabase
        .from('program_store')
        .select(`
          id,
          title,
          level,
          goal,
          gender,
          sessions,
          duration,
          description,
          image,
          image_alt,
          partner_image,
          partner_image_alt,
          partner_link,
          link,
          downloads,
          created_at
        `)
        .eq('status', 'ON');

      // Apply filters if active
      if (filters[0]) {
        query = query.or(`gender.eq.${filters[0]},gender.eq.Tous`);
      }
      if (filters[1]) query = query.eq('goal', filters[1]);
      if (filters[2]) query = query.eq('level', filters[2]);
      if (filters[3]) query = query.eq('partner_name', filters[3]);

      const { data, error } = await query
        .order(order.column, { ascending: order.ascending })
        .range(start, end);

      if (error) {
        console.error("Erreur Supabase :", error.message);
      } else {
        setPrograms(data || []);
      }

      setLoading(false);
    };

    fetchPrograms();
  }, [sortBy, currentPage, filters]);

  return (
    <>
      {showLoader && <GliftLoader />}
      <div className="relative mt-8">
        {programs.length === 0 && !showLoader && !loading && (
          <p className="text-center text-[#5D6494]">Aucun programme trouvé.</p>
        )}

        <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(270px,1fr))] justify-center">
          {programs.map((program) => (
            <StoreCard
              key={program.id}
              program={program}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>

      </div>
    </>
  );
}
