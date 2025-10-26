"use client";

import { useEffect, useState } from "react";
import StoreCard from "@/components/store/StoreCard";
import StoreGridSkeleton from "@/components/store/StoreGridSkeleton";
import { createClient } from "@/lib/supabaseClient";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";
import type { Database } from "@/lib/supabase/types";

type ProgramRow = Database["public"]["Tables"]["program_store"]["Row"];
type ProgramQueryRow = Pick<
  ProgramRow,
  |
    "id"
    | "title"
    | "level"
    | "goal"
    | "gender"
    | "sessions"
    | "duration"
    | "description"
    | "image"
    | "image_alt"
    | "partner_image"
    | "partner_image_alt"
    | "partner_link"
    | "link"
    | "downloads"
    | "created_at"
    | "partner_name"
>;

type Program = {
  id: string;
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
  downloads: number;
  created_at: string;
  goal: string;
  gender: string;
  partner_name: string;
};

const mapProgramRowToCard = (row: ProgramQueryRow): Program => ({
  id: row.id,
  title: row.title,
  level: row.level ?? "",
  sessions: row.sessions !== null && row.sessions !== undefined ? String(row.sessions) : "",
  duration: row.duration ?? "",
  description: row.description ?? "",
  image: row.image ?? "",
  image_alt: row.image_alt ?? "",
  partner_image: row.partner_image ?? "",
  partner_image_alt: row.partner_image_alt ?? "",
  partner_link: row.partner_link ?? "",
  link: row.link ?? "",
  downloads: row.downloads ?? 0,
  created_at: row.created_at ?? "",
  goal: row.goal ?? "",
  gender: row.gender ?? "",
  partner_name: row.partner_name ?? "",
});

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
  const showSkeleton = useMinimumVisibility(loading);

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
      if (filters[4]) {
        const maxDuration = Number.parseInt(filters[4], 10);
        if (!Number.isNaN(maxDuration)) {
          query = query.lte('duration', maxDuration);
        }
      }

      const { data, error } = await query
        .order(order.column, { ascending: order.ascending })
        .range(start, end)
        .returns<ProgramQueryRow[]>();

      if (error) {
        console.error("Erreur Supabase :", error.message);
      } else {
        const mappedPrograms = (data ?? []).map(mapProgramRowToCard);
        setPrograms(mappedPrograms);
      }

      setLoading(false);
    };

    fetchPrograms();
  }, [sortBy, currentPage, filters]);

  return (
    <>
      {showSkeleton ? (
        <StoreGridSkeleton />
      ) : (
        <div className="relative mt-8">
          {programs.length === 0 && !loading && (
            <p className="text-center text-[#5D6494] font-semibold">
              Aucun programme trouvé.
            </p>
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
      )}
    </>
  );
}
