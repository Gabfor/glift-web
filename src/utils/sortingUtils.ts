import { StoreProgram, StoreProfile } from "@/types/store";
import { ShopOffer, ShopProfile } from "@/types/shop";

/**
 * Calcule le score de pertinence pour un programme selon le profil utilisateur
 */
export function calculateProgramRelevance(
  program: StoreProgram,
  userProfile: StoreProfile | null,
  isFavorite: boolean = false
): number {
  let score = 0;

  // 0. Favorite Rule (+10 points)
  if (isFavorite) {
    score += 10;
  }

  if (!userProfile) return score;

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
  const userLocation = userProfile.training_place?.toString().trim().toLowerCase();
  if (userLocation) {
    const pl = program.location.trim().toLowerCase();
    const isWildcard = pl === "les deux" || pl === "tous" || pl === "partout";

    if (userLocation === "salle") {
      if (pl === "salle" || isWildcard) score += 5;
      else if (pl === "domicile") score -= 5;
    } else if (userLocation === "domicile") {
      if (pl === "domicile" || isWildcard) score += 5;
      else if (pl === "salle") score -= 5;
    } else if (userLocation === "les deux") {
      score += 5;
    }
  }

  // 5. Duration Rule (Sessions per week)
  const userSessions = userProfile.weekly_sessions?.toString().trim();
  if (userSessions && program.sessions) {
    const pSessions = program.sessions.toString().trim();
    if (userSessions === pSessions) {
      score += 5;
    } else {
      const uVal = parseInt(userSessions, 10);
      const pVal = parseInt(pSessions, 10);
      if (!isNaN(uVal) && !isNaN(pVal)) {
        const diff = Math.abs(uVal - pVal);
        if (diff === 1) score += 2;
      }
    }
  }

  return score;
}

/**
 * Trie les programmes par pertinence
 */
export function sortProgramsByRelevance(
  programs: StoreProgram[],
  userProfile: StoreProfile | null,
  favorites: string[] = []
): StoreProgram[] {
  return [...programs].sort((a, b) => {
    const isFavA = favorites.includes(a.id);
    const isFavB = favorites.includes(b.id);
    const scoreA = calculateProgramRelevance(a, userProfile, isFavA);
    const scoreB = calculateProgramRelevance(b, userProfile, isFavB);

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
export function calculateOfferRelevance(
  offer: ShopOffer,
  userProfile: ShopProfile | null,
  now?: number,
  isFavorite?: boolean
): number {
  let score = 0;

  // 0. Favorite Rule (+10 points)
  if (isFavorite) {
    score += 10;
  }

  if (!userProfile) return score;

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
    const currentTime = now || Date.now();
    const end = new Date(`${offer.end_date}T00:00:00`).getTime();
    const diffHours = (end - currentTime) / (1000 * 60 * 60);

    if (diffHours <= 24 && diffHours > 0) score += 2;
    else if (diffHours > 24 && diffHours <= 72) score += 1;
  }

  return score;
}

/**
 * Trie les offres par pertinence
 */
export function sortOffersByRelevance(
  offers: ShopOffer[],
  userProfile: ShopProfile | null,
  favoriteOfferIds: string[] = []
): ShopOffer[] {
  const now = Date.now();
  const favoriteSet = new Set(favoriteOfferIds);

  return [...offers].sort((a, b) => {
    const scoreA = calculateOfferRelevance(a, userProfile, now, favoriteSet.has(a.id));
    const scoreB = calculateOfferRelevance(b, userProfile, now, favoriteSet.has(b.id));

    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    // Tie-breaker 1: Expiration Date (Ascending - ends soonest first)
    const dateA = a.end_date ? new Date(`${a.end_date}T00:00:00`).getTime() : 8640000000000;
    const dateB = b.end_date ? new Date(`${b.end_date}T00:00:00`).getTime() : 8640000000000;

    if (dateA !== dateB) {
      return dateA - dateB;
    }

    // Tie-breaker 2: Name (Alphabetical - using simple comparison for cross-platform parity)
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
}
