import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";
import StorePageClient from "./StorePageClient";
import { mapProgramRowToCard, ProgramQueryRow } from "@/utils/storeUtils";
import { sortProgramsByRelevance } from "@/utils/sortingUtils";
import { StoreProfile } from "@/types/store";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createServerClient();
  const { data: pageConfig } = await supabase
    .from("pages")
    .select("titre, description, seo_title, seo_description, noindex, nofollow, canonical_override")
    .eq("id", "fd7e055c-bf17-4222-a8f8-c27b014d3062")
    .single();

  if (!pageConfig) return { title: "Store" };

  const title = pageConfig.seo_title || pageConfig.titre || "Glift Store";
  const plainTitle = title.replace(/<[^>]*>/g, "").trim();
  const description = pageConfig.seo_description || pageConfig.description || "Téléchargez des programmes de musculation professionnels.";
  const plainDescription = description.replace(/<[^>]*>/g, "").trim();

  const robots: any = {};
  if (pageConfig.noindex) robots.index = false;
  if (pageConfig.nofollow) robots.follow = false;

  return {
    title: plainTitle,
    description: plainDescription,
    robots: Object.keys(robots).length > 0 ? robots : undefined,
    alternates: {
      canonical: pageConfig.canonical_override || "/store",
    },
  };
}

import StoreHeader from "@/components/store/StoreHeader";

export default async function StorePage() {
  const supabase = await createServerClient();
  
  // 0. Check custom URL redirection
  const { data: pageConfig } = await supabase
    .from("pages")
    .select("surtitre, titre, description, url")
    .eq("id", "fd7e055c-bf17-4222-a8f8-c27b014d3062")
    .single();

  if (pageConfig && pageConfig.url && pageConfig.url !== "store") {
    redirect(`/${pageConfig.url}`);
  }
  
  // 1. Get user profile for relevance sorting
  const { data: { session } } = await supabase.auth.getSession();
  let userProfile: StoreProfile | null = null;
  
  if (session?.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_plan, gender, main_goal, experience, training_place, weekly_sessions")
      .eq("id", session.user.id)
      .single();
    
    if (profile) {
      userProfile = profile as StoreProfile;
    }
  }

  // 2. Fetch total count
  const { count: totalCount } = await supabase
    .from("program_store")
    .select("*", { count: "exact", head: true })
    .eq("status", "ON");

  // 3. Fetch first batch of programs for initial display (Default relevance sort)
  const { data: rawPrograms } = await supabase
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

  const mappedPrograms = (rawPrograms ?? []).map(row => mapProgramRowToCard(row as ProgramQueryRow));
  const sortedPrograms = sortProgramsByRelevance(mappedPrograms, userProfile);
  
  // Only send the first 8 for the initial page
  const initialPrograms = sortedPrograms.slice(0, 8);

  const initialPageContent = {
    surtitre: pageConfig?.surtitre ?? "",
    titre: pageConfig?.titre || "Glift Store",
    description: pageConfig?.description ?? "Téléchargez un programme pour l'utiliser directement dans Glift.",
  };

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px]">
      <div className="max-w-[1152px] mx-auto">
        <StoreHeader initialPageContent={initialPageContent} />
      </div>
      <StorePageClient 
        initialPrograms={initialPrograms} 
        initialTotalCount={totalCount || 0} 
        initialUserProfile={userProfile}
        initialIsAuthenticated={!!session?.user}
      />
    </main>
  );
}
