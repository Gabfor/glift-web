"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import StoreCard from "@/components/store/StoreCard";
import StoreGridSkeleton from "@/components/store/StoreGridSkeleton";
import { createClient } from "@/lib/supabaseClient";
import { createClientComponentClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { haveStringArrayChanged } from "@/utils/arrayUtils";
import { useUser } from "@/context/UserContext";

import { mapProgramRowToCard, ProgramQueryRow } from "@/utils/storeUtils";

import { StoreProgram, StoreProfile } from "@/types/store";
import { sortProgramsByRelevance } from "@/utils/sortingUtils";

export default function StoreGrid({
  sortBy,
  currentPage,
  filters,
  initialPrograms = [],
  initialUserProfile = null,
  initialIsAuthenticated = false,
  initialFavorites = [],
  favoritesOnly = false,
  onCountChange,
}: {
  sortBy: string;
  currentPage: number;
  filters: string[];
  initialPrograms?: StoreProgram[];
  initialUserProfile?: StoreProfile | null;
  initialIsAuthenticated?: boolean;
  initialFavorites?: string[];
  favoritesOnly?: boolean;
  onCountChange?: (count: number) => void;
}) {
  const isDefaultQuery =
    currentPage === 1 &&
    sortBy === "relevance" &&
    filters.every((f) => f === "") &&
    !favoritesOnly;

  const [allPrograms, setAllPrograms] = useState<StoreProgram[]>(initialPrograms);
  const [programs, setPrograms] = useState<StoreProgram[]>(() => initialPrograms.slice(0, 8));
  const [loading, setLoading] = useState(
    initialPrograms.length === 0 || !isDefaultQuery
  );
  const [isAuthenticated, setIsAuthenticated] = useState(initialIsAuthenticated);
  const [userProfile, setUserProfile] = useState<StoreProfile | null>(initialUserProfile);
  const [favorites, setFavorites] = useState<string[]>(initialFavorites);

  const hasLoadedOnceRef = useRef(initialPrograms.length > 0 && isDefaultQuery);

  const previousQueryRef = useRef<{
    sortBy: string;
    currentPage: number;
    filters: string[];
    isAuthenticated: boolean;
    userProfile: StoreProfile | null;
    favoritesOnly: boolean;
  } | null>(
    initialPrograms.length > 0 && isDefaultQuery
      ? {
          sortBy,
          currentPage,
          filters: [...filters],
          isAuthenticated: initialIsAuthenticated,
          userProfile: initialUserProfile,
          favoritesOnly,
        }
      : null
  );

  const getOrderForSortBy = (sortBy: string) => {
    switch (sortBy) {
      case "relevance":
        return { column: "", ascending: false };
      case "popularity":
        return { column: "downloads", ascending: false };
      case "oldest":
        return { column: "created_at", ascending: true };
      case "newest":
      default:
        return { column: "created_at", ascending: false };
    }
  };

  // ➜ UserContext provides auth state and computed premium status
  const { user, isPremiumUser, isLoading: isUserContextLoading } = useUser();

  // Load favorites from Supabase DB (or localStorage fallback) on client mount
  useEffect(() => {
    let isCancelled = false;

    async function loadFavorites() {
      let loadedFavs: string[] = initialFavorites;

      // 1. First read local cache
      try {
        const stored = localStorage.getItem("glift_favorite_programs");
        if (stored) {
          loadedFavs = JSON.parse(stored);
        }
      } catch {
        // ignore
      }

      if (user?.id) {
        try {
          const supabase = createClientComponentClient();
          const { data, error } = await (supabase.from("user_store_favorites" as any) as any)
            .select("program_id")
            .eq("user_id", user.id);

          if (error) {
            console.error("Erreur Supabase lors du chargement des favoris Store :", error.message || error);
          } else if (data) {
            loadedFavs = (data as Array<{ program_id: string }>).map((item) => String(item.program_id));
            try {
              localStorage.setItem("glift_favorite_programs", JSON.stringify(loadedFavs));
            } catch {
              // ignore
            }
          }
        } catch (err) {
          console.error("Erreur inattendue lors du chargement des favoris Store :", err);
        }
      }

      if (!isCancelled) {
        const areFavsSame = (a: string[], b: string[]) => {
          if (a.length !== b.length) return false;
          const setA = new Set(a);
          return b.every((item) => setA.has(item));
        };

        if (!areFavsSame(favorites, loadedFavs)) {
          setFavorites(loadedFavs);
          if (sortBy === "relevance") {
            const sorted = sortProgramsByRelevance(allPrograms, userProfile, loadedFavs);
            setAllPrograms(sorted);
            setPrograms(sorted.slice(0, 8));
          }
        }
      }
    }

    loadFavorites();

    return () => {
      isCancelled = true;
    };
  }, [user?.id]);

  const handleToggleFavorite = useCallback(
    async (programId: string) => {
      const isCurrentlyFav = favorites.includes(programId);
      const next = isCurrentlyFav
        ? favorites.filter((id) => id !== programId)
        : [...favorites, programId];

      setFavorites(next);
      try {
        localStorage.setItem("glift_favorite_programs", JSON.stringify(next));
      } catch {
        // ignore
      }

      if (user?.id) {
        try {
          const supabase = createClientComponentClient();
          if (isCurrentlyFav) {
            const { error } = await (supabase.from("user_store_favorites" as any) as any)
              .delete()
              .eq("user_id", user.id)
              .eq("program_id", programId);
            if (error) {
              console.error("Erreur Supabase lors de la suppression du favori Store :", error.message || error);
            }
          } else {
            const { error } = await (supabase.from("user_store_favorites" as any) as any)
              .upsert({ user_id: user.id, program_id: programId });
            if (error) {
              console.error("Erreur Supabase lors de l'ajout du favori Store :", error.message || error);
            }
          }
        } catch (err) {
          console.error("Erreur inattendue lors de la mise à jour du favori Store :", err);
        }
      }
    },
    [favorites, user?.id]
  );

  // ➜ Auth & Extended Profile check once on load
  useEffect(() => {
    const supabase = createClient();
    const fetchExtendedProfile = async () => {
      setIsAuthenticated(!!user);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("subscription_plan, gender, main_goal, experience, training_place, weekly_sessions")
          .eq("id", user.id)
          .single();
        if (data) {
          const effectivePlan = isPremiumUser ? 'premium' : 'starter';
          const nextProfile = {
            ...data,
            subscription_plan: effectivePlan,
          } as any;
          setUserProfile((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(nextProfile)) {
              return prev;
            }
            return nextProfile;
          });
        }
      } else {
        setUserProfile((prev) => (prev === null ? prev : null));
      }
    };

    if (!isUserContextLoading) {
      fetchExtendedProfile();
    }
  }, [user, isPremiumUser, isUserContextLoading]);

  // ➜ Fetch programs
  useEffect(() => {
    if (
      initialPrograms.length > 0 &&
      isDefaultQuery &&
      !hasLoadedOnceRef.current
    ) {
      hasLoadedOnceRef.current = true;
      previousQueryRef.current = {
        sortBy,
        currentPage,
        filters: [...filters],
        isAuthenticated,
        userProfile,
        favoritesOnly,
      };
      setLoading(false);
      return;
    }

    const previousQuery = previousQueryRef.current;
    const hasQueryChanged =
      !previousQuery ||
      previousQuery.sortBy !== sortBy ||
      previousQuery.currentPage !== currentPage ||
      previousQuery.isAuthenticated !== isAuthenticated ||
      previousQuery.favoritesOnly !== favoritesOnly ||
      JSON.stringify(previousQuery.userProfile) !== JSON.stringify(userProfile) ||
      haveStringArrayChanged(previousQuery.filters, filters);

    if (!hasQueryChanged && hasLoadedOnceRef.current) {
      setLoading(false);
      return;
    }

    previousQueryRef.current = {
      sortBy,
      currentPage,
      filters: [...filters],
      isAuthenticated,
      userProfile,
      favoritesOnly,
    };

    if (!hasLoadedOnceRef.current) {
      setLoading(true);
    }

    let isActive = true;

    const fetchPrograms = async () => {
      if (filters.some((f) => f === "__none__") || (favoritesOnly && favorites.length === 0)) {
        if (onCountChange) onCountChange(0);
        setAllPrograms([]);
        setPrograms([]);
        hasLoadedOnceRef.current = true;
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const start = (currentPage - 1) * 8;
      const end = start + 7;
      const order = getOrderForSortBy(sortBy);

      let query = supabase
        .from("program_store")
        .select(`
          id, title, level, goal, gender, sessions, duration, description, 
          image, image_alt, partner_image, partner_image_alt, partner_link, 
          link, downloads, created_at, plan, location, image_mobile, partner_name
        `)
        .eq("status", "ON");

      const [genderFilter, goalFilter, levelFilter, locationFilter, durationFilter, partnerFilter, availabilityFilter] = filters;

      if (genderFilter) {
        const genders = genderFilter.split(",").map((s) => s.trim());
        if (genders.length === 1) {
          query = query.or(`gender.eq.${genders[0]},gender.eq.Tous,gender.eq.Mixte`);
        }
      }
      if (goalFilter) {
        const goals = goalFilter.split(",").map((s) => s.trim());
        if (goals.length === 1) query = query.eq("goal", goals[0]);
        else query = query.in("goal", goals);
      }
      if (levelFilter) {
        const levels = levelFilter.split(",").map((s) => s.trim());
        query = query.in("level", [...levels, "Tous niveaux"]);
      }
      if (locationFilter) {
        const locations = locationFilter.split(",").map((s) => s.trim());
        if (locations.length === 1) query = query.eq("location", locations[0]);
        else query = query.in("location", locations);
      }
      if (durationFilter) {
        const maxDuration = Number.parseInt(durationFilter, 10);
        if (!Number.isNaN(maxDuration)) query = query.lte("duration", maxDuration);
      }
      if (partnerFilter) {
        const partners = partnerFilter.split(",").map((s) => s.trim());
        if (partners.length === 1) query = query.eq("partner_name", partners[0]);
        else query = query.in("partner_name", partners);
      }
      if (availabilityFilter === "Oui") {
        if (!isAuthenticated || userProfile?.subscription_plan === "starter") {
          query = query.eq("plan", "starter");
        }
      } else if (availabilityFilter === "Non") {
        if (!isAuthenticated || userProfile?.subscription_plan === "starter") {
          query = query.eq("plan", "premium");
        }
      }

      let finalQuery = query;
      if (order.column) {
        finalQuery = finalQuery.order(order.column, { ascending: order.ascending });
      }

      const { data, error } = await finalQuery.returns<ProgramQueryRow[]>();

      if (!isActive) return;

      if (error) {
        console.error("Erreur Supabase :", error.message);
      } else {
        let mappedPrograms = (data ?? []).map(mapProgramRowToCard);

        if (sortBy === "relevance") {
          mappedPrograms = sortProgramsByRelevance(mappedPrograms, userProfile, favorites);
        }

        if (favoritesOnly) {
          mappedPrograms = mappedPrograms.filter((p) => favorites.includes(p.id));
        }

        if (onCountChange) onCountChange(mappedPrograms.length);

        setAllPrograms(mappedPrograms);
        setPrograms(mappedPrograms.slice(start, end + 1));
      }

      hasLoadedOnceRef.current = true;
      setLoading(false);
    };

    void fetchPrograms();

    return () => {
      isActive = false;
    };
  }, [sortBy, currentPage, filters, userProfile, isAuthenticated, isUserContextLoading, favoritesOnly, favorites]);

  return (
    <>
      {loading ? (
        <StoreGridSkeleton />
      ) : (
        <div className="relative mt-8">
          {allPrograms.length === 0 && !loading && (
            <p className="text-center text-[#3A416F] font-semibold whitespace-pre-line">
              {favoritesOnly
                ? "Aucun programme enregistré en favori pour le moment."
                : "Aucun programme disponible\navec ces filtres."}
            </p>
          )}

          {/* Vue Mobile (< md) : Tous les programmes en défilement continu */}
          <div className="flex flex-col gap-5 md:hidden">
            {allPrograms.map((program) => (
              <StoreCard
                key={program.id}
                program={program}
                isAuthenticated={isAuthenticated}
                subscriptionPlan={userProfile?.subscription_plan ?? null}
                isFavorite={favorites.includes(program.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>

          {/* Vue Desktop (md:) : Grille paginée */}
          <div className="hidden md:grid md:gap-6 md:grid-cols-[repeat(auto-fill,minmax(270px,1fr))] justify-center">
            {programs.map((program) => (
              <StoreCard
                key={program.id}
                program={program}
                isAuthenticated={isAuthenticated}
                subscriptionPlan={userProfile?.subscription_plan ?? null}
                isFavorite={favorites.includes(program.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>

        </div>
      )}
    </>
  );
}
