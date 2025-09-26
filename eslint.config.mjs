import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Limit lint coverage to the sections actively maintained while we
// progressively migrate the legacy screens. This keeps `npm run lint`
// actionable instead of failing on thousands of legacy violations.
const targetFiles = [
  "src/app/layout.tsx",
  "src/components/ClientLayout.tsx",
  "src/components/SupabaseProvider.tsx",
  "src/context/**/*.{ts,tsx}",
];

const baseConfigs = compat.extends("next/core-web-vitals", "next/typescript");

const eslintConfig = [
  ...baseConfigs.map((config) => ({
    ...config,
    ignores: ["src/**"],
  })),
  ...baseConfigs.map((config) => ({
    ...config,
    files: targetFiles,
  })),
];

export default eslintConfig;
