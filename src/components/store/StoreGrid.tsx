"use client";

import { useEffect, useRef, useState } from "react";
import StoreCard from "@/components/store/StoreCard";
import StoreGridSkeleton from "@/components/store/StoreGridSkeleton";
import { createClient } from "@/lib/supabaseClient";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";
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
  initialPrograms = []
}: {
  sortBy: string;
  currentPage: number;
  filters: string[];
  initialPrograms?: StoreProgram[];
}) {
  const [programs, setPrograms] = useState<StoreProgram[]>(initialPrograms);
  const [loading, setLoading] = useState(initialPrograms.length === 0);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(initialPrograms.length > 0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<StoreProfile | null>(null);

  const showSkeleton = useMinimumVisibility(loading);
  const hasLoadedOnceRef = useRef(initialPrograms.length > 0);

  const previousQueryRef = useRef<{
    sortBy: string;
    currentPage: number;
    filters: string[];
    isAuthenticated: boolean;
    userProfile: StoreProfile | null;
  } | null>(initialPrograms.length > 0 ? {
    sortBy,
    currentPage,
    filters: [...filters],
    isAuthenticated: false,
    userProfile: null
  } : null);

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

  // ➜ Auth & Extended Profile check once on load
  useEffect(() => {
    const supabase = createClient();
    const fetchExtendedProfile = async () => {
      // Wait for UserContext to be ready if possible, or just rely on it being fast?
      // Actually we can just trigger this when `user` changes from context.
      setIsAuthenticated(!!user);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("subscription_plan, gender, main_goal, experience, training_place, weekly_sessions")
          .eq("id", user.id)
          .single();
        if (data) {
          // FORCE OVERRIDE: Use the computed isPremiumUser from context to determine plan.
          // This ensures immediate downgrade UI even if DB is lagging.
          const effectivePlan = isPremiumUser ? 'premium' : 'starter';
          setUserProfile({
            ...data,
            subscription_plan: effectivePlan
          } as any);
        }
      } else {
        setUserProfile(null);
      }
    };

    if (!isUserContextLoading) {
      fetchExtendedProfile();
    }
  }, [user, isPremiumUser, isUserContextLoading]);


  // ➜ Fetch programs
  useEffect(() => {
    const previousQuery = previousQueryRef.current;
    const hasQueryChanged =
      !previousQuery ||
      previousQuery.sortBy !== sortBy ||
      previousQuery.currentPage !== currentPage ||
      previousQuery.isAuthenticated !== isAuthenticated ||
      previousQuery.userProfile !== userProfile ||
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
      isAuthenticated,
      userProfile,
    };

    let isActive = true;

    const fetchPrograms = async () => {
      // ✅ LOADING LOGIC: stay in skeleton while UserContext is syncing
      const isInitialSync = !hasLoadedOnceRef.current;
      const isProfileSyncing = isUserContextLoading;
      
      const queryChangedMaturity = previousQuery && (
        previousQuery.sortBy !== sortBy || 
        previousQuery.currentPage !== currentPage || 
        haveStringArrayChanged(previousQuery.filters, filters)
      );

      if (isInitialSync || queryChangedMaturity) {
        setLoading(true);
      }

      const supabase = createClient();
      const start = (currentPage - 1) * 8;
      const end = start + 7;
      const order = getOrderForSortBy(sortBy);
      const isClientSideSort = sortBy === 'relevance';

      let query = supabase
        .from("program_store")
        .select(`
          id, title, level, goal, gender, sessions, duration, description, 
          image, image_alt, partner_image, partner_image_alt, partner_link, 
          link, downloads, created_at, plan, location
        `)
        .eq("status", "ON");

      const [genderFilter, goalFilter, levelFilter, locationFilter, durationFilter, availabilityFilter] = filters;

      if (genderFilter) query = query.or(`gender.eq.${genderFilter},gender.eq.Tous`);
      if (goalFilter) query = query.eq("goal", goalFilter);
      if (levelFilter) query = query.in("level", [levelFilter, "Tous niveaux"]);
      if (locationFilter) query = query.eq("location", locationFilter);
      if (durationFilter) {
        const maxDuration = Number.parseInt(durationFilter, 10);
        if (!Number.isNaN(maxDuration)) query = query.lte("duration", maxDuration);
      }
      if (availabilityFilter === "Oui") {
        if (!isAuthenticated || userProfile?.subscription_plan === "starter") {
          query = query.eq("plan", "starter");
        }
      }

      let finalQuery = query;
      if (order.column) {
        finalQuery = finalQuery.order(order.column, { ascending: order.ascending });
      }

      if (!isClientSideSort) {
        finalQuery = finalQuery.range(start, end);
      }

      const { data, error } = await finalQuery.returns<ProgramQueryRow[]>();

      if (!isActive) return;

      if (error) {
        console.error("Erreur Supabase :", error.message);
      } else {
        let mappedPrograms = (data ?? []).map(mapProgramRowToCard);

        if (sortBy === "relevance") {
          // ✅ SESSION PERSISTENCE:
          const sessionKey = `store_relevance_order_${user?.id || 'guest'}`;
          const savedOrder = sessionStorage.getItem(sessionKey);
          
          if (savedOrder && !queryChangedMaturity) {
            const orderIds = JSON.parse(savedOrder) as string[];
            mappedPrograms.sort((a, b) => {
              const indexA = orderIds.indexOf(a.id);
              const indexB = orderIds.indexOf(b.id);
              if (indexA === -1 || indexB === -1) return 0;
              return indexA - indexB;
            });
          } else {
            mappedPrograms = sortProgramsByRelevance(mappedPrograms, userProfile);
            const orderIds = mappedPrograms.map(p => p.id);
            sessionStorage.setItem(sessionKey, JSON.stringify(orderIds));
          }
        }

        if (isClientSideSort) {
          setPrograms(mappedPrograms.slice(start, end + 1));
        } else {
          setPrograms(mappedPrograms);
        }
      }

      setHasLoadedOnce(true);
      hasLoadedOnceRef.current = true;
      setLoading(false);
    };

    void fetchPrograms();

    return () => {
      isActive = false;
    };
  }, [sortBy, currentPage, filters, userProfile, isAuthenticated, isUserContextLoading]);

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
                subscriptionPlan={userProfile?.subscription_plan ?? null}
              />
            ))}
          </div>

        </div>
      )}
    </>
  );
}
