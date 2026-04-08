import { StoreProgram, StoreProfile } from "@/types/store";
import { ShopOffer, ShopProfile } from "@/types/shop";

/**
 * Calcule le score de pertinence pour un programme selon le profil utilisateur
 */
export function calculateProgramRelevance(program: StoreProgram, userProfile: StoreProfile | null): number {
  if (!userProfile) return 0;
  
  let score = 0;

  // 1. Gender Rule
  const userGender = userProfile.gender?.toString().trim().toLowerCase();
  if (userGender) {
    const pg = program.gender.trim().toLowerCase();
    if (userGender === "homme") {
      if (pg === "homme" || pg === "tous") score += 5;
      else if (pg === "femme") score -= 5;
    } else if (userGender === "femme") {
      if (pg === "femme" || pg === "tous") score += 5;
      else if (pg === "homme") score -= 5;
    } else if (userGender === "non binaire" || userGender === "non-binaire") {
      if (pg === "tous") score += 3;
    }
  }

  // 2. Experience Rule (Years of practice -> Level)
  const userYOP = userProfile.experience?.toString().trim();
  if (userYOP) {
    const pl = program.level.trim().toLowerCase();
    const isAllLevels = pl === "tous niveaux";

    if (userYOP === "0") {
      if (pl === "débutant") score += 5;
      else if (isAllLevels) score += 3;
    } else if (["1", "2", "3"].includes(userYOP)) {
      if (pl === "intermédiaire") score += 5;
      else if (isAllLevels) score += 3;
    } else if (["4", "5+"].includes(userYOP)) {
      if (pl === "confirmé") score += 5;
      else if (isAllLevels) score += 3;
    }
  }

  // 3. Goal Rule
  const userGoal = userProfile.main_goal?.toString().trim();
  if (userGoal && userGoal === program.goal.trim()) {
    score += 5;
  }

  // 4. Location Rule
  const userLocation = userProfile.training_place?.toString().trim();
  if (userLocation && program.location && program.location.trim() === userLocation) {
    score += 3;
  }

  // 5. Sessions Rule
  const userSessions = userProfile.weekly_sessions?.toString().trim();
  if (userSessions) {
    const pSessions = String(program.sessions).trim();
    if (pSessions && (pSessions === userSessions || userSessions.startsWith(pSessions))) {
      score += 2;
    }
  }

  return score;
}

/**
 * Trie les programmes par pertinence
 */
export function sortProgramsByRelevance(programs: StoreProgram[], userProfile: StoreProfile | null): StoreProgram[] {
  return [...programs].sort((a, b) => {
    const scoreA = calculateProgramRelevance(a, userProfile);
    const scoreB = calculateProgramRelevance(b, userProfile);

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

/**
 * Calcule le score de pertinence pour une offre selon le profil utilisateur
 */
export function calculateOfferRelevance(offer: ShopOffer, userProfile: ShopProfile | null): number {
  if (!userProfile) return 0;

  let score = 0;
  const gender = userProfile.gender?.toLowerCase();
  const supplements = userProfile.supplements;

  // 1. Gender Rules
  if (gender) {
    const g = offer.gender?.toLowerCase();
    const isWildcard = g === "tous" || g === "mixte" || g === "unisexe";

    if (gender === "homme") {
      if (g === "homme" || isWildcard) score += 5;
      else if (g === "femme") score -= 5;
    } else if (gender === "femme") {
      if (g === "femme" || isWildcard) score += 5;
      else if (g === "homme") score -= 5;
    } else if (gender === "non binaire" || gender === "non-binaire") {
      if (isWildcard) score += 3;
    }
  }

  // 2. Supplements Rule
  const isSupplement = (types: string[]) => types.some(t => t.toLowerCase().includes("complément"));
  if (supplements === "Oui" && isSupplement(offer.type)) {
    score += 5;
  } else if (supplements === "Non" && isSupplement(offer.type)) {
    score -= 5;
  }

  // 3. Boost Rule
  const isBoosted = String(offer.boost).toLowerCase() === "true" || offer.boost === true;
  if (isBoosted) {
    score += 5;
  }

  // 4. Expiration Rule
  if (offer.end_date) {
    const now = new Date().getTime();
    const end = new Date(`${offer.end_date}T00:00:00`).getTime();
    const diffHours = (end - now) / (1000 * 60 * 60);

    if (diffHours <= 24 && diffHours > 0) score += 2;
    else if (diffHours > 24 && diffHours <= 72) score += 1;
  }

  return score;
}

/**
 * Trie les offres par pertinence
 */
export function sortOffersByRelevance(offers: ShopOffer[], userProfile: ShopProfile | null): ShopOffer[] {
  return [...offers].sort((a, b) => {
    const scoreA = calculateOfferRelevance(a, userProfile);
    const scoreB = calculateOfferRelevance(b, userProfile);

    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    // Tie-breaker 1: Expiration Date (Ascending - ends soonest first)
    const dateA = a.end_date ? new Date(`${a.end_date}T00:00:00`).getTime() : 8640000000000;
    const dateB = b.end_date ? new Date(`${b.end_date}T00:00:00`).getTime() : 8640000000000;

    if (dateA !== dateB) {
      return dateA - dateB;
    }

    // Tie-breaker 2: Name (Alphabetical)
    return a.name.localeCompare(b.name);
  });
}
