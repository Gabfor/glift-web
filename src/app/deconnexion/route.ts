import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/connexion", req.url), 302);
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Clear-Site-Data", `"storage"`);

  const { supabase, applyServerCookies } = await createServerSupabaseClient();
  const jar = await cookies();

  try { await supabase.auth.signOut({ scope: "global" }); } catch {}

  res.cookies.set({ name: "sb-remember", value: "", path: "/", maxAge: 0 });
  res.cookies.set({ name: "sb-session-tab", value: "", path: "/", maxAge: 0 });

  for (const c of jar.getAll()) {
    if (c.name.startsWith("sb-")) {
      res.cookies.set({ name: c.name, value: "", path: "/", maxAge: 0 });
    }
  }

  return applyServerCookies(res);
}
