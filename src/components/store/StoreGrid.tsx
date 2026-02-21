"use client";

import { useEffect, useRef, useState } from "react";
import StoreCard from "@/components/store/StoreCard";
import StoreGridSkeleton from "@/components/store/StoreGridSkeleton";
import { createClient } from "@/lib/supabaseClient";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";
import type { Database } from "@/lib/supabase/types";
import { haveStringArrayChanged } from "@/utils/arrayUtils";
import { useUser } from "@/context/UserContext";

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
  | "plan"
  | "location"
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
  plan: "starter" | "premium";
  location: string;
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
  plan: row.plan ?? "starter",
  location: row.location ?? "",
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
  const [userProfile, setUserProfile] = useState<{
    gender: string | null;
    subscription_plan: string | null;
    main_goal: string | null;
    experience: string | null;
    training_place: string | null;
    weekly_sessions: string | null;
  } | null>(null);

  const showSkeleton = useMinimumVisibility(loading);
  const hasLoadedOnceRef = useRef(false);

  const previousQueryRef = useRef<{
    sortBy: string;
    currentPage: number;
    filters: string[];
    isAuthenticated: boolean;
    userProfile: typeof userProfile;
  } | null>(null);

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
  /* ... */


  // ➜ Fetch programs
  useEffect(() => {
    const previousQuery = previousQueryRef.current;
    const hasQueryChanged =
      !previousQuery ||
      previousQuery.sortBy !== sortBy ||
      previousQuery.currentPage !== currentPage ||
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
      setLoading(true);
      const supabase = createClient();

      const start = (currentPage - 1) * 8;
      const end = start + 7;

      const order = getOrderForSortBy(sortBy);

      const isClientSideSort = sortBy === 'relevance';

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
          created_at,
          plan,
          location
        `)
        .eq("status", "ON");

      const [
        genderFilter,
        goalFilter,
        levelFilter,
        locationFilter,
        durationFilter,
        availabilityFilter,
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

      if (!isActive) {
        return;
      }

      if (error) {
        console.error("Erreur Supabase :", error.message);
      } else {
        let mappedPrograms = (data ?? []).map(mapProgramRowToCard);

        if (sortBy === "relevance") {
          mappedPrograms.sort((a, b) => {
            let scoreA = 0;
            let scoreB = 0;

            // 1. Gender Rule
            const userGender = userProfile?.gender?.toString().trim().toLowerCase();
            const getGenderScore = (programGender: string): number => {
              const pg = programGender.trim().toLowerCase();
              // "Homme" user
              if (userGender === "homme") {
                if (pg === "homme" || pg === "tous") return 5;
                if (pg === "femme") return -5;
              }
              // "Femme" user
              else if (userGender === "femme") {
                if (pg === "femme" || pg === "tous") return 5;
                if (pg === "homme") return -5;
              }
              // "Non binaire" user
              else if (userGender === "non binaire" || userGender === "non-binaire") {
                if (pg === "tous") return 3;
              }
              return 0;
            };
            if (userGender) {
              scoreA += getGenderScore(a.gender);
              scoreB += getGenderScore(b.gender);
            }

            // 2. Experience Rule (Years of practice -> Level)
            const userYOP = userProfile?.experience?.toString().trim();
            const getLevelScore = (programLevel: string): number => {
              const pl = programLevel.trim().toLowerCase();
              const isAllLevels = pl === "tous niveaux";

              if (userYOP === "0") {
                if (pl === "débutant") return 5;
                if (isAllLevels) return 3;
              } else if (["1", "2", "3"].includes(userYOP || "")) {
                if (pl === "intermédiaire") return 5;
                if (isAllLevels) return 3;
              } else if (["4", "5+"].includes(userYOP || "")) {
                if (pl === "confirmé") return 5;
                if (isAllLevels) return 3;
              }
              return 0;
            };
            if (userYOP) {
              scoreA += getLevelScore(a.level);
              scoreB += getLevelScore(b.level);
            }

            // 3. Goal Rule
            const userGoal = userProfile?.main_goal?.toString().trim();
            if (userGoal) {
              if (userGoal === a.goal.trim()) scoreA += 5;
              if (userGoal === b.goal.trim()) scoreB += 5;
            }

            // 4. Location Rule
            const userLocation = userProfile?.training_place?.toString().trim();
            if (userLocation) {
              if (a.location && a.location.trim() === userLocation) scoreA += 3;
              if (b.location && b.location.trim() === userLocation) scoreB += 3;
            }

            // 5. Sessions Rule
            // "Nombre de séances par semaine" match "category "Nombre de séances"
            const userSessions = userProfile?.weekly_sessions?.toString().trim(); // e.g. "3" or "3 séances"
            // Program sessions is a string number e.g "3"
            if (userSessions) {
              // Try strict string matching or slight fuzzy matching if formats differ
              // Assuming strict match based on prompt saying "identique"
              // But typically user profile might say "3" and program "3"
              // Or user "3 séances" vs program "3"
              // Let's maximize chance: check if program session is contained in user session string or equals
              const pSessionsA = String(a.sessions).trim();
              const uSessions = userSessions;
              if (pSessionsA && (pSessionsA === uSessions || uSessions.startsWith(pSessionsA))) {
                scoreA += 2;
              }
              const pSessionsB = String(b.sessions).trim();
              if (pSessionsB && (pSessionsB === uSessions || uSessions.startsWith(pSessionsB))) {
                scoreB += 2;
              }
            }

            if (scoreA !== scoreB) {
              return scoreB - scoreA;
            }

            // Tie-breaker 1: Downloads
            if (a.downloads !== b.downloads) {
              return b.downloads - a.downloads;
            }

            // Tie-breaker 2: Alphabetical
            return a.title.localeCompare(b.title);
          });
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
  }, [sortBy, currentPage, filters, userProfile, isAuthenticated]);

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
