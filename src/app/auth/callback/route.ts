import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/compte#mes-informations";
  const origin = url.origin;

  const { supabase, applyServerCookies } = await createServerSupabaseClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  return applyServerCookies(NextResponse.redirect(new URL(next, origin)));
}

export async function POST(req: Request) {
  const { session, remember = "1", next } = await req.json().catch(() => ({}));

  if (!session?.access_token || !session?.refresh_token) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  const rememberOn = remember === "1";

  const { supabase, applyServerCookies } = await createServerSupabaseClient();

  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  const origin = new URL(req.url).origin;
  const response = next
    ? NextResponse.redirect(new URL(next, origin))
    : new NextResponse(null, { status: 204 });

  response.cookies.set({
    name: "sb-remember",
    value: rememberOn ? "1" : "0",
    path: "/",
    ...(rememberOn ? { maxAge: 60 * 60 * 24 * 365 } : {}),
  });

  return applyServerCookies(response);
}
