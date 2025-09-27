// /src/components/store/StoreGrid.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import StoreCard from "@/components/store/StoreCard";
import { createClient } from "@/lib/supabase/client";

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

const FETCH_TIMEOUT_MS = 12000; // 12s max pour éviter un spinner infini

export default function StoreGrid({
  sortBy,
  currentPage,
  filters,
}: {
  sortBy: string;
  currentPage: number;
  filters: string[];
}) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChangeToken, setAuthChangeToken] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  const supabase = createClient();

  // Sécurise filters (au cas où) + clé stable pour l’effet
  const safeFilters = useMemo<string[]>(
    () => (Array.isArray(filters) ? filters : []),
    [filters]
  );
  const filtersKey = useMemo(() => safeFilters.join("|"), [safeFilters]);

  const getOrderForSortBy = (s: string) => {
    switch (s) {
      case "popularity":
        return { column: "downloads", ascending: false };
      case "oldest":
        return { column: "created_at", ascending: true };
      case "newest":
      default:
        return { column: "created_at", ascending: false };
    }
  };

  // 1) Réhydratation session + écoute des changements d’auth
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSessionUserId(data.session?.user?.id ?? null);
        setIsAuthenticated(!!data.session?.user);
        setAuthChangeToken(Date.now());
      } catch (_error) {
        if (!mounted) return;
        setSessionUserId(null);
        setIsAuthenticated(false);
        setAuthChangeToken(Date.now());
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED"
      ) {
        setSessionUserId(session?.user?.id ?? null);
        setIsAuthenticated(!!session?.user);
        setAuthChangeToken(Date.now());
      }

      if (event === "SIGNED_OUT") {
        setSessionUserId(null);
        setIsAuthenticated(false);
        setAuthChangeToken(Date.now());
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  // 2) Fetch programs (uniquement quand réhydraté)
  const runFetch = useCallback(async () => {
    const start = (currentPage - 1) * 8;
    const end = start + 7;
    const order = getOrderForSortBy(sortBy);

    setLoading(true);
    console.time("[StoreGrid] fetch");

    const tid = window.setTimeout(() => {
      console.warn("[StoreGrid] fetch timeout after", FETCH_TIMEOUT_MS, "ms");
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

      // Filtres
      if (safeFilters[0]) {
        // gender
        query = query.or(`gender.eq.${safeFilters[0]},gender.eq.Tous`);
      }
      if (safeFilters[1]) query = query.eq("goal", safeFilters[1]);
      if (safeFilters[2]) query = query.eq("level", safeFilters[2]);
      if (safeFilters[3]) query = query.eq("partner_name", safeFilters[3]);

      const { data, error } = await query
        .order(order.column, { ascending: order.ascending })
        .range(start, end);

      if (error) {
        console.error("[StoreGrid] Supabase error:", error);
        setPrograms([]);
      } else {
        setPrograms(data || []);
      }
    } catch (e) {
      console.error("[StoreGrid] fetch threw:", e);
      setPrograms([]);
    } finally {
      clearTimeout(tid);
      setLoading(false);
      setHasFetchedOnce(true);
      console.timeEnd("[StoreGrid] fetch");
    }
  }, [currentPage, sortBy, safeFilters, supabase]);

  useEffect(() => {
    if (!authChangeToken) return;

    if (!sessionUserId) {
      setPrograms([]);
      setLoading(false);
      setHasFetchedOnce(false);
      return;
    }

    runFetch();
  }, [authChangeToken, runFetch, filtersKey, sessionUserId]);

  return (
    <div className="relative mt-8">
      {programs.length === 0 && !loading && hasFetchedOnce && isAuthenticated && (
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

      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <span className="text-[#5D6494] font-semibold">Chargement...</span>
        </div>
      )}
    </div>
  );
}
