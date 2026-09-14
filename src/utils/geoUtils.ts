export const ISO_TO_COUNTRY_MAP: Record<string, string> = {
  FR: "France",
  BE: "Belgique",
  CH: "Suisse",
  CA: "Canada",
  MU: "Île Maurice",
  LU: "Luxembourg",
  MA: "Maroc",
  MC: "Monaco",
};

export const DEFAULT_COUNTRY = "France";

/**
 * Resolves the effective country for a user:
 * 1. If logged in with a specific country, use that country.
 * 2. If country code from IP is recognized in the list, use that country.
 * 3. Otherwise, fallback to "France".
 */
export const resolveUserCountry = (
  profileCountry?: string | null,
  geoCountryCode?: string | null
): string => {
  if (
    profileCountry &&
    profileCountry.trim() &&
    profileCountry.trim().toLowerCase() !== "tous"
  ) {
    return profileCountry.trim();
  }

  if (geoCountryCode) {
    const upper = geoCountryCode.trim().toUpperCase();
    if (ISO_TO_COUNTRY_MAP[upper]) {
      return ISO_TO_COUNTRY_MAP[upper];
    }
  }

  return DEFAULT_COUNTRY;
};

/**
 * Helper to get country name from a cookie on the client side
 */
export const getClientCountryCookie = (): string => {
  if (typeof document === "undefined") return DEFAULT_COUNTRY;
  const match = document.cookie.match(/(?:^|;\s*)glift_country=([^;]+)/);
  if (match && match[1]) {
    try {
      const decoded = decodeURIComponent(match[1]);
      if (decoded && decoded.trim()) {
        return decoded.trim();
      }
    } catch {
      // ignore
    }
  }
  return DEFAULT_COUNTRY;
};
