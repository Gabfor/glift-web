import { createServerClient } from "@/lib/supabaseServer";
import StorePageClient from "./StorePageClient";
import { mapProgramRowToCard, ProgramQueryRow } from "@/utils/storeUtils";
import { sortProgramsByRelevance } from "@/utils/sortingUtils";
import { StoreProfile } from "@/types/store";

export const revalidate = 60; // Mise à jour auto toutes les minutes

import StoreHeader from "@/components/store/StoreHeader";

export default async function StorePage() {
  const supabase = await createServerClient();
  
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
    .eq("status", "ON")
    .limit(50);

  const mappedPrograms = (rawPrograms ?? []).map(row => mapProgramRowToCard(row as ProgramQueryRow));
  const sortedPrograms = sortProgramsByRelevance(mappedPrograms, userProfile);
  
  // Only send the first 8 for the initial page
  const initialPrograms = sortedPrograms.slice(0, 8);

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px]">
      <div className="max-w-[1152px] mx-auto">
        <StoreHeader />
      </div>
      <StorePageClient 
        initialPrograms={initialPrograms} 
        initialTotalCount={totalCount || 0} 
      />
    </main>
  );
}
