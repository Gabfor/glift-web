const CANONICAL_ENV_VARIABLES = [
  "NEXT_PUBLIC_CANONICAL_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_URL",
  "SITE_URL",
] as const;

const cachedCanonicalUrl: { value: URL | null; initialized: boolean } = {
  value: null,
  initialized: false,
};

const parseEnvUrl = (value: string): URL | null => {
  try {
    const parsed = new URL(value);

    if (!parsed.protocol?.startsWith("http")) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const getCanonicalSiteUrl = (): string | null => {
  if (!cachedCanonicalUrl.initialized) {
    for (const key of CANONICAL_ENV_VARIABLES) {
      const rawValue = process.env[key];

      if (!rawValue) {
        continue;
      }

      const parsed = parseEnvUrl(rawValue);

      if (parsed) {
        cachedCanonicalUrl.value = parsed;
        break;
      }
    }

    cachedCanonicalUrl.initialized = true;
  }

  return cachedCanonicalUrl.value?.origin ?? null;
};

export const getAbsoluteUrl = (
  pathname: string,
  fallbackOrigin: string,
): string => {
  const baseUrl = getCanonicalSiteUrl() ?? fallbackOrigin;

  return new URL(pathname, baseUrl).toString();
};
