"use client";

import { useEffect, useRef, useState } from "react";
import StoreCard from "@/components/store/StoreCard";
import StoreGridSkeleton from "@/components/store/StoreGridSkeleton";
import { createClient } from "@/lib/supabaseClient";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";
import type { Database } from "@/lib/supabase/types";
import { haveStringArrayChanged } from "@/utils/arrayUtils";

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
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const showSkeleton = useMinimumVisibility(loading);
  const hasLoadedOnceRef = useRef(false);
  const previousQueryRef = useRef<{
    sortBy: string;
    currentPage: number;
    filters: string[];
  } | null>(null);

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
    const previousQuery = previousQueryRef.current;
    const hasQueryChanged =
      !previousQuery ||
      previousQuery.sortBy !== sortBy ||
      previousQuery.currentPage !== currentPage ||
      haveStringArrayChanged(previousQuery.filters, filters);

    const shouldSkipFetch =
      previousQuery !== null &&
      !hasQueryChanged &&
      hasLoadedOnceRef.current;

    if (shouldSkipFetch) {
      return;
    }

    previousQueryRef.current = {
      sortBy,
      currentPage,
      filters: [...filters],
    };

    let isActive = true;

    const fetchPrograms = async () => {
      setLoading(true);
      const supabase = createClient();

      const start = (currentPage - 1) * 8;
      const end = start + 7;

      const order = getOrderForSortBy(sortBy);

      let query = supabase
        .from("program_store")
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
        .eq("status", "ON");

      const [
        genderFilter,
        goalFilter,
        levelFilter,
        locationFilter,
        durationFilter,
        partnerFilter,
      ] = filters;

      // Apply filters if active
      if (genderFilter) {
        query = query.or(`gender.eq.${genderFilter},gender.eq.Tous`);
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
      if (partnerFilter) query = query.eq("partner_name", partnerFilter);

      const { data, error } = await query
        .order(order.column, { ascending: order.ascending })
        .range(start, end)
        .returns<ProgramQueryRow[]>();

      if (!isActive) {
        return;
      }

      if (error) {
        console.error("Erreur Supabase :", error.message);
      } else {
        const mappedPrograms = (data ?? []).map(mapProgramRowToCard);
        setPrograms(mappedPrograms);
      }

      setHasLoadedOnce(true);
      hasLoadedOnceRef.current = true;
      setLoading(false);
    };

    void fetchPrograms();

    return () => {
      isActive = false;
    };
  }, [sortBy, currentPage, filters]);

  return (
    <>
      {showSkeleton && (!hasLoadedOnce || programs.length > 0) ? (
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
