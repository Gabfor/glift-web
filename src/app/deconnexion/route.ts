import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const response = NextResponse.redirect(new URL("/connexion", req.url), 302);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Clear-Site-Data", `"storage"`);

  const { client, cookies, applyCookies } = await createRouteHandlerClient(response);

  try {
    await client.auth.signOut({ scope: "global" });
  } catch {}

  response.cookies.set({ name: "sb-remember", value: "", path: "/", maxAge: 0 });
  response.cookies.set({ name: "sb-session-tab", value: "", path: "/", maxAge: 0 });

  for (const cookie of cookies.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set({ name: cookie.name, value: "", path: "/", maxAge: 0 });
    }
  }

  return applyCookies(response);
}
