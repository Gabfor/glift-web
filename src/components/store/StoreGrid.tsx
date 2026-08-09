"use client";

import { useEffect, useRef, useState } from "react";
import StoreCard from "@/components/store/StoreCard";
import StoreGridSkeleton from "@/components/store/StoreGridSkeleton";
import { createClient } from "@/lib/supabaseClient";
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
  initialIsAuthenticated = false
}: {
  sortBy: string;
  currentPage: number;
  filters: string[];
  initialPrograms?: StoreProgram[];
  initialUserProfile?: StoreProfile | null;
  initialIsAuthenticated?: boolean;
}) {
  const [allPrograms, setAllPrograms] = useState<StoreProgram[]>(initialPrograms);
  const [programs, setPrograms] = useState<StoreProgram[]>(() => initialPrograms.slice(0, 8));
  const [loading, setLoading] = useState(initialPrograms.length === 0);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(initialPrograms.length > 0);
  const [isAuthenticated, setIsAuthenticated] = useState(initialIsAuthenticated);
  const [userProfile, setUserProfile] = useState<StoreProfile | null>(initialUserProfile);

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
    isAuthenticated: initialIsAuthenticated,
    userProfile: initialUserProfile
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
      JSON.stringify(previousQuery.userProfile) !== JSON.stringify(userProfile) ||
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

      if (queryChangedMaturity) {
        setLoading(true);
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
          link, downloads, created_at, plan, location, image_mobile
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
          mappedPrograms = sortProgramsByRelevance(mappedPrograms, userProfile);
        }

        setAllPrograms(mappedPrograms);
        setPrograms(mappedPrograms.slice(start, end + 1));
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
      {loading && (!hasLoadedOnce || allPrograms.length > 0) ? (
        <StoreGridSkeleton />
      ) : (
        <div className="relative mt-8">
          {allPrograms.length === 0 && !loading && (
            <p className="text-center text-[#3A416F] font-semibold whitespace-pre-line">
              Aucun programme disponible{"\n"}avec ces filtres...
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
              />
            ))}
          </div>

        </div>
      )}
    </>
  );
}
