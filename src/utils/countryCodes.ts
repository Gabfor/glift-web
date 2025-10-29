const FALLBACK_REGION_CODES = [
  "FR",
  "BE",
  "CH",
  "CA",
  "US",
  "GB",
  "DE",
  "ES",
  "IT",
  "PT",
  "NL",
  "LU",
  "IE",
  "AU",
  "NZ",
  "BR",
  "AR",
  "MX",
  "CN",
  "JP",
  "KR",
  "IN",
  "AE",
  "MA",
  "TN",
  "DZ",
  "SN",
  "CI",
  "CM",
  "NG",
  "ZA",
];

const REGION_CODES: string[] = (() => {
  if (typeof Intl.supportedValuesOf === "function") {
    try {
      return Intl.supportedValuesOf("region");
    } catch (error) {
    }
  }

  return FALLBACK_REGION_CODES;
})();

const normalizeCountryName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[’']/gu, " ")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const createDisplayNames = (locale: string) => {
  if (typeof Intl.DisplayNames !== "function") {
    return null;
  }

  try {
    return new Intl.DisplayNames([locale], { type: "region" });
  } catch (error) {
    return null;
  }
};

const DISPLAY_NAMES = ["fr", "en"]
  .map(createDisplayNames)
  .filter((instance): instance is Intl.DisplayNames => instance !== null);

const COUNTRY_OVERRIDES = new Map<string, string>([
  ["etats unis", "US"],
  ["usa", "US"],
  ["royaume uni", "GB"],
  ["grande bretagne", "GB"],
  ["uk", "GB"],
  ["emirats arabes unis", "AE"],
  ["hong kong", "HK"],
  ["coree du sud", "KR"],
  ["coree du nord", "KP"],
  ["tchequie", "CZ"],
  ["republique tcheque", "CZ"],
  ["russie", "RU"],
  ["cote divoire", "CI"],
  ["viet nam", "VN"],
  ["palestine", "PS"],
  ["iles feroe", "FO"],
  ["iles marshall", "MH"],
  ["iles salomon", "SB"],
  ["antigua et barbuda", "AG"],
  ["bosnie herzegovine", "BA"],
  ["saint marin", "SM"],
  ["saint barthelemy", "BL"],
  ["saint martin", "MF"],
  ["saint kitts et nevis", "KN"],
  ["saint vincent et les grenadines", "VC"],
  ["iles vierges", "VG"],
]);

const COUNTRY_NAME_TO_CODE = (() => {
  const map = new Map<string, string>();

  REGION_CODES.forEach((code) => {
    DISPLAY_NAMES.forEach((displayNames) => {
      const label = displayNames.of(code);

      if (!label) {
        return;
      }

      const normalized = normalizeCountryName(label);

      if (!normalized) {
        return;
      }

      map.set(normalized, code);
    });
  });

  COUNTRY_OVERRIDES.forEach((code, label) => {
    map.set(label, code);
  });

  return map;
})();

const isIsoAlpha2 = (value: string) => /^[A-Z]{2}$/.test(value);

export const getCountryCode = (label: string | null | undefined) => {
  if (!label) {
    return null;
  }

  const trimmed = label.trim();

  if (!trimmed) {
    return null;
  }

  const upper = trimmed.toUpperCase();

  if (isIsoAlpha2(upper) && REGION_CODES.includes(upper)) {
    return upper;
  }

  const normalized = normalizeCountryName(trimmed);

  if (!normalized) {
    return null;
  }

  return COUNTRY_NAME_TO_CODE.get(normalized) ?? null;
};
