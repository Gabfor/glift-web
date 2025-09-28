"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StoreCard from "@/components/store/StoreCard";
import { useVisibilityRefetch } from "@/hooks/useVisibilityRefetch";
import { useSessionAwareClient } from "@/hooks/useSessionAwareClient";

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
  status?: string;
};

const FETCH_TIMEOUT_MS = 12000;

export default function StoreGrid({
  sortBy,
  currentPage,
  filters,
}: {
  sortBy: string;
  currentPage: number;
  filters: string[];
}) {
  const logPrefix = "[StoreGrid]";
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  const { supabase, status, sessionVersion, user } = useSessionAwareClient();
  const userId = user?.id ?? null;

  const safeFilters = useMemo<string[]>(
    () => (Array.isArray(filters) ? filters : []),
    [filters]
  );
  const filtersKey = useMemo(() => safeFilters.join("|"), [safeFilters]);

  const getOrderForSortBy = (value: string) => {
    switch (value) {
      case "popularity":
        return { column: "downloads", ascending: false };
      case "oldest":
        return { column: "created_at", ascending: true };
      default:
        return { column: "created_at", ascending: false };
    }
  };

  const runFetch = useCallback(
    async (reason: string) => {
      console.log(`${logPrefix} runFetch decision`, {
        status,
        sessionVersion,
        userId,
        reason,
        sortBy,
        currentPage,
        filters: safeFilters,
      });
      if (status !== "authenticated" || !userId) {
        console.log(`${logPrefix} runFetch skipped`, {
          status,
          sessionVersion,
          userId,
          reason,
        });
        setPrograms([]);
        setLoading(false);
        setHasFetchedOnce(false);
        return;
      }
      setLoading(true);
      const start = (currentPage - 1) * 8;
      const end = start + 7;
      const order = getOrderForSortBy(sortBy);
      const timeoutId = window.setTimeout(() => {
        console.warn(`${logPrefix} fetch timeout`, FETCH_TIMEOUT_MS);
        setLoading(false);
      }, FETCH_TIMEOUT_MS);
      try {
        let query = supabase
          .from("program_store")
          .select(
            `
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
            `
          )
          .eq("status", "ON");
        if (safeFilters[0]) {
          query = query.or(`gender.eq.${safeFilters[0]},gender.eq.Tous`);
        }
        if (safeFilters[1]) query = query.eq("goal", safeFilters[1]);
        if (safeFilters[2]) query = query.eq("level", safeFilters[2]);
        if (safeFilters[3]) query = query.eq("partner_name", safeFilters[3]);
        const { data, error } = await query
          .order(order.column, { ascending: order.ascending })
          .range(start, end);
        if (error) {
          console.error(`${logPrefix} runFetch error`, error);
          setPrograms([]);
        } else {
          setPrograms(data || []);
        }
      } catch (error) {
        console.error(`${logPrefix} runFetch exception`, error);
        setPrograms([]);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
        setHasFetchedOnce(true);
      }
    },
    [currentPage, safeFilters, sessionVersion, sortBy, status, supabase, userId]
  );

  useEffect(() => {
    void runFetch("deps-change");
  }, [filtersKey, runFetch]);

  useVisibilityRefetch(() => {
    if (status !== "authenticated" || !userId) {
      console.log(`${logPrefix} visibility skipped`, {
        status,
        sessionVersion,
        userId,
      });
      return;
    }
    console.log(`${logPrefix} visibility refetch`, {
      status,
      sessionVersion,
      userId,
    });
    void runFetch("visibility");
  });

  useEffect(() => {
    console.log(`${logPrefix} state snapshot`, {
      loading,
      programs: programs.length,
      status,
      sessionVersion,
      userId,
    });
  }, [loading, programs.length, sessionVersion, status, userId]);

  return (
    <div className="relative mt-8">
      {programs.length === 0 && !loading && hasFetchedOnce && status === "authenticated" && (
        <p className="text-center text-[#5D6494]">Aucun programme trouvé.</p>
      )}

      <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(270px,1fr))] justify-center">
        {programs.map((program) => (
          <StoreCard
            key={program.id}
            program={program}
            isAuthenticated={status === "authenticated"}
          />
        ))}
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <span className="text-[#5D6494] font-semibold">Chargement...</span>
        </div>
      )}
    </div>
  );
}
