import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import { extractColorOverrides, recolorIconSvg } from "@/constants/colorPalette";

export const dynamic = "force-dynamic";

const ICONS_DIR = path.resolve(process.cwd(), "public", "icons");
const EXCLUDED_DIRS = new Set(["header", "sounds"]);

export async function GET(
  _req: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params;
  if (!segments || segments.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = path.resolve(ICONS_DIR, ...segments);
  if (!filePath.startsWith(`${ICONS_DIR}${path.sep}`) || !filePath.toLowerCase().endsWith(".svg")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let svg: string;
  try {
    svg = await fs.readFile(filePath, "utf8");
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const topDir = segments[0]?.toLowerCase();
  if (!EXCLUDED_DIRS.has(topDir)) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("settings")
        .select("key, value")
        .like("key", "color\\_%");
      const settings: Record<string, string> = {};
      data?.forEach((row) => {
        settings[row.key] = row.value;
      });
      svg = recolorIconSvg(svg, extractColorOverrides(settings));
    } catch {
      // En cas d'erreur Supabase, renvoyer le SVG d'origine
    }
  }

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-cache, must-revalidate",
    },
  });
}
