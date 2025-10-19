const CONFIGURED_SITE_URL_ENV_VARS = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_URL",
  "SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "NEXT_PUBLIC_VERCEL_URL",
];

const normalizeOrigin = (value: string) => {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.origin;
  } catch (error) {
    console.warn("[getSiteOrigin] Unable to normalize origin", { value, error });
    return null;
  }
};

export const getSiteOrigin = (fallback?: string): string | null => {
  for (const envVarName of CONFIGURED_SITE_URL_ENV_VARS) {
    const value = process.env[envVarName];

    if (typeof value === "string" && value.trim().length > 0) {
      const normalized = normalizeOrigin(value.trim());

      if (normalized) {
        return normalized;
      }
    }
  }

  if (fallback) {
    const normalizedFallback = normalizeOrigin(fallback);

    if (normalizedFallback) {
      return normalizedFallback;
    }
  }

  return null;
};
