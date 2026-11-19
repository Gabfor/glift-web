import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractColorOverrides, resolvePalette } from "@/constants/colorPalette";

export const dynamic = "force-dynamic";

/**
 * Palette courante (défauts + surcharges admin) — consommée par glift-mobile.
 * GET /api/colors → { colors: { brandPrimary: "#7069FA", ... }, gradient: {...} }
 */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .or("key.like.color\\_%,key.like.gradient\\_%");

  if (error) {
    return NextResponse.json({ error: "Impossible de charger les couleurs" }, { status: 500 });
  }

  const settings: Record<string, string> = {};
  data?.forEach((row) => {
    settings[row.key] = row.value;
  });

  const gradient = {
    enabled: settings["gradient_enabled"] !== "false",
    colors: [1, 2, 3].map((i) => ({
      color: settings[`gradient_color${i}`] ?? null,
      opacity: settings[`gradient_opacity${i}`] ? Number(settings[`gradient_opacity${i}`]) : null,
    })),
  };

  return NextResponse.json(
    { colors: resolvePalette(extractColorOverrides(settings)), gradient },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
  );
}
